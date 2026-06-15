import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class MenuVariant extends Model {
  declare id: string;
  declare menu_item_id: string;
  declare name: string;
  declare additional_price: number;
}

MenuVariant.init(
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
    additional_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MenuVariant',
    tableName: 'menu_variants',
  }
);
