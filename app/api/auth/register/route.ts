import { after, NextResponse } from 'next/server';
import { one } from '@/lib/db';
import { hashPassword, isAdminEmail, startSession } from '@/lib/auth';
import { clientIp, hit, HOUR, tooMany } from '@/lib/ratelimit';
import { createToken } from '@/lib/tokens';
import { sendVerifyEmail } from '@/lib/emails';
import { siteUrl } from '@/lib/env';
import { cleanName, cleanPhone, isEmail } from '@/lib/validate';

export async function POST(req: Request) {
  const wait = await hit(`register:${clientIp(req)}`, 10, HOUR);
  if (wait) return tooMany(wait);
  const b = await req.json().catch(() => ({}));
  const name = cleanName(b.name), phone = cleanPhone(b.phone);
  const email = isEmail(b.email) ? b.email.toLowerCase() : null;
  if (!name) return NextResponse.json({ error: 'Enter your full name.' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 100)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  // the UNIQUE constraint decides, so two sign-ups at the same moment cannot both succeed
  const r = await one<{ id: number }>('INSERT INTO users (name, email, phone, password_hash, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING RETURNING id',
    [name, email, phone, hashPassword(b.password), Date.now()]);
  if (!r) return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });
  await startSession(r.id);
  const link = `${siteUrl(req)}/verify?token=${await createToken(r.id, 'verify')}`;
  after(() => sendVerifyEmail(email, name, link));
  return NextResponse.json({ user: { id: r.id, name, email, phone, isAdmin: isAdminEmail(email), emailVerified: false } });
}
