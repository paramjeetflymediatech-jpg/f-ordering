import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Order, Payment } from '../../../../../../models';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { transactionReference } = await request.json();

    if (!transactionReference) {
      return NextResponse.json({ success: false, error: 'Transaction reference is required.' }, { status: 400 });
    }

    // Authenticate customer session
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

    // Verify order ownership
    const order = await Order.findByPk(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (order.customer_id !== decoded.id) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    // Update or create Payment record
    const payment = await Payment.findOne({ where: { order_id: order.id } });
    if (payment) {
      payment.transaction_status = 'success';
      payment.transaction_reference = transactionReference;
      payment.payment_method = 'card';
      await payment.save();
    } else {
      await Payment.create({
        order_id: order.id,
        amount: order.total_amount,
        payment_method: 'card',
        transaction_status: 'success',
        transaction_reference: transactionReference,
      });
    }

    // Update order status if it was pending
    if (order.status === 'pending') {
      order.status = 'accepted';
      await order.save();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Order direct payment capture error:', error);
    return NextResponse.json({ error: 'Internal server error processing payment.' }, { status: 500 });
  }
}
