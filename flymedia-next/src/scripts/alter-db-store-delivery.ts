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

async function runAlterStoreDeliveryMigration() {
  console.log('--- Store Delivery Toggle Alteration Script ---');

  // 1. Central Database
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

    await addColumnIfMissing(
      centralConn,
      'stores',
      'is_delivery_enabled',
      'ALTER TABLE `stores` ADD COLUMN `is_delivery_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `tax_rate`');

    await centralConn.end();
    console.log('✅ Central Database store delivery alteration complete.');
  } catch (err: any) {
    console.error('❌ Failed to alter Central Database stores:', err.message);
  }

  // 2. Tenant Databases
  console.log('\nDiscovering Tenant Databases...');
  try {
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

        await addColumnIfMissing(
          tenantConn,
          'stores',
          'is_delivery_enabled',
          'ALTER TABLE `stores` ADD COLUMN `is_delivery_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `tax_rate`'
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

  console.log('\n--- Store Delivery Alteration Script Complete ---');
  process.exit(0);
}

runAlterStoreDeliveryMigration();
