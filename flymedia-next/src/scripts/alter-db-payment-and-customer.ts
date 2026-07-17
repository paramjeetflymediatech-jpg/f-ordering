import { sequelize } from '../lib/db';
import { Organization } from '../models/Organization';
import { slugToDbName } from '../lib/tenant-db';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';

async function addColumnIfMissing(connection: mysql.Connection, tableName: string, columnName: string, alterQuery: string) {
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

async function modifyColumn(connection: mysql.Connection, tableName: string, columnName: string, modifyQuery: string) {
  try {
    console.log(`[Alter] Modifying Column '${columnName}' in Table '${tableName}'...`);
    await connection.query(modifyQuery);
    console.log(`[Alter] Column '${columnName}' successfully modified in '${tableName}'.`);
  } catch (err: any) {
    console.error(`[Alter Error] Failed to modify '${tableName}.${columnName}':`, err.message);
  }
}

async function runAlterMigration() {
  console.log('--- Custom Payment Settings & Customer Table Alteration Script ---');

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

    // Make customer phone nullable in Central DB
    await modifyColumn(
      centralConn,
      'customers',
      'phone',
      'ALTER TABLE `customers` MODIFY COLUMN `phone` VARCHAR(255) NULL'
    );

    // Add is_cash_enabled to store_payment_configs in Central DB
    await addColumnIfMissing(
      centralConn,
      'store_payment_configs',
      'is_cash_enabled',
      'ALTER TABLE `store_payment_configs` ADD COLUMN `is_cash_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `is_stripe_enabled`'
    );

    await centralConn.end();
    console.log('✅ Central Database alterations complete.');
  } catch (err: any) {
    console.error('❌ Failed to alter Central Database:', err.message);
  }

  // 2. Discover & Alter Tenant Databases
  console.log('\nDiscovering Tenant Databases...');
  try {
    // Authenticate central sequelize connection
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

        // Make customer phone nullable in Tenant DB
        await modifyColumn(
          tenantConn,
          'customers',
          'phone',
          'ALTER TABLE `customers` MODIFY COLUMN `phone` VARCHAR(255) NULL'
        );

        await tenantConn.end();
        console.log(`✅ Tenant Database '${tenantDb}' alterations complete.`);
      } catch (tenantErr: any) {
        console.error(`❌ Skip/Failed to alter Tenant Database '${tenantDb}':`, tenantErr.message);
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to discover tenant databases:', err.message);
  }

  console.log('\n--- Custom Alteration Script Complete ---');
  process.exit(0);
}

runAlterMigration();
