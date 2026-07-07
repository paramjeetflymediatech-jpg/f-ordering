import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class UserDevice extends Model {
  declare id: string;
  declare user_id: string;
  declare fcmToken: string | null;
  declare deviceType: string | null;
  declare lastLoginDevice: string | null;
  declare lastActive: Date;
}

UserDevice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fcmToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lastLoginDevice: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lastActive: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'UserDevice',
    tableName: 'user_devices',
  }
);
