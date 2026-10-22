import crypto from 'node:crypto';
import { one, run } from './db';

const sha = (t: string) => crypto.createHash('sha256').update(t).digest('hex');
export type Purpose = 'verify' | 'reset';
const TTL: Record<Purpose, number> = { verify: 48 * 36e5, reset: 36e5 };

/** Seconds since the last token of this kind was made for the user (Infinity if none). Used to rate-limit emails. */
export async function secondsSinceLast(userId: number, purpose: Purpose) {
  const r = await one<{ t: number | null }>('SELECT MAX(created_at) AS t FROM email_tokens WHERE user_id = $1 AND purpose = $2', [userId, purpose]);
  return r?.t ? (Date.now() - r.t) / 1000 : Infinity;
}

/** Makes a one-time token. Older tokens of the same kind for the user stop working. */
export async function createToken(userId: number, purpose: Purpose) {
  const raw = crypto.randomBytes(32).toString('base64url');
  await run('DELETE FROM email_tokens WHERE user_id = $1 AND purpose = $2', [userId, purpose]);
  await run('INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at, created_at) VALUES ($1,$2,$3,$4,$5)', [sha(raw), userId, purpose, Date.now() + TTL[purpose], Date.now()]);
  return raw;
}

/** Checks and uses up a token. Returns the user id, or null if wrong, used or expired. */
export async function consumeToken(raw: unknown, purpose: Purpose): Promise<number | null> {
  if (typeof raw !== 'string' || raw.length > 100) return null;
  const row = await one<{ user_id: number; expires_at: number }>('SELECT user_id, expires_at FROM email_tokens WHERE token_hash = $1 AND purpose = $2', [sha(raw), purpose]);
  if (!row) return null;
  // delete returns how many rows it removed, so two clicks at the same moment cannot both win
  if (!(await run('DELETE FROM email_tokens WHERE token_hash = $1', [sha(raw)]))) return null;
  return Number(row.expires_at) > Date.now() ? row.user_id : null;
}
