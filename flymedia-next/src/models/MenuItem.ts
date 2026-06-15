import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class MenuItem extends Model {
  declare id: string;
  declare organization_id: string;
  declare store_id: string;
  declare category_id: string;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare image_url: string | null;
  declare is_available: boolean;
  declare is_combo: boolean;
}

MenuItem.init(
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
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    is_combo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MenuItem',
    tableName: 'menu_items',
  }
);
