import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '../../../../lib/auth';
import { sequelize, Organization, Store, User, Role } from '../../../../models';
import { provisionTenantDatabase } from '../../../../lib/tenant-db';

// Helper to check if caller is a Super Admin
async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.roles?.includes('Super Admin')) {
    return false;
  }
  return true;
}

// 1. GET: List all organizations with stores and user details
export async function GET() {
  try {
    const isAuthorized = await checkSuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const organizations = await Organization.findAll({
      include: [
        {
          model: Store,
          attributes: ['id', 'name', 'address', 'phone'],
        },
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone', 'status'],
          include: [
            {
              model: Role,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ success: true, organizations });
  } catch (error: any) {
    console.error('Super Admin GET Orgs Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to retrieve organizations.', error: error.message }, { status: 500 });
  }
}

// 2. POST: Manually create a new organization, store, and default Restaurant Owner user
export async function POST(request: Request) {
  const isAuthorized = await checkSuperAdmin();
  if (!isAuthorized) {
    return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
  }

  const transaction = await sequelize.transaction();
  try {
    const body = await request.json();
    const {
      organizationName,
      storeName,
      name,
      email,
      password,
      phone,
      storeAddress,
      storePhone,
      subscriptionPlan,
    } = body;

    // Validation
    if (!organizationName || !storeName || !name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing required onboarding fields.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists.' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slugBase = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = slugBase;
    let counter = 1;
    while (await Organization.findOne({ where: { slug } })) {
      slug = `${slugBase}-${counter}`;
      counter++;
    }

    // Create Organization
    const organization = await Organization.create(
      {
        name: organizationName,
        slug,
        status: 'active',
        subscription_plan: subscriptionPlan || 'starter',
      },
      { transaction }
    );

    // Create Store
    const store = await Store.create(
      {
        organization_id: organization.id,
        name: storeName,
        address: storeAddress || 'Main Branch Address',
        phone: storePhone || phone || '',
        tax_rate: 8.25,
      },
      { transaction }
    );

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create(
      {
        organization_id: organization.id,
        store_id: store.id,
        name,
        email,
        password: hashedPassword,
        phone,
        status: 'active',
      },
      { transaction }
    );

    // Assign 'Restaurant Owner' Role
    const ownerRole = await Role.findOne({ where: { name: 'Restaurant Owner' } });
    if (ownerRole) {
      await (user as any).addRole(ownerRole, { transaction });
    }

    await transaction.commit();

    // Auto-provision isolated tenant database in background (non-blocking)
    provisionTenantDatabase(organization.slug).catch((err) =>
      console.error('[SuperAdmin] Tenant DB provision failed for', organization.slug, err)
    );

    return NextResponse.json({
      success: true,
      message: 'New organization and owner provisioned successfully! Tenant database is being initialized.',
      organization,
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Super Admin POST Org Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to provision organization.', error: error.message },
      { status: 500 }
    );
  }
}

// 3. PUT: Update an organization (subscription_plan or status)
export async function PUT(request: Request) {
  try {
    const isAuthorized = await checkSuperAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, subscriptionPlan, status, name, logo } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Organization ID is required.' }, { status: 400 });
    }

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return NextResponse.json({ success: false, message: 'Organization not found.' }, { status: 404 });
    }

    // Prepare updates
    const updates: any = {};
    if (subscriptionPlan !== undefined) {
      updates.subscription_plan = subscriptionPlan;
    }
    if (status !== undefined) {
      updates.status = status;
    }
    if (name !== undefined) {
      updates.name = name;
    }
    if (logo !== undefined) {
      updates.logo = logo;
    }

    await organization.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully!',
      organization,
    });
  } catch (error: any) {
    console.error('Super Admin PUT Org Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update organization.', error: error.message }, { status: 500 });
  }
}
