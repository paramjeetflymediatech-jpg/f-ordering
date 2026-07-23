import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Permission extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'permissions_name_unique',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
  }
);
