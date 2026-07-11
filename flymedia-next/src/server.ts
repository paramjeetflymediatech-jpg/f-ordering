import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import net from 'net';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.NEXT_PUBLIC_APP_URL || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Redis options configuration for BullMQ
const redisConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
};

// Create print jobs queue
const printQueue = new Queue('print-jobs', { connection: redisConnectionOptions });

// Helper to compile plain-text / ESC-POS thermal receipt layout
function compileEscPosReceipt(order: any, items: any[]): string {
  const ESC = '\x1b';
  const GS = '\x1d';
  const Initialize = ESC + '@';
  const BoldOn = ESC + 'E\x01';
  const BoldOff = ESC + 'E\x00';
  const CenterAlign = ESC + 'a\x01';
  const LeftAlign = ESC + 'a\x00';
  const PaperCut = GS + 'V\x41\x03'; // Cut feed command
  
  let slip = Initialize;
  slip += CenterAlign + BoldOn + "ORDER RECEIPT\n" + BoldOff;
  slip += `Ref: ${order.orderNumber || order.order_number || 'N/A'}\n`;
  slip += `Type: ${(order.orderType || order.order_type || 'takeaway').toUpperCase()}\n`;
  slip += `Time: ${new Date(order.createdAt || Date.now()).toLocaleString()}\n`;
  slip += "--------------------------------\n" + LeftAlign;

  if (items && items.length > 0) {
    items.forEach((item: any) => {
      const name = item.name || item.MenuItem?.name || 'Item';
      const qty = item.quantity || 1;
      const price = parseFloat(item.price || item.unit_price || 0).toFixed(2);
      slip += `${qty}x ${name.padEnd(20)} $${price}\n`;
      if (item.addons && item.addons.length > 0) {
        const addonsStr = item.addons.map((a: any) => a.name).join(', ');
        slip += `   + ${addonsStr}\n`;
      }
    });
  }
  
  slip += "--------------------------------\n";
  slip += `Subtotal: $${parseFloat(order.subtotal || 0).toFixed(2)}\n`;
  slip += `Tax: $${parseFloat(order.tax_amount || order.tax || 0).toFixed(2)}\n`;
  slip += BoldOn + `Total: $${parseFloat(order.total_amount || order.total || 0).toFixed(2)}\n` + BoldOff;
  slip += "\n\n" + CenterAlign + "THANK YOU FOR YOUR ORDER!\n\n\n\n" + PaperCut;

  return slip;
}

// Helper to send ticket directly to a network printer IP via raw TCP Socket
function sendTcpPrintJob(ip: string, port: number, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(5000); // 5s connection timeout

    client.connect(port, ip, () => {
      client.write(data, 'utf-8', () => {
        client.end();
        resolve();
      });
    });

    client.on('error', (err) => {
      client.destroy();
      reject(err);
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error('Connection timed out'));
    });
  });
}

