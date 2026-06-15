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
} from '../../../../models';

export async function POST() {
  try {
    // 1. Ensure Database Exists
    await ensureDatabaseExists();

    // 2. Synchronize Schema
    await sequelize.sync({ force: false, alter: true });

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
        name: 'F-Ordering Main Branch',
        address: '100 Silicon Valley Way, Suite A, San Jose, CA',
        phone: '+1 555-0199',
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
      console.log('Seeded default cashier user: cashier@fordering.com / password123');
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
