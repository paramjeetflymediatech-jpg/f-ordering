import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Payment extends Model {
  declare id: string;
  declare order_id: string;
  declare payment_method: 'cash' | 'card' | 'upi' | 'wallet';
  declare amount: number;
  declare transaction_status: 'pending' | 'success' | 'failed' | 'refunded';
  declare transaction_reference: string | null;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'wallet'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    transaction_status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
      defaultValue: 'pending',
      allowNull: false,
    },
    transaction_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
  }
);
