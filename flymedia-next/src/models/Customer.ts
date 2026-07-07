import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Customer extends Model {
  declare id: string;
  declare organization_id: string | null;
  declare name: string;
  declare email: string | null;
  declare phone: string;
  declare password: string | null;
  declare loyalty_points: number;
  declare first_name: string | null;
  declare last_name: string | null;
  declare company_name: string | null;
  declare date_of_birth: string | null;
  declare address: string | null;
  declare city: string | null;
  declare state: string | null;
  declare country: string | null;
  declare zip_code: string | null;
  declare shipping_address: string | null;
  declare shipping_city: string | null;
  declare shipping_state: string | null;
  declare shipping_country: string | null;
  declare shipping_zip_code: string | null;
  declare stripe_customer_id: string | null;
}

Customer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loyalty_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zip_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shipping_city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipping_state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipping_country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipping_zip_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    indexes: [
      {
        unique: true,
        fields: ['phone'],
      },
    ],
  }
);
