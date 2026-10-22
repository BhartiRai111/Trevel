import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { clientIp, hit, HOUR, tooMany } from '@/lib/ratelimit';
import { consumeToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const wait = await hit(`verify:${clientIp(req)}`, 20, HOUR);
  if (wait) return tooMany(wait);
  const { token } = await req.json().catch(() => ({}));
  const id = await consumeToken(token, 'verify');
  if (!id) return NextResponse.json({ error: 'This link is invalid or has expired. Log in and ask for a new one.' }, { status: 400 });
  await run('UPDATE users SET email_verified = 1 WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
