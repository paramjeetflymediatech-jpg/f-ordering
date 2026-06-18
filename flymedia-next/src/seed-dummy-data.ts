/**
 * seed-dummy-data.ts
 * Script to populate central and tenant databases for both organizations:
 * 1. F-Ordering Foods Ltd (f-ordering-foods)
 * 2. Mitran Da Dhaba (mitran-da-dhaba)
 *
 * Run with: npx ts-node src/seed-dummy-data.ts
 */

import bcrypt from 'bcryptjs';
import { 
  sequelize as centralSeq, 
  Organization as CentralOrg, 
  Store as CentralStore, 
  User as CentralUser, 
  Role as CentralRole,
  Permission as CentralPermission,
  Customer as CentralCustomer,
  Order as CentralOrder,
  Payment as CentralPayment,
  RestaurantTable as CentralTable,
  MenuCategory as CentralCategory,
  MenuItem as CentralMenuItem
} from './models';
import { provisionTenantDatabase, getTenantModels } from './lib/tenant-db';

async function seedCentralDb() {
  console.log('--- Seeding Central Database ---');
  await centralSeq.authenticate();

  // Create Roles & Permissions
  const [superAdminRole, ownerRole, cashierRole] = await Promise.all([
    CentralRole.findOrCreate({ where: { name: 'Super Admin' }, defaults: { name: 'Super Admin', description: 'Global system administrator' } }).then(([r]) => r),
    CentralRole.findOrCreate({ where: { name: 'Restaurant Owner' }, defaults: { name: 'Restaurant Owner', description: 'Owner of the organization' } }).then(([r]) => r),
    CentralRole.findOrCreate({ where: { name: 'Cashier' }, defaults: { name: 'Cashier', description: 'Sales terminal operator' } }).then(([r]) => r),
  ]);

  const hashedPwd = await bcrypt.hash('password123', 10);

  // 1. F-Ordering Foods Ltd (f-ordering-foods)
  const [fOrg] = await CentralOrg.findOrCreate({
    where: { slug: 'f-ordering-foods' },
    defaults: {
      name: 'F-Ordering Foods Ltd',
      slug: 'f-ordering-foods',
      status: 'active',
      subscription_plan: 'enterprise',
    }
  });

  const [fStore] = await CentralStore.findOrCreate({
    where: { organization_id: fOrg.id },
    defaults: {
      organization_id: fOrg.id,
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
    }
  });

  // Users
  const [fOwner] = await CentralUser.findOrCreate({
    where: { email: 'owner@fordering.com' },
    defaults: {
      organization_id: fOrg.id,
      store_id: fStore.id,
      name: 'John Doe (Owner)',
      email: 'owner@fordering.com',
      password: hashedPwd,
      phone: '+1 555-0210',
      status: 'active',
    }
  });
  await (fOwner as any).addRole(ownerRole);

  const [fAdmin] = await CentralUser.findOrCreate({
    where: { email: 'admin@fordering.com' },
    defaults: {
      organization_id: fOrg.id,
      store_id: fStore.id,
      name: 'System Admin (Super)',
      email: 'admin@fordering.com',
      password: hashedPwd,
      phone: '+1 555-0100',
      status: 'active',
    }
  });
  await (fAdmin as any).addRole(superAdminRole);

  // 2. Mitran Da Dhaba (mitran-da-dhaba)
  const [mOrg] = await CentralOrg.findOrCreate({
    where: { slug: 'mitran-da-dhaba' },
    defaults: {
      name: 'Mitran Da Dhaba',
      slug: 'mitran-da-dhaba',
      status: 'active',
      subscription_plan: 'enterprise',
    }
  });

  const [mStore] = await CentralStore.findOrCreate({
    where: { organization_id: mOrg.id },
    defaults: {
      organization_id: mOrg.id,
      name: 'Mitran Da Dhaba',
      category: 'Indian Restaurant',
      address: '123 Curry Road, Warners Bay',
      zip_code: '2282',
      state: 'NSW',
      city: 'Sydney',
      country: 'Australia',
      phone: '+61 299999999',
      email: 'info@mitrandadhaba.com.au',
      currency: 'AUD',
      website: 'https://mitrandadhaba.info/',
      tax_rate: 10.00,
    }
  });

  const [mOwner] = await CentralUser.findOrCreate({
    where: { email: 'owner@mitrandadhaba.com.au' },
    defaults: {
      organization_id: mOrg.id,
      store_id: mStore.id,
      name: 'Mitran Owner',
      email: 'owner@mitrandadhaba.com.au',
      password: hashedPwd,
      phone: '+61 299999998',
      status: 'active',
    }
  });
  await (mOwner as any).addRole(ownerRole);

  // Clean up transactional records to avoid duplicates/unique constraints on re-run
  await CentralPayment.destroy({ where: {}, force: true }).catch(() => {});
  await CentralOrder.destroy({ where: {}, force: true }).catch(() => {});
  await CentralCustomer.destroy({ where: {}, force: true }).catch(() => {});

  // Seed Central DB Customers & Orders for F-Ordering
  console.log('Seeding central orders for F-Ordering Foods...');
  const fc1 = await CentralCustomer.create({ organization_id: fOrg.id, name: 'Mr Warrick Jordan', email: 'warrickjordan@gmail.com', phone: '0451633197' });
  const fc2 = await CentralCustomer.create({ organization_id: fOrg.id, name: 'Terry Mulcahy', email: 'terry@gmail.com', phone: '0499634548' });

  // Warrick Jordan: 3 orders
  for (let i = 1; i <= 3; i++) {
    const ord = await CentralOrder.create({
      organization_id: fOrg.id,
      store_id: fStore.id,
      customer_id: fc1.id,
      order_number: `ORD-FO-WJ-${i}`,
      order_type: 'dine_in',
      status: 'completed',
      total_amount: 50.00,
      tax_amount: 4.10,
    });
    await CentralPayment.create({
      order_id: ord.id,
      amount: 50.00,
      payment_method: 'card',
      transaction_status: 'success',
      transaction_reference: `TX-FO-WJ-PAY-${i}`,
    });
  }

  // Terry Mulcahy: 2 orders
  for (let i = 1; i <= 2; i++) {
    const ord = await CentralOrder.create({
      organization_id: fOrg.id,
      store_id: fStore.id,
      customer_id: fc2.id,
      order_number: `ORD-FO-TM-${i}`,
      order_type: 'dine_in',
      status: 'completed',
      total_amount: 80.00,
      tax_amount: 6.60,
    });
    await CentralPayment.create({
      order_id: ord.id,
      amount: 80.00,
      payment_method: 'cash',
      transaction_status: 'success',
      transaction_reference: `TX-FO-TM-PAY-${i}`,
    });
  }

  // Seed Central DB Customers & Orders for Mitran Da Dhaba
  console.log('Seeding central orders for Mitran Da Dhaba...');
  const mc1 = await CentralCustomer.create({ organization_id: mOrg.id, name: 'Param Singh', email: 'param@mitran.com', phone: '0412345678' });
  const mc2 = await CentralCustomer.create({ organization_id: mOrg.id, name: 'Gurpreet Kaur', email: 'gurpreet@mitran.com', phone: '0487654321' });

  // Param: 4 orders
  for (let i = 1; i <= 4; i++) {
    const ord = await CentralOrder.create({
      organization_id: mOrg.id,
      store_id: mStore.id,
      customer_id: mc1.id,
      order_number: `ORD-MDD-PS-${i}`,
      order_type: 'dine_in',
      status: 'completed',
      total_amount: 65.50,
      tax_amount: 6.55,
    });
    await CentralPayment.create({
      order_id: ord.id,
      amount: 65.50,
      payment_method: 'card',
      transaction_status: 'success',
      transaction_reference: `TX-MDD-PS-PAY-${i}`,
    });
  }

  // Gurpreet: 3 orders
  for (let i = 1; i <= 3; i++) {
    const ord = await CentralOrder.create({
      organization_id: mOrg.id,
      store_id: mStore.id,
      customer_id: mc2.id,
      order_number: `ORD-MDD-GK-${i}`,
      order_type: 'takeaway',
      status: 'completed',
      total_amount: 45.00,
      tax_amount: 4.50,
    });
    await CentralPayment.create({
      order_id: ord.id,
      amount: 45.00,
      payment_method: 'cash',
      transaction_status: 'success',
      transaction_reference: `TX-MDD-GK-PAY-${i}`,
    });
  }

  console.log('✅ Central DB Seeding Done.');
}

