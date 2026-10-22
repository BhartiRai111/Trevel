import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { createOrder, paymentsEnabled, publicKeyId } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/** Starts a Razorpay payment for a booking that the team has confirmed. */
export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (!paymentsEnabled()) return NextResponse.json({ error: 'Online payment is not set up yet. Our team will share payment details with you.' }, { status: 503 });
  const { bookingId } = await req.json().catch(() => ({}));
  const b = db().prepare('SELECT id, ref, total, status, name, phone FROM bookings WHERE id = ? AND user_id = ?').get(Number(bookingId), u.id) as unknown as
    { id: number; ref: string; total: number; status: string; name: string; phone: string } | undefined;
  if (!b) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (b.status !== 'confirmed') return NextResponse.json({ error: b.status === 'paid' ? 'This booking is already paid.' : 'You can pay after we confirm your booking.' }, { status: 400 });
  try {
    const order = await createOrder(b.total * 100, b.ref);
    db().prepare('INSERT INTO payments (booking_id, order_id, amount, created_at) VALUES (?,?,?,?)').run(b.id, order.id, b.total, Date.now());
    return NextResponse.json({ orderId: order.id, amount: b.total * 100, keyId: publicKeyId(), ref: b.ref, name: b.name, phone: b.phone, email: u.email });
  } catch {
    return NextResponse.json({ error: 'Could not start the payment. Please try again in a minute.' }, { status: 502 });
  }
}
