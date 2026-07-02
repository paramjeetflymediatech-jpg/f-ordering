import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class MenuBase extends Model {
  declare id: string;
  declare menu_item_id: string;
  declare name: string;
  declare extraPrice: number;
}

MenuBase.init(
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
    extraPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MenuBase',
    tableName: 'menu_bases',
  }
);
