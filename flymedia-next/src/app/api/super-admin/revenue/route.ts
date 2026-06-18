import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { Organization, Payment, Order, Store } from '../../../../models';

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.roles?.includes('Super Admin')) return false;
  return true;
}

/**
 * GET /api/super-admin/revenue
 * Returns platform-wide revenue aggregated by organization.
 */
export async function GET() {
  try {
    const authorized = await checkSuperAdmin();
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const organizations = await Organization.findAll({
      include: [{ model: Store, attributes: ['id', 'name', 'currency'] }],
      order: [['name', 'ASC']],
    });

    const results = await Promise.all(
      organizations.map(async (org: any) => {
        const storeIds = org.Stores?.map((s: any) => s.id) || [];

        let totalRevenue = 0;
        let totalOrders = 0;
        let completedOrders = 0;
        let paymentBreakdown: Record<string, number> = {};

        if (storeIds.length > 0) {
          const orders = await Order.findAll({
            where: { store_id: storeIds } as any,
            include: [{ model: Payment, as: 'payments' }],
          });

          totalOrders = orders.length;
          orders.forEach((order: any) => {
            if (order.status === 'completed') {
              completedOrders++;
              const payments = order.payments || [];
              payments.forEach((pay: any) => {
                if (pay.transaction_status === 'success') {
                  totalRevenue += parseFloat(pay.amount || 0);
                  const method = pay.payment_method || 'other';
                  paymentBreakdown[method] = (paymentBreakdown[method] || 0) + parseFloat(pay.amount || 0);
                }
              });
            }
          });
        }

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          status: org.status,
          subscription_plan: org.subscription_plan,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
          completedOrders,
          paymentBreakdown,
        };
      })
    );

    const platformTotal = results.reduce((sum, r) => sum + r.totalRevenue, 0);
    const platformOrders = results.reduce((sum, r) => sum + r.totalOrders, 0);

    return NextResponse.json({
      success: true,
      platformTotal: Math.round(platformTotal * 100) / 100,
      platformOrders,
      organizations: results,
    });
  } catch (error: any) {
    console.error('Revenue API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
