import { after, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { createToken, secondsSinceLast } from '@/lib/tokens';
import { sendVerifyEmail } from '@/lib/emails';
import { siteUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (u.emailVerified) return NextResponse.json({ ok: true });
  if (secondsSinceLast(u.id, 'verify') < 60) return NextResponse.json({ error: 'We just sent one. Wait a minute and try again.' }, { status: 429 });
  const link = `${siteUrl(req)}/verify?token=${createToken(u.id, 'verify')}`;
  after(() => sendVerifyEmail(u.email, u.name, link));
  return NextResponse.json({ ok: true });
}
