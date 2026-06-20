import 'dotenv/config';
import mysql from 'mysql2/promise';
import { ensureDatabaseExists, sequelize } from './lib/db';
// Import index to load associations
import * as centralModels from './models'; 
import { provisionTenantDatabase } from './lib/tenant-db';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';

async function main() {
  console.log('--- 1. Synchronizing Central Database ---');
  await ensureDatabaseExists();
  // We use alter: true to make safe schema changes
  await sequelize.sync({ force: false, alter: true });
  console.log('✅ Central database sync complete.\n');

  console.log('--- 2. Discovering & Syncing Tenant Databases ---');
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
  });

  const [rows]: any = await conn.query(
    "SELECT schema_name AS db_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'"
  );
  await conn.end();

  if (rows.length === 0) {
    console.log('ℹ️ No tenant databases found.');
  } else {
    for (const row of rows) {
      const dbName = row.db_name || row.schema_name;
      // Convert database name like tenant_f_ordering_foods back to a slug: f-ordering-foods
      const slug = dbName.replace(/^tenant_/, '').replace(/_/g, '-');
      console.log(`Syncing schema for tenant database: ${dbName} (slug: ${slug})...`);
      try {
        await provisionTenantDatabase(slug);
        console.log(`✅ Completed sync for: ${dbName}`);
      } catch (err: any) {
        console.error(`❌ Failed to sync tenant database ${dbName}:`, err.message);
      }
    }
  }

  console.log('\n--- 3. Closing Central Connection ---');
  await sequelize.close();
  console.log('✅ Migration process complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
