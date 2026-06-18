import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { Payment, Order, Store, Organization, Customer } from '../../../../models';
import { Op } from 'sequelize';

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.roles?.includes('Super Admin')) return false;
  return true;
}

/**
 * GET /api/super-admin/payments?page=1&orgId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns paginated, filterable payment transaction history across all organizations.
 */
export async function GET(request: Request) {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 20;
    const offset = (page - 1) * limit;
    const orgId = searchParams.get('orgId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build order where clause
    const orderWhere: any = {};
    if (orgId) {
      // Resolve storeIds for the org
      const stores = await Store.findAll({ where: { organization_id: orgId }, attributes: ['id'] });
      orderWhere.store_id = stores.map((s: any) => s.id);
    }

    // Build payment date filter
    const paymentWhere: any = {};
    if (startDate || endDate) {
      paymentWhere.createdAt = {};
      if (startDate) paymentWhere.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        paymentWhere.createdAt[Op.lte] = end;
      }
    }

    const payments = await Payment.findAndCountAll({
      where: paymentWhere,
      include: [
        {
          model: Order,
          where: orderWhere,
          include: [
            {
              model: Store,
              attributes: ['id', 'name'],
              include: [{ model: Organization, attributes: ['id', 'name', 'slug'] }],
            },
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'name', 'email', 'phone'],
              required: false,
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      total: payments.count,
      page,
      totalPages: Math.ceil(payments.count / limit),
      payments: payments.rows,
    });
  } catch (error: any) {
    console.error('Payments API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
