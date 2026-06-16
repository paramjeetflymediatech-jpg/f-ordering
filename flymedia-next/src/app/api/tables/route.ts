import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { RestaurantTable } from '../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;

    const tables = await RestaurantTable.findAll({
      where: {
        organization_id,
        store_id,
      },
      order: [['table_number', 'ASC']],
    });

    return NextResponse.json({ success: true, tables });
  } catch (error: any) {
    console.error('Fetch Tables Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tables.', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;
    
    const body = await req.json();
    const { table_number, seating_capacity, status } = body;

    if (!table_number || typeof table_number !== 'string' || !table_number.trim()) {
      return NextResponse.json(
        { success: false, message: 'Table number is required.' },
        { status: 400 }
      );
    }

    // Check if table number already exists in this store
    const existingTable = await RestaurantTable.findOne({
      where: {
        store_id,
        table_number: table_number.trim(),
      },
    });

    if (existingTable) {
      return NextResponse.json(
        { success: false, message: `Table "${table_number}" already exists in this store.` },
        { status: 400 }
      );
    }

    // Generate a unique token for QR code
    const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const newTable = await RestaurantTable.create({
      organization_id,
      store_id,
      table_number: table_number.trim(),
      seating_capacity: seating_capacity ? parseInt(seating_capacity, 10) : 4,
      status: status || 'available',
      qr_code_token: randomToken,
    });

    return NextResponse.json({ success: true, table: newTable });
  } catch (error: any) {
    console.error('Create Table Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create table.', error: error.message },
      { status: 500 }
    );
  }
}
