import type { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { SEED } from './destinations';

const g = globalThis as unknown as { __roamoraDb?: DatabaseSync };

function addCol(d: DatabaseSync, table: string, col: string, def: string) {
  const cols = d.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[];
  if (!cols.some(c => c.name === col)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}

/** SQLite file at ./data/roamora.db (Node's built-in sqlite, no extra package). */
export function db(): DatabaseSync {
  if (g.__roamoraDb) return g.__roamoraDb;
  const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  const { DatabaseSync: DB } = process.getBuiltinModule('node:sqlite');
  const d = new DB(path.join(dir, 'roamora.db'));
  d.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL,
      password_hash TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saved (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, slug TEXT NOT NULL,
      PRIMARY KEY (user_id, slug)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL, travel_date TEXT NOT NULL, travellers INTEGER NOT NULL,
      name TEXT NOT NULL, phone TEXT NOT NULL,
      base INTEGER NOT NULL, gst INTEGER NOT NULL, total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested', created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS destinations (
      slug TEXT PRIMARY KEY, name TEXT NOT NULL, state TEXT NOT NULL, type TEXT NOT NULL,
      days INTEGER NOT NULL, price INTEGER NOT NULL, best_time TEXT NOT NULL, tagline TEXT NOT NULL,
      about TEXT NOT NULL, highlights TEXT NOT NULL, itinerary TEXT NOT NULL, img TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL UNIQUE, payment_id TEXT, amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'created', created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL, rating INTEGER NOT NULL, text TEXT NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
    );
  `);
  addCol(d, 'bookings', 'share_token', 'TEXT');
  addCol(d, 'bookings', 'paid_at', 'INTEGER');
  d.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_share ON bookings(share_token) WHERE share_token IS NOT NULL');

  const n = (d.prepare('SELECT COUNT(*) AS n FROM destinations').get() as unknown as { n: number }).n;
  if (n === 0) {
    const ins = d.prepare('INSERT INTO destinations (slug,name,state,type,days,price,best_time,tagline,about,highlights,itinerary,img,active,sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    SEED.forEach((x, i) => ins.run(x.slug, x.name, x.state, x.type, x.days, x.price, x.bestTime, x.tagline, x.about,
      JSON.stringify(x.highlights), JSON.stringify(x.itinerary), x.img, 1, i));
  }
  g.__roamoraDb = d;
  return d;
}
