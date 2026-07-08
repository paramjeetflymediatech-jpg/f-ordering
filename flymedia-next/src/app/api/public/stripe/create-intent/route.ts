import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Store, StorePaymentConfig, Customer } from '../../../../../models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, amount, currency, orderId, customerId, saveCard, paymentMethodId } = body;

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

    let stripeCustomerId: string | undefined = undefined;

    // Check if customerId is passed
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (customer) {
        if (customer.stripe_customer_id) {
          stripeCustomerId = customer.stripe_customer_id;
        } else {
          // Create Stripe Customer
          try {
            const stripeCustomer = await stripe.customers.create({
              email: customer.email,
              name: customer.name,
              metadata: {
                customerId: String(customer.id),
              },
            });
            customer.stripe_customer_id = stripeCustomer.id;
            await customer.save();
            stripeCustomerId = stripeCustomer.id;
          } catch (custErr) {
            console.error('Failed to create Stripe customer:', custErr);
          }
        }
      }
    }

    // Resolve store-specific currency configured in the database to support Stripe UPI (requires INR)
    const storeCurrency = (store.currency || currency || 'aud').toLowerCase();

    // Build intent options
    const intentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: storeCurrency,
      metadata: {
        store_id: storeId,
        organization_id: store.organization_id,
        order_id: orderId || '',
      },
    };

    if (stripeCustomerId) {
      intentOptions.customer = stripeCustomerId;
    }

    if (paymentMethodId) {
      // Direct charge on a saved card
      intentOptions.payment_method = paymentMethodId;
      intentOptions.confirm = true;
      // We must provide return_url when confirming payment intent on backend
      const origin = request.headers.get('origin') || '';
      intentOptions.return_url = `${origin}/order-online/payment-confirm`;
      // When confirming on server, we also need to allow redirects
      intentOptions.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'always',
      };
    } else {
      // Normal flow - card elements
      intentOptions.automatic_payment_methods = { enabled: true };
      
      // Save card checkbox logic
      if (saveCard && stripeCustomerId) {
        intentOptions.setup_future_usage = 'off_session';
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(intentOptions);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: paymentConfig.stripe_publishable_key,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error('Stripe Create Intent Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
