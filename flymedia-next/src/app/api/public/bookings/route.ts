import { NextResponse } from 'next/server';
import { sequelize, Store, Customer, Reservation } from '../../../../models';

export async function POST(request: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await request.json();
    const {
      storeId,
      customerName,
      customerPhone,
      customerEmail,
      reservationTime,
      guestCount = 2,
      notes,
    } = body;

    // 1. Validations
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Customer name and phone number are required' }, { status: 400 });
    }
    if (!reservationTime) {
      return NextResponse.json({ error: 'Reservation date and time are required' }, { status: 400 });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // 2. Find or Create Customer Profile
    const [customer] = await Customer.findOrCreate({
      where: { phone: customerPhone },
      defaults: {
        name: customerName,
        email: customerEmail || null,
      },
      transaction,
    });

    // 3. Create Reservation
    const reservation = await Reservation.create(
      {
        store_id: storeId,
        customer_id: customer.id,
        reservation_time: new Date(reservationTime),
        guest_count: parseInt(guestCount as any) || 2,
        notes: notes || null,
        status: 'pending', // Awaiting manager approval
      },
      { transaction }
    );

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: 'Table reservation request submitted successfully!',
      reservation: {
        id: reservation.id,
        reservationTime: reservation.reservation_time,
        guestCount: reservation.guest_count,
        status: reservation.status,
      },
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Booking Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process table booking.', error: error.message },
      { status: 500 }
    );
  }
}
