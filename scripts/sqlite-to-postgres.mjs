// One-off: copy an old SQLite file (data/roamora.db from the earlier version) into PostgreSQL.
// Usage:  DATABASE_URL=postgres://... node scripts/sqlite-to-postgres.mjs [path/to/roamora.db]
// Run the new app once first (or `npm run build && npm start`) so the tables exist, and run this only on an empty database.
import pg from 'pg';
import { createRequire } from 'node:module';

const url = process.env.DATABASE_URL;
if (!url) { console.error('Set DATABASE_URL first.'); process.exit(1); }
const file = process.argv[2] || 'data/roamora.db';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
const lite = new DatabaseSync(file, { readOnly: true });
const client = new pg.Client({ connectionString: url });
await client.connect();

// parents first, so foreign keys hold
const TABLES = ['users', 'destinations', 'bookings', 'sessions', 'saved', 'payments', 'email_tokens', 'reviews', 'outbox'];
const SERIAL = { users: 'id', bookings: 'id', payments: 'id', reviews: 'id', outbox: 'id' };

try {
  await client.query('BEGIN');
  for (const t of TABLES) {
    let rows;
    try { rows = lite.prepare(`SELECT * FROM ${t}`).all(); } catch { console.log(`${t}: not in the SQLite file, skipped`); continue; }
    const existing = Number((await client.query(`SELECT COUNT(*) AS n FROM ${t}`)).rows[0].n);
    if (existing && t !== 'destinations') { console.log(`${t}: target already has ${existing} rows, skipped`); continue; }
    if (t === 'destinations' && existing) await client.query('DELETE FROM destinations'); // replace the starter data with your edited data
    for (const r of rows) {
      const cols = Object.keys(r);
      await client.query(`INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT DO NOTHING`, cols.map(c => r[c]));
    }
    if (SERIAL[t]) await client.query(`SELECT setval(pg_get_serial_sequence('${t}','${SERIAL[t]}'), COALESCE((SELECT MAX(${SERIAL[t]}) FROM ${t}),0)+1, false)`);
    console.log(`${t}: copied ${rows.length} rows`);
  }
  await client.query('COMMIT');
  console.log('Done.');
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Failed, nothing was changed:', e.message);
  process.exitCode = 1;
} finally { await client.end(); lite.close(); }
