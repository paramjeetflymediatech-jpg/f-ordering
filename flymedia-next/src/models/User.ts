import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class User extends Model {
  declare id: string;
  declare organization_id: string | null;
  declare store_id: string | null;
  declare name: string;
  declare email: string;
  declare password: string;
  declare phone: string | null;
  declare status: 'active' | 'inactive';
  declare fcmToken: string | null;
  declare deviceType: string | null;
  declare lastLoginDevice: string | null;
}

User.init(
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
    store_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false,
    },
    fcmToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lastLoginDevice: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);
