import { Organization } from '../models/Organization';
import { slugToDbName } from '../lib/tenant-db';
import mysql from 'mysql2/promise';
import { sequelize } from '../lib/db';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';

async function runAlter() {
  console.log('--- Reservation Status ENUM Migration ---');

  // 1. Alter Central Database
  const centralDbName = process.env.DB_NAME || 'flymedia_twirl_db';
  console.log(`Modifying Central Database: ${centralDbName}...`);
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: centralDbName
    });

    await conn.query(`
      ALTER TABLE \`reservations\` 
      MODIFY COLUMN \`status\` ENUM('pending', 'confirmed', 'cancelled', 'seated', 'completed') 
      NOT NULL DEFAULT 'pending'
    `);
    console.log('✅ Central Database reservations.status altered successfully.');
    await conn.end();
  } catch (err: any) {
    console.error('❌ Failed to alter Central Database:', err.message);
  }

  // 2. Discover & Alter Tenant Databases
  try {
    await sequelize.authenticate();
    const orgs = await Organization.findAll();
    console.log(`Found ${orgs.length} organization tenants.`);
    for (const org of orgs) {
      const dbName = slugToDbName(org.slug);
      console.log(`Modifying Tenant Database: ${dbName}...`);
      try {
        const conn = await mysql.createConnection({
          host: DB_HOST,
          port: DB_PORT,
          user: DB_USER,
          password: DB_PASS,
          database: dbName
        });

        await conn.query(`
          ALTER TABLE \`reservations\` 
          MODIFY COLUMN \`status\` ENUM('pending', 'confirmed', 'cancelled', 'seated', 'completed') 
          NOT NULL DEFAULT 'pending'
        `);
        console.log(`✅ Tenant Database ${dbName} reservations.status altered successfully.`);
        await conn.end();
      } catch (err: any) {
        console.error(`❌ Failed to alter Tenant Database ${dbName}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to retrieve organizations list:', err.message);
  }

  console.log('--- Migration Complete ---');
  process.exit(0);
}

runAlter();