async function seedTenantDb(slug: string, storeName: string, itemsList: any[], customersList: any[]) {
  console.log(`\n--- Seeding Tenant DB for: ${slug} ---`);
  await provisionTenantDatabase(slug);
  const models = await getTenantModels(slug);

  // Verify default store
  const [store] = await models.Store.findOrCreate({
    where: { name: storeName },
    defaults: {
      organization_id: 'default-org-id',
      name: storeName,
      category: 'Restaurant',
      address: 'Store Street Address',
      phone: '1234567890',
      tax_rate: 10.0,
      currency: 'AUD',
    }
  });

  // Seed Menu Categories and Items
  console.log(`Seeding categories & menu items inside tenant_${slug}...`);
  const categoriesMap: Record<string, any> = {};
  for (const item of itemsList) {
    if (!categoriesMap[item.category]) {
      const [cat] = await models.MenuCategory.findOrCreate({
        where: { name: item.category },
        defaults: {
          name: item.category,
          sort_order: 1,
          is_active: true,
          organization_id: 'default-org-id',
          store_id: store.id,
        }
      });
      categoriesMap[item.category] = cat;
    }
    const category = categoriesMap[item.category];
    await models.MenuItem.findOrCreate({
      where: { name: item.name },
      defaults: {
        category_id: category.id,
        name: item.name,
        description: item.description,
        price: item.price,
        is_available: true,
        organization_id: 'default-org-id',
        store_id: store.id,
      }
    });
  }

  // Seed Tables
  await Promise.all([
    models.RestaurantTable.findOrCreate({
      where: { table_number: 'Table 1' },
      defaults: {
        table_number: 'Table 1',
        seating_capacity: 4,
        status: 'available',
        store_id: store.id,
        organization_id: 'default-org-id',
      }
    }),
    models.RestaurantTable.findOrCreate({
      where: { table_number: 'Table 2' },
      defaults: {
        table_number: 'Table 2',
        seating_capacity: 4,
        status: 'available',
        store_id: store.id,
        organization_id: 'default-org-id',
      }
    }),
  ]);

  // Clean up existing transactional records to avoid duplicate constraints on re-run
  await models.Payment.destroy({ where: {}, force: true }).catch(() => {});
  await models.Order.destroy({ where: {}, force: true }).catch(() => {});
  await models.Customer.destroy({ where: {}, force: true }).catch(() => {});

  // Seed Customers & Orders
  console.log(`Seeding customers, orders & payments inside tenant_${slug}...`);
  for (const cust of customersList) {
    const tenantCust = await models.Customer.create({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      organization_id: 'default-org-id',
    });

    for (let i = 1; i <= cust.orderCount; i++) {
      const orderNum = `ORD-${slug.toUpperCase().slice(0, 3)}-${cust.name.split(' ')[0].toUpperCase()}-${i}`;
      const amount = cust.orderAmount;
      const order = await models.Order.create({
        store_id: store.id,
        customer_id: tenantCust.id,
        order_number: orderNum,
        order_type: 'dine_in',
        status: 'completed',
        total_amount: amount,
        tax_amount: Math.round(amount * 0.1 * 100) / 100,
        organization_id: 'default-org-id',
      });

      await models.Payment.create({
        order_id: order.id,
        amount,
        payment_method: i % 2 === 0 ? 'card' : 'cash',
        transaction_status: 'success',
        transaction_reference: `TX-${orderNum}-PAY`,
      });
    }
  }

  console.log(`✅ Tenant DB '${slug}' Seeding Done.`);
}

