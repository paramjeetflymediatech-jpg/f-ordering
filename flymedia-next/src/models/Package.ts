import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Package extends Model {
  declare id: string;
  declare name: string;
  declare price: number;
  declare billing_cycle: string;
  declare features: any; // JSON string or array
  declare is_popular: boolean;
  declare service_id: string | null;
}

Package.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    billing_cycle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'monthly',
    },
    features: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    is_popular: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    service_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Package',
    tableName: 'packages',
  }
);
