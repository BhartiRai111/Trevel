import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { bySlug } from '@/lib/destinations';
import { quote } from '@/lib/pricing';
import { cleanName, cleanPhone } from '@/lib/validate';

export const dynamic = 'force-dynamic';
const unauth = () => NextResponse.json({ error: 'Please log in to book.' }, { status: 401 });

type Row = { id: number; ref: string; slug: string; travel_date: string; travellers: number; base: number; gst: number; total: number; status: string; created_at: number };

export async function GET() {
  const u = await currentUser(); if (!u) return unauth();
  const rows = db().prepare('SELECT id, ref, slug, travel_date, travellers, base, gst, total, status, created_at FROM bookings WHERE user_id = ? ORDER BY id DESC').all(u.id) as Row[];
  return NextResponse.json({ bookings: rows });
}

export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const b = await req.json().catch(() => ({}));
  const d = typeof b.slug === 'string' ? bySlug(b.slug) : undefined;
  if (!d) return NextResponse.json({ error: 'Unknown destination.' }, { status: 400 });

  const travellers = Number(b.travellers);
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > 20)
    return NextResponse.json({ error: 'Travellers must be between 1 and 20.' }, { status: 400 });
  const date = typeof b.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : '';
  if (!date || new Date(date + 'T00:00:00') <= new Date(new Date().toDateString()))
    return NextResponse.json({ error: 'Choose a travel date after today.' }, { status: 400 });
  const name = cleanName(b.name), phone = cleanPhone(b.phone);
  if (!name) return NextResponse.json({ error: 'Enter the lead traveller name.' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });

  // price is always computed on the server from our own data
  const q = quote(d.price, travellers);
  const ref = 'ROA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  db().prepare('INSERT INTO bookings (ref, user_id, slug, travel_date, travellers, name, phone, base, gst, total, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(ref, u.id, d.slug, date, travellers, name, phone, q.base, q.gst, q.total, Date.now());
  return NextResponse.json({ ref, total: q.total, status: 'requested' });
}

export async function DELETE(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const id = Number(new URL(req.url).searchParams.get('id'));
  const r = db().prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status IN ('requested','confirmed')").run(id, u.id);
  if (!r.changes) return NextResponse.json({ error: 'This booking cannot be cancelled.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
