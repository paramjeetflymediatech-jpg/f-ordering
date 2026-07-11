import { sequelize } from '../lib/db';
import { Organization as OrgClass } from './Organization';
import { Store as StoreClass } from './Store';
import { User as UserClass } from './User';
import { Role as RoleClass } from './Role';
import { Permission as PermissionClass } from './Permission';
import { MenuCategory as MenuCategoryClass } from './MenuCategory';
import { MenuItem as MenuItemClass } from './MenuItem';
import { MenuVariant as MenuVariantClass } from './MenuVariant';
import { MenuAddon as MenuAddonClass } from './MenuAddon';
import { MenuBase as MenuBaseClass } from './MenuBase';
import { RestaurantTable as RestaurantTableClass } from './RestaurantTable';
import { Order as OrderClass } from './Order';
import { OrderItem as OrderItemClass } from './OrderItem';
import { Payment as PaymentClass } from './Payment';
import { Customer as CustomerClass } from './Customer';
import { Reservation as ReservationClass } from './Reservation';
import { Coupon as CouponClass } from './Coupon';
import { Service as ServiceClass } from './Service';
import { Package as PackageClass } from './Package';
import { DeliveryZone as DeliveryZoneClass } from './DeliveryZone';
import { DeliveryRule as DeliveryRuleClass } from './DeliveryRule';
import { StorePaymentConfig as StorePaymentConfigClass } from './StorePaymentConfig';
import { UserDevice as UserDeviceClass } from './UserDevice';
import { Printer as PrinterClass } from './Printer';
import { PrintJob as PrintJobClass } from './PrintJob';

const Organization = (sequelize.models.Organization as any) || OrgClass;
const Store = (sequelize.models.Store as any) || StoreClass;
const User = (sequelize.models.User as any) || UserClass;
const Role = (sequelize.models.Role as any) || RoleClass;
const Permission = (sequelize.models.Permission as any) || PermissionClass;
const MenuCategory = (sequelize.models.MenuCategory as any) || MenuCategoryClass;
const MenuItem = (sequelize.models.MenuItem as any) || MenuItemClass;
const MenuVariant = (sequelize.models.MenuVariant as any) || MenuVariantClass;
const MenuAddon = (sequelize.models.MenuAddon as any) || MenuAddonClass;
const MenuBase = (sequelize.models.MenuBase as any) || MenuBaseClass;
const RestaurantTable = (sequelize.models.RestaurantTable as any) || RestaurantTableClass;
const Order = (sequelize.models.Order as any) || OrderClass;
const OrderItem = (sequelize.models.OrderItem as any) || OrderItemClass;
const Payment = (sequelize.models.Payment as any) || PaymentClass;
const Customer = (sequelize.models.Customer as any) || CustomerClass;
const Reservation = (sequelize.models.Reservation as any) || ReservationClass;
const Coupon = (sequelize.models.Coupon as any) || CouponClass;
const Service = (sequelize.models.Service as any) || ServiceClass;
const Package = (sequelize.models.Package as any) || PackageClass;
const DeliveryZone = (sequelize.models.DeliveryZone as any) || DeliveryZoneClass;
const DeliveryRule = (sequelize.models.DeliveryRule as any) || DeliveryRuleClass;
const StorePaymentConfig = (sequelize.models.StorePaymentConfig as any) || StorePaymentConfigClass;
const UserDevice = (sequelize.models.UserDevice as any) || UserDeviceClass;
const Printer = (sequelize.models.Printer as any) || PrinterClass;
const PrintJob = (sequelize.models.PrintJob as any) || PrintJobClass;

// Define Associations

