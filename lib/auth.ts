import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { one, run } from './db';
import { adminEmailList, mailConfigured } from './env';

const COOKIE = 'roamora_session';
const DAYS = 30;

export type User = { id: number; name: string; email: string; phone: string; isAdmin: boolean; emailVerified: boolean };

/** Admins are the emails listed in the ADMIN_EMAILS environment variable (comma separated). */
export const isAdminEmail = (email: string) => adminEmailList().includes(email.toLowerCase());
/** When email is set up, an admin must also have verified their email address. */
export const isAdminUser = (email: string, verified: boolean) => isAdminEmail(email) && (!mailConfigured() || verified);

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString('hex')}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [s, h] = stored.split(':');
  const calc = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 64);
  return crypto.timingSafeEqual(calc, Buffer.from(h, 'hex'));
}

const sha = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

export async function startSession(userId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  await run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [sha(token), userId, Date.now() + DAYS * 864e5]);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}

export async function endAllSessions(userId: number) { await run('DELETE FROM sessions WHERE user_id = $1', [userId]); }

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run('DELETE FROM sessions WHERE token_hash = $1', [sha(token)]);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = await one<{ id: number; name: string; email: string; phone: string; ev: number }>(
    'SELECT u.id, u.name, u.email, u.phone, u.email_verified AS ev FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > $2', [sha(token), Date.now()]
  );
  if (!row) return null;
  const { ev, ...u } = row;
  return { ...u, emailVerified: !!ev, isAdmin: isAdminUser(row.email, !!ev) };
}

export async function requireAdmin(): Promise<User | null> {
  const u = await currentUser();
  return u?.isAdmin ? u : null;
}
