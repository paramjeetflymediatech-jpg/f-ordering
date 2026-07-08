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

    if (!config) {
      return NextResponse.json({ enabled: false, stripeEnabled: false, upiEnabled: false });
    }

    const hasStripeKeys = config.stripe_secret_key && config.stripe_publishable_key;
    const stripeEnabled = !!(config.is_stripe_enabled && hasStripeKeys);
    const upiEnabled = !!config.is_upi_enabled;

    return NextResponse.json({
      enabled: stripeEnabled, // backward compatibility
      stripeEnabled,
      publishableKey: stripeEnabled ? config.stripe_publishable_key : null,
      upiEnabled,
      upiVpa: upiEnabled ? config.upi_vpa : null,
      upiQrImage: upiEnabled ? config.upi_qr_image : null,
    });
  } catch (error: any) {
    console.error('Payment Config Check Error:', error);
    return NextResponse.json({ enabled: false, stripeEnabled: false, upiEnabled: false });
  }
}
