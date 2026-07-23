import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Organization extends Model {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare logo: string | null;
  declare status: 'active' | 'inactive' | 'suspended';
  declare subscription_plan: 'starter' | 'professional' | 'enterprise';
}

Organization.init(
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
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'organizations_slug_unique',
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
      allowNull: false,
    },
    subscription_plan: {
      type: DataTypes.ENUM('starter', 'professional', 'enterprise'),
      defaultValue: 'starter',
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
  }
);
