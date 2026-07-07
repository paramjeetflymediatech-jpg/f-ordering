import { sequelize } from '../lib/db';

async function runMigration() {
  try {
    console.log('Starting database alteration...');

    // 1. Check if stripe_customer_id already exists in customers table
    const [columns]: any = await sequelize.query(
      "SHOW COLUMNS FROM `customers` LIKE 'stripe_customer_id'"
    );

    if (columns.length === 0) {
      console.log("Adding 'stripe_customer_id' column to 'customers' table...");
      await sequelize.query(
        "ALTER TABLE `customers` ADD COLUMN `stripe_customer_id` VARCHAR(255) NULL DEFAULT NULL"
      );
      console.log("'stripe_customer_id' column added successfully.");
    } else {
      console.log("'stripe_customer_id' column already exists in 'customers' table.");
    }

    // 2. Create user_devices table if it doesn't exist
    console.log("Ensuring 'user_devices' table exists...");
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`user_devices\` (
        \`id\` CHAR(36) BINARY NOT NULL,
        \`user_id\` CHAR(36) BINARY NOT NULL,
        \`fcm_token\` VARCHAR(512) NULL DEFAULT NULL,
        \`device_type\` VARCHAR(50) NULL DEFAULT NULL,
        \`last_login_device\` VARCHAR(255) NULL DEFAULT NULL,
        \`last_active\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`created_at\` DATETIME NOT NULL,
        \`updated_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_user_devices_user_id\`
          FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("'user_devices' table verified/created successfully.");
    
    console.log('✅ Database alteration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database alteration failed:', error);
    process.exit(1);
  }
}

runMigration();
