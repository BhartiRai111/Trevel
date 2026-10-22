import { after, NextResponse } from 'next/server';
import { one } from '@/lib/db';
import { clientIp, hit, HOUR, tooMany } from '@/lib/ratelimit';
import { createToken, secondsSinceLast } from '@/lib/tokens';
import { sendResetEmail } from '@/lib/emails';
import { siteUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Always answers the same way, so it cannot be used to find out who has an account. */
export async function POST(req: Request) {
  const wait = await hit(`forgot:${clientIp(req)}`, 5, HOUR);
  if (wait) return tooMany(wait);
  const { email } = await req.json().catch(() => ({}));
  const e = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const u = e ? await one<{ id: number; name: string; email: string }>('SELECT id, name, email FROM users WHERE email = $1', [e]) : undefined;
  if (u && (await secondsSinceLast(u.id, 'reset')) >= 60) {
    const link = `${siteUrl(req)}/reset?token=${await createToken(u.id, 'reset')}`;
    after(() => sendResetEmail(u.email, u.name, link));
  }
  return NextResponse.json({ ok: true, message: 'If that email has an account, we sent a link to reset the password.' });
}
