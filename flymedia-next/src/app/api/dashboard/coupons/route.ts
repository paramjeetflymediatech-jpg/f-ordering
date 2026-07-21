import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Coupon } from '../../../../models';
import { promises as fs, existsSync } from 'fs';
import path from 'path';

async function deleteOldBannerFile(fileUrl: string | null | undefined) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  try {
    const cleanedUrl = fileUrl.trim();
    if (cleanedUrl.startsWith('/uploads/') || cleanedUrl.startsWith('uploads/')) {
      const relativePath = cleanedUrl.replace(/^\/?uploads\//, '');
      const filePath = path.join(process.cwd(), 'uploads', relativePath);
      const resolvedPath = path.resolve(filePath);

      const uploadsDir = path.resolve(path.join(process.cwd(), 'uploads'));
      if (resolvedPath.startsWith(uploadsDir) && existsSync(resolvedPath)) {
        await fs.unlink(resolvedPath);
        console.log(`[Coupons API] Deleted old banner file from local storage: ${resolvedPath}`);
      }
    }
  } catch (err: any) {
    console.error(`[Coupons API] Failed to delete old banner image file ${fileUrl}:`, err.message);
  }
}

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
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount = 0,
      banner_url,
      type = 'discount',
      buy_item_id,
      buy_qty = 0,
      get_item_id,
      get_qty = 0,
      valid_days = null,
      order_type_discounts = null,
      is_auto_apply = false,
    } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    if (type === 'discount' && (!discountType || discountValue === undefined)) {
      return NextResponse.json({ error: 'Discount Type and Value are required for standard coupons' }, { status: 400 });
    }

    if (type === 'buy_x_get_y' && (!buy_item_id || !buy_qty || !get_item_id || !get_qty)) {
      return NextResponse.json({ error: 'Buy Item, Buy Qty, Get Item, and Get Qty are required for Buy X Get Y offers' }, { status: 400 });
    }

    const coupon = await Coupon.create({
      store_id,
      code: code.toUpperCase().replace(/\s+/g, ''),
      discount_type: type === 'buy_x_get_y' ? 'fixed' : discountType,
      discount_value: type === 'buy_x_get_y' ? 0.00 : parseFloat(discountValue),
      min_order_amount: parseFloat(minOrderAmount),
      is_active: true,
      banner_url: banner_url || null,
      type,
      buy_item_id: type === 'buy_x_get_y' ? buy_item_id : null,
      buy_qty: type === 'buy_x_get_y' ? parseInt(buy_qty as any, 10) : 0,
      get_item_id: type === 'buy_x_get_y' ? get_item_id : null,
      get_qty: type === 'buy_x_get_y' ? parseInt(get_qty as any, 10) : 0,
      valid_days: Array.isArray(valid_days) && valid_days.length > 0 ? valid_days : null,
      order_type_discounts: order_type_discounts && typeof order_type_discounts === 'object' ? order_type_discounts : null,
      is_auto_apply: Boolean(is_auto_apply),
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

    const { store_id } = session.user as any;

    const coupon = await Coupon.findOne({ where: { id, store_id } });
    if (coupon && coupon.banner_url) {
      await deleteOldBannerFile(coupon.banner_url);
    }

    await Coupon.destroy({ where: { id, store_id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Coupon Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = session.user as any;
    const body = await request.json();
    const {
      id,
      code,
      discountType,
      discountValue,
      minOrderAmount = 0,
      banner_url,
      type = 'discount',
      buy_item_id,
      buy_qty = 0,
      get_item_id,
      get_qty = 0,
      valid_days = null,
      order_type_discounts = null,
      is_auto_apply = false,
      is_active = true,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required for update' }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ where: { id, store_id } });
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const oldBannerUrl = coupon.banner_url;
    const newBannerUrl = banner_url || null;

    if (oldBannerUrl && oldBannerUrl !== newBannerUrl) {
      await deleteOldBannerFile(oldBannerUrl);
    }

    await coupon.update({
      code: code.toUpperCase().replace(/\s+/g, ''),
      discount_type: type === 'buy_x_get_y' ? 'fixed' : discountType,
      discount_value: type === 'buy_x_get_y' ? 0.00 : parseFloat(discountValue),
      min_order_amount: parseFloat(minOrderAmount),
      banner_url: banner_url || null,
      type,
      buy_item_id: type === 'buy_x_get_y' ? buy_item_id : null,
      buy_qty: type === 'buy_x_get_y' ? parseInt(buy_qty as any, 10) : 0,
      get_item_id: type === 'buy_x_get_y' ? get_item_id : null,
      get_qty: type === 'buy_x_get_y' ? parseInt(get_qty as any, 10) : 0,
      valid_days: Array.isArray(valid_days) && valid_days.length > 0 ? valid_days : null,
      order_type_discounts: order_type_discounts && typeof order_type_discounts === 'object' ? order_type_discounts : null,
      is_auto_apply: Boolean(is_auto_apply),
      is_active: Boolean(is_active),
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Update Coupon Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

