import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { Store, StorePaymentConfig } from '../../../../models';

/**
 * GET /api/pos/stripe-config
 * Returns Stripe publishable key for the current user's store.
 * Used by the POS screen to enable card payments.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).store_id) {
      return NextResponse.json({ enabled: false });
    }

    const { store_id } = session.user as any;
    const store = await Store.findByPk(store_id);
    if (!store) {
      return NextResponse.json({ enabled: false });
    }

    const config = await StorePaymentConfig.findOne({
      where: { organization_id: store.organization_id },
    });

    if (!config || !config.is_stripe_enabled || !config.stripe_secret_key || !config.stripe_publishable_key) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      publishableKey: config.stripe_publishable_key,
    });
  } catch (error: any) {
    console.error('POS Stripe Config Error:', error);
    return NextResponse.json({ enabled: false });
  }
}
