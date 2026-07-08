import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Order extends Model {
  declare id: string;
  declare organization_id: string;
  declare store_id: string;
  declare table_id: string | null;
  declare cashier_id: string;
  declare customer_id: string | null;
  declare order_number: string;
  declare order_type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  declare status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'on_hold';
  declare subtotal: number;
  declare tax_amount: number;
  declare discount_amount: number;
  declare total_amount: number;
  declare coupon_code: string | null;
  declare rating: number | null;
  declare rating_comment: string | null;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    store_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    table_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    cashier_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    order_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order_type: {
      type: DataTypes.ENUM('dine_in', 'takeaway', 'delivery', 'qr_order'),
      allowNull: false,
      defaultValue: 'dine_in',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled', 'on_hold'),
      allowNull: false,
      defaultValue: 'pending',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    coupon_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rating_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
  }
);
