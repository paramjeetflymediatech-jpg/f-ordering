import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { StorePaymentConfig, Organization } from '../../../../models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = session.user as any;

    const config = await StorePaymentConfig.findOne({
      where: { organization_id },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        config: {
          is_stripe_enabled: false,
          stripe_publishable_key: null,
          stripe_secret_key: null,
          stripe_webhook_secret: null,
        },
      });
    }

    // Mask the secret key for display
    const maskedSecret = config.stripe_secret_key
      ? `${config.stripe_secret_key.slice(0, 8)}...${config.stripe_secret_key.slice(-4)}`
      : null;

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        is_stripe_enabled: config.is_stripe_enabled,
        stripe_publishable_key: config.stripe_publishable_key,
        stripe_secret_key: maskedSecret,
        stripe_webhook_secret: config.stripe_webhook_secret
          ? `${config.stripe_webhook_secret.slice(0, 8)}...`
          : null,
        has_secret_key: !!config.stripe_secret_key,
        has_webhook_secret: !!config.stripe_webhook_secret,
      },
    });
  } catch (error: any) {
    console.error('Fetch Payment Config Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = session.user as any;
    const body = await request.json();

    const { stripe_publishable_key, stripe_secret_key, stripe_webhook_secret, is_stripe_enabled } =
      body;

    // Verify the organization actually exists in the DB (guards against stale JWT sessions)
    const org = await Organization.findByPk(organization_id);
    if (!org) {
      return NextResponse.json(
        {
          error:
            'Your session is out of date. Please log out and log back in, then try again.',
        },
        { status: 400 }
      );
    }

    // Find existing or build new config
    let config = await StorePaymentConfig.findOne({ where: { organization_id } });

    const updates: any = {};
    if (is_stripe_enabled !== undefined) updates.is_stripe_enabled = is_stripe_enabled;
    if (stripe_publishable_key !== undefined) updates.stripe_publishable_key = stripe_publishable_key;
    // Only update secret key if a full new value is sent (not masked)
    if (stripe_secret_key && !stripe_secret_key.includes('...')) {
      updates.stripe_secret_key = stripe_secret_key;
    }
    if (stripe_webhook_secret && !stripe_webhook_secret.includes('...')) {
      updates.stripe_webhook_secret = stripe_webhook_secret;
    }

    if (config) {
      await config.update(updates);
    } else {
      config = await StorePaymentConfig.create({
        organization_id,
        is_stripe_enabled: is_stripe_enabled ?? false,
        stripe_publishable_key: stripe_publishable_key || null,
        stripe_secret_key: stripe_secret_key || null,
        stripe_webhook_secret: stripe_webhook_secret || null,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment configuration saved successfully.',
    });
  } catch (error: any) {
    console.error('Update Payment Config Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
