import fs from 'node:fs';
import path from 'node:path';
import { ORIGINAL_IMG, PHOTOS, SEED } from './seedDestinations';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;
type Raw = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Row[]; count: number }> };
export type Conn = {
  /** all rows */ q: <T = Row>(sql: string, params?: unknown[]) => Promise<T[]>;
  /** first row or undefined */ one: <T = Row>(sql: string, params?: unknown[]) => Promise<T | undefined>;
  /** number of rows changed */ run: (sql: string, params?: unknown[]) => Promise<number>;
};
type Backend = Raw & { exec: (sql: string) => Promise<void>; tx: <T>(fn: (c: Conn) => Promise<T>) => Promise<T> };

const wrap = (r: Raw): Conn => ({
  q: async (sql, p) => (await r.query(sql, p)).rows as any,
  one: async (sql, p) => (await r.query(sql, p)).rows[0] as any,
  run: async (sql, p) => (await r.query(sql, p)).count
});

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL,
    password_hash TEXT NOT NULL, created_at BIGINT NOT NULL, email_verified INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saved (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, slug TEXT NOT NULL, PRIMARY KEY (user_id, slug)
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY, ref TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL, travel_date TEXT NOT NULL, travellers INTEGER NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
    base INTEGER NOT NULL, gst INTEGER NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'requested',
    created_at BIGINT NOT NULL, share_token TEXT, paid_at BIGINT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_share ON bookings(share_token) WHERE share_token IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
  CREATE TABLE IF NOT EXISTS destinations (
    slug TEXT PRIMARY KEY, name TEXT NOT NULL, state TEXT NOT NULL, type TEXT NOT NULL, days INTEGER NOT NULL,
    price INTEGER NOT NULL, best_time TEXT NOT NULL, tagline TEXT NOT NULL, about TEXT NOT NULL, highlights TEXT NOT NULL,
    itinerary TEXT NOT NULL, img TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY, booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE, payment_id TEXT, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'created', created_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS email_tokens (
    token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL, expires_at BIGINT NOT NULL, created_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS outbox (
    id SERIAL PRIMARY KEY, to_addr TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, error TEXT, created_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rate_hits (key TEXT NOT NULL, ts BIGINT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_rate_hits ON rate_hits(key, ts);
  CREATE TABLE IF NOT EXISTS hotels (
    slug TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, stars INTEGER NOT NULL, price INTEGER NOT NULL,
    amenities TEXT NOT NULL, about TEXT NOT NULL, img TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS flights (
    slug TEXT PRIMARY KEY, airline TEXT NOT NULL, flight_no TEXT NOT NULL, from_city TEXT NOT NULL, to_city TEXT NOT NULL, dep TEXT NOT NULL,
    duration INTEGER NOT NULL, price INTEGER NOT NULL, days TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS cars (
    slug TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, city TEXT NOT NULL, seats INTEGER NOT NULL, price INTEGER NOT NULL,
    about TEXT NOT NULL, img TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
  );
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'tour';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_date TEXT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS units INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package TEXT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE destinations ADD COLUMN IF NOT EXISTS explore TEXT NOT NULL DEFAULT '';
  ALTER TABLE destinations ADD COLUMN IF NOT EXISTS packages TEXT NOT NULL DEFAULT '';
  ALTER TABLE destinations ADD COLUMN IF NOT EXISTS gallery TEXT NOT NULL DEFAULT '';
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY, booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, slug TEXT NOT NULL, rating INTEGER NOT NULL,
    text TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL
  );
`;

async function connectPg(url: string): Promise<Backend> {
  const pg = (await import('pg')).default;
  pg.types.setTypeParser(20, v => Number(v)); // BIGINT (timestamps in ms, COUNT, SUM) as numbers
  const pool = new pg.Pool({ connectionString: url, max: Number(process.env.PG_POOL_MAX || 10) });
  const asRaw = (c: { query: (s: string, p?: unknown[]) => Promise<{ rows: Row[]; rowCount: number | null }> }): Raw => ({
    query: async (sql, params) => { const r = await c.query(sql, params as unknown[]); return { rows: r.rows, count: r.rowCount ?? 0 }; }
  });
  return {
    ...asRaw(pool),
    exec: async sql => { await pool.query(sql); },
    tx: async fn => {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const out = await fn(wrap(asRaw(client))); await client.query('COMMIT'); return out; }
      catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
      finally { client.release(); }
    }
  };
}

/** Local development without installing anything: a real Postgres running inside Node, saved in ./data/pglite */
async function connectEmbedded(): Promise<Backend> {
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'pglite');
  fs.mkdirSync(dir, { recursive: true });
  const lite = new PGlite(dir, { parsers: { 20: (v: string) => Number(v) } });
  await lite.waitReady;
  type Q = { query: (s: string, p?: unknown[]) => Promise<{ rows: Row[]; affectedRows?: number }> };
  const asRaw = (c: Q): Raw => ({ query: async (sql, params) => { const r = await c.query(sql, params as unknown[]); return { rows: r.rows, count: r.affectedRows ?? 0 }; } });
  return {
    ...asRaw(lite as unknown as Q),
    exec: async sql => { await lite.exec(sql); },
    tx: fn => lite.transaction(t => fn(wrap(asRaw(t as unknown as Q))))
  };
}

const g = globalThis as unknown as { __roamora?: Promise<Backend> };

async function init(): Promise<Backend> {
  const url = process.env.DATABASE_URL;
  const b = url ? await connectPg(url) : await connectEmbedded();
  await b.exec(SCHEMA);
  const { rows } = await b.query('SELECT COUNT(*) AS n FROM destinations');
  if (Number(rows[0].n) === 0) {
    await b.tx(async c => {
      for (const [i, x] of SEED.entries())
        await c.run(
          'INSERT INTO destinations (slug,name,state,type,days,price,best_time,tagline,about,highlights,itinerary,img,active,sort,explore,packages,gallery) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$14,$15,$16) ON CONFLICT (slug) DO NOTHING',
          [x.slug, x.name, x.state, x.type, x.days, x.price, x.bestTime, x.tagline, x.about, JSON.stringify(x.highlights), JSON.stringify(x.itinerary), x.img, i, JSON.stringify(x.explore), JSON.stringify(x.packages), JSON.stringify(x.gallery)]
        );
    });
  }
  // one-time: the first guide version gave places stock photos by category (a Jaipur palace on a Goa fort card). Clear those so cards use the destination photo.
  const migrated = await b.query("SELECT 1 FROM meta WHERE key = 'guide-photos-v2'");
  if (!migrated.rows.length) {
    const OLD = new Set(['photo-1507525428034-b723cf961d3e', 'photo-1464822759023-fed622ff2c3b', 'photo-1506905925346-21bda4d32df4', 'photo-1501785888041-af3ef285b470', 'photo-1477587458883-47145ed94245', 'photo-1602216056096-3b40cc0c9944', 'photo-1551632811-561732d1e306', 'photo-1469854523086-cc02fe5d8800']);
    const rows = (await b.query("SELECT slug, img, explore FROM destinations WHERE explore <> ''")).rows;
    for (const r of rows) {
      try {
        const ex = JSON.parse(r.explore as string); let changed = false;
        for (const it of ex.items ?? []) if (it.kind !== 'food' && it.img && (OLD.has(it.img) || it.img === r.img)) { it.img = ''; changed = true; }
        if (changed) await b.query('UPDATE destinations SET explore = $1 WHERE slug = $2', [JSON.stringify(ex), r.slug]);
      } catch { /* leave a row we cannot read untouched */ }
    }
    await b.query("INSERT INTO meta (key, value) VALUES ('guide-photos-v2', '1') ON CONFLICT (key) DO NOTHING");
  }
  // one-time: move destinations to the real local photos, and drop the generic stock food photos (cards without a real photo become text cards)
  const localDone = await b.query("SELECT 1 FROM meta WHERE key = 'local-photos-v1'");
  if (!localDone.rows.length) {
    const FOOD_STOCK = new Set(['photo-1504674900247-0877df9cc836', 'photo-1495474472287-4d71bcdd2085']);
    const rows = (await b.query('SELECT slug, img, gallery, explore FROM destinations')).rows;
    for (const r of rows) {
      const plan = PHOTOS[r.slug as string];
      let img = r.img as string, gallery = r.gallery as string, explore = r.explore as string;
      if (img === ORIGINAL_IMG[r.slug as string]) img = plan?.hero ?? '';                               // untouched stock photo -> our real photo, or none until one with credits exists
      if (plan && (!gallery || gallery === '[]')) gallery = JSON.stringify(plan.gallery);               // no background photos yet -> add ours
      if (explore) {
        try {
          const ex = JSON.parse(explore);
          for (const it of ex.items ?? []) {
            if (FOOD_STOCK.has(it.img)) it.img = '';
            if (plan?.items[it.name as string] && !it.img) it.img = plan.items[it.name as string];      // keep any photo an admin set
          }
          explore = JSON.stringify(ex);
        } catch { /* leave unreadable rows as they are */ }
      }
      await b.query('UPDATE destinations SET img = $1, gallery = $2, explore = $3 WHERE slug = $4', [img, gallery, explore, r.slug]);
    }
    await b.query("INSERT INTO meta (key, value) VALUES ('local-photos-v1', '1') ON CONFLICT (key) DO NOTHING");
  }
  // databases from before the guide pages: fill the sample guide and packages for rows that still have none (edited rows are never touched)
  for (const x of SEED) await b.query("UPDATE destinations SET explore = $1, packages = $2 WHERE slug = $3 AND explore = ''", [JSON.stringify(x.explore), JSON.stringify(x.packages), x.slug]);
  const { seedCatalog } = await import('./catalog'); // loaded here to avoid a circular import
  await seedCatalog(wrap(b));
  return b;
}

const backend = () => (g.__roamora ??= init().catch(e => { g.__roamora = undefined; throw e; }));

/** PostgreSQL (DATABASE_URL) in production, embedded Postgres when DATABASE_URL is not set. */
export const q: Conn['q'] = async (sql, p) => wrap(await backend()).q(sql, p);
export const one: Conn['one'] = async (sql, p) => wrap(await backend()).one(sql, p);
export const run: Conn['run'] = async (sql, p) => wrap(await backend()).run(sql, p);
/** Runs several statements as one all-or-nothing transaction. */
export const tx = async <T,>(fn: (c: Conn) => Promise<T>): Promise<T> => (await backend()).tx(fn);
