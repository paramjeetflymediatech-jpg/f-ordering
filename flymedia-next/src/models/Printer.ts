import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Printer extends Model {
  declare id: string;
  declare store_id: string;
  declare name: string;
  declare role: string;
  declare type: 'usb' | 'network';
  declare connection_value: string;
  declare copies: number;
  declare width: '80mm' | '58mm';
  declare auto_cut: boolean;
  declare open_drawer: boolean;
  declare api_key: string;
  declare status: 'online' | 'offline';
  declare last_seen_at: Date | null;
  declare last_printed_at: Date | null;
}

Printer.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Kitchen Printer',
    },
    type: {
      type: DataTypes.ENUM('usb', 'network'),
      allowNull: false,
      defaultValue: 'network',
    },
    connection_value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    copies: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    width: {
      type: DataTypes.ENUM('80mm', '58mm'),
      defaultValue: '80mm',
      allowNull: false,
    },
    auto_cut: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    open_drawer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    api_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('online', 'offline'),
      defaultValue: 'offline',
      allowNull: false,
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_printed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Printer',
    tableName: 'printers',
    timestamps: true,
  }
);
