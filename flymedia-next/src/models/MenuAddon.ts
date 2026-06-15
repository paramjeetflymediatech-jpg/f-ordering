import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class MenuAddon extends Model {
  declare id: string;
  declare menu_item_id: string;
  declare name: string;
  declare price: number;
}

MenuAddon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    menu_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MenuAddon',
    tableName: 'menu_addons',
  }
);
