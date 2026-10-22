import { after, NextResponse } from 'next/server';
import { q, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { notifyBooking } from '@/lib/emails';

export const dynamic = 'force-dynamic';
const deny = () => NextResponse.json({ error: 'Admins only.' }, { status: 403 });

export async function GET() {
  if (!(await requireAdmin())) return deny();
  const rows = await q(
    `SELECT b.id, b.ref, b.kind, b.slug, COALESCE(b.title, d.name) AS trip, b.travel_date, b.end_date, b.travellers, b.units, b.name, b.phone, u.email, b.total, b.status, b.created_at
       FROM bookings b JOIN users u ON u.id = b.user_id LEFT JOIN destinations d ON d.slug = b.slug ORDER BY b.id DESC LIMIT 500`);
  const stats = await q('SELECT status, COUNT(*) AS n, COALESCE(SUM(total),0) AS amount FROM bookings GROUP BY status');
  return NextResponse.json({ bookings: rows, stats });
}

const NEXT: Record<string, { to: 'confirmed' | 'cancelled' | 'paid'; from: string[] }> = {
  confirm: { to: 'confirmed', from: ['requested'] },
  cancel: { to: 'cancelled', from: ['requested', 'confirmed', 'paid'] },
  markpaid: { to: 'paid', from: ['confirmed'] } // for payments received outside Razorpay (bank transfer, cash)
};

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return deny();
  const { id, action } = await req.json().catch(() => ({}));
  const rule = NEXT[action as string];
  const bid = Number(id);
  if (!rule) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  if (!Number.isInteger(bid)) return NextResponse.json({ error: 'Unknown booking.' }, { status: 400 });
  const ph = rule.from.map((_, i) => `$${i + 3}`).join(',');
  const n = await run(`UPDATE bookings SET status = $1${rule.to === 'paid' ? `, paid_at = ${Date.now()}` : ''} WHERE id = $2 AND status IN (${ph})`, [rule.to, bid, ...rule.from]);
  if (!n) return NextResponse.json({ error: `A booking in this status cannot be changed with "${action}".` }, { status: 400 });
  after(() => notifyBooking(rule.to === 'confirmed' ? 'confirmed' : rule.to === 'paid' ? 'paid' : 'cancelled', bid));
  return NextResponse.json({ ok: true });
}
