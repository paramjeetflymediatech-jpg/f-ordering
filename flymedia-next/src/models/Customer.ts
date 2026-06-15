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
