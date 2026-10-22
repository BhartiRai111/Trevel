import { NextResponse } from 'next/server';
import { one, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { hit, HOUR, tooMany } from '@/lib/ratelimit';
import { reviewsFor } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  return NextResponse.json(await reviewsFor(slug));
}

/** Only the traveller of a paid/confirmed booking whose trip date has passed can review it, once. */
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const wait = await hit(`review:${u.id}`, 10, HOUR);
  if (wait) return tooMany(wait);
  const b = await req.json().catch(() => ({}));
  const rating = Number(b.rating), text = typeof b.text === 'string' ? b.text.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Choose a rating from 1 to 5 stars.' }, { status: 400 });
  if (text.length < 10 || text.length > 1000) return NextResponse.json({ error: 'Write between 10 and 1000 characters.' }, { status: 400 });
  const id = Number(b.bookingId);
  const bk = Number.isInteger(id) ? await one<{ id: number; slug: string; status: string; travel_date: string }>('SELECT id, slug, status, travel_date FROM bookings WHERE id = $1 AND user_id = $2', [id, u.id]) : undefined;
  if (!bk || !['paid', 'confirmed'].includes(bk.status)) return NextResponse.json({ error: 'You can review a trip after you have taken it.' }, { status: 403 });
  if (bk.travel_date > new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: 'You can review after your travel date.' }, { status: 403 });
  const added = await one('INSERT INTO reviews (booking_id, user_id, slug, rating, text, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (booking_id) DO NOTHING RETURNING id', [bk.id, u.id, bk.slug, rating, text, Date.now()]);
  if (!added) return NextResponse.json({ error: 'You already reviewed this trip.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
