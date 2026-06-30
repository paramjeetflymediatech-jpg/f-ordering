import { NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { Coupon, Customer, Order } from '../../../../../models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, code, subtotal, customerPhone } = body;

    if (!storeId || !code) {
      return NextResponse.json({ error: 'Store ID and Coupon Code are required.' }, { status: 400 });
    }

    // Find the coupon matching code, either store-specific or global
    const coupon = await Coupon.findOne({
      where: {
        code: code.trim(),
        is_active: true,
        [Op.or]: [
          { store_id: storeId },
          { store_id: null }
        ]
      },
    });

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive coupon code.' }, { status: 404 });
    }

    // If customer phone is provided, check if they have already used this coupon in any non-cancelled order
    if (customerPhone && customerPhone.trim()) {
      const customer = await Customer.findOne({
        where: { phone: customerPhone.trim() },
      });

      if (customer) {
        const orderUsed = await Order.findOne({
          where: {
            customer_id: customer.id,
            coupon_code: code.trim(),
            status: { [Op.ne]: 'cancelled' },
          },
        });

        if (orderUsed) {
          return NextResponse.json({
            success: false,
            error: 'This coupon code has already been used with this mobile number.'
          }, { status: 400 });
        }
      }
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
        is_global: !coupon.store_id,
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
