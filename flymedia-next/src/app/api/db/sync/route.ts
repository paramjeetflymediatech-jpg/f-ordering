// Force recompilation comment
import { NextResponse } from 'next/server';
import { ensureDatabaseExists, sequelize } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import {
  Organization,
  Store,
  User,
  Role,
  Permission,
  MenuCategory,
  MenuItem,
  MenuVariant,
  MenuAddon,
  RestaurantTable,
  Customer,
  Reservation,
  Coupon,
  Service,
  Package,
  Order,
  Payment,
} from '../../../../models';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // 1. Ensure Database Exists
    await ensureDatabaseExists();

    // 2. Synchronize Schema & Cleanup Accumulated Redundant Indexes
    if (force) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    }

    try {
      const [indexes]: any = await sequelize.query(`
        SELECT TABLE_NAME, INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND INDEX_NAME != 'PRIMARY'
      `);

      for (const row of (indexes || [])) {
        const tbl = row.TABLE_NAME;
        const idx = row.INDEX_NAME;
        if (
          /_\d+$/.test(idx) || 
          (tbl === 'organizations' && (idx === 'slug' || idx.startsWith('slug'))) ||
          (tbl === 'users' && (idx === 'email' || idx === 'users_email_unique' || idx.startsWith('email')))
        ) {
          try {
            await sequelize.query(`ALTER TABLE \`${tbl}\` DROP INDEX \`${idx}\``);
          } catch (e) {
            /* ignore index drop error */
          }
        }
      }
    } catch (e) {
      /* ignore statistics error */
    }

    await sequelize.sync({ force, alter: !force });
    if (force) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // 3. Seed Roles & Permissions if they don't exist yet
    const existingRolesCount = await Role.count();
    if (existingRolesCount === 0) {
      console.log('Seeding initial system roles and permissions...');

      // Create Permissions
      const perms = await Promise.all([
        Permission.create({ name: 'pos:access', description: 'Access POS terminal screen' }),
        Permission.create({ name: 'pos:checkout', description: 'Complete a checkout transaction' }),
        Permission.create({ name: 'pos:refund', description: 'Issue discounts or refunds' }),
        Permission.create({ name: 'menu:write', description: 'Create and update menu items' }),
        Permission.create({ name: 'menu:read', description: 'View menu listings' }),
        Permission.create({ name: 'settings:write', description: 'Modify store configurations' }),
        Permission.create({ name: 'reports:read', description: 'View sales and analytics reports' }),
      ]);

      // Create Roles
      const [superAdminRole, ownerRole, managerRole, cashierRole, kitchenRole, waiterRole] = await Promise.all([
        Role.create({ name: 'Super Admin', description: 'Global system administrator' }),
        Role.create({ name: 'Restaurant Owner', description: 'Owner of the organization and all stores' }),
        Role.create({ name: 'Manager', description: 'Store manager' }),
        Role.create({ name: 'Cashier', description: 'Sales terminal operator' }),
        Role.create({ name: 'Kitchen Staff', description: 'Kitchen Display System operator' }),
        Role.create({ name: 'Waiter', description: 'Service and table ordering staff' }),
      ]);

      // Associate Permissions with Roles
      // Super Admin gets all permissions
      await (superAdminRole as any).setPermissions(perms);

      // Owner gets all except global settings
      await (ownerRole as any).setPermissions(perms);

      // Manager gets pos:access, pos:checkout, menu:read, settings:write
      await (managerRole as any).setPermissions([
        perms.find(p => p.name === 'pos:access')!,
        perms.find(p => p.name === 'pos:checkout')!,
        perms.find(p => p.name === 'menu:read')!,
        perms.find(p => p.name === 'settings:write')!,
      ]);

      // Cashier gets pos:access, pos:checkout, menu:read
      await (cashierRole as any).setPermissions([
        perms.find(p => p.name === 'pos:access')!,
        perms.find(p => p.name === 'pos:checkout')!,
        perms.find(p => p.name === 'menu:read')!,
      ]);

      // Kitchen Staff gets pos:access, menu:read
      await (kitchenRole as any).setPermissions([
        perms.find(p => p.name === 'pos:access')!,
        perms.find(p => p.name === 'menu:read')!,
      ]);

      // Waiter gets pos:access, pos:checkout, menu:read
      await (waiterRole as any).setPermissions([
        perms.find(p => p.name === 'pos:access')!,
        perms.find(p => p.name === 'pos:checkout')!,
        perms.find(p => p.name === 'menu:read')!,
      ]);
    }

    // 4. Seed Default Tenant (Organization & Store) if empty
    const orgCount = await Organization.count();
    let defaultOrg;
    let defaultStore;
    if (orgCount === 0) {
      defaultOrg = await Organization.create({
        name: 'F-Ordering Foods Ltd',
        slug: 'f-ordering-foods',
        logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300',
        status: 'active',
        subscription_plan: 'enterprise',
      });

      defaultStore = await Store.create({
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
        description: 'A fine dining pavilion serving authentic culinary experiences.',
        tax_rate: 8.25,
        business_hours: {
          monday: { open: '08:00', close: '22:00' },
          tuesday: { open: '08:00', close: '22:00' },
          wednesday: { open: '08:00', close: '22:00' },
          thursday: { open: '08:00', close: '22:00' },
          friday: { open: '08:00', close: '23:00' },
          saturday: { open: '09:00', close: '23:00' },
          sunday: { open: '09:00', close: '21:00' },
        },
      });

      // Seed Default Tables
      await Promise.all([
        RestaurantTable.create({ organization_id: defaultOrg.id, store_id: defaultStore.id, table_number: 'Table 1', seating_capacity: 2, status: 'available' }),
        RestaurantTable.create({ organization_id: defaultOrg.id, store_id: defaultStore.id, table_number: 'Table 2', seating_capacity: 2, status: 'available' }),
        RestaurantTable.create({ organization_id: defaultOrg.id, store_id: defaultStore.id, table_number: 'Table 3', seating_capacity: 4, status: 'available' }),
        RestaurantTable.create({ organization_id: defaultOrg.id, store_id: defaultStore.id, table_number: 'Table 4', seating_capacity: 4, status: 'available' }),
        RestaurantTable.create({ organization_id: defaultOrg.id, store_id: defaultStore.id, table_number: 'Table 5', seating_capacity: 6, status: 'available' }),
      ]);

      // Seed Default Menu Categories and Items
      const appetizers = await MenuCategory.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        name: 'Appetizers',
        sort_order: 1,
        is_active: true,
      });

      const mains = await MenuCategory.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        name: 'Main Course',
        sort_order: 2,
        is_active: true,
      });

      const beverages = await MenuCategory.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        name: 'Beverages',
        sort_order: 3,
        is_active: true,
      });

      // Create Menu Items
      const itemFries = await MenuItem.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        category_id: appetizers.id,
        name: 'Truffle Parmesan Fries',
        description: 'Golden crispy fries tossed in white truffle oil, grated parmesan cheese, and fresh parsley.',
        price: 9.50,
        image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=300',
        is_available: true,
      });

      const itemBurger = await MenuItem.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        category_id: mains.id,
        name: 'Classic Smash Burger',
        description: 'Premium beef patty, sharp cheddar cheese, caramelized onions, house pickles, and smash sauce on a toasted brioche bun.',
        price: 14.99,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300',
        is_available: true,
      });

      // Add variants to burger
      await MenuVariant.create({
        menu_item_id: itemBurger.id,
        name: 'Double Patty',
        additional_price: 3.50,
      });
      await MenuVariant.create({
        menu_item_id: itemBurger.id,
        name: 'Triple Patty',
        additional_price: 6.00,
      });

      // Add addons to burger
      await MenuAddon.create({
        menu_item_id: itemBurger.id,
        name: 'Extra Cheddar Cheese',
        price: 1.50,
      });
      await MenuAddon.create({
        menu_item_id: itemBurger.id,
        name: 'Crispy Bacon Strips',
        price: 2.50,
      });

      const itemPizza = await MenuItem.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        category_id: mains.id,
        name: 'Woodfired Margherita Pizza',
        description: 'San Marzano tomato base, fresh buffalo mozzarella, fresh basil leaves, and a drizzle of extra virgin olive oil.',
        price: 13.99,
        image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=300',
        is_available: true,
      });

      const itemSoda = await MenuItem.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        category_id: beverages.id,
        name: 'Fresh Mint Lime Soda',
        description: 'Refreshing sparkling water mixed with organic mint extracts and fresh lime juice juice.',
        price: 4.50,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=300',
        is_available: true,
      });

      // 5. Seed Users
      const superAdminRoleModel = await Role.findOne({ where: { name: 'Super Admin' } });
      const ownerRoleModel = await Role.findOne({ where: { name: 'Restaurant Owner' } });
      const cashierRoleModel = await Role.findOne({ where: { name: 'Cashier' } });

      const hashedDefaultPassword = await bcrypt.hash('password123', 10);

      // Create Default Super Admin User
      const superAdminUser = await User.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        name: 'System Admin (Super)',
        email: 'admin@fordering.com',
        password: hashedDefaultPassword,
        phone: '+1 555-0100',
        status: 'active',
      });
      await (superAdminUser as any).addRole(superAdminRoleModel);

      // Create Default Owner User
      const ownerUser = await User.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        name: 'John Doe (Owner)',
        email: 'owner@fordering.com',
        password: hashedDefaultPassword,
        phone: '+1 555-0210',
        status: 'active',
      });
      await (ownerUser as any).addRole(ownerRoleModel);

      // Create Default Cashier User
      const cashierUser = await User.create({
        organization_id: defaultOrg.id,
        store_id: defaultStore.id,
        name: 'Sarah Connor (Cashier)',
        email: 'cashier@fordering.com',
        password: hashedDefaultPassword,
        phone: '+1 555-0211',
        status: 'active',
      });
      await (cashierUser as any).addRole(cashierRoleModel);

      console.log('Seeded default super admin user: admin@fordering.com / password123');
      console.log('Seeded default owner user: owner@fordering.com / password123');
    } else {
      const firstStore = await Store.findOne();
      if (firstStore && !firstStore.email) {
        await firstStore.update({
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
          description: 'A fine dining pavilion serving authentic culinary experiences.',
        });
      }
    }

    // 6. Seed Default Services & Packages if empty
    const serviceCount = await Service.count();
    if (serviceCount === 0) {
      console.log('Seeding initial agency services and packages...');
      const seoService = await Service.create({
        title: 'Search Engine Optimization (SEO)',
        description: 'Climb Google ranks, capture targeted traffic, and grow organic sales with data-driven keywords, link acquisition, and technical audits.',
        icon: 'Search',
        color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        highlights: ['Keyword Research', 'Technical SEO', 'Link Building', 'Local Optimization'],
      });

      const webDesignService = await Service.create({
        title: 'Bespoke Web Design & Development',
        description: 'Deploy fast, modern interfaces with optimized performance using React, Next.js, and static sites. Designed to convert visitors into loyal clients.',
        icon: 'Code2',
        color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        highlights: ['React & Next.js Apps', 'Responsive Designs', 'SaaS Architectures', 'UI/UX Prototypes'],
      });

      const ppcService = await Service.create({
        title: 'Pay-Per-Click Advertising (PPC)',
        description: 'Achieve immediate leads and conversions via targeted search, display, and social ads. Continuous optimization for lowest cost-per-acquisition (CPA).',
        icon: 'TrendingUp',
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        highlights: ['Google Search Ads', 'Retargeting Campaigns', 'Social Media Ads', 'Landing Page Audits'],
      });

      // Seed default packages for these services
      await Package.bulkCreate([
        {
          name: 'SEO Starter Pack',
          price: 399.00,
          billing_cycle: 'monthly',
          features: ['5 Keywords Tracked', 'On-Page Audits', 'Monthly Report', 'Basic Link Building'],
          is_popular: false,
          service_id: seoService.id,
        },
        {
          name: 'SEO Enterprise Pro',
          price: 999.00,
          billing_cycle: 'monthly',
          features: ['30 Keywords Tracked', 'Full Technical SEO Audit', 'Competitor Analysis', 'Premium Link Building', 'Dedicated Support Account Manager'],
          is_popular: true,
          service_id: seoService.id,
        },
        {
          name: 'Single Page Landing Web App',
          price: 799.00,
          billing_cycle: 'one-time',
          features: ['React & Next.js Core', 'Responsive Web Layout', 'Framer Motion Micro-Animations', 'Contact Inquiry Form Sync', 'SEO Metadata Setup'],
          is_popular: false,
          service_id: webDesignService.id,
        },
        {
          name: 'Multi-Page SaaS Portal Web App',
          price: 2499.00,
          billing_cycle: 'one-time',
          features: ['Multi-Page Setup & Client Portal Router', 'Custom Database Integrations', 'Authentication Middleware', 'Full Custom Admin Controls UI', '90 Days Post-Release Support'],
          is_popular: true,
          service_id: webDesignService.id,
        },
      ]);
      console.log('Seeded default services and packages successfully!');
    }

    // Seed Customers, Orders, and Payments matching Warrick Jordan and other details from screens
    const firstOrg = await Organization.findOne();
    const firstStore = await Store.findOne();
    if (firstOrg && firstStore) {
      const customerCount = await Customer.count();
      if (customerCount === 0) {
        console.log('Seeding initial customers, orders and payments...');
        
        const c1 = await Customer.create({
          organization_id: firstOrg.id,
          name: 'Mr Warrick Jordan',
          first_name: 'Mr Warrick Jordan',
          last_name: '-',
          email: 'warrickjordan@gmail.com',
          phone: '0451633197',
          loyalty_points: 120,
          company_name: '-',
          date_of_birth: '-',
          address: '-',
          city: '-',
          state: '-',
          country: '-',
          zip_code: '-',
        });

        const c2 = await Customer.create({
          organization_id: firstOrg.id,
          name: 'terry mulcahy',
          first_name: 'terry mulcahy',
          last_name: '-',
          email: null,
          phone: '0499634548',
          loyalty_points: 450,
          company_name: '-',
          date_of_birth: '-',
          address: 'unit 2, Cardiff executive apartments, cardiff',
          city: 'Cardiff',
          state: 'NSW',
          country: 'Australia',
          zip_code: '2305',
        });

        const c3 = await Customer.create({
          organization_id: firstOrg.id,
          name: 'Liam Simmons',
          first_name: 'Liam Simmons',
          last_name: '-',
          email: 'lsimmons95@gmail.com',
          phone: '0410330367',
          loyalty_points: 45,
          company_name: '-',
          date_of_birth: '-',
          address: '-',
          city: '-',
          state: '-',
          country: '-',
          zip_code: '-',
        });

        const c4 = await Customer.create({
          organization_id: firstOrg.id,
          name: 'Joshua Cameron',
          first_name: 'Joshua Cameron',
          last_name: '-',
          email: 'joshuacameron92@gmail.com',
          phone: '402442845',
          loyalty_points: 520,
          company_name: '-',
          date_of_birth: '-',
          address: '23 Morse St',
          city: 'Speers Point',
          state: 'NSW',
          country: 'Australia',
          zip_code: '2284',
        });

        const c5 = await Customer.create({
          organization_id: firstOrg.id,
          name: 'Arun',
          first_name: 'Arun',
          last_name: '-',
          email: 'haiarun07@gmail.com',
          phone: '0493252238',
          loyalty_points: 210,
          company_name: '-',
          date_of_birth: '-',
          address: '-',
          city: '-',
          state: '-',
          country: '-',
          zip_code: '-',
        });

        const c6 = await Customer.create({
          organization_id: firstOrg.id,
          name: 'Charlise',
          first_name: 'Charlise',
          last_name: '-',
          email: 'cheeshi28@gmail.com',
          phone: '422772969',
          loyalty_points: 15,
          company_name: '-',
          date_of_birth: '-',
          address: '-',
          city: '-',
          state: '-',
          country: '-',
          zip_code: '-',
        });

        const c7 = await Customer.create({
          organization_id: firstOrg.id,
          name: 'Nick',
          first_name: 'Nick',
          last_name: '-',
          email: 'nickridley_@outlook.com',
          phone: '0431217465',
          loyalty_points: 10,
          company_name: '-',
          date_of_birth: '-',
          address: '-',
          city: '-',
          state: '-',
          country: '-',
          zip_code: '-',
        });

        // Seed Orders for each to calculate totals
        // Mr Warrick Jordan: 5 orders, total 239.80 (all paid)
        for (let i = 1; i <= 5; i++) {
          const ord = await Order.create({
            organization_id: firstOrg.id,
            store_id: firstStore.id,
            customer_id: c1.id,
            order_number: `ORD-WJ-00${i}`,
            order_type: 'dine_in',
            status: 'completed',
            total_amount: 47.96,
            tax_amount: 3.96,
          });
          await Payment.create({
            order_id: ord.id,
            amount: 47.96,
            payment_method: 'card',
            transaction_status: 'success',
            transaction_reference: `TX-WJ-PAY-${i}`,
          });
        }

        // Terry Mulcahy: 20 orders, total 1576.90. (19 paid of $79.27, 1 unpaid of $70.70)
        for (let i = 1; i <= 19; i++) {
          const ord = await Order.create({
            organization_id: firstOrg.id,
            store_id: firstStore.id,
            customer_id: c2.id,
            order_number: `ORD-TM-0${i < 10 ? '0' + i : i}`,
            order_type: 'dine_in',
            status: 'completed',
            total_amount: 79.27,
            tax_amount: 6.54,
          });
          await Payment.create({
            order_id: ord.id,
            amount: 79.27,
            payment_method: 'cash',
            transaction_status: 'success',
            transaction_reference: `TX-TM-PAY-${i}`,
          });
        }
        await Order.create({
          organization_id: firstOrg.id,
          store_id: firstStore.id,
          customer_id: c2.id,
          order_number: `ORD-TM-020`,
          order_type: 'dine_in',
          status: 'pending',
          total_amount: 70.70,
          tax_amount: 5.83,
        });

        // Liam Simmons: 2 orders, total 157.00
        for (let i = 1; i <= 2; i++) {
          const ord = await Order.create({
            organization_id: firstOrg.id,
            store_id: firstStore.id,
            customer_id: c3.id,
            order_number: `ORD-LS-00${i}`,
            order_type: 'dine_in',
            status: 'completed',
            total_amount: 78.50,
            tax_amount: 6.48,
          });
          await Payment.create({
            order_id: ord.id,
            amount: 78.50,
            payment_method: 'upi',
            transaction_status: 'success',
            transaction_reference: `TX-LS-PAY-${i}`,
          });
        }

        // Joshua Cameron: 27 orders, total 1667.70
        for (let i = 1; i <= 27; i++) {
          const ord = await Order.create({
            organization_id: firstOrg.id,
            store_id: firstStore.id,
            customer_id: c4.id,
            order_number: `ORD-JC-0${i < 10 ? '0' + i : i}`,
            order_type: 'dine_in',
            status: 'completed',
            total_amount: 61.77,
            tax_amount: 5.10,
          });
          await Payment.create({
            order_id: ord.id,
            amount: 61.77,
            payment_method: 'card',
            transaction_status: 'success',
            transaction_reference: `TX-JC-PAY-${i}`,
          });
        }

        // Arun: 14 orders, total 1159.33
        for (let i = 1; i <= 14; i++) {
          const ord = await Order.create({
            organization_id: firstOrg.id,
            store_id: firstStore.id,
            customer_id: c5.id,
            order_number: `ORD-AR-0${i < 10 ? '0' + i : i}`,
            order_type: 'dine_in',
            status: 'completed',
            total_amount: 82.81,
            tax_amount: 6.83,
          });
          await Payment.create({
            order_id: ord.id,
            amount: 82.81,
            payment_method: 'cash',
            transaction_status: 'success',
            transaction_reference: `TX-AR-PAY-${i}`,
          });
        }

        // Charlise: 1 order, total 62.80
        const ordC = await Order.create({
          organization_id: firstOrg.id,
          store_id: firstStore.id,
          customer_id: c6.id,
          order_number: `ORD-CH-001`,
          order_type: 'dine_in',
          status: 'completed',
          total_amount: 62.80,
          tax_amount: 5.18,
        });
        await Payment.create({
          order_id: ordC.id,
          amount: 62.80,
          payment_method: 'card',
          transaction_status: 'success',
          transaction_reference: `TX-CH-PAY-1`,
        });

        // Nick: 1 order, total 41.30 (unpaid)
        await Order.create({
          organization_id: firstOrg.id,
          store_id: firstStore.id,
          customer_id: c7.id,
          order_number: `ORD-NK-001`,
          order_type: 'dine_in',
          status: 'pending',
          total_amount: 41.30,
          tax_amount: 3.41,
        });
        console.log('Seeded default customers, orders, and payments successfully!');
      }
    }


    return NextResponse.json({
      success: true,
      message: 'Database schema synchronized and default seeds processed successfully!',
    });
  } catch (error: any) {
    console.error('Database Sync Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database synchronization failed.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
