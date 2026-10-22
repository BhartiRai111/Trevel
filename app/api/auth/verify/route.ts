import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consumeToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  const id = consumeToken(token, 'verify');
  if (!id) return NextResponse.json({ error: 'This link is invalid or has expired. Log in and ask for a new one.' }, { status: 400 });
  db().prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
