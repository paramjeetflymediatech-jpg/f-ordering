import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Reservation, Customer, RestaurantTable, sequelize } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    const dbReservations = await Reservation.findAll({
      where: { store_id },
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone', 'email'] },
        { model: RestaurantTable, attributes: ['id', 'table_number'] }
      ],
      order: [['reservation_time', 'DESC']],
    });

    // Map database structures to the format expected by the frontend
    const reservations = dbReservations.map((r: any) => {
      // Format reservation_time to 'YYYY-MM-DD HH:mm:ss' local-like string representation
      const date = new Date(r.reservation_time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      return {
        id: r.id,
        guest_name: r.customer?.name || 'Unknown Guest',
        guest_phone: r.customer?.phone || '',
        guest_email: r.customer?.email || '',
        reservation_time: formattedTime,
        party_size: r.guest_count,
        status: r.status,
        table_id: r.table_id || '',
        table_number: r.RestaurantTable?.table_number || 'Not Assigned',
      };
    });

    return NextResponse.json({
      success: true,
      reservations,
    });
  } catch (error: any) {
    console.error('Fetch Dashboard Reservations Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, organization_id } = session.user as any;
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      reservationTime,
      guestCount = 2,
      notes,
      table_id,
      status = 'confirmed',
    } = body;

    // 1. Validations
    if (!customerName || !customerPhone) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Customer name and phone number are required' }, { status: 400 });
    }
    if (!reservationTime) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Reservation date and time are required' }, { status: 400 });
    }

    // 2. Find or Create Customer Profile
    const [customer] = await Customer.findOrCreate({
      where: { phone: customerPhone },
      defaults: {
        name: customerName,
        email: customerEmail || null,
        organization_id: organization_id || null,
      },
      transaction,
    });

    // 3. Create Reservation
    const reservation = await Reservation.create(
      {
        store_id,
        customer_id: customer.id,
        reservation_time: new Date(reservationTime),
        guest_count: parseInt(guestCount as any) || 2,
        notes: notes || null,
        status: status,
        table_id: table_id || null,
      },
      { transaction }
    );

    // 4. Update table status if table is assigned
    if (table_id) {
      const tableStatus = status === 'seated' ? 'occupied' : 'reserved';
      await RestaurantTable.update(
        { status: tableStatus },
        { where: { id: table_id }, transaction }
      );
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: 'Table reservation created successfully!',
      reservation: {
        id: reservation.id,
        reservationTime: reservation.reservation_time,
        guestCount: reservation.guest_count,
        status: reservation.status,
        table_id: reservation.table_id,
      },
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Create Dashboard Reservation Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create table reservation.', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();
    const { id, status, table_id, reservation_time, guest_count, notes } = body;

    if (!id) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    const reservation = await Reservation.findOne({
      where: { id, store_id },
      transaction,
    });

    if (!reservation) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const oldTableId = reservation.table_id;
    const oldStatus = reservation.status;

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (table_id !== undefined) updates.table_id = table_id || null;
    if (reservation_time !== undefined) updates.reservation_time = new Date(reservation_time);
    if (guest_count !== undefined) updates.guest_count = parseInt(guest_count, 10);
    if (notes !== undefined) updates.notes = notes || null;

    await reservation.update(updates, { transaction });

    const currentStatus = updates.status !== undefined ? updates.status : oldStatus;
    const currentTableId = updates.table_id !== undefined ? updates.table_id : oldTableId;

    // Handle Table Status Synchronization
    // If the table changed, revert the old table
    if (oldTableId && oldTableId !== currentTableId) {
      await RestaurantTable.update(
        { status: 'available' },
        { where: { id: oldTableId }, transaction }
      );
    }

    // Sync current table
    if (currentTableId) {
      if (currentStatus === 'seated') {
        await RestaurantTable.update(
          { status: 'occupied' },
          { where: { id: currentTableId }, transaction }
        );
      } else if (currentStatus === 'cancelled') {
        await RestaurantTable.update(
          { status: 'available' },
          { where: { id: currentTableId }, transaction }
        );
      } else {
        // pending or confirmed
        await RestaurantTable.update(
          { status: 'reserved' },
          { where: { id: currentTableId }, transaction }
        );
      }
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: 'Reservation updated successfully',
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Update Dashboard Reservation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
