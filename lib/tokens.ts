import crypto from 'node:crypto';
import { db } from './db';

const sha = (t: string) => crypto.createHash('sha256').update(t).digest('hex');
export type Purpose = 'verify' | 'reset';
const TTL: Record<Purpose, number> = { verify: 48 * 36e5, reset: 36e5 };

/** Seconds since the last token of this kind was made for the user (Infinity if none). Used to rate-limit emails. */
export function secondsSinceLast(userId: number, purpose: Purpose) {
  const r = db().prepare('SELECT MAX(created_at) AS t FROM email_tokens WHERE user_id = ? AND purpose = ?').get(userId, purpose) as unknown as { t: number | null };
  return r.t ? (Date.now() - r.t) / 1000 : Infinity;
}

/** Makes a one-time token. Older tokens of the same kind for the user stop working. */
export function createToken(userId: number, purpose: Purpose) {
  const raw = crypto.randomBytes(32).toString('base64url');
  db().prepare('DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?').run(userId, purpose);
  db().prepare('INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at, created_at) VALUES (?,?,?,?,?)').run(sha(raw), userId, purpose, Date.now() + TTL[purpose], Date.now());
  return raw;
}

/** Checks and uses up a token. Returns the user id, or null if wrong, used or expired. */
export function consumeToken(raw: unknown, purpose: Purpose): number | null {
  if (typeof raw !== 'string' || raw.length > 100) return null;
  const row = db().prepare('SELECT user_id, expires_at FROM email_tokens WHERE token_hash = ? AND purpose = ?').get(sha(raw), purpose) as unknown as { user_id: number; expires_at: number } | undefined;
  if (!row) return null;
  db().prepare('DELETE FROM email_tokens WHERE token_hash = ?').run(sha(raw));
  return row.expires_at > Date.now() ? row.user_id : null;
}
