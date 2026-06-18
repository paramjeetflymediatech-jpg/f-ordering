/**
 * reset-db.ts
 * Wipes all data from the central database and drops all tenant databases.
 * Run with:  npx ts-node src/reset-db.ts
 *
 * ⚠️  This is DESTRUCTIVE — all data will be permanently deleted.
 */

import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || 'Root@123';
const DB_NAME = process.env.DB_NAME || 'flymedia_twirl_db';

async function reset() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
  });

  console.log('\n🗑️  F-Ordering Database Cleanup Tool');
  console.log('═'.repeat(50));

  // ── 1. Find & drop all tenant databases ──────────────────────────────────
  const [tenantDbs]: any = await conn.query(
    `SELECT schema_name AS db_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`
  );

  if (tenantDbs.length === 0) {
    console.log('ℹ️  No tenant databases found.');
  } else {
    for (const row of tenantDbs) {
      const dbName = row.db_name || row.schema_name || row.SCHEMA_NAME;
      await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
      console.log(`✅ Dropped tenant database: ${dbName}`);
    }
  }

  // ── 2. Clear all tables in the central database ───────────────────────────
  await conn.query(`USE \`${DB_NAME}\`;`);
  await conn.query(`SET FOREIGN_KEY_CHECKS = 0;`);

  // All tables in the correct truncation order (children before parents)
  const tablesToTruncate = [
    'payments',
    'order_items',
    'orders',
    'reservations',
    'coupons',
    'customers',
    'restaurant_tables',
    'menu_addons',
    'menu_variants',
    'menu_items',
    'menu_categories',
    'user_roles',
    'role_permissions',
    'users',
    'packages',
    'services',
    'stores',
    'organizations',
    'roles',
    'permissions',
  ];

  for (const table of tablesToTruncate) {
    try {
      await conn.query(`TRUNCATE TABLE \`${table}\`;`);
      console.log(`✅ Truncated: ${table}`);
    } catch (err: any) {
      // Table may not exist yet — skip silently
      if (err.code !== 'ER_NO_SUCH_TABLE') {
        console.warn(`⚠️  Could not truncate ${table}: ${err.message}`);
      }
    }
  }

  await conn.query(`SET FOREIGN_KEY_CHECKS = 1;`);
  await conn.end();

  console.log('\n✅  All done! Database is clean.');
  console.log('   Run POST /api/db/sync to re-seed fresh data.\n');
}

reset().catch((err) => {
  console.error('\n❌  Reset failed:', err.message);
  process.exit(1);
});
