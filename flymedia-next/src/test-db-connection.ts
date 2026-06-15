import { ensureDatabaseExists, sequelize } from './lib/db';
import { Organization, Store, User, Role, Permission } from './models';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('--- Starting Integration & Model Tests ---');
  try {
    // 1. Ensure DB exists & authenticate
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('✔ MySQL Connection authenticated successfully.');

    // 2. Synchronize models
    await sequelize.sync({ force: true });
    console.log('✔ Database synced (force: true).');

    // 3. Test Organization and Store Creation
    const org = await Organization.create({
      name: 'Test Burger Joint',
      slug: 'test-burger-joint',
      status: 'active',
      subscription_plan: 'starter',
    });
    console.log(`✔ Org created: ${org.name} (${org.id})`);

    const store = await Store.create({
      organization_id: org.id,
      name: 'Test Branch A',
      address: '456 Test Blvd, Test City',
      phone: '+1 555-9999',
      tax_rate: 8.00,
    });
    console.log(`✔ Store created: ${store.name} (${store.id})`);

    // 4. Test RBAC Roles & Permissions
    const perm = await Permission.create({
      name: 'pos:access',
      description: 'Access cashier terminal',
    });
    console.log(`✔ Permission created: ${perm.name}`);

    const role = await Role.create({
      name: 'Test Cashier',
      description: 'Cashier for testing',
    });
    console.log(`✔ Role created: ${role.name}`);

    await (role as any).addPermission(perm);
    console.log('✔ Permission assigned to Role.');

    // 5. Test User Creation & Association
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await User.create({
      organization_id: org.id,
      store_id: store.id,
      name: 'Tester Cashier',
      email: 'tester.cashier@example.com',
      password: hashedPassword,
      phone: '+1 555-8888',
      status: 'active',
    });
    console.log(`✔ User created: ${user.name}`);

    await (user as any).addRole(role);
    console.log('✔ Role assigned to User.');

    // 6. Test Querying & Assertions
    const foundUser = await User.findOne({
      where: { email: 'tester.cashier@example.com' },
      include: [
        {
          model: Role,
          include: [Permission],
        },
      ],
    });

    if (foundUser) {
      console.log('✔ Queried user from DB successfully.');
      const roles = (foundUser as any).Roles?.map((r: any) => r.name) || [];
      const permissions = (foundUser as any).Roles?.flatMap((r: any) => r.Permissions?.map((p: any) => p.name) || []) || [];
      
      console.log('   Assigned Roles:', roles);
      console.log('   Assigned Permissions:', permissions);

      if (roles.includes('Test Cashier') && permissions.includes('pos:access')) {
        console.log('✔ Integration verification PASSED. RBAC permissions resolved properly.');
      } else {
        throw new Error('Verification FAILED: Role/Permission loading mismatched.');
      }
    } else {
      throw new Error('Verification FAILED: Inserted user could not be retrieved.');
    }

    console.log('--- All DB Integration Tests Completed Successfully! ---');
  } catch (error) {
    console.error('✘ Integration Tests FAILED:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('Database connections closed.');
  }
}

runTests();
