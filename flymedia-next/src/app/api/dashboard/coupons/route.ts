import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Coupon } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;

    const coupons = await Coupon.findAll({
      where: { store_id },
      order: [['created_at', 'DESC']],
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error('Fetch Coupons Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();
    const { code, discountType, discountValue, minOrderAmount = 0 } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Code, Discount Type, and Value are required' }, { status: 400 });
    }

    const coupon = await Coupon.create({
      store_id,
      code: code.toUpperCase().replace(/\s+/g, ''),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_amount: parseFloat(minOrderAmount),
      is_active: true,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Create Coupon Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    await Coupon.destroy({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Coupon Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