async function main() {
  try {
    await seedCentralDb();

    // 1. Seed F-Ordering Foods tenant DB
    await seedTenantDb(
      'f-ordering-foods',
      'The Grand Pavillion Warner Bay',
      [
        { category: 'Appetizers', name: 'Truffle Parmesan Fries', description: 'Fries with white truffle oil and parmesan', price: 9.50 },
        { category: 'Main Course', name: 'Classic Smash Burger', description: 'Smash beef patty with cheddar cheese', price: 14.99 },
        { category: 'Main Course', name: 'Woodfired Margherita Pizza', description: 'Fresh buffalo mozzarella and basil', price: 13.99 },
        { category: 'Beverages', name: 'Fresh Mint Lime Soda', description: 'Sparkling mint lime mocktail', price: 4.50 },
      ],
      [
        { name: 'Mr Warrick Jordan', email: 'warrickjordan@gmail.com', phone: '0451633197', orderCount: 3, orderAmount: 50.00 },
        { name: 'Terry Mulcahy', email: 'terry@gmail.com', phone: '0499634548', orderCount: 2, orderAmount: 80.00 }
      ]
    );

    // 2. Seed Mitran Da Dhaba tenant DB
    await seedTenantDb(
      'mitran-da-dhaba',
      'Mitran Da Dhaba',
      [
        { category: 'Entree', name: 'Paneer Tikka', description: 'Grilled marinated cottage cheese cubes', price: 15.90 },
        { category: 'Mains', name: 'Butter Chicken', description: 'Creamy tomato-based clay oven tandoori chicken', price: 21.90 },
        { category: 'Mains', name: 'Dal Makhani', description: 'Slow cooked creamy black lentils', price: 18.90 },
      ],
      [
        { name: 'Param Singh', email: 'param@mitran.com', phone: '0412345678', orderCount: 4, orderAmount: 65.50 },
        { name: 'Gurpreet Kaur', email: 'gurpreet@mitran.com', phone: '0487654321', orderCount: 3, orderAmount: 45.00 }
      ]
    );

    console.log('\n🌟 SEEDING PROCESS COMPLETED SUCCESSFULLY FOR BOTH DATABASES! 🌟');
  } catch (error) {
    console.error('Fatal Seeding Error:', error);
    process.exit(1);
  } finally {
    await centralSeq.close();
  }
}

main();
