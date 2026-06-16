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
  declare email: string | null;
  declare website: string | null;
  declare currency: string | null;
  declare category: string | null;
  declare zip_code: string | null;
  declare country: string | null;
  declare state: string | null;
  declare city: string | null;
  declare description: string | null;
  declare banner: string | null;
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'AUD',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Restaurant',
    },
    zip_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    banner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Store',
    tableName: 'stores',
  }
);
