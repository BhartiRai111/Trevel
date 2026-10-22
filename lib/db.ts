import type { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const g = globalThis as unknown as { __roamoraDb?: DatabaseSync };

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
  `);
  g.__roamoraDb = d;
  return d;
}
