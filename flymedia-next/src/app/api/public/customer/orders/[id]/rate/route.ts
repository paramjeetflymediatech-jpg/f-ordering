import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Order } from '../../../../../../../models';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { rating, comment } = await request.json();

    if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be an integer between 1 and 5.' }, { status: 400 });
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

    // Save rating and comment
    order.rating = rating;
    order.rating_comment = comment || null;
    await order.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Order rating submit error:', error);
    return NextResponse.json({ error: 'Internal server error submitting rating.' }, { status: 500 });
  }
}
