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

    // Business hours validation
    if (store.business_hours) {
      const reqDate = new Date(reservationTime);
      const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const dayKey = dayNames[reqDate.getDay()];
      
      const bizHours = store.business_hours;
      let dayHours = bizHours[dayKey] || bizHours[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];
      
      // Fallback nested lookups
      if (!dayHours && bizHours.dine_in) {
        dayHours = bizHours.dine_in[dayKey] || bizHours.dine_in[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];
      }
      if (!dayHours && bizHours.reservation) {
        dayHours = bizHours.reservation[dayKey] || bizHours.reservation[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];
      }

      if (dayHours) {
        if (dayHours.closed || dayHours.isClosed) {
          await transaction.rollback();
          return NextResponse.json({
            success: false,
            error: `The restaurant is closed on ${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}s.`,
          }, { status: 400 });
        }

        const openTime = dayHours.open;
        const closeTime = dayHours.close;

        if (openTime && closeTime) {
          const reqHours = reqDate.getHours();
          const reqMinutes = reqDate.getMinutes();
          const reqMinutesSinceMidnight = reqHours * 60 + reqMinutes;

          const [openH, openM] = openTime.split(':').map(Number);
          const [closeH, closeM] = closeTime.split(':').map(Number);
          const openMinutesSinceMidnight = openH * 60 + openM;
          const closeMinutesSinceMidnight = closeH * 60 + closeM;

          if (reqMinutesSinceMidnight < openMinutesSinceMidnight || reqMinutesSinceMidnight > closeMinutesSinceMidnight) {
            await transaction.rollback();
            const formatTime12h = (h: number, m: number) => {
              const ampm = h >= 12 ? 'PM' : 'AM';
              const displayH = h % 12 === 0 ? 12 : h % 12;
              const displayM = String(m).padStart(2, '0');
              return `${displayH}:${displayM} ${ampm}`;
            };
            const openFormatted = formatTime12h(openH, openM);
            const closeFormatted = formatTime12h(closeH, closeM);
            return NextResponse.json({
              success: false,
              error: `Reservation time must be within our business hours for ${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}: ${openFormatted} - ${closeFormatted}.`,
            }, { status: 400 });
          }
        }
      }
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
