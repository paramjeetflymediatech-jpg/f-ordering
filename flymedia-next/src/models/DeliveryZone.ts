import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class DeliveryZone extends Model {
  declare id: string;
  declare organization_id: string;
  declare store_id: string;
  declare name: string;
  declare type: 'RADIAL DISTANCE' | 'ZIPCODE';
  declare country: string;
  declare distance: number | null;
  declare state: string | null;
  declare city: string | null;
  declare zip: string | null;
  declare locality: string | null;
  declare is_active: boolean;
}

DeliveryZone.init(
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
    type: {
      type: DataTypes.ENUM('RADIAL DISTANCE', 'ZIPCODE'),
      defaultValue: 'ZIPCODE',
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'Australia',
      allowNull: false,
    },
    distance: {
      type: DataTypes.INTEGER,
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
    zip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    locality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'DeliveryZone',
    tableName: 'delivery_zones',
  }
);
