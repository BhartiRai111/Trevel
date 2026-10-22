import { NextResponse } from 'next/server';
import { q, run } from './db';

/**
 * Small database-backed rate limiter (works across restarts, one server).
 * The client IP comes from X-Forwarded-For, so run the site behind a proxy that sets it (Nginx, Cloudflare, Vercel...).
 * Per-account limits below do not depend on the IP, so they still hold if the IP header is faked.
 */
export function clientIp(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local').slice(0, 64);
}

/** Seconds to wait if `key` already has `max` or more hits in the window, else 0. Does not record a hit. */
export async function waitFor(key: string, max: number, windowMs: number): Promise<number> {
  const since = Date.now() - windowMs;
  const rows = await q<{ ts: number }>('SELECT ts FROM rate_hits WHERE key = $1 AND ts > $2 ORDER BY ts ASC', [key, since]);
  if (rows.length < max) return 0;
  return Math.max(1, Math.ceil((rows[rows.length - max].ts + windowMs - Date.now()) / 1000));
}

export async function record(key: string) {
  await run('INSERT INTO rate_hits (key, ts) VALUES ($1, $2)', [key, Date.now()]);
  if (Math.random() < 0.01) await run('DELETE FROM rate_hits WHERE ts < $1', [Date.now() - 864e5]);
}

export async function clear(key: string) { await run('DELETE FROM rate_hits WHERE key = $1', [key]); }

/** Counts one hit and reports how long to wait if the limit is passed (0 = allowed). */
export async function hit(key: string, max: number, windowMs: number): Promise<number> {
  const w = await waitFor(key, max, windowMs);
  if (w) return w;
  await record(key);
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