// Initialize print worker to connect with physical ESC/POS TCP network printers or fallback to simulation
const printWorker = new Worker(
  'print-jobs',
  async (job) => {
    console.log(`[BullMQ Worker] Processing Print Job ID ${job.id}...`);
    const { orderId, storeId, order: directOrder, items: directItems } = job.data;

    let targetOrderId = orderId;
    let targetStoreId = storeId;
    let orderRecord = directOrder;
    let orderItems = directItems || [];

    // Load full order details if orderId is provided
    if (targetOrderId) {
      try {
        const { Order, OrderItem, MenuItem, MenuCategory } = require('./models');
        const order = await Order.findOne({
          where: { id: targetOrderId },
          include: [
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: MenuItem, include: [{ model: MenuCategory }] }]
            }
          ]
        });

        if (order) {
          orderRecord = order.toJSON();
          orderItems = (order.items || []).map((oi: any) => oi.toJSON());
          targetStoreId = order.store_id;
        }
      } catch (err: any) {
        console.error('[BullMQ Worker] Failed to load order details from database:', err.message);
      }
    }

    // Load registered printers for this store
    let printers: any[] = [];
    try {
      const { Printer } = require('./models');
      printers = await Printer.findAll({ where: { store_id: targetStoreId } });
    } catch (err: any) {
      console.error('[BullMQ Worker] Failed to fetch store printers:', err.message);
    }

    if (printers && printers.length > 0) {
      console.log(`[BullMQ Worker] Found ${printers.length} registered printers for store ${targetStoreId}`);
      const { PrintJob } = require('./models');

      for (const printer of printers) {
        // Filter items matching the printer's role (or send all if role is "Receipt Printer")
        let printerItems = orderItems;
        if (printer.role && printer.role !== 'Receipt Printer') {
          printerItems = orderItems.filter((oi: any) => {
            const cat = oi.MenuItem?.MenuCategory;
            return cat && cat.printer_category === printer.role;
          });
        }

        // If this printer is not a Receipt Printer and has no matching items, skip it!
        if (printerItems.length === 0 && printer.role !== 'Receipt Printer') {
          console.log(`[BullMQ Worker] Skipping printer "${printer.name}" (${printer.role}) - No matching categories.`);
          continue;
        }

        // Create a PrintJob record
        const printJob = await PrintJob.create({
          store_id: targetStoreId,
          printer_id: printer.id,
          order_id: targetOrderId || '00000000-0000-0000-0000-000000000000',
          status: 'pending',
          attempts: 1,
        });

        // Notify the agent
        const io = (global as any).__socketIo;
        if (io) {
          console.log(`[BullMQ Worker] Emitting print:new-order to printer room: printer:${printer.id}`);
          io.to(`printer:${printer.id}`).emit('print:new-order', {
            jobId: printJob.id,
            orderId: targetOrderId || 'test-print-job-id',
            isTest: targetOrderId ? false : true,
          });

          // Wait for acknowledgment by polling the database PrintJob status
          let acknowledged = false;
          for (let poll = 0; poll < 10; poll++) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const updatedJob = await PrintJob.findByPk(printJob.id);
            if (updatedJob && (updatedJob.status === 'completed' || updatedJob.status === 'failed')) {
              acknowledged = true;
              if (updatedJob.status === 'failed') {
                throw new Error(`Print agent failed to print job ${printJob.id}: ${updatedJob.error_message}`);
              }
              break;
            }
          }

          if (!acknowledged) {
            await printJob.update({ status: 'failed', error_message: 'Print agent acknowledgment timeout' });
            throw new Error(`Print agent acknowledgment timeout for job ${printJob.id}`);
          }
        } else {
          console.warn('[BullMQ Worker] Socket.IO instance not active. Marking job failed.');
          await printJob.update({ status: 'failed', error_message: 'Socket.IO server inactive' });
          throw new Error('Socket.IO server inactive');
        }
      }
      return { success: true, printedAt: new Date(), printersCount: printers.length };
    }

    // Fallback: Check direct TCP IP connection (backward compatibility)
    console.log(`[BullMQ Worker] No printers registered for store. Running fallback/direct network printer.`);
    const { printerIp, printerPort = 9100 } = job.data;
    if (printerIp) {
      const compiledReceipt = compileEscPosReceipt(orderRecord || {}, orderItems || []);
      try {
        await sendTcpPrintJob(printerIp, printerPort, compiledReceipt);
        console.log(`[BullMQ Worker] Fallback job ${job.id} printed to network printer.`);
        return { success: true, printedAt: new Date(), printer: `${printerIp}:${printerPort}` };
      } catch (err: any) {
        console.error(`[BullMQ Worker] Direct printer unreachable. Error:`, err.message);
      }
    }

    // Simulated fallback
    console.log(`[BullMQ Worker] Printing Ticket Payload (SIMULATED):`);
    const compiledReceipt = compileEscPosReceipt(orderRecord || {}, orderItems || []);
    console.log(compiledReceipt);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`[BullMQ Worker] Fallback simulated print complete.`);
    return { success: true, printedAt: new Date(), simulated: true };
  },
  { connection: redisConnectionOptions }
);

