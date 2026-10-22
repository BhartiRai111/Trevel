import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { markPaid } from '@/lib/pay';
import { verifyCheckoutSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s } = b;
  if (![o, p, s].every(x => typeof x === 'string' && x.length < 200)) return NextResponse.json({ error: 'Invalid payment details.' }, { status: 400 });
  const owns = db().prepare('SELECT 1 FROM payments pay JOIN bookings b ON b.id = pay.booking_id WHERE pay.order_id = ? AND b.user_id = ?').get(o, u.id);
  if (!owns) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  if (!verifyCheckoutSignature(o, p, s)) return NextResponse.json({ error: 'Payment could not be verified. If money was deducted, contact support with your booking reference.' }, { status: 400 });
  markPaid(o, p);
  return NextResponse.json({ ok: true });
}
