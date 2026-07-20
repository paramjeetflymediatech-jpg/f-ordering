import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Store extends Model {
  declare id: string;
  declare organization_id: string;
  declare name: string;
  declare address: string;
  declare phone: string;
  declare tax_rate: number;
  declare business_hours: any;
  declare email: string | null;
  declare website: string | null;
  declare currency: string | null;
  declare category: string | null;
  declare zip_code: string | null;
  declare country: string | null;
  declare state: string | null;
  declare city: string | null;
  declare description: string | null;
  declare banner: string | null;
  declare bg_dashboard: string | null;
  declare bg_login: string | null;
  declare bg_menu: string | null;
  declare bg_customer_login: string | null;
  declare bg_register: string | null;
  declare bg_customer_register: string | null;
  declare bg_book: string | null;
  declare bg_color_dashboard: string | null;
  declare bg_color_login: string | null;
  declare bg_color_menu: string | null;
  declare bg_color_customer_login: string | null;
  declare bg_color_register: string | null;
  declare bg_color_customer_register: string | null;
  declare bg_color_book: string | null;
  declare theme_primary_color: string | null;
  declare theme_accent_color: string | null;
  declare theme_bg_color: string | null;
  declare theme_layout: 'classic' | 'modern_dark' | 'grid_minimal' | null;
  declare theme_font: 'serif' | 'sans' | 'playfair' | null;
  declare is_delivery_enabled: boolean;
}

Store.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 5.00,
      allowNull: false,
    },
    is_delivery_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    business_hours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'AUD',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Restaurant',
    },
    zip_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    banner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_dashboard: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_login: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_menu: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_customer_login: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_register: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_book: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_color_dashboard: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_color_login: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_color_menu: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_color_customer_login: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_color_register: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_customer_register: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_color_customer_register: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_color_book: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    theme_primary_color: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#2A0E07',
    },
    theme_accent_color: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#C39A3C',
    },
    theme_bg_color: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#F9F6F0',
    },
    theme_layout: {
      type: DataTypes.ENUM('classic', 'modern_dark', 'grid_minimal'),
      allowNull: true,
      defaultValue: 'classic',
    },
    theme_font: {
      type: DataTypes.ENUM('serif', 'sans', 'playfair'),
      allowNull: true,
      defaultValue: 'serif',
    },
  },
  {
    sequelize,
    modelName: 'Store',
    tableName: 'stores',
  }
);
