import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Coupon extends Model {
  declare id: string;
  declare store_id: string;
  declare code: string;
  declare discount_type: 'percentage' | 'fixed';
  declare discount_value: number;
  declare min_order_amount: number;
  declare is_active: boolean;
  declare banner_url: string | null;
  declare type: 'discount' | 'buy_x_get_y';
  declare buy_item_id: string | null;
  declare buy_qty: number;
  declare get_item_id: string | null;
  declare get_qty: number;
  declare valid_days: string[] | null;
  declare order_type_discounts: Record<string, number> | null;
  declare is_auto_apply: boolean;
}

Coupon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    store_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage',
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    min_order_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    banner_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('discount', 'buy_x_get_y'),
      allowNull: false,
      defaultValue: 'discount',
    },
    buy_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    buy_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    get_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    get_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    valid_days: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    order_type_discounts: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_auto_apply: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Coupon',
    tableName: 'coupons',
    indexes: [
      {
        unique: true,
        fields: ['store_id', 'code'],
      },
    ],
  }
);
