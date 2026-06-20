import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class MenuCategory extends Model {
  declare id: string;
  declare organization_id: string;
  declare store_id: string;
  declare name: string;
  declare sort_order: number;
  declare is_active: boolean;
  declare parent_id: string | null;
  declare printer_category: string | null;
}

MenuCategory.init(
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
    store_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    printer_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'MenuCategory',
    tableName: 'menu_categories',
  }
);
