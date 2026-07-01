import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

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

// Initialize print worker to simulate Epson printer queues
const printWorker = new Worker(
  'print-jobs',
  async (job) => {
    console.log(`[BullMQ Worker] Processing Print Job ID ${job.id}...`);
    console.log(`[BullMQ Worker] Printing Ticket Payload:`, job.data);
    
    // Simulate printing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    console.log(`[BullMQ Worker] Job ${job.id} printed successfully.`);
    return { success: true, printedAt: new Date() };
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

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
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
