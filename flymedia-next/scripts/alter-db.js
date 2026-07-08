// HELPER MIGRATION SCRIPT TO ALTER DATABASE SCHEMAS
// Execute using: node scripts/alter-db.js

require('dotenv').config();
const { Sequelize } = require('sequelize');

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306');
const username = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'flymedia_db';

console.log(`Connecting to MySQL database '${database}' on host ${host}:${port}...`);

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'mysql',
  logging: console.log,
});

async function run() {
  try {
    // 1. Add coupon_code column to orders table if not exists
    const [results] = await sequelize.query("SHOW COLUMNS FROM `orders` LIKE 'coupon_code'");
    if (results.length === 0) {
      console.log("Adding column 'coupon_code' to 'orders' table...");
      await sequelize.query("ALTER TABLE `orders` ADD COLUMN `coupon_code` VARCHAR(255) NULL AFTER `total_amount`");
      console.log("Column 'coupon_code' added successfully.");
    } else {
      console.log("Column 'coupon_code' already exists on 'orders' table.");
    }

    // 2. Modify store_id column in coupons table to be nullable to support global coupons
    console.log("Altering 'store_id' column in 'coupons' table to be nullable...");
    await sequelize.query("ALTER TABLE `coupons` MODIFY COLUMN `store_id` CHAR(36) BINARY NULL");

    // 3. Add background image and color columns to stores table if not exists
    const bgColumns = [
      'bg_dashboard', 'bg_login', 'bg_menu', 'bg_customer_login', 'bg_register', 'bg_customer_register', 'bg_book',
      'bg_color_dashboard', 'bg_color_login', 'bg_color_menu', 'bg_color_customer_login', 'bg_color_register', 'bg_color_customer_register', 'bg_color_book'
    ];
    for (const col of bgColumns) {
      const [colResults] = await sequelize.query(`SHOW COLUMNS FROM \`stores\` LIKE '${col}'`);
      if (colResults.length === 0) {
        console.log(`Adding column '${col}' to 'stores' table...`);
        await sequelize.query(`ALTER TABLE \`stores\` ADD COLUMN \`${col}\` VARCHAR(255) NULL`);
        console.log(`Column '${col}' added successfully.`);
      } else {
        console.log(`Column '${col}' already exists on 'stores' table.`);
      }
    }

    // 4. Create user_devices table if not exists to support push notification device registrations
    console.log("Checking if 'user_devices' table exists...");
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`user_devices\` (
        \`id\` CHAR(36) BINARY NOT NULL,
        \`user_id\` CHAR(36) BINARY NOT NULL,
        \`fcmToken\` VARCHAR(512) NULL,
        \`deviceType\` VARCHAR(50) NULL,
        \`lastLoginDevice\` VARCHAR(255) NULL,
        \`lastActive\` DATETIME NOT NULL,
        \`createdAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`user_id_idx\` (\`user_id\`),
        CONSTRAINT \`fk_user_devices_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("'user_devices' table verification complete.");

    // 5. Add stripe_customer_id to customers table
    const [stripeCustomerCol] = await sequelize.query("SHOW COLUMNS FROM `customers` LIKE 'stripe_customer_id'");
    if (stripeCustomerCol.length === 0) {
      console.log("Adding column 'stripe_customer_id' to 'customers' table...");
      await sequelize.query("ALTER TABLE `customers` ADD COLUMN `stripe_customer_id` VARCHAR(255) NULL DEFAULT NULL");
    } else {
      console.log("Column 'stripe_customer_id' already exists on 'customers' table.");
    }

    // 6. Add UPI payment configurations to store_payment_configs table
    const [upiEnabledCol] = await sequelize.query("SHOW COLUMNS FROM `store_payment_configs` LIKE 'is_upi_enabled'");
    if (upiEnabledCol.length === 0) {
      console.log("Adding UPI columns to 'store_payment_configs' table...");
      await sequelize.query("ALTER TABLE `store_payment_configs` ADD COLUMN `is_upi_enabled` TINYINT(1) NOT NULL DEFAULT 0");
      await sequelize.query("ALTER TABLE `store_payment_configs` ADD COLUMN `upi_vpa` VARCHAR(255) NULL DEFAULT NULL");
      await sequelize.query("ALTER TABLE `store_payment_configs` ADD COLUMN `upi_qr_image` VARCHAR(500) NULL DEFAULT NULL");
    } else {
      console.log("UPI columns already exist on 'store_payment_configs' table.");
    }

    // 7. Add rating and rating_comment to orders table
    const [ratingCol] = await sequelize.query("SHOW COLUMNS FROM `orders` LIKE 'rating'");
    if (ratingCol.length === 0) {
      console.log("Adding rating columns to 'orders' table...");
      await sequelize.query("ALTER TABLE `orders` ADD COLUMN `rating` INT NULL DEFAULT NULL");
      await sequelize.query("ALTER TABLE `orders` ADD COLUMN `rating_comment` TEXT NULL DEFAULT NULL");
    } else {
      console.log("Rating columns already exist on 'orders' table.");
    }

    console.log("Table alterations complete.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sequelize.close();
  }
}

run();
