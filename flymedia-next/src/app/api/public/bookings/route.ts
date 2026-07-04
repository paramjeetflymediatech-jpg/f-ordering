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
      await transaction.rollback();
      return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      await transaction.rollback();
      return NextResponse.json({ success: false, error: 'Customer name and phone number are required' }, { status: 400 });
    }
    if (!reservationTime) {
      await transaction.rollback();
      return NextResponse.json({ success: false, error: 'Reservation date and time are required' }, { status: 400 });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      await transaction.rollback();
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // 2. Find or Create Customer Profile scoped by organization
    const [customer] = await Customer.findOrCreate({
      where: { 
        phone: customerPhone,
        organization_id: store.organization_id 
      },
      defaults: {
        name: customerName,
        email: customerEmail || null,
        organization_id: store.organization_id
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
