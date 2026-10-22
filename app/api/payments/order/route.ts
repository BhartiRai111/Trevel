import { NextResponse } from 'next/server';
import { one, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { hit, HOUR, tooMany } from '@/lib/ratelimit';
import { createOrder, paymentsEnabled, publicKeyId } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/** Starts a Razorpay payment for a booking that the team has confirmed. */
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (!paymentsEnabled()) return NextResponse.json({ error: 'Online payment is not set up yet. Our team will share payment details with you.' }, { status: 503 });
  const wait = await hit(`payorder:${u.id}`, 20, HOUR);
  if (wait) return tooMany(wait);
  const { bookingId } = await req.json().catch(() => ({}));
  const id = Number(bookingId);
  const b = Number.isInteger(id) ? await one<{ id: number; ref: string; total: number; status: string; name: string; phone: string }>('SELECT id, ref, total, status, name, phone FROM bookings WHERE id = $1 AND user_id = $2', [id, u.id]) : undefined;
  if (!b) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (b.status !== 'confirmed') return NextResponse.json({ error: b.status === 'paid' ? 'This booking is already paid.' : 'You can pay after we confirm your booking.' }, { status: 400 });
  try {
    const order = await createOrder(b.total * 100, b.ref);
    await run('INSERT INTO payments (booking_id, order_id, amount, created_at) VALUES ($1,$2,$3,$4)', [b.id, order.id, b.total, Date.now()]);
    return NextResponse.json({ orderId: order.id, amount: b.total * 100, keyId: publicKeyId(), ref: b.ref, name: b.name, phone: b.phone, email: u.email });
  } catch {
    return NextResponse.json({ error: 'Could not start the payment. Please try again in a minute.' }, { status: 502 });
  }
}
