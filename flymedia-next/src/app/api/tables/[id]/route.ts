import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { RestaurantTable, Reservation, Customer, Order } from '../../../../models';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;

    const table = await RestaurantTable.findOne({
      where: {
        id,
        organization_id,
        store_id,
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, message: 'Table not found.' },
        { status: 404 }
      );
    }

    // Fetch all reservations for this table, including customer info
    const reservations = await Reservation.findAll({
      where: {
        table_id: id,
        store_id,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
        },
      ],
      order: [['reservation_time', 'DESC']],
    });

    // Fetch all orders for this table, including customer info
    const orders = await Order.findAll({
      where: {
        table_id: id,
        store_id,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({
      success: true,
      table,
      reservations,
      orders,
    });
  } catch (error: any) {
    console.error('Fetch Table Detail/History Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch table history.', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;

    const table = await RestaurantTable.findOne({
      where: {
        id,
        organization_id,
        store_id,
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, message: 'Table not found.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { table_number, seating_capacity, status, booking_slots, apply_to_all } = body;

    // If table number is changing, verify it is unique in the store
    if (table_number !== undefined) {
      const trimmedNumber = table_number.trim();
      if (!trimmedNumber) {
        return NextResponse.json(
          { success: false, message: 'Table number cannot be empty.' },
          { status: 400 }
        );
      }

      if (trimmedNumber !== table.table_number) {
        const duplicateTable = await RestaurantTable.findOne({
          where: {
            store_id,
            table_number: trimmedNumber,
          },
        });

        if (duplicateTable) {
          return NextResponse.json(
            { success: false, message: `Table "${trimmedNumber}" already exists in this store.` },
            { status: 400 }
          );
        }
      }
      table.table_number = trimmedNumber;
    }

    if (seating_capacity !== undefined) {
      const parsedCapacity = parseInt(seating_capacity, 10);
      if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        return NextResponse.json(
          { success: false, message: 'Seating capacity must be a positive integer.' },
          { status: 400 }
        );
      }
      table.seating_capacity = parsedCapacity;
    }

    if (status !== undefined) {
      const validStatuses = ['available', 'occupied', 'reserved', 'cleaning'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid table status.' },
          { status: 400 }
        );
      }
      table.status = status;
    }

    if (booking_slots !== undefined) {
      if (booking_slots !== null && !Array.isArray(booking_slots)) {
        return NextResponse.json(
          { success: false, message: 'Booking slots must be an array of slot times.' },
          { status: 400 }
        );
      }

      if (apply_to_all) {
        await RestaurantTable.update(
          { booking_slots },
          {
            where: {
              store_id,
              organization_id,
            },
          }
        );
        table.booking_slots = booking_slots;
      } else {
        table.booking_slots = booking_slots;
      }
    }

    await table.save();

    return NextResponse.json({ success: true, table });
  } catch (error: any) {
    console.error('Update Table Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update table.', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;

    const table = await RestaurantTable.findOne({
      where: {
        id,
        organization_id,
        store_id,
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, message: 'Table not found.' },
        { status: 404 }
      );
    }

    await table.destroy();

    return NextResponse.json({
      success: true,
      message: `Table "${table.table_number}" has been deleted.`,
    });
  } catch (error: any) {
    console.error('Delete Table Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete table.', error: error.message },
      { status: 500 }
    );
  }
}
