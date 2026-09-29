import { runMigrations } from './migrate.js';
import { pool } from './db.js';

try {
  await runMigrations();
  console.log('Migrations applied.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
