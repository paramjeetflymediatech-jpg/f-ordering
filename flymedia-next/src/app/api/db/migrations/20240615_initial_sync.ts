import { sequelize } from '../../../../lib/db';

/**
 * This migration ensures the database schema is synchronized with the current Sequelize models.
 * It uses `sequelize.sync({ alter: true })` which will create missing tables and apply any
 * column changes without dropping data. This is suitable for development environments where
 * a full schema migration is desired after model updates.
 */
export async function up() {
  // Apply any pending alterations to match model definitions
  await sequelize.sync({ force: false, alter: true });
}


up();
/**
 * Reverting this migration is non‑trivial because `sequelize.sync({ alter: true })`
 * cannot automatically drop columns or tables that were added. In production you would
 * generate specific down scripts for each change. For simplicity we leave this empty.
 */
export async function down() {
  // No automatic rollback; implement manual steps if needed.
}
