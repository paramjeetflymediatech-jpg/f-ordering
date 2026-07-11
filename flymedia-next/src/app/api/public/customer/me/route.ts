import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Customer, Order, OrderItem, Payment, MenuItem, MenuVariant, Reservation, RestaurantTable } from '../../../../../models';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session.' }, { status: 401 });
    }

    // Fetch Customer
    const customer = await Customer.findByPk(decoded.id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    // Fetch Order and Payment history
    const orders = await Order.findAll({
      where: { customer_id: customer.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: MenuItem,
              attributes: ['name', 'price', 'image_url'],
            },
            {
              model: MenuVariant,
              as: 'variant',
              attributes: ['name', 'additional_price'],
            }
          ]
        },
        {
          model: Payment,
          as: 'payments',
        },
      ],
    });

    const matchingCustomerIds = await Customer.findAll({
      where: { phone: customer.phone },
      attributes: ['id']
    }).then((list: any[]) => list.map((c: any) => c.id));

    console.log('[DEBUG /me] Customer phone:', customer.phone);
    console.log('[DEBUG /me] Matching customer IDs:', matchingCustomerIds);

    const reservations = await Reservation.findAll({
      where: {
        customer_id: { [Op.in]: matchingCustomerIds }
      },
      order: [['reservation_time', 'DESC']],
      include: [
        {
          model: RestaurantTable,
          attributes: ['table_number', 'seating_capacity'],
        }
      ]
    });

    let addressesList: string[] = [];
    if (customer.address) {
      try {
        const parsed = JSON.parse(customer.address);
        if (Array.isArray(parsed)) {
          addressesList = parsed;
        } else {
          addressesList = [customer.address];
        }
      } catch {
        addressesList = [customer.address];
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        loyaltyPoints: customer.loyalty_points,
        addresses: addressesList,
      },
      reservations: reservations.map((res: any) => ({
        id: res.id,
        tableNumber: res.RestaurantTable?.table_number || 'N/A',
        capacity: res.RestaurantTable?.seating_capacity || 0,
        reservationTime: res.reservation_time,
        bookingSlot: res.booking_slot,
        bookingChargePaid: parseFloat(res.booking_charge_paid as any),
        appliedOffer: res.applied_offer,
        guestCount: res.guest_count,
        notes: res.notes || '',
        status: res.status,
      })),
      orders: orders.map((order: any) => ({
        id: order.id,
        storeId: order.store_id,
        orderNumber: order.order_number,
        orderType: order.order_type,
        status: order.status,
        subtotal: parseFloat(order.subtotal as any),
        taxAmount: parseFloat(order.tax_amount as any),
        discountAmount: parseFloat(order.discount_amount as any),
        totalAmount: parseFloat(order.total_amount as any),
        rating: order.rating || null,
        ratingComment: order.rating_comment || null,
        createdAt: (order as any).createdAt,
        items: ((order as any).items || []).map((item: any) => ({
          id: item.id,
          menuItemId: item.menu_item_id,
          name: item.MenuItem?.name || 'Menu Item',
          price: parseFloat(item.unit_price as any),
          quantity: item.quantity,
          notes: item.notes || '',
          imageUrl: item.MenuItem?.image_url || null,
          variant: item.variant ? {
            id: item.variant_id,
            name: item.variant.name,
            additionalPrice: parseFloat(item.variant.additional_price as any),
          } : null,
          addons: typeof item.addons === 'string' ? JSON.parse(item.addons) : (item.addons || []),
          bases: typeof item.bases === 'string' ? JSON.parse(item.bases) : (item.bases || []),
        })),
        payments: (order as any).payments || [],
      })),
    });

  } catch (error: any) {
    console.error('Customer Profile Fetch Error:', error);
    return NextResponse.json({ error: 'Internal server error fetching customer profile.' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Invalid or expired session.' }, { status: 401 });
    }

    const customer = await Customer.findByPk(decoded.id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    const { name, phone, email, addresses, currentPassword, newPassword } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and Phone are required.' }, { status: 400 });
    }

    // Check duplicate phone
    const { Op } = require('sequelize');
    const duplicate = await Customer.findOne({
      where: {
        phone,
        id: { [Op.ne]: customer.id }
      }
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: 'Phone number already registered by another user.' }, { status: 400 });
    }

    customer.name = name;
    customer.phone = phone;
    customer.email = email || null;
    if (Array.isArray(addresses)) {
      customer.address = JSON.stringify(addresses);
    }

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }

      if (customer.password) {
        if (!currentPassword) {
          return NextResponse.json({ success: false, error: 'Current password is required to change password.' }, { status: 400 });
        }
        const isPasswordCorrect = await bcrypt.compare(currentPassword, customer.password);
        if (!isPasswordCorrect) {
          return NextResponse.json({ success: false, error: 'Incorrect current password.' }, { status: 400 });
        }
      }

      customer.password = await bcrypt.hash(newPassword, 10);
    }

    await customer.save();

    let savedAddresses: string[] = [];
    if (customer.address) {
      try {
        const parsed = JSON.parse(customer.address);
        if (Array.isArray(parsed)) {
          savedAddresses = parsed;
        } else {
          savedAddresses = [customer.address];
        }
      } catch {
        savedAddresses = [customer.address];
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        loyaltyPoints: customer.loyalty_points,
        addresses: savedAddresses,
      }
    });
  } catch (error: any) {
    console.error('Customer Profile Update Error:', error);
    return NextResponse.json({ error: 'Internal server error updating customer profile.' }, { status: 500 });
  }
}
