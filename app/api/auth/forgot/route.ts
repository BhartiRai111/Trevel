import { after, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken, secondsSinceLast } from '@/lib/tokens';
import { sendResetEmail } from '@/lib/emails';
import { siteUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Always answers the same way, so it cannot be used to find out who has an account. */
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const e = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const u = e ? db().prepare('SELECT id, name, email FROM users WHERE email = ?').get(e) as unknown as { id: number; name: string; email: string } | undefined : undefined;
  if (u && secondsSinceLast(u.id, 'reset') >= 60) {
    const link = `${siteUrl(req)}/reset?token=${createToken(u.id, 'reset')}`;
    after(() => sendResetEmail(u.email, u.name, link));
  }
  return NextResponse.json({ ok: true, message: 'If that email has an account, we sent a link to reset the password.' });
}
