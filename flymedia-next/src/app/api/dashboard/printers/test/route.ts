import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { Printer, PrintJob } from '../../../../../models';
import net from 'net';

function compileEscPosReceipt(title: string): string {
  const ESC = '\x1b';
  const GS = '\x1d';
  const Initialize = ESC + '@';
  const BoldOn = ESC + 'E\x01';
  const BoldOff = ESC + 'E\x00';
  const CenterAlign = ESC + 'a\x01';
  const LeftAlign = ESC + 'a\x00';
  const PaperCut = GS + 'V\x41\x03'; // Cut feed command

  let slip = Initialize;
  slip += CenterAlign + BoldOn + "=== TEST PRINT RECEIPT ===\n" + BoldOff;
  slip += `Station: ${title}\n`;
  slip += `Time: ${new Date().toLocaleString()}\n`;
  slip += "--------------------------------\n" + LeftAlign;
  slip += "1x  Thermal Printer Connection Test   $0.00\n";
  slip += "--------------------------------\n";
  slip += BoldOn + "Status: CONNECTED & WORKING OK\n" + BoldOff;
  slip += "\n\n" + CenterAlign + "FLYMEDIA POS PRINT ENGINE\n\n\n\n" + PaperCut;

  return slip;
}

function sendTcpPrintJob(ip: string, port: number, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(4000); // 4s timeout

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
      reject(new Error('Connection timed out (Check printer IP & Port 9100)'));
    });
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();
    const { id: printerId } = body;

    if (!printerId) {
      return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 });
    }

    const printer = await Printer.findOne({ where: { id: printerId, store_id } });
    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    const io = (global as any).__socketIo;
    const roomSize = io ? io.sockets?.adapter?.rooms?.get(`printer:${printerId}`)?.size || 0 : 0;
    const hasActiveAgent = roomSize > 0;

    // Direct network print attempt for Network IP printers
    if (printer.type === 'network') {
      let ip = (printer.connection_value || '127.0.0.1').trim();
      let port = 9100;
      if (ip.includes(':')) {
        const parts = ip.split(':');
        ip = parts[0];
        port = parseInt(parts[1], 10) || 9100;
      }

      const receiptPayload = compileEscPosReceipt(printer.name);

      try {
        await sendTcpPrintJob(ip, port, receiptPayload);

        // Mark printer online & update timestamps
        await printer.update({
          status: 'online',
          last_seen_at: new Date(),
          last_printed_at: new Date(),
        });

        const job = await PrintJob.create({
          store_id,
          printer_id: printerId,
          order_id: null,
          status: 'completed',
          attempts: 1,
          printed_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          job,
          message: `Test receipt printed successfully to network printer (${ip}:${port})!`,
        });
      } catch (tcpErr: any) {
        // If direct TCP failed BUT a desktop agent is connected via Socket.IO, send to agent!
        if (hasActiveAgent) {
          console.log(`Direct TCP to ${ip}:${port} failed, falling back to active Socket.IO agent for printer ${printerId}`);
          const agentJob = await PrintJob.create({
            store_id,
            printer_id: printerId,
            order_id: null,
            status: 'pending',
            attempts: 1,
          });

          io.to(`printer:${printerId}`).emit('print:new-order', {
            jobId: agentJob.id,
            orderId: 'test-print-job-id',
            isTest: true,
          });

          return NextResponse.json({
            success: true,
            job: agentJob,
            message: `Direct TCP (${ip}:${port}) timed out, but test job was sent to your connected Desktop Printer Agent!`,
          });
        }

        await printer.update({
          status: 'offline',
          last_seen_at: new Date(),
        });

        const job = await PrintJob.create({
          store_id,
          printer_id: printerId,
          order_id: null,
          status: 'failed',
          attempts: 1,
          error_message: `TCP Direct Print Error: ${tcpErr.message}`,
        });

        return NextResponse.json({
          success: false,
          error: `Could not connect to network printer at ${ip}:${port}. Please verify the printer IP/Port or start the printer agent.`,
          job,
        }, { status: 500 });
      }
    }

    // USB / Agent-based printer dispatch
    const newJob = await PrintJob.create({
      store_id,
      printer_id: printerId,
      order_id: null,
      status: 'pending',
      attempts: 1,
    });

    if (io) {
      io.to(`printer:${printerId}`).emit('print:new-order', {
        jobId: newJob.id,
        orderId: 'test-print-job-id',
        isTest: true,
      });
    }

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Test print command dispatched to connected printer agent.',
    });
  } catch (error: any) {
    console.error('Test Print Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
