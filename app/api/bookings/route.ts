import crypto from 'node:crypto';
import { after, NextResponse } from 'next/server';
import { one, q, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getDestination } from '@/lib/repo';
import { quote } from '@/lib/pricing';
import { paymentsEnabled } from '@/lib/razorpay';
import { hit, HOUR, tooMany } from '@/lib/ratelimit';
import { notifyBooking } from '@/lib/emails';
import { cleanName, cleanPhone } from '@/lib/validate';

export const dynamic = 'force-dynamic';
const unauth = () => NextResponse.json({ error: 'Please log in to book.' }, { status: 401 });

type Row = { id: number; ref: string; slug: string; name: string | null; travel_date: string; travellers: number; total: number; status: string; share_token: string | null; reviewed: boolean };

export async function GET() {
  const u = await currentUser(); if (!u) return unauth();
  const rows = await q<Row>(
    `SELECT b.id, b.ref, b.slug, d.name, b.travel_date, b.travellers, b.total, b.status, b.share_token,
            EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS reviewed
       FROM bookings b LEFT JOIN destinations d ON d.slug = b.slug WHERE b.user_id = $1 ORDER BY b.id DESC`, [u.id]);
  const today = new Date().toISOString().slice(0, 10);
  const bookings = rows.map(r => ({
    id: r.id, ref: r.ref, slug: r.slug, name: r.name ?? r.slug, travel_date: r.travel_date, travellers: r.travellers,
    total: r.total, status: r.status, share_token: r.share_token,
    can_review: (r.status === 'paid' || r.status === 'confirmed') && r.travel_date <= today && !r.reviewed,
    reviewed: !!r.reviewed
  }));
  return NextResponse.json({ bookings, payEnabled: paymentsEnabled() });
}

export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const wait = await hit(`booking:${u.id}`, 10, HOUR);
  if (wait) return tooMany(wait);
  const b = await req.json().catch(() => ({}));
  const d = typeof b.slug === 'string' ? await getDestination(b.slug) : undefined;
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

  // price is always computed on the server from the stored destination price
  const qt = quote(d.price, travellers);
  const ref = 'ROA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const ins = await one<{ id: number }>(
    'INSERT INTO bookings (ref, user_id, slug, travel_date, travellers, name, phone, base, gst, total, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
    [ref, u.id, d.slug, date, travellers, name, phone, qt.base, qt.gst, qt.total, Date.now()]);
  after(() => notifyBooking('requested', ins!.id));
  return NextResponse.json({ ref, total: qt.total, status: 'requested' });
}

export async function DELETE(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const id = Number(new URL(req.url).searchParams.get('id'));
  const n = Number.isInteger(id) ? await run("UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status IN ('requested','confirmed')", [id, u.id]) : 0;
  if (n) after(() => notifyBooking('cancelled', id));
  if (!n) return NextResponse.json({ error: 'This booking cannot be cancelled online. Paid trips need support to cancel.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
