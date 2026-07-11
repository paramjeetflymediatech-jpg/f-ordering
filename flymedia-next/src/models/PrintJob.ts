import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class PrintJob extends Model {
  declare id: string;
  declare store_id: string;
  declare printer_id: string;
  declare order_id: string;
  declare status: 'pending' | 'printing' | 'completed' | 'failed';
  declare attempts: number;
  declare error_message: string | null;
  declare printed_at: Date | null;
}

PrintJob.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    store_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    printer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'printing', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    printed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'PrintJob',
    tableName: 'print_jobs',
    timestamps: true,
  }
);
