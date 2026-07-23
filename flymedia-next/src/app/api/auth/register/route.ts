import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sequelize, Organization, Store, User, Role } from '../../../../models';
import { provisionTenantDatabase } from '../../../../lib/tenant-db';

export async function POST(request: Request) {
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
    } = body;

    // Validation
    if (!organizationName || !storeName || !name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing required onboarding fields.' },
        { status: 400 }
      );
    }

    // Note: User can register and manage multiple organizations/stores with the same email

    // Check if Slug is taken, generate unique slug
    const slugBase = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = slugBase;
    let counter = 1;
    while (await Organization.findOne({ where: { slug } })) {
      slug = `${slugBase}-${counter}`;
      counter++;
    }

    // 1. Create Organization
    const organization = await Organization.create(
      {
        name: organizationName,
        slug,
        status: 'active',
        subscription_plan: 'starter',
      },
      { transaction }
    );

    // 2. Create Store
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

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User
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

    // 5. Assign 'Restaurant Owner' Role
    const ownerRole = await Role.findOne({ where: { name: 'Restaurant Owner' } });
    if (ownerRole) {
      await (user as any).addRole(ownerRole, { transaction });
    }

    await transaction.commit();

    // Auto-provision isolated tenant database (non-blocking)
    provisionTenantDatabase(organization.slug).catch((err) =>
      console.error('[Register] Tenant DB provision failed for', organization.slug, err)
    );

    return NextResponse.json({
      success: true,
      message: 'Tenant registration and onboarding successful! Your dashboard is being initialized.',
      data: {
        organizationId: organization.id,
        storeId: store.id,
        userId: user.id,
        slug: organization.slug,
      },
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Registration Error:', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed.', error: error.message },
      { status: 500 }
    );
  }
}
