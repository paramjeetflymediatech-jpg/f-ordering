import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Order, OrderItem, Payment } from '../../../../../../models';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

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

    // Delete associated payments and order items to prevent foreign key errors
    await Payment.destroy({ where: { order_id: orderId } });
    await OrderItem.destroy({ where: { order_id: orderId } });

    // Delete the order itself
    await order.destroy();

    return NextResponse.json({ success: true, message: 'Order deleted successfully.' });
  } catch (error: any) {
    console.error('Order delete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error deleting order.' }, { status: 500 });
  }
}
