import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, isAdminEmail, startSession } from '@/lib/auth';
import { cleanName, cleanPhone, isEmail } from '@/lib/validate';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = cleanName(b.name), phone = cleanPhone(b.phone);
  const email = isEmail(b.email) ? b.email.toLowerCase() : null;
  if (!name) return NextResponse.json({ error: 'Enter your full name.' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 100)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  const exists = db().prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  if (exists) return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });

  const r = db().prepare('INSERT INTO users (name, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, phone, hashPassword(b.password), Date.now());
  await startSession(Number(r.lastInsertRowid));
  return NextResponse.json({ user: { id: Number(r.lastInsertRowid), name, email, phone, isAdmin: isAdminEmail(email) } });
}
