import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  const sql = await fs.readFile(path.join(here, '../db/schema.sql'), 'utf8');
  await pool.query(sql);
}
