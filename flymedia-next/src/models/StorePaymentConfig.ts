import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

export class StorePaymentConfig extends Model {
  declare id: string;
  declare organization_id: string;
  declare stripe_publishable_key: string | null;
  declare stripe_secret_key: string | null;
  declare stripe_webhook_secret: string | null;
  declare is_stripe_enabled: boolean;
}

StorePaymentConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    stripe_publishable_key: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    stripe_secret_key: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    stripe_webhook_secret: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_stripe_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'StorePaymentConfig',
    tableName: 'store_payment_configs',
  }
);
