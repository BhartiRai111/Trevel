import { NextResponse } from 'next/server';
import { db } from './db';

/**
 * Small database-backed rate limiter (works across restarts, one server).
 * The client IP comes from X-Forwarded-For, so run the site behind a proxy that sets it (Nginx, Cloudflare, Vercel...).
 * Per-account limits below do not depend on the IP, so they still hold if the IP header is faked.
 */
export function clientIp(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local').slice(0, 64);
}

/** Seconds to wait if `key` already has `max` or more hits in the window, else 0. Does not record a hit. */
export function waitFor(key: string, max: number, windowMs: number): number {
  const since = Date.now() - windowMs;
  const rows = db().prepare('SELECT ts FROM rate_hits WHERE key = ? AND ts > ? ORDER BY ts ASC').all(key, since) as unknown as { ts: number }[];
  if (rows.length < max) return 0;
  return Math.max(1, Math.ceil((rows[rows.length - max].ts + windowMs - Date.now()) / 1000));
}

export function record(key: string) {
  db().prepare('INSERT INTO rate_hits (key, ts) VALUES (?, ?)').run(key, Date.now());
  if (Math.random() < 0.01) db().prepare('DELETE FROM rate_hits WHERE ts < ?').run(Date.now() - 864e5);
}

export function clear(key: string) { db().prepare('DELETE FROM rate_hits WHERE key = ?').run(key); }

/** Counts one hit and reports how long to wait if the limit is passed (0 = allowed). */
export function hit(key: string, max: number, windowMs: number): number {
  const w = waitFor(key, max, windowMs);
  if (w) return w;
  record(key);
  return 0;
}

export function tooMany(seconds: number) {
  const mins = Math.ceil(seconds / 60);
  return NextResponse.json(
    { error: `Too many attempts. Please try again in ${seconds < 90 ? `${seconds} seconds` : `${mins} minutes`}.` },
    { status: 429, headers: { 'Retry-After': String(seconds) } }
  );
}

export const MIN = 60_000, HOUR = 3_600_000;
