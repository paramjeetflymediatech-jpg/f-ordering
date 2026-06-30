import { NextResponse } from 'next/server';
import { Coupon } from '../../../../../models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, code, subtotal } = body;

    if (!storeId || !code) {
      return NextResponse.json({ error: 'Store ID and Coupon Code are required.' }, { status: 400 });
    }

    // Find the coupon matching code and store_id
    const coupon = await Coupon.findOne({
      where: {
        store_id: storeId,
        code: code.trim(),
        is_active: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive coupon code.' }, { status: 404 });
    }

    const minAmount = parseFloat(coupon.min_order_amount as any) || 0;
    const currentSubtotal = parseFloat(subtotal) || 0;

    if (currentSubtotal < minAmount) {
      return NextResponse.json({
        success: false,
        error: `This coupon requires a minimum order amount of $${minAmount.toFixed(2)}.`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value as any),
        min_order_amount: minAmount,
      },
    });
  } catch (error: any) {
    console.error('Validate Coupon Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to validate coupon.', error: error.message },
      { status: 500 }
    );
  }
}
