import { sequelize } from '../lib/db';
import { Organization } from './Organization';
import { Store } from './Store';
import { User } from './User';
import { Role } from './Role';
import { Permission } from './Permission';
import { MenuCategory } from './MenuCategory';
import { MenuItem } from './MenuItem';
import { MenuVariant } from './MenuVariant';
import { MenuAddon } from './MenuAddon';
import { MenuBase } from './MenuBase';
import { RestaurantTable } from './RestaurantTable';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { Payment } from './Payment';
import { Customer } from './Customer';
import { Reservation } from './Reservation';
import { Coupon } from './Coupon';
import { Service } from './Service';
import { Package } from './Package';
import { DeliveryZone } from './DeliveryZone';
import { DeliveryRule } from './DeliveryRule';
import { StorePaymentConfig } from './StorePaymentConfig';

// Define Associations

// Org & Stores
Organization.hasMany(Store, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
Store.belongsTo(Organization, { foreignKey: 'organization_id' });

// Org & Users
Organization.hasMany(User, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
User.belongsTo(Organization, { foreignKey: 'organization_id', constraints: false });

// Stores & Users
Store.hasMany(User, { foreignKey: 'store_id', onDelete: 'SET NULL' });
User.belongsTo(Store, { foreignKey: 'store_id', constraints: false });

// Users, Roles & Permissions (RBAC)
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id', onDelete: 'CASCADE' });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id', onDelete: 'CASCADE' });

Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', otherKey: 'permission_id', onDelete: 'CASCADE' });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id', onDelete: 'CASCADE' });

// Menu Category & Items
Store.hasMany(MenuCategory, { foreignKey: 'store_id', onDelete: 'CASCADE' });
MenuCategory.belongsTo(Store, { foreignKey: 'store_id' });

MenuCategory.hasMany(MenuItem, { foreignKey: 'category_id', onDelete: 'CASCADE' });
MenuItem.belongsTo(MenuCategory, { foreignKey: 'category_id' });

// Recursive category hierarchy
MenuCategory.hasMany(MenuCategory, { as: 'subcategories', foreignKey: 'parent_id', onDelete: 'CASCADE', constraints: false });
MenuCategory.belongsTo(MenuCategory, { as: 'parent', foreignKey: 'parent_id', constraints: false });

// Menu Items, Variants, and Addons
MenuItem.hasMany(MenuVariant, { foreignKey: 'menu_item_id', as: 'variants', onDelete: 'CASCADE' });
MenuVariant.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });

MenuItem.hasMany(MenuAddon, { foreignKey: 'menu_item_id', as: 'addons', onDelete: 'CASCADE' });
MenuAddon.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });

// Menu Items, Bases
MenuItem.hasMany(MenuBase, { foreignKey: 'menu_item_id', as: 'bases', onDelete: 'CASCADE' });
MenuBase.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });

// Tables & Stores
Store.hasMany(RestaurantTable, { foreignKey: 'store_id', onDelete: 'CASCADE' });
RestaurantTable.belongsTo(Store, { foreignKey: 'store_id' });

// Orders & Stores/Tables/Cashiers
Store.hasMany(Order, { foreignKey: 'store_id', onDelete: 'CASCADE' });
Order.belongsTo(Store, { foreignKey: 'store_id' });

RestaurantTable.hasMany(Order, { foreignKey: 'table_id', onDelete: 'SET NULL' });
Order.belongsTo(RestaurantTable, { foreignKey: 'table_id', constraints: false });

User.hasMany(Order, { foreignKey: 'cashier_id' });
Order.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });

// Orders & Items
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });

OrderItem.belongsTo(MenuVariant, { foreignKey: 'variant_id', as: 'variant', constraints: false });
MenuVariant.hasMany(OrderItem, { foreignKey: 'variant_id', constraints: false });

// Orders & Payments
Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

// Customer, Orders & Reservations
Customer.belongsTo(Organization, { foreignKey: 'organization_id', constraints: false });
Organization.hasMany(Customer, { foreignKey: 'organization_id' });

Customer.hasMany(Order, { foreignKey: 'customer_id' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer', constraints: false });

Store.hasMany(Reservation, { foreignKey: 'store_id', onDelete: 'CASCADE' });
Reservation.belongsTo(Store, { foreignKey: 'store_id' });

Customer.hasMany(Reservation, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
Reservation.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

RestaurantTable.hasMany(Reservation, { foreignKey: 'table_id', onDelete: 'SET NULL' });
Reservation.belongsTo(RestaurantTable, { foreignKey: 'table_id', constraints: false });

Store.hasMany(Coupon, { foreignKey: 'store_id', onDelete: 'CASCADE' });
Coupon.belongsTo(Store, { foreignKey: 'store_id' });

// Service & Package
Service.hasMany(Package, { foreignKey: 'service_id', as: 'packages', onDelete: 'SET NULL' });
Package.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// Delivery Zones & Rules
Store.hasMany(DeliveryZone, { foreignKey: 'store_id', onDelete: 'CASCADE' });
DeliveryZone.belongsTo(Store, { foreignKey: 'store_id' });
DeliveryZone.hasMany(DeliveryRule, { foreignKey: 'delivery_zone_id', as: 'rules', onDelete: 'CASCADE' });
DeliveryRule.belongsTo(DeliveryZone, { foreignKey: 'delivery_zone_id' });

// Payment Config per Organization
Organization.hasOne(StorePaymentConfig, { foreignKey: 'organization_id', as: 'paymentConfig', onDelete: 'CASCADE' });
StorePaymentConfig.belongsTo(Organization, { foreignKey: 'organization_id' });

(global as any).associationsLoaded = true;

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
};
