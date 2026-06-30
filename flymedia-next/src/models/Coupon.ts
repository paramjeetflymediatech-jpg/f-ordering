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
