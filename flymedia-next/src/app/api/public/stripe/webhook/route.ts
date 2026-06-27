import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Store, StorePaymentConfig, Order, Payment } from '../../../../../models';


export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  // We need to identify which org's webhook this belongs to.
  // Stripe sends the account's own events. We check all enabled configs for a matching secret.
  let event: Stripe.Event | null = null;
  let matchedConfig: StorePaymentConfig | null = null;

  try {
    const configs = await StorePaymentConfig.findAll({
      where: { is_stripe_enabled: true },
    });

    for (const cfg of configs) {
      if (!cfg.stripe_webhook_secret || !cfg.stripe_secret_key) continue;
      try {
        const stripe = new Stripe(cfg.stripe_secret_key, { apiVersion: '2026-06-24.dahlia' });
        event = stripe.webhooks.constructEvent(rawBody, sig, cfg.stripe_webhook_secret);
        matchedConfig = cfg;
        break;
      } catch {
        // Wrong secret for this org — try next
      }
    }

    if (!event || !matchedConfig) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.order_id;
      if (orderId) {
        await Payment.update(
          { transaction_status: 'success', transaction_reference: intent.id },
          { where: { order_id: orderId } }
        );
        await Order.update({ status: 'accepted' }, { where: { id: orderId } });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.order_id;
      if (orderId) {
        await Payment.update(
          { transaction_status: 'failed' },
          { where: { order_id: orderId } }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
