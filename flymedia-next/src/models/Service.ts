import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class Service extends Model {
  declare id: string;
  declare title: string;
  declare description: string;
  declare icon: string | null;
  declare color: string | null;
  declare highlights: any; // JSON string or array
}

Service.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Sparkles',
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    },
    highlights: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Service',
    tableName: 'services',
  }
);
