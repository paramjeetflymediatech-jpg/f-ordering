import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Store, StorePaymentConfig } from '../../../../../models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, amount, orgSlug, orderPayload } = body;

    if (!storeId || !amount || !orgSlug) {
      return NextResponse.json({ error: 'storeId, amount, and orgSlug are required' }, { status: 400 });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const paymentConfig = await StorePaymentConfig.findOne({
      where: { organization_id: store.organization_id },
    });

    if (!paymentConfig || !paymentConfig.is_stripe_enabled || !paymentConfig.stripe_secret_key) {
      return NextResponse.json(
        { error: 'Stripe payments are not enabled for this store.' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(paymentConfig.stripe_secret_key, {
      apiVersion: '2026-06-24.dahlia' as any,
    });

    const storeCurrency = (store.currency || 'aud').toLowerCase();
    const origin = request.headers.get('origin') || '';

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'upi'],
      line_items: [
        {
          price_data: {
            currency: storeCurrency,
            product_data: {
              name: `Order from ${store.name}`,
            },
            unit_amount: Math.round(amount * 100), // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/order-online/${orgSlug}/menu?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&payload=${encodeURIComponent(JSON.stringify(orderPayload))}`,
      cancel_url: `${origin}/order-online/${orgSlug}/menu?checkout_cancelled=true`,
      metadata: {
        store_id: storeId,
        organization_id: store.organization_id,
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Create Checkout Session Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
