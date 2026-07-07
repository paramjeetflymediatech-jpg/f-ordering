import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { Customer, Store, StorePaymentConfig } from '../../../../../models';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'storeId is required.' }, { status: 400 });
    }

    // Authenticate Customer
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session.' }, { status: 401 });
    }

    const customer = await Customer.findByPk(decoded.id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    // If customer has no Stripe customer ID, return empty list of cards
    if (!customer.stripe_customer_id) {
      return NextResponse.json({ success: true, cards: [] });
    }

    // Resolve store and config
    const store = await Store.findByPk(storeId);
    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found.' }, { status: 404 });
    }

    const paymentConfig = await StorePaymentConfig.findOne({
      where: { organization_id: store.organization_id },
    });

    if (!paymentConfig || !paymentConfig.is_stripe_enabled || !paymentConfig.stripe_secret_key) {
      return NextResponse.json({ success: false, error: 'Stripe not configured.' }, { status: 400 });
    }

    const stripe = new Stripe(paymentConfig.stripe_secret_key, {
      apiVersion: '2026-06-24.dahlia',
    });

    // Fetch saved payment methods of type 'card' for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripe_customer_id,
      type: 'card',
    });

    const cards = paymentMethods.data.map((pm: any) => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    }));

    return NextResponse.json({ success: true, cards });
  } catch (error: any) {
    console.error('Fetch Saved Cards Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
