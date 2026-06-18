/**
 * tenant-db.ts
 * Multi-tenant database utility for the F-Ordering SaaS platform.
 *
 * Strategy:
 * - Each organization gets an isolated MySQL database: `tenant_<slug>`
 * - Model classes are imported statically at the top level (required for Next.js)
 * - Each is re-initialised on a fresh Sequelize instance for the tenant DB
 * - FK references to central tables (organizations, stores) are stripped
 * - A global connection pool cache prevents redundant connections per request
 */

import { Sequelize, Model } from 'sequelize';
import mysql from 'mysql2/promise';

// ── Static top-level imports of all model CLASSES ───────────────────────────
// We import the class constructors directly so they are resolved at build time.
import { User }            from '../models/User';
import { Role }            from '../models/Role';
import { Permission }      from '../models/Permission';
import { Store }           from '../models/Store';
import { MenuCategory }    from '../models/MenuCategory';
import { MenuItem }        from '../models/MenuItem';
import { MenuVariant }     from '../models/MenuVariant';
import { MenuAddon }       from '../models/MenuAddon';
import { RestaurantTable } from '../models/RestaurantTable';
import { Order }           from '../models/Order';
import { OrderItem }       from '../models/OrderItem';
import { Payment }         from '../models/Payment';
import { Customer }        from '../models/Customer';
import { Reservation }     from '../models/Reservation';
import { Coupon }          from '../models/Coupon';

// ─── Connection-level config ─────────────────────────────────────────────────
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';

// ─── Global connection pool cache (keyed by DB name) ─────────────────────────
const connectionCache = new Map<string, Sequelize>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts an org slug to a safe MySQL database name */
export function slugToDbName(slug: string): string {
  return `tenant_${slug.replace(/-/g, '_')}`;
}

/**
 * Strips all cross-database FK references from rawAttributes so the model
 * can be safely initialised on an isolated tenant Sequelize instance.
 */
function cleanAttributes(rawAttributes: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const key in rawAttributes) {
    const attr = { ...rawAttributes[key] };
    if (attr.references) {
      delete attr.references;
      delete attr.onDelete;
      delete attr.onUpdate;
    }
    clean[key] = attr;
  }
  return clean;
}

/** Creates (or returns cached) a Sequelize instance for a tenant database */
async function getTenantSequelize(dbName: string): Promise<Sequelize> {
  if (connectionCache.has(dbName)) {
    return connectionCache.get(dbName)!;
  }
  const seq = new Sequelize(dbName, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true },
  });
  await seq.authenticate();
  connectionCache.set(dbName, seq);
  return seq;
}

// ─── Tenant Model Factory ─────────────────────────────────────────────────────

/**
 * Re-initialises the statically-imported model classes onto the provided
 * tenant Sequelize instance (with FK references stripped).
 *
 * NOTE: Each call creates fresh subclasses so models from different tenants
 * are fully isolated and won't share Sequelize's internal model registry.
 */
