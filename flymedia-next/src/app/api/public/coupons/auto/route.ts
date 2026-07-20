import { NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { Coupon } from '../../../../../models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, subtotal = 0, orderType = 'takeaway', dayName } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required.' }, { status: 400 });
    }

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayName || DAYS[new Date().getDay()];
    const currentSubtotal = parseFloat(subtotal) || 0;

    // Find active auto-apply coupons for store or global
    const coupons = await Coupon.findAll({
      where: {
        is_active: true,
        is_auto_apply: true,
        [Op.or]: [
          { store_id: storeId },
          { store_id: null }
        ]
      },
    });

    const eligibleCoupons: any[] = [];

    for (const coupon of coupons) {
      // 1. Check day of week
      const validDays: string[] | null = coupon.valid_days as any;
      if (validDays && Array.isArray(validDays) && validDays.length > 0) {
        const matchDay = validDays.some(d => d.toLowerCase() === currentDay.toLowerCase());
        if (!matchDay) continue;
      }

      // 2. Check min order amount
      const minAmount = parseFloat(coupon.min_order_amount as any) || 0;
      if (currentSubtotal < minAmount) continue;

      // 3. Determine discount rate for orderType
      let discountType = coupon.discount_type;
      let discountValue = parseFloat(coupon.discount_value as any) || 0;

      const orderTypeDiscounts: Record<string, number> | null = coupon.order_type_discounts as any;
      if (orderTypeDiscounts && typeof orderTypeDiscounts === 'object') {
        const normalizedOrderType = (orderType || 'takeaway').toLowerCase().replace('-', '_');
        let matchedRate: number | undefined = undefined;
        for (const [key, val] of Object.entries(orderTypeDiscounts)) {
          if (key.toLowerCase().replace('-', '_') === normalizedOrderType) {
            matchedRate = Number(val);
            break;
          }
        }
        if (matchedRate !== undefined) {
          discountType = 'percentage';
          discountValue = matchedRate;
        }
      }

      // If rate is 0, skip
      if (discountType === 'percentage' && discountValue <= 0) continue;

      eligibleCoupons.push({
        id: coupon.id,
        code: coupon.code,
        discount_type: discountType,
        discount_value: discountValue,
        min_order_amount: minAmount,
        type: coupon.type,
        buy_item_id: coupon.buy_item_id,
        buy_qty: coupon.buy_qty,
        get_item_id: coupon.get_item_id,
        get_qty: coupon.get_qty,
        banner_url: coupon.banner_url,
        valid_days: coupon.valid_days,
        order_type_discounts: coupon.order_type_discounts,
        is_auto_apply: coupon.is_auto_apply,
      });
    }

    // Pick the coupon with highest discount percentage/value
    eligibleCoupons.sort((a, b) => b.discount_value - a.discount_value);

    return NextResponse.json({
      success: true,
      coupon: eligibleCoupons[0] || null,
      availableCoupons: eligibleCoupons,
    });
  } catch (error: any) {
    console.error('Fetch Auto Coupons Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch auto coupons.', error: error.message },
      { status: 500 }
    );
  }
}
