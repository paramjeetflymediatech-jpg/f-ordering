import { sequelize } from '../lib/db';
import { Organization } from '../models/Organization';
import { slugToDbName } from '../lib/tenant-db';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';

async function alterTable(connection: mysql.Connection, tableName: string, columnName: string, alterQuery: string) {
  try {
    const [rows]: any = await connection.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`);
    if (rows.length === 0) {
      console.log(`[Alter] Adding Column '${columnName}' to Table '${tableName}'...`);
      await connection.query(alterQuery);
      console.log(`[Alter] Column '${columnName}' successfully added to '${tableName}'.`);
    } else {
      console.log(`[Alter] Column '${columnName}' already exists in table '${tableName}'.`);
    }
  } catch (err: any) {
    console.error(`[Alter Error] Failed to check/alter '${tableName}.${columnName}':`, err.message);
  }
}

async function runAlterMigration() {
  console.log('--- Database Manual Alteration Script ---');

  // 1. Alter Central Database
  const centralDbName = process.env.DB_NAME || 'flymedia_twirl_db';
  console.log(`\nModifying Central Database: ${centralDbName}...`);
  try {
    const centralConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: centralDbName
    });

    await alterTable(
      centralConn,
      'store_payment_configs',
      'booking_charge',
      'ALTER TABLE `store_payment_configs` ADD COLUMN `booking_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'
    );

    await alterTable(
      centralConn,
      'reservations',
      'booking_charge_paid',
      'ALTER TABLE `reservations` ADD COLUMN `booking_charge_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'
    );

    await alterTable(
      centralConn,
      'reservations',
      'applied_offer',
      'ALTER TABLE `reservations` ADD COLUMN `applied_offer` VARCHAR(255) NULL'
    );

    await alterTable(
      centralConn,
      'reservations',
      'deposit_credited',
      'ALTER TABLE `reservations` ADD COLUMN `deposit_credited` TINYINT(1) NOT NULL DEFAULT 0'
    );

    await alterTable(
      centralConn,
      'orders',
      'deposit_deducted',
      'ALTER TABLE `orders` ADD COLUMN `deposit_deducted` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'
    );

    await centralConn.end();
    console.log('✅ Central Database alteration complete.');
  } catch (err: any) {
    console.error('❌ Failed to alter Central Database:', err.message);
  }

  // 2. Discover & Alter Tenant Databases
  console.log('\nDiscovering Tenant Databases...');
  try {
    // Authenticate central sequelize connection first
    await sequelize.authenticate();
    const orgs = await Organization.findAll();
    console.log(`Found ${orgs.length} organizations.`);

    for (const org of orgs) {
      const tenantDb = slugToDbName(org.slug);
      console.log(`\nModifying Tenant Database: ${tenantDb}...`);

      try {
        const tenantConn = await mysql.createConnection({
          host: DB_HOST,
          port: DB_PORT,
          user: DB_USER,
          password: DB_PASS,
          database: tenantDb
        });

        await alterTable(
          tenantConn,
          'reservations',
          'booking_charge_paid',
          'ALTER TABLE `reservations` ADD COLUMN `booking_charge_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'
        );

        await alterTable(
          tenantConn,
          'reservations',
          'applied_offer',
          'ALTER TABLE `reservations` ADD COLUMN `applied_offer` VARCHAR(255) NULL'
        );

        await alterTable(
          tenantConn,
          'reservations',
          'deposit_credited',
          'ALTER TABLE `reservations` ADD COLUMN `deposit_credited` TINYINT(1) NOT NULL DEFAULT 0'
        );

        await alterTable(
          tenantConn,
          'orders',
          'deposit_deducted',
          'ALTER TABLE `orders` ADD COLUMN `deposit_deducted` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'
        );

        await tenantConn.end();
        console.log(`✅ Tenant Database '${tenantDb}' alteration complete.`);
      } catch (tenantErr: any) {
        console.error(`❌ Skip/Failed to alter Tenant Database '${tenantDb}':`, tenantErr.message);
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to discover tenant databases:', err.message);
  }

  console.log('\n--- Alteration Script Complete ---');
  process.exit(0);
}

runAlterMigration();
