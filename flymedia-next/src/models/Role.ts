import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Role extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'roles_name_unique',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
  }
);
