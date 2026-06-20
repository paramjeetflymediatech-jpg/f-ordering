import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class DeliveryRule extends Model {
  declare id: string;
  declare delivery_zone_id: string;
  declare name: string;
  declare sequence: number;
  declare charge: number;
  declare estimated_delivery: number;
  declare min_order_value: number;
  declare free_delivery_above: number;
  declare start_date: string;
  declare end_date: string;
  declare provider: string;
  declare charge_by_item: boolean;
  declare description: string | null;
}

DeliveryRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    delivery_zone_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sequence: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    charge: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
    estimated_delivery: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false,
    },
    min_order_value: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
    free_delivery_above: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 999999999.00,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      defaultValue: 'Self Managed',
      allowNull: false,
    },
    charge_by_item: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'DeliveryRule',
    tableName: 'delivery_rules',
  }
);
