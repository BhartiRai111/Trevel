import crypto from 'node:crypto';
import { after, NextResponse } from 'next/server';
import { one, q, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getDestination } from '@/lib/repo';
import { getItem, type Car, type Flight, type Hotel } from '@/lib/catalog';
import { daysBetween, quote, quoteCar, quoteFlight, quoteHotel, weekday, type Quote } from '@/lib/pricing';
import { paymentsEnabled } from '@/lib/razorpay';
import { hit, HOUR, tooMany } from '@/lib/ratelimit';
import { notifyBooking } from '@/lib/emails';
import { cleanName, cleanPhone } from '@/lib/validate';

export const dynamic = 'force-dynamic';
const unauth = () => NextResponse.json({ error: 'Please log in to book.' }, { status: 401 });

type Row = { id: number; ref: string; kind: string; slug: string; name: string; travel_date: string; end_date: string | null; travellers: number; total: number; status: string; share_token: string | null; reviewed: boolean };

const HREF: Record<string, string> = { tour: 'destinations', hotel: 'hotels', flight: 'flights', car: 'cars' };

export async function GET() {
  const u = await currentUser(); if (!u) return unauth();
  const rows = await q<Row>(
    `SELECT b.id, b.ref, b.kind, b.slug, COALESCE(b.title, d.name, b.slug) AS name, b.travel_date, b.end_date, b.travellers, b.total, b.status, b.share_token,
            EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS reviewed
       FROM bookings b LEFT JOIN destinations d ON d.slug = b.slug WHERE b.user_id = $1 ORDER BY b.id DESC`, [u.id]);
  const today = new Date().toISOString().slice(0, 10);
  const bookings = rows.map(r => ({
    id: r.id, ref: r.ref, kind: r.kind, href: `/${HREF[r.kind] ?? 'destinations'}/${r.slug}`, slug: r.slug, name: r.name, travel_date: r.travel_date, end_date: r.end_date,
    travellers: r.travellers, total: r.total, status: r.status, share_token: r.share_token,
    can_review: r.kind === 'tour' && (r.status === 'paid' || r.status === 'confirmed') && r.travel_date <= today && !r.reviewed,
    reviewed: !!r.reviewed
  }));
  return NextResponse.json({ bookings, payEnabled: paymentsEnabled() });
}

export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const wait = await hit(`booking:${u.id}`, 10, HOUR);
  if (wait) return tooMany(wait);
  const b = await req.json().catch(() => ({}));
  const kind = ['tour', 'hotel', 'flight', 'car'].includes(b.kind) ? (b.kind as string) : 'tour';
  const slug = typeof b.slug === 'string' ? b.slug : '';
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

  const travellers = Number(b.travellers);
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > 20) return bad('Travellers must be between 1 and 20.');
  const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  const date = isDate(b.date) ? b.date : '';
  const today = new Date().toISOString().slice(0, 10);
  if (!date || date <= today) return bad(kind === 'hotel' ? 'Choose a check-in date after today.' : 'Choose a date after today.');
  if (daysBetween(today, date) > 730) return bad('Choose a date within the next two years.');
  const name = cleanName(b.name), phone = cleanPhone(b.phone);
  if (!name) return bad('Enter the lead traveller name.');
  if (!phone) return bad('Enter a valid 10-digit mobile number.');

  // every price is computed here on the server from the stored rate, never taken from the browser
  let title = '', slugOut = slug, endDate: string | null = null, units = 1, qt: Quote;
  if (kind === 'tour') {
    const d = await getDestination(slug);
    if (!d) return bad('Unknown destination.');
    title = d.name; slugOut = d.slug; qt = quote(d.price, travellers);
  } else if (kind === 'hotel') {
    const h = await getItem<Hotel>('hotel', slug);
    if (!h) return bad('Unknown hotel.');
    const out = isDate(b.endDate) ? b.endDate : '';
    const nights = out ? daysBetween(date, out) : 0;
    if (nights < 1 || nights > 30) return bad('Check-out must be 1 to 30 nights after check-in.');
    const rooms = Number(b.rooms);
    if (!Number.isInteger(rooms) || rooms < 1 || rooms > 5) return bad('Rooms must be between 1 and 5.');
    if (travellers > rooms * 3) return bad('Each room fits up to 3 guests. Add a room or reduce guests.');
    title = h.name; slugOut = h.slug; endDate = out; units = rooms; qt = quoteHotel(h.price, nights, rooms);
  } else if (kind === 'flight') {
    const f = await getItem<Flight>('flight', slug);
    if (!f) return bad('Unknown flight.');
    if (travellers > 9) return bad('You can book up to 9 passengers at a time.');
    if (!f.days.includes(weekday(date))) return bad('This flight does not operate on the chosen date. Pick another day.');
    title = `${f.flightNo} ${f.from} to ${f.to}`; slugOut = f.slug; qt = quoteFlight(f.price, travellers);
  } else {
    const c = await getItem<Car>('car', slug);
    if (!c) return bad('Unknown car.');
    const back = isDate(b.endDate) ? b.endDate : '';
    const days = back ? daysBetween(date, back) + 1 : 0;
    if (days < 1 || days > 30) return bad('Return date must be on or after pick-up, within 30 days.');
    if (travellers > c.seats) return bad(`This car seats up to ${c.seats} people.`);
    title = c.name; slugOut = c.slug; endDate = back; qt = quoteCar(c.price, days);
  }

  const ref = 'ROA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const ins = await one<{ id: number }>(
    'INSERT INTO bookings (ref, user_id, kind, slug, title, travel_date, end_date, travellers, units, name, phone, base, gst, total, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id',
    [ref, u.id, kind, slugOut, title, date, endDate, travellers, units, name, phone, qt.base, qt.gst, qt.total, Date.now()]);
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
