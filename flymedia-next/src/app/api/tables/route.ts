import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { RestaurantTable, Reservation, Order, Organization, sequelize } from '../../../models';

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

    // Fetch counts of reservations group by table_id for this store
    const reservationCounts = await Reservation.findAll({
      where: { store_id },
      attributes: ['table_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['table_id'],
      raw: true,
    });

    // Fetch counts of orders group by table_id for this store
    const orderCounts = await Order.findAll({
      where: { store_id },
      attributes: ['table_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['table_id'],
      raw: true,
    });

    // Map counts to lookup tables
    const resMap: Record<string, number> = {};
    reservationCounts.forEach((item: any) => {
      if (item.table_id) {
        resMap[item.table_id] = parseInt(item.count) || 0;
      }
    });

    const orderMap: Record<string, number> = {};
    orderCounts.forEach((item: any) => {
      if (item.table_id) {
        orderMap[item.table_id] = parseInt(item.count) || 0;
      }
    });

    // Merge counts into table data
    const tablesWithCounts = tables.map((t: any) => {
      const tableJson = t.toJSON();
      return {
        ...tableJson,
        reservation_count: resMap[t.id] || 0,
        order_count: orderMap[t.id] || 0,
      };
    });

    const org = await Organization.findByPk(organization_id, {
      attributes: ['slug'],
    });
    const organizationSlug = org?.slug || 'f-ordering-foods';

    return NextResponse.json({ success: true, tables: tablesWithCounts, organizationSlug });
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
