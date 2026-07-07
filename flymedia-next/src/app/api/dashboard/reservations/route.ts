import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Op } from 'sequelize';
import { Reservation, Customer, RestaurantTable, Order, sequelize } from '../../../../models';

// Statuses that mean a table is physically in use by an active dine-in order
const ACTIVE_ORDER_STATUSES = ['on_hold', 'pending', 'preparing', 'accepted'];
// Statuses that mean a reservation is still active (occupying a table)
const ACTIVE_RESERVATION_STATUSES = ['pending', 'confirmed', 'seated'];

/**
 * Resolves the correct table status by checking active orders AND reservations.
 * Priority: occupied (active order) > reserved (confirmed reservation) > available
 * Pass excludeReservationId to ignore the reservation currently being updated.
 */
async function resolveTableStatus(
  tableId: string,
  excludeReservationId: string | null = null
): Promise<'occupied' | 'reserved' | 'available'> {
  const activeOrder = await Order.findOne({
    where: { table_id: tableId, status: { [Op.in]: ACTIVE_ORDER_STATUSES } },
  });
  if (activeOrder) return 'occupied';

  const resWhere: any = {
    table_id: tableId,
    status: { [Op.in]: ACTIVE_RESERVATION_STATUSES },
  };
  if (excludeReservationId) resWhere.id = { [Op.ne]: excludeReservationId };

  const activeReservation = await Reservation.findOne({ where: resWhere });
  return activeReservation ? 'reserved' : 'available';
}


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
        notes: r.notes || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
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

    // Check if table is occupied
    if (table_id && status !== 'cancelled') {
      const activeOrder = await Order.findOne({
        where: {
          table_id,
          status: { [Op.in]: ACTIVE_ORDER_STATUSES },
        },
        transaction,
      });
      if (activeOrder) {
        await transaction.rollback();
        return NextResponse.json({
          error: `Table is occupied with active order #${(activeOrder as any).order_number}.`,
        }, { status: 409 });
      }
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

    // Bug 6 fix: Notify POS of table status change via socket so it refreshes immediately
    try {
      const io = (request as any).io || (global as any).__socketIo;
      if (io && table_id) {
        io.to(store_id).emit('table_status_update', { tableId: table_id });
      }
    } catch (_) {}

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

    const isTableChanged = table_id !== undefined && table_id !== oldTableId;
    const isStatusActivated = status !== undefined && status !== oldStatus && status !== 'cancelled';

    if (currentTableId && (isTableChanged || isStatusActivated)) {
      if (currentStatus !== 'cancelled') {
        const activeOrder = await Order.findOne({
          where: {
            table_id: currentTableId,
            status: { [Op.in]: ACTIVE_ORDER_STATUSES },
          },
          transaction,
        });
        if (activeOrder) {
          await transaction.rollback();
          return NextResponse.json({
            error: `Table is occupied with active order #${(activeOrder as any).order_number}.`,
          }, { status: 409 });
        }
      }
    }

    // Handle Table Status Synchronization
    // If the table changed, revert the old table properly
    if (oldTableId && oldTableId !== currentTableId) {
      const correctOldStatus = await resolveTableStatus(oldTableId, id);
      await RestaurantTable.update(
        { status: correctOldStatus },
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
        const correctStatus = await resolveTableStatus(currentTableId, id);
        await RestaurantTable.update(
          { status: correctStatus },
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

    // Bug 6 fix: Notify POS of table status change via socket so it refreshes immediately
    try {
      const io = (request as any).io || (global as any).__socketIo;
      if (io) {
        const tableIdToNotify = currentTableId || oldTableId;
        if (tableIdToNotify) {
          io.to(store_id).emit('table_status_update', { tableId: tableIdToNotify });
        }
      }
    } catch (_) {}

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

export async function DELETE(request: Request) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const statusFilter = searchParams.get('status');

    if (id) {
      const ids = id.split(',');
      const reservations = await Reservation.findAll({
        where: { id: { [Op.in]: ids }, store_id },
        transaction,
      });

      const affectedTableIds = Array.from(
        new Set(reservations.map((r: any) => r.table_id).filter(Boolean))
      ) as string[];

      const deletedCount = await Reservation.destroy({
        where: { id: { [Op.in]: ids }, store_id },
        transaction,
      });

      for (const tableId of affectedTableIds) {
        const correctStatus = await resolveTableStatus(tableId, null);
        await RestaurantTable.update(
          { status: correctStatus },
          { where: { id: tableId }, transaction }
        );
      }

      await transaction.commit();

      try {
        const io = (request as any).io || (global as any).__socketIo;
        if (io && affectedTableIds.length > 0) {
          for (const tableId of affectedTableIds) {
            io.to(store_id).emit('table_status_update', { tableId });
          }
        }
      } catch (_) {}

      return NextResponse.json({ success: true, message: `${deletedCount} reservations deleted successfully.` });
    } else if (statusFilter) {
      const validFilterStatuses = ['seated', 'cancelled', 'pending', 'confirmed'];
      if (!validFilterStatuses.includes(statusFilter)) {
        await transaction.rollback();
        return NextResponse.json({ error: 'Invalid status filter for deletion.' }, { status: 400 });
      }

      const reservationsToDelete = await Reservation.findAll({
        where: { store_id, status: statusFilter },
        transaction,
      });

      const affectedTableIds = Array.from(
        new Set(reservationsToDelete.map((r: any) => r.table_id).filter(Boolean))
      ) as string[];

      const deletedCount = await Reservation.destroy({
        where: { store_id, status: statusFilter },
        transaction,
      });

      for (const tableId of affectedTableIds) {
        const correctStatus = await resolveTableStatus(tableId, null);
        await RestaurantTable.update(
          { status: correctStatus },
          { where: { id: tableId }, transaction }
        );
      }

      await transaction.commit();

      try {
        const io = (request as any).io || (global as any).__socketIo;
        if (io && affectedTableIds.length > 0) {
          for (const tableId of affectedTableIds) {
            io.to(store_id).emit('table_status_update', { tableId });
          }
        }
      } catch (_) {}

      return NextResponse.json({
        success: true,
        message: `${deletedCount} ${statusFilter.toUpperCase()} reservations deleted successfully.`,
      });
    } else {
      await transaction.rollback();
      return NextResponse.json({ error: 'Either ID or status filter is required.' }, { status: 400 });
    }
  } catch (error: any) {
    await transaction.rollback();
    console.error('Delete Reservation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

