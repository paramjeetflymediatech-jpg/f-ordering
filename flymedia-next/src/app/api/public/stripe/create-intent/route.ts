import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Store, StorePaymentConfig } from '../../../../../models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, amount, currency, orderId } = body;

    if (!storeId || !amount) {
      return NextResponse.json({ error: 'storeId and amount are required' }, { status: 400 });
    }

    // Fetch the store to get its organization
    const store = await Store.findByPk(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch that organization's Stripe config
    const paymentConfig = await StorePaymentConfig.findOne({
      where: { organization_id: store.organization_id },
    });

    if (!paymentConfig || !paymentConfig.is_stripe_enabled || !paymentConfig.stripe_secret_key) {
      return NextResponse.json(
        { error: 'Stripe payments are not enabled for this store.' },
        { status: 400 }
      );
    }

    // Use THIS owner's secret key
    const stripe = new Stripe(paymentConfig.stripe_secret_key, {
      apiVersion: '2026-06-24.dahlia',
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: (currency || 'aud').toLowerCase(),
      metadata: {
        store_id: storeId,
        organization_id: store.organization_id,
        order_id: orderId || '',
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: paymentConfig.stripe_publishable_key,
    });
  } catch (error: any) {
    console.error('Stripe Create Intent Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
