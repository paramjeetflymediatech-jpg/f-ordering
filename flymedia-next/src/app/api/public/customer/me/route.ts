import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Customer, Order, OrderItem, Payment } from '../../../../../models';

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
        },
        {
          model: Payment,
          as: 'payments',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        loyaltyPoints: customer.loyalty_points,
      },
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        orderType: order.order_type,
        status: order.status,
        subtotal: parseFloat(order.subtotal as any),
        taxAmount: parseFloat(order.tax_amount as any),
        discountAmount: parseFloat(order.discount_amount as any),
        totalAmount: parseFloat(order.total_amount as any),
        createdAt: (order as any).createdAt,
        items: (order as any).items || [],
        payments: (order as any).payments || [],
      })),
    });

  } catch (error: any) {
    console.error('Customer Profile Fetch Error:', error);
    return NextResponse.json({ error: 'Internal server error fetching customer profile.' }, { status: 500 });
  }
}
