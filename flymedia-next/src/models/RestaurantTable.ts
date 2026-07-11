import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class RestaurantTable extends Model {
  declare id: string;
  declare organization_id: string;
  declare store_id: string;
  declare table_number: string;
  declare seating_capacity: number;
  declare status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  declare qr_code_token: string | null;
  declare booking_slots: Array<string | { time: string; offer: string | null }> | null;
}

RestaurantTable.init(
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
    table_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    seating_capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved', 'cleaning'),
      defaultValue: 'available',
      allowNull: false,
    },
    qr_code_token: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    booking_slots: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'RestaurantTable',
    tableName: 'restaurant_tables',
  }
);