// Reset cached Model.associations to avoid duplicate registration errors on hot-reloads
const modelsList = [
  Organization, Store, User, Role, Permission, MenuCategory, MenuItem,
  MenuVariant, MenuAddon, MenuBase, RestaurantTable, Order, OrderItem,
  Payment, Customer, Reservation, Coupon, Service, Package,
  DeliveryZone, DeliveryRule, StorePaymentConfig, UserDevice, Printer, PrintJob
];
for (const m of modelsList) {
  if (m) (m as any).associations = {};
}

  const associate = (name: string, fn: () => void) => {
    try {
      fn();
    } catch (e: any) {
      console.warn(`[Association Warning] ${name}:`, e.message);
    }
  };

  // Define Associations

  // Org & Stores
  associate('Org & Stores', () => {
    Organization.hasMany(Store, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
    Store.belongsTo(Organization, { foreignKey: 'organization_id' });
  });

  // Org & Users
  associate('Org & Users', () => {
    Organization.hasMany(User, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
    User.belongsTo(Organization, { foreignKey: 'organization_id', constraints: false });
  });

  // Stores & Users
  associate('Stores & Users', () => {
    Store.hasMany(User, { foreignKey: 'store_id', onDelete: 'SET NULL' });
    User.belongsTo(Store, { foreignKey: 'store_id', constraints: false });
  });

  // Users, Roles & Permissions (RBAC)
  associate('Users & Roles', () => {
    User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id', onDelete: 'CASCADE' });
    Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id', onDelete: 'CASCADE' });
  });

  // Users & UserDevices (One-to-Many device tokens)
  associate('Users & UserDevices', () => {
    User.hasMany(UserDevice, { foreignKey: 'user_id', as: 'devices', onDelete: 'CASCADE' });
    UserDevice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  });

  associate('Roles & Permissions', () => {
    Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', otherKey: 'permission_id', onDelete: 'CASCADE' });
    Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id', onDelete: 'CASCADE' });
  });

  // Menu Category & Items
  associate('Menu Category', () => {
    Store.hasMany(MenuCategory, { foreignKey: 'store_id', onDelete: 'CASCADE' });
    MenuCategory.belongsTo(Store, { foreignKey: 'store_id' });
  });

  associate('Category & MenuItem', () => {
    MenuCategory.hasMany(MenuItem, { foreignKey: 'category_id', onDelete: 'CASCADE' });
    MenuItem.belongsTo(MenuCategory, { foreignKey: 'category_id' });
  });

  // Recursive category hierarchy
  associate('MenuCategory hierarchy', () => {
    MenuCategory.hasMany(MenuCategory, { as: 'subcategories', foreignKey: 'parent_id', onDelete: 'CASCADE', constraints: false });
    MenuCategory.belongsTo(MenuCategory, { as: 'parent', foreignKey: 'parent_id', constraints: false });
  });

  // Menu Items, Variants, and Addons
  associate('MenuItem & MenuVariant', () => {
    MenuItem.hasMany(MenuVariant, { foreignKey: 'menu_item_id', as: 'variants', onDelete: 'CASCADE' });
    MenuVariant.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });
  });

  associate('MenuItem & MenuAddon', () => {
    MenuItem.hasMany(MenuAddon, { foreignKey: 'menu_item_id', as: 'addons', onDelete: 'CASCADE' });
    MenuAddon.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });
  });

  // Menu Items, Bases
  associate('MenuItem & MenuBase', () => {
    MenuItem.hasMany(MenuBase, { foreignKey: 'menu_item_id', as: 'bases', onDelete: 'CASCADE' });
    MenuBase.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });
  });

  // Tables & Stores
  associate('Tables & Stores', () => {
    Store.hasMany(RestaurantTable, { foreignKey: 'store_id', onDelete: 'CASCADE' });
    RestaurantTable.belongsTo(Store, { foreignKey: 'store_id' });
  });

  // Orders & Stores/Tables/Cashiers
  associate('Orders & Stores', () => {
    Store.hasMany(Order, { foreignKey: 'store_id', onDelete: 'CASCADE' });
    Order.belongsTo(Store, { foreignKey: 'store_id' });
  });

  associate('Orders & Tables', () => {
    RestaurantTable.hasMany(Order, { foreignKey: 'table_id', onDelete: 'SET NULL' });
    Order.belongsTo(RestaurantTable, { foreignKey: 'table_id', constraints: false });
  });

  associate('Orders & Cashiers', () => {
    User.hasMany(Order, { foreignKey: 'cashier_id' });
    Order.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });
  });

  // Orders & Items
  associate('Orders & Items', () => {
    Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
    OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
  });

  associate('MenuItem & OrderItem', () => {
    MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id' });
    OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });
  });

  associate('MenuVariant & OrderItem', () => {
    OrderItem.belongsTo(MenuVariant, { foreignKey: 'variant_id', as: 'variant', constraints: false });
    MenuVariant.hasMany(OrderItem, { foreignKey: 'variant_id', constraints: false });
  });

  // Orders & Payments
  associate('Orders & Payments', () => {
    Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments', onDelete: 'CASCADE' });
    Payment.belongsTo(Order, { foreignKey: 'order_id' });
  });

  // Customer, Orders & Reservations
  associate('Customer & Org', () => {
    Customer.belongsTo(Organization, { foreignKey: 'organization_id', constraints: false });
    Organization.hasMany(Customer, { foreignKey: 'organization_id' });
  });

  associate('Customer & Orders', () => {
    Customer.hasMany(Order, { foreignKey: 'customer_id' });
    Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer', constraints: false });
  });

  associate('Store & Reservations', () => {
    Store.hasMany(Reservation, { foreignKey: 'store_id', onDelete: 'CASCADE' });
    Reservation.belongsTo(Store, { foreignKey: 'store_id' });
  });

  associate('Customer & Reservations', () => {
    Customer.hasMany(Reservation, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
    Reservation.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  });

  associate('RestaurantTable & Reservations', () => {
    RestaurantTable.hasMany(Reservation, { foreignKey: 'table_id', onDelete: 'SET NULL' });
    Reservation.belongsTo(RestaurantTable, { foreignKey: 'table_id', constraints: false });
  });

  associate('Store & Coupons', () => {
    Store.hasMany(Coupon, { foreignKey: 'store_id', onDelete: 'CASCADE' });
    Coupon.belongsTo(Store, { foreignKey: 'store_id' });
  });

  // Service & Package
  associate('Service & Package', () => {
    Service.hasMany(Package, { foreignKey: 'service_id', as: 'packages', onDelete: 'SET NULL' });
    Package.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
  });

  // Delivery Zones & Rules
  associate('Delivery Zones & Rules', () => {
    Store.hasMany(DeliveryZone, { foreignKey: 'store_id', onDelete: 'CASCADE' });
    DeliveryZone.belongsTo(Store, { foreignKey: 'store_id' });
    DeliveryZone.hasMany(DeliveryRule, { foreignKey: 'delivery_zone_id', as: 'rules', onDelete: 'CASCADE' });
    DeliveryRule.belongsTo(DeliveryZone, { foreignKey: 'delivery_zone_id' });
  });

  // Payment Config per Organization
  associate('Payment Config per Org', () => {
    Organization.hasOne(StorePaymentConfig, { foreignKey: 'organization_id', as: 'paymentConfig', onDelete: 'CASCADE' });
    StorePaymentConfig.belongsTo(Organization, { foreignKey: 'organization_id' });
  });

  // Printers & PrintJobs associations
  associate('Printers & Stores', () => {
    Store.hasMany(Printer, { foreignKey: 'store_id', onDelete: 'CASCADE' });
    Printer.belongsTo(Store, { foreignKey: 'store_id' });
  });

  associate('Printers & PrintJobs', () => {
    Printer.hasMany(PrintJob, { foreignKey: 'printer_id', onDelete: 'CASCADE' });
    PrintJob.belongsTo(Printer, { foreignKey: 'printer_id' });
    Order.hasMany(PrintJob, { foreignKey: 'order_id', onDelete: 'CASCADE' });
    PrintJob.belongsTo(Order, { foreignKey: 'order_id' });
  });

export type Organization = OrgClass;
export type Store = StoreClass;
export type User = UserClass;
export type Role = RoleClass;
export type Permission = PermissionClass;
export type MenuCategory = MenuCategoryClass;
export type MenuItem = MenuItemClass;
export type MenuVariant = MenuVariantClass;
export type MenuAddon = MenuAddonClass;
export type MenuBase = MenuBaseClass;
export type RestaurantTable = RestaurantTableClass;
export type Order = OrderClass;
export type OrderItem = OrderItemClass;
export type Payment = PaymentClass;
export type Customer = CustomerClass;
export type Reservation = ReservationClass;
export type Coupon = CouponClass;
export type Service = ServiceClass;
export type Package = PackageClass;
export type DeliveryZone = DeliveryZoneClass;
export type DeliveryRule = DeliveryRuleClass;
export type StorePaymentConfig = StorePaymentConfigClass;
export type UserDevice = UserDeviceClass;
export type Printer = PrinterClass;
export type PrintJob = PrintJobClass;

export {
  sequelize,
  Organization,
  Store,
  User,
  Role,
  Permission,
  MenuCategory,
  MenuItem,
  MenuVariant,
  MenuAddon,
  MenuBase,
  RestaurantTable,
  Order,
  OrderItem,
  Payment,
  Customer,
  Reservation,
  Coupon,
  Service,
  Package,
  DeliveryZone,
  DeliveryRule,
  StorePaymentConfig,
  UserDevice,
  Printer,
  PrintJob,
};
