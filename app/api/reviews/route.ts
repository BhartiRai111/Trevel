import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { reviewsFor } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  return NextResponse.json(reviewsFor(slug));
}

/** Only the traveller of a paid/confirmed booking whose trip date has passed can review it, once. */
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const rating = Number(b.rating), text = typeof b.text === 'string' ? b.text.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Choose a rating from 1 to 5 stars.' }, { status: 400 });
  if (text.length < 10 || text.length > 1000) return NextResponse.json({ error: 'Write between 10 and 1000 characters.' }, { status: 400 });
  const bk = db().prepare('SELECT id, slug, status, travel_date FROM bookings WHERE id = ? AND user_id = ?').get(Number(b.bookingId), u.id) as unknown as
    { id: number; slug: string; status: string; travel_date: string } | undefined;
  if (!bk || !['paid', 'confirmed'].includes(bk.status)) return NextResponse.json({ error: 'You can review a trip after you have taken it.' }, { status: 403 });
  if (bk.travel_date > new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: 'You can review after your travel date.' }, { status: 403 });
  if (db().prepare('SELECT 1 FROM reviews WHERE booking_id = ?').get(bk.id)) return NextResponse.json({ error: 'You already reviewed this trip.' }, { status: 409 });
  db().prepare('INSERT INTO reviews (booking_id, user_id, slug, rating, text, created_at) VALUES (?,?,?,?,?,?)').run(bk.id, u.id, bk.slug, rating, text, Date.now());
  return NextResponse.json({ ok: true });
}
