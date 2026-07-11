import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Reservation extends Model {
  declare id: string;
  declare store_id: string;
  declare customer_id: string;
  declare table_id: string | null;
  declare reservation_time: Date;
  declare booking_slot: string | null;
  declare booking_charge_paid: number;
  declare applied_offer: string | null;
  declare guest_count: number;
  declare notes: string | null;
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'seated';
  declare deposit_credited: boolean;
}

Reservation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    store_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    table_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reservation_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    booking_slot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    booking_charge_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
    applied_offer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guest_count: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'seated'),
      defaultValue: 'pending',
      allowNull: false,
    },
    deposit_credited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations',
  }
);
