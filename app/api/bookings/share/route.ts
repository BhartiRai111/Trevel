import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** POST {id}: create (or return) a public share link for your booking. DELETE ?id=: turn the link off. */
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const row = db().prepare("SELECT share_token FROM bookings WHERE id = ? AND user_id = ? AND status != 'cancelled'").get(Number(id), u.id) as unknown as { share_token: string | null } | undefined;
  if (!row) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  const token = row.share_token ?? crypto.randomBytes(12).toString('base64url');
  if (!row.share_token) db().prepare('UPDATE bookings SET share_token = ? WHERE id = ?').run(token, Number(id));
  return NextResponse.json({ token });
}

export async function DELETE(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  db().prepare('UPDATE bookings SET share_token = NULL WHERE id = ? AND user_id = ?').run(id, u.id);
  return NextResponse.json({ ok: true });
}
