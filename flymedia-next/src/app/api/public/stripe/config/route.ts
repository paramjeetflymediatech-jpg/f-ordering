import { NextResponse } from 'next/server';
import { Store, StorePaymentConfig } from '../../../../../models';

/**
 * GET /api/public/stripe/config?storeId=xxx
 * Returns whether Stripe is enabled for a store and the publishable key.
 * Does NOT create any PaymentIntent — safe to call on page load.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ enabled: false });
    }

    const store = await Store.findByPk(storeId);
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
    console.error('Stripe Config Check Error:', error);
    return NextResponse.json({ enabled: false });
  }
}
