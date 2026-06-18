import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { Organization, Payment, Order } from '../../../../models';

/**
 * GET /api/dashboard/billing
 * Returns the current organization's subscription plan and recent payment history.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, store_id } = session.user as any;

    // Fetch organization (subscription info)
    const org = await Organization.findByPk(organization_id, {
      attributes: ['id', 'name', 'slug', 'subscription_plan', 'status', 'createdAt'],
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch recent platform payments (last 10 orders with payments for this store)
    const recentOrders = await Order.findAll({
      where: { store_id },
      include: [{ model: Payment, as: 'payments' }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    // Aggregate revenue stats
    let totalRevenue = 0;
    let totalPaid = 0;
    const recentPayments: any[] = [];

    recentOrders.forEach((order: any) => {
      const payments = order.payments || [];
      payments.forEach((pay: any) => {
        if (pay.transaction_status === 'success') {
          totalRevenue += parseFloat(pay.amount || 0);
          totalPaid++;
          recentPayments.push({
            id: pay.id,
            amount: parseFloat(pay.amount || 0),
            method: pay.payment_method,
            status: pay.transaction_status,
            reference: pay.transaction_reference,
            orderNumber: order.order_number,
            date: (pay as any).createdAt,
          });
        }
      });
    });

    // Subscription plan metadata
    const plans: Record<string, any> = {
      starter: {
        label: 'Starter',
        price: '$49/mo',
        color: 'text-slate-400 bg-slate-800 border-slate-700',
        features: ['1 Branch', 'Online Ordering', 'Basic POS', 'Email Support'],
      },
      professional: {
        label: 'Professional',
        price: '$149/mo',
        color: 'text-sky-400 bg-sky-900/20 border-sky-700',
        features: ['Up to 3 Branches', 'Table Reservations', 'Advanced Analytics', 'Priority Support'],
      },
      enterprise: {
        label: 'Enterprise',
        price: '$499/mo',
        color: 'text-amber-400 bg-amber-900/20 border-amber-700',
        features: ['Unlimited Branches', 'Dedicated DB Isolation', 'Custom Integrations', '24/7 Dedicated Support'],
      },
    };

    const planMeta = plans[(org as any).subscription_plan] || plans.starter;

    return NextResponse.json({
      success: true,
      organization: {
        id: (org as any).id,
        name: (org as any).name,
        slug: (org as any).slug,
        subscription_plan: (org as any).subscription_plan,
        status: (org as any).status,
        memberSince: (org as any).createdAt,
        planMeta,
      },
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPaidOrders: totalPaid,
      },
      recentPayments: recentPayments.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Billing API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
