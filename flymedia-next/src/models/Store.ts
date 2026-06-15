import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Store extends Model {
  declare id: string;
  declare organization_id: string;
  declare name: string;
  declare address: string;
  declare phone: string;
  declare tax_rate: number;
  declare business_hours: any;
}

Store.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 5.00,
      allowNull: false,
    },
    business_hours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Store',
    tableName: 'stores',
  }
);
