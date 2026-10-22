import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { one, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** POST {id}: create (or return) a public share link for your booking. DELETE ?id=: turn the link off. */
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const row = Number.isInteger(Number(id)) ? await one<{ share_token: string | null }>("SELECT share_token FROM bookings WHERE id = $1 AND user_id = $2 AND status != 'cancelled'", [Number(id), u.id]) : undefined;
  if (!row) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  const token = row.share_token ?? crypto.randomBytes(12).toString('base64url');
  if (!row.share_token) await run('UPDATE bookings SET share_token = $1 WHERE id = $2', [token, Number(id)]);
  return NextResponse.json({ token });
}

export async function DELETE(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (Number.isInteger(id)) await run('UPDATE bookings SET share_token = NULL WHERE id = $1 AND user_id = $2', [id, u.id]);
  return NextResponse.json({ ok: true });
}
