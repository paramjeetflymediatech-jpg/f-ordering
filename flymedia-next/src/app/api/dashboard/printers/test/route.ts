import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { Printer, PrintJob } from '../../../../../models';

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

    // Create a mock print job in the database
    const newJob = await PrintJob.create({
      store_id,
      printer_id: printerId,
      order_id: '00000000-0000-0000-0000-000000000000', // Mock UUID
      status: 'pending',
      attempts: 1,
    });

    // Notify connected agent via global Socket.IO reference
    const io = (global as any).__socketIo;
    if (io) {
      io.to(`printer:${printerId}`).emit('print:new-order', {
        jobId: newJob.id,
        orderId: 'test-print-job-id',
        isTest: true,
      });
      console.log(`[Dashboard API] Dispatched test print event for printer: ${printerId}`);
    } else {
      console.warn('[Dashboard API] Socket.IO server reference not found in global context');
    }

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Test print command dispatched to agent.',
    });
  } catch (error: any) {
    console.error('Test Print Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