function makeTenantModels(seq: Sequelize) {
  // Helper: subclass the original model and init it on the tenant sequelize
  function rebind<T extends typeof Model>(
    Original: T,
    modelName: string,
    tableName: string,
    extraOptions: Record<string, any> = {}
  ): T {
    // Create a fresh anonymous subclass — this gives us an independent model
    // class that won't collide with the central-DB version.
    const TenantModel = class extends (Original as any) {} as unknown as T;
    (TenantModel as any).init(cleanAttributes((Original as any).rawAttributes), {
      sequelize: seq,
      modelName,
      tableName,
      underscored: true,
      timestamps: true,
      ...extraOptions,
    });
    return TenantModel;
  }

  const TUser        = rebind(User,            'User',            'users');
  const TRole        = rebind(Role,            'Role',            'roles');
  const TPermission  = rebind(Permission,      'Permission',      'permissions');
  const TStore       = rebind(Store,           'Store',           'stores');
  const TMenuCat     = rebind(MenuCategory,    'MenuCategory',    'menu_categories');
  const TMenuItem    = rebind(MenuItem,        'MenuItem',        'menu_items');
  const TVariant     = rebind(MenuVariant,     'MenuVariant',     'menu_variants');
  const TAddon       = rebind(MenuAddon,       'MenuAddon',       'menu_addons');
  const TTable       = rebind(RestaurantTable, 'RestaurantTable', 'restaurant_tables');
  const TOrder       = rebind(Order,           'Order',           'orders');
  const TOrderItem   = rebind(OrderItem,       'OrderItem',       'order_items');
  const TPayment     = rebind(Payment,         'Payment',         'payments');
  const TCustomer    = rebind(Customer,        'Customer',        'customers');
  const TReservation = rebind(Reservation,     'Reservation',     'reservations');
  const TCoupon      = rebind(Coupon,          'Coupon',          'coupons');

  // ── Associations ──────────────────────────────────────────────────────────

  // RBAC
  (TUser as any).belongsToMany(TRole, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id', onDelete: 'CASCADE' });
  (TRole as any).belongsToMany(TUser, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id', onDelete: 'CASCADE' });
  (TRole as any).belongsToMany(TPermission, { through: 'role_permissions', foreignKey: 'role_id', otherKey: 'permission_id', onDelete: 'CASCADE' });
  (TPermission as any).belongsToMany(TRole, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id', onDelete: 'CASCADE' });

  // Store ↔ Menu
  (TStore as any).hasMany(TMenuCat, { foreignKey: 'store_id', onDelete: 'CASCADE' });
  (TMenuCat as any).belongsTo(TStore, { foreignKey: 'store_id' });
  (TMenuCat as any).hasMany(TMenuItem, { foreignKey: 'category_id', onDelete: 'CASCADE' });
  (TMenuItem as any).belongsTo(TMenuCat, { foreignKey: 'category_id' });
  (TMenuItem as any).hasMany(TVariant, { foreignKey: 'menu_item_id', as: 'variants', onDelete: 'CASCADE' });
  (TVariant as any).belongsTo(TMenuItem, { foreignKey: 'menu_item_id' });
  (TMenuItem as any).hasMany(TAddon, { foreignKey: 'menu_item_id', as: 'addons', onDelete: 'CASCADE' });
  (TAddon as any).belongsTo(TMenuItem, { foreignKey: 'menu_item_id' });

  // Store ↔ Tables
  (TStore as any).hasMany(TTable, { foreignKey: 'store_id', onDelete: 'CASCADE' });
  (TTable as any).belongsTo(TStore, { foreignKey: 'store_id' });

  // Orders
  (TStore as any).hasMany(TOrder, { foreignKey: 'store_id', onDelete: 'CASCADE' });
  (TOrder as any).belongsTo(TStore, { foreignKey: 'store_id' });
  (TTable as any).hasMany(TOrder, { foreignKey: 'table_id', onDelete: 'SET NULL' });
  (TOrder as any).belongsTo(TTable, { foreignKey: 'table_id', constraints: false });
  (TUser as any).hasMany(TOrder, { foreignKey: 'cashier_id' });
  (TOrder as any).belongsTo(TUser, { foreignKey: 'cashier_id', as: 'cashier' });
  (TOrder as any).hasMany(TOrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
  (TOrderItem as any).belongsTo(TOrder, { foreignKey: 'order_id' });
  (TMenuItem as any).hasMany(TOrderItem, { foreignKey: 'menu_item_id' });
  (TOrderItem as any).belongsTo(TMenuItem, { foreignKey: 'menu_item_id' });
  (TOrder as any).hasMany(TPayment, { foreignKey: 'order_id', as: 'payments', onDelete: 'CASCADE' });
  (TPayment as any).belongsTo(TOrder, { foreignKey: 'order_id' });

  // Customers & Reservations
  (TCustomer as any).hasMany(TOrder, { foreignKey: 'customer_id' });
  (TOrder as any).belongsTo(TCustomer, { foreignKey: 'customer_id', as: 'customer', constraints: false });
  (TStore as any).hasMany(TReservation, { foreignKey: 'store_id', onDelete: 'CASCADE' });
  (TReservation as any).belongsTo(TStore, { foreignKey: 'store_id' });
  (TCustomer as any).hasMany(TReservation, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
  (TReservation as any).belongsTo(TCustomer, { foreignKey: 'customer_id', as: 'customer' });
  (TTable as any).hasMany(TReservation, { foreignKey: 'table_id', onDelete: 'SET NULL' });
  (TReservation as any).belongsTo(TTable, { foreignKey: 'table_id', constraints: false });

  // Coupons
  (TStore as any).hasMany(TCoupon, { foreignKey: 'store_id', onDelete: 'CASCADE' });
  (TCoupon as any).belongsTo(TStore, { foreignKey: 'store_id' });

  return {
    sequelize: seq,
    User: TUser,
    Role: TRole,
    Permission: TPermission,
    Store: TStore,
    MenuCategory: TMenuCat,
    MenuItem: TMenuItem,
    MenuVariant: TVariant,
    MenuAddon: TAddon,
    RestaurantTable: TTable,
    Order: TOrder,
    OrderItem: TOrderItem,
    Payment: TPayment,
    Customer: TCustomer,
    Reservation: TReservation,
    Coupon: TCoupon,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface TenantModels {
  sequelize: Sequelize;
  User: any;
  Role: any;
  Permission: any;
  Store: any;
  MenuCategory: any;
  MenuItem: any;
  MenuVariant: any;
  MenuAddon: any;
  RestaurantTable: any;
  Order: any;
  OrderItem: any;
  Payment: any;
  Customer: any;
  Reservation: any;
  Coupon: any;
}

/**
 * Returns Sequelize model instances scoped to the tenant database for the given org slug.
 * Connection is cached globally for the lifetime of the Node.js process.
 */
export async function getTenantModels(slug: string): Promise<TenantModels> {
  const dbName = slugToDbName(slug);
  const seq = await getTenantSequelize(dbName);
  return makeTenantModels(seq);
}

/**
 * Provisions a new isolated MySQL database for the given org slug:
 *  1. Creates the database if it doesn't exist
 *  2. Syncs all tenant schema tables (alter: true for safe additive migrations)
 *  3. Seeds default roles & permissions for this tenant
 */
export async function provisionTenantDatabase(slug: string): Promise<void> {
  const dbName = slugToDbName(slug);

  // 1. Create the database (idempotent)
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await conn.end();
  console.log(`[TenantDB] Database '${dbName}' created/verified.`);

  // 2. Get tenant models and sync schema
  const models = await getTenantModels(slug);
  await models.sequelize.sync({ alter: true });
  console.log(`[TenantDB] Schema synced for '${dbName}'.`);

  // 3. Seed default roles & permissions if not already present
  const existingRoles = await models.Role.count();
  if (existingRoles === 0) {
    const perms = await Promise.all([
      models.Permission.create({ name: 'pos:access',     description: 'Access POS terminal screen' }),
      models.Permission.create({ name: 'pos:checkout',   description: 'Complete a checkout transaction' }),
      models.Permission.create({ name: 'pos:refund',     description: 'Issue discounts or refunds' }),
      models.Permission.create({ name: 'menu:write',     description: 'Create and update menu items' }),
      models.Permission.create({ name: 'menu:read',      description: 'View menu listings' }),
      models.Permission.create({ name: 'settings:write', description: 'Modify store configurations' }),
      models.Permission.create({ name: 'reports:read',   description: 'View sales and analytics reports' }),
    ]);

    const [ownerRole, managerRole, cashierRole] = await Promise.all([
      models.Role.create({ name: 'Restaurant Owner', description: 'Owner of the organization and all stores' }),
      models.Role.create({ name: 'Manager',          description: 'Store manager with elevated permissions' }),
      models.Role.create({ name: 'Cashier',          description: 'Sales terminal operator' }),
      models.Role.create({ name: 'Kitchen Staff',    description: 'Kitchen Display System operator' }),
      models.Role.create({ name: 'Waiter',           description: 'Service and table ordering staff' }),
    ]);

    await ownerRole.setPermissions(perms);
    await managerRole.setPermissions(
      perms.filter((p: any) => ['pos:access', 'pos:checkout', 'menu:read', 'settings:write'].includes(p.name))
    );
    await cashierRole.setPermissions(
      perms.filter((p: any) => ['pos:access', 'pos:checkout', 'menu:read'].includes(p.name))
    );

    console.log(`[TenantDB] Default roles & permissions seeded for '${dbName}'.`);
  }
}
