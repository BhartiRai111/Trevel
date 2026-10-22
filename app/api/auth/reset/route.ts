import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { endAllSessions, hashPassword } from '@/lib/auth';
import { consumeToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));
  if (typeof password !== 'string' || password.length < 8 || password.length > 100)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  const id = consumeToken(token, 'reset');
  if (!id) return NextResponse.json({ error: 'This link is invalid or has expired. Ask for a new reset link.' }, { status: 400 });
  // following the emailed link also proves the address is theirs
  db().prepare('UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?').run(hashPassword(password), id);
  endAllSessions(id); // log out everywhere
  return NextResponse.json({ ok: true });
}
