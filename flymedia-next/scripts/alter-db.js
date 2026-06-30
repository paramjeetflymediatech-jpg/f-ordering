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
    console.log("Table alterations complete.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sequelize.close();
  }
}

run();
