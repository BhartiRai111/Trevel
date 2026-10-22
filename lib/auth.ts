import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE = 'roamora_session';
const DAYS = 30;

export type User = { id: number; name: string; email: string; phone: string };

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
  db().prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, Date.now() + DAYS * 864e5);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db().prepare(
    'SELECT u.id, u.name, u.email, u.phone FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).get(sha(token), Date.now()) as User | undefined;
  return row ?? null;
}
