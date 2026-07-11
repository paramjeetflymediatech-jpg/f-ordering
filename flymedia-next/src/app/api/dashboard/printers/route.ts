import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Printer, PrintJob, Order } from '../../../../models';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    const printers = await Printer.findAll({
      where: { store_id },
      order: [['createdAt', 'DESC']],
    });

    const printJobs = await PrintJob.findAll({
      where: { store_id },
      include: [
        { model: Printer, attributes: ['name', 'role'] },
        { model: Order, attributes: ['order_number', 'total_amount'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      printers,
      printJobs,
    });
  } catch (error: any) {
    console.error('Fetch Printers Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();

    const {
      name,
      role = 'Kitchen Printer',
      type = 'network',
      connection_value,
      copies = 1,
      width = '80mm',
      auto_cut = true,
      open_drawer = false,
    } = body;

    if (!name || !connection_value) {
      return NextResponse.json({ error: 'Name and Connection Value are required' }, { status: 400 });
    }

    // Generate secure unique API Key
    const apiKey = 'prn_' + crypto.randomUUID().replace(/-/g, '');

    const newPrinter = await Printer.create({
      store_id,
      name,
      role,
      type,
      connection_value,
      copies,
      width,
      auto_cut,
      open_drawer,
      api_key: apiKey,
      status: 'offline',
    });

    return NextResponse.json({
      success: true,
      printer: newPrinter,
    });
  } catch (error: any) {
    console.error('Create Printer Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 });
    }

    const printer = await Printer.findOne({ where: { id, store_id } });
    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    await printer.update(updateFields);

    return NextResponse.json({
      success: true,
      printer,
    });
  } catch (error: any) {
    console.error('Update Printer Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 });
    }

    const printer = await Printer.findOne({ where: { id, store_id } });
    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    await printer.destroy();

    return NextResponse.json({
      success: true,
      message: 'Printer removed successfully',
    });
  } catch (error: any) {
    console.error('Delete Printer Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
