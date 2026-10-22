import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clear, clientIp, MIN, record, tooMany, waitFor } from '@/lib/ratelimit';
import { isAdminUser, startSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = typeof b.email === 'string' ? b.email.toLowerCase().trim().slice(0, 120) : '';
  const ip = clientIp(req);
  const keys = { pair: `login:pair:${email}|${ip}`, ip: `login:ip:${ip}`, email: `login:email:${email}` };
  const wait = Math.max(waitFor(keys.pair, 5, 15 * MIN), waitFor(keys.ip, 30, 15 * MIN), waitFor(keys.email, 25, 15 * MIN));
  if (wait) return tooMany(wait);
  const row = db().prepare('SELECT id, name, email, phone, password_hash, email_verified AS ev FROM users WHERE email = ?').get(email) as
    { id: number; name: string; email: string; phone: string; password_hash: string; ev: number } | undefined;
  if (!row || typeof b.password !== 'string' || !verifyPassword(b.password, row.password_hash))
  { record(keys.pair); record(keys.ip); record(keys.email); return NextResponse.json({ error: 'Email or password is wrong.' }, { status: 401 }); }
  clear(keys.pair);
  await startSession(row.id);
  return NextResponse.json({ user: { id: row.id, name: row.name, email: row.email, phone: row.phone, isAdmin: isAdminUser(row.email, !!row.ev), emailVerified: !!row.ev } });
}
