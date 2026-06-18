/**
 * create-super-admin.ts
 * Seeds the Super Admin role and user into the database.
 * Run with: npx ts-node src/create-super-admin.ts
 */

import bcrypt from 'bcryptjs';
import { sequelize, Organization, Store, User, Role, Permission } from './models';

async function main() {
  console.log('Ensuring Super Admin role and user exist...');
  try {
    // 1. Ensure tables are synced
    await sequelize.authenticate();
    console.log('Database connection successful.');

    // 2. Ensure Super Admin role exists
    let [superAdminRole] = await Role.findOrCreate({
      where: { name: 'Super Admin' },
      defaults: {
        name: 'Super Admin',
        description: 'Global system administrator',
      },
    });
    console.log('Super Admin role created/verified.');

    // 3. Ensure a default organization exists for the Super Admin
    let [defaultOrg] = await Organization.findOrCreate({
      where: { slug: 'f-ordering-foods' },
      defaults: {
        name: 'F-Ordering Foods Ltd',
        slug: 'f-ordering-foods',
        status: 'active',
        subscription_plan: 'enterprise',
      },
    });
    console.log('Default organization created/verified.');

    // 4. Ensure a default store exists
    let [defaultStore] = await Store.findOrCreate({
      where: { name: 'The Grand Pavillion Warner Bay' },
      defaults: {
        organization_id: defaultOrg.id,
        name: 'The Grand Pavillion Warner Bay',
        category: 'Restaurant',
        address: '456 The Esplanade, warners Bay',
        zip_code: '2282',
        state: 'NSW',
        city: 'Sydney',
        country: 'Australia',
        phone: '+61 249480092',
        email: 'contact@tgwbh.com.au',
        currency: 'AUD',
        website: 'https://tgwbh.com.au',
        tax_rate: 8.25,
      },
    });
    console.log('Default store created/verified.');

    // 5. Ensure Super Admin user exists
    const email = 'admin@fordering.com';
    let adminUser = await User.findOne({ where: { email } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      adminUser = await User.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        name: 'System Admin (Super)',
        email,
        password: hashedPassword,
        phone: '+1 555-0100',
        status: 'active',
      });
      console.log('Super Admin user created successfully.');
    } else {
      console.log('Super Admin user already exists.');
    }

    // 6. Ensure user has Super Admin role
    const hasRole = await (adminUser as any).hasRole(superAdminRole);
    if (!hasRole) {
      await (adminUser as any).addRole(superAdminRole);
      console.log('Super Admin role associated with user.');
    } else {
      console.log('User already has Super Admin role.');
    }

    console.log('\n✅ Super Admin seeding completed successfully!');
    console.log(`Email: ${email}`);
    console.log('Password: password123');
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
