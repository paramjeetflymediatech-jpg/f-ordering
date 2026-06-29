import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Reservation, Customer, RestaurantTable } from '../../../../models';

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

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();
    const { id, status, table_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    const reservation = await Reservation.findOne({
      where: { id, store_id },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (table_id !== undefined) updates.table_id = table_id || null;

    await reservation.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Reservation updated successfully',
    });
  } catch (error: any) {
    console.error('Update Dashboard Reservation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
