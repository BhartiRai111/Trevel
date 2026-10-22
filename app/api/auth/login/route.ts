import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminUser, startSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = typeof b.email === 'string' ? b.email.toLowerCase().trim() : '';
  const row = db().prepare('SELECT id, name, email, phone, password_hash, email_verified AS ev FROM users WHERE email = ?').get(email) as
    { id: number; name: string; email: string; phone: string; password_hash: string; ev: number } | undefined;
  if (!row || typeof b.password !== 'string' || !verifyPassword(b.password, row.password_hash))
    return NextResponse.json({ error: 'Email or password is wrong.' }, { status: 401 });
  await startSession(row.id);
  return NextResponse.json({ user: { id: row.id, name: row.name, email: row.email, phone: row.phone, isAdmin: isAdminUser(row.email, !!row.ev), emailVerified: !!row.ev } });
}