printWorker.on('completed', (job) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed.`);
});

printWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err);
});

app.prepare().then(() => {
  const expressApp = express();
  const server = http.createServer(expressApp);
  
  // Attach Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  (global as any).__socketIo = io;

  // Socket.IO Connection Event handlers
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join store channel for isolated tenant event broadcasting
    socket.on('join_store', (storeId) => {
      socket.join(storeId);
      console.log(`[Socket.IO] Client ${socket.id} joined store channel: ${storeId}`);
    });

    // Notify kitchen on new order creation
    socket.on('new_order', (data) => {
      const { storeId, order } = data;
      console.log(`[Socket.IO] New order created in store ${storeId}:`, order.orderNumber);
      io.to(storeId).emit('kitchen_new_order', order);
    });

    // Notify waiter/cashier on food preparation state update
    socket.on('order_status_update', (data) => {
      const { storeId, orderId, status } = data;
      console.log(`[Socket.IO] Order ${orderId} updated to: ${status}`);
      io.to(storeId).emit('order_status_changed', { orderId, status });
    });

    // Notify POS when a reservation table assignment changes (table reserved/freed)
    socket.on('reservation_table_update', (data) => {
      const { storeId, tableId } = data;
      console.log(`[Socket.IO] Table status updated for table ${tableId} in store ${storeId}`);
      io.to(storeId).emit('table_status_update', { tableId });
    });

    // Printer Agent Event Listeners
    socket.on('printer:register', async (data) => {
      const { apiKey, name } = data;
      try {
        const { Printer } = require('./models');
        const printer = await Printer.findOne({ where: { api_key: apiKey } });
        if (printer) {
          const storeId = printer.store_id;
          socket.join(`store:${storeId}:printers`);
          socket.join(`printer:${printer.id}`);
          socket.data.printerId = printer.id;
          socket.data.storeId = storeId;
          await printer.update({ status: 'online', last_seen_at: new Date() });
          socket.emit('printer:registered', { 
            success: true, 
            printerId: printer.id,
            config: {
              name: printer.name,
              type: printer.type,
              connectionValue: printer.connection_value,
              copies: printer.copies,
              width: printer.width,
              autoCut: printer.auto_cut,
              openDrawer: printer.open_drawer,
            }
          });
          console.log(`[Socket.IO] Printer Agent "${name || printer.name}" (ID: ${printer.id}) connected to store: ${storeId}`);
        } else {
          socket.emit('printer:registered', { success: false, error: 'Invalid API Key' });
        }
      } catch (err: any) {
        console.error('[Socket.IO] Printer registration failed:', err.message);
        socket.emit('printer:registered', { success: false, error: 'Server registration error' });
      }
    });

    socket.on('printer:acknowledge', async (data) => {
      const { printJobId, status, error } = data;
      try {
        const { PrintJob, Printer } = require('./models');
        const job = await PrintJob.findByPk(printJobId);
        if (job) {
          await job.update({
            status: status === 'success' ? 'completed' : 'failed',
            error_message: error || null,
            printed_at: status === 'success' ? new Date() : null,
          });

          // Also update the printer's last printed timestamp on success
          if (status === 'success') {
            await Printer.update(
              { last_printed_at: new Date(), last_seen_at: new Date() },
              { where: { id: job.printer_id } }
            );
          }
          console.log(`[Socket.IO] Print Job ${printJobId} acknowledged by agent as: ${status}`);
        }
      } catch (err: any) {
        console.error('[Socket.IO] Acknowledgment update failed:', err.message);
      }
    });

    socket.on('printer:heartbeat', async () => {
      if (socket.data.printerId) {
        try {
          const { Printer } = require('./models');
          await Printer.update(
            { last_seen_at: new Date(), status: 'online' },
            { where: { id: socket.data.printerId } }
          );
        } catch (err: any) {
          console.error('[Socket.IO] Heartbeat update failed:', err.message);
        }
      }
    });

    socket.on('disconnect', async () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      if (socket.data.printerId) {
        try {
          const { Printer } = require('./models');
          await Printer.update(
            { status: 'offline', last_seen_at: new Date() },
            { where: { id: socket.data.printerId } }
          );
          console.log(`[Socket.IO] Printer ID ${socket.data.printerId} marked offline.`);
        } catch (err: any) {
          console.error('[Socket.IO] Printer disconnect update failed:', err.message);
        }
      }
    });
  });

  // Inject Socket.IO helper into requests
  expressApp.use((req: any, res, nextHook) => {
    req.io = io;
    req.printQueue = printQueue;
    nextHook();
  });

  // Serve public assets and dynamic uploads directly via express
  expressApp.use(express.static(path.join(process.cwd(), 'public')));

  // Next.js Route handlers
  expressApp.all(/.*/, (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server mounted successfully.`);
    console.log(`> BullMQ worker listening to print queue on Redis.`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
