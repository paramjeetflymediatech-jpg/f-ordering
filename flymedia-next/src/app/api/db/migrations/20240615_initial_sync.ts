import { ensureDatabaseExists, sequelize } from '../../../../lib/db';
import '../../../../models'; // Registers models and sets up associations

/**
 * This migration ensures the database schema is synchronized with the current Sequelize models.
 * It uses `sequelize.sync({ alter: true })` which will create missing tables and apply any
 * column changes without dropping data.
 */
export async function up() {
  console.log('Verifying/creating database...');
  await ensureDatabaseExists();
  
  console.log('Synchronizing database tables...');
  await sequelize.sync({ force: false, alter: true });
  console.log('✅ All tables synchronized successfully!');
}

/**
 * Reverting this migration is non‑trivial because `sequelize.sync({ alter: true })`
 * cannot automatically drop columns or tables that were added.
 */
export async function down() {
  console.log('No rollback defined for auto-sync migration.');
}

// Self-run when executed directly via ts-node / node
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration execution complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
