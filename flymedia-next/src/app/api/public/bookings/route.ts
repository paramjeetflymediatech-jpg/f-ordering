import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sequelize, Store, Customer, Reservation } from '../../../../models';
import { Op } from 'sequelize';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const date = searchParams.get('date'); // YYYY-MM-DD

    if (!storeId || !date) {
      return NextResponse.json({ error: 'Store ID and Date are required' }, { status: 400 });
    }

    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    const reservations = await Reservation.findAll({
      where: {
        store_id: storeId,
        reservation_time: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [Op.in]: ['pending', 'confirmed', 'seated']
        }
      },
      attributes: ['id', 'table_id', 'booking_slot', 'status', 'booking_charge_paid', 'applied_offer']
    });

    return NextResponse.json({ success: true, reservations });
  } catch (error: any) {
    console.error('Fetch reservations public error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
      bookingSlot,
      tableId,
      bookingChargePaid = 0,
      appliedOffer = null,
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

    // Check for double booking
    if (tableId && bookingSlot) {
      const reservationDate = reservationTime.split('T')[0];
      const startOfDay = new Date(`${reservationDate}T00:00:00`);
      const endOfDay = new Date(`${reservationDate}T23:59:59`);

      const duplicate = await Reservation.findOne({
        where: {
          store_id: storeId,
          table_id: tableId,
          booking_slot: bookingSlot,
          status: {
            [Op.in]: ['pending', 'confirmed', 'seated']
          },
          reservation_time: {
            [Op.between]: [startOfDay, endOfDay]
          }
        },
        transaction
      });

      if (duplicate) {
        await transaction.rollback();
        return NextResponse.json({ success: false, error: 'This table is already reserved for the selected date and time slot.' }, { status: 400 });
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
        table_id: tableId || null,
        reservation_time: new Date(reservationTime),
        booking_slot: bookingSlot || null,
        booking_charge_paid: bookingChargePaid ? parseFloat(bookingChargePaid) : 0.00,
        applied_offer: appliedOffer || null,
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

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    const { id, action } = await request.json();

    if (!id || action !== 'cancel') {
      return NextResponse.json({ success: false, error: 'Invalid request parameters.' }, { status: 400 });
    }

    const matchingCustomerIds = await Customer.findAll({
      where: { phone: decoded.phone },
      attributes: ['id']
    }).then((list: any[]) => list.map((c: any) => c.id));

    const reservation = await Reservation.findOne({
      where: {
        id,
        customer_id: { [Op.in]: matchingCustomerIds }
      }
    });

    if (!reservation) {
      return NextResponse.json({ success: false, error: 'Reservation not found.' }, { status: 404 });
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Reservation is already cancelled.' }, { status: 400 });
    }
    
    if (reservation.status === 'seated') {
      return NextResponse.json({ success: false, error: 'Seated reservations cannot be cancelled.' }, { status: 400 });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    if (reservation.table_id) {
      const { RestaurantTable } = require('../../../../models');
      await RestaurantTable.update(
        { status: 'available' },
        { where: { id: reservation.table_id } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully.',
      reservation: {
        id: reservation.id,
        status: reservation.status
      }
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
