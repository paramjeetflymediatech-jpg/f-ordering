import { NextResponse } from 'next/server';
import { Coupon } from '../../../../models';
import { Op } from 'sequelize';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required.' }, { status: 400 });
    }

    const coupons = await Coupon.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { store_id: storeId },
          { store_id: null }
        ]
      },
      order: [['created_at', 'DESC']]
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error('Fetch Public Coupons Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch active coupons.', error: error.message },
      { status: 500 }
    );
  }
}
