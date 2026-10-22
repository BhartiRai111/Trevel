import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const deny = () => NextResponse.json({ error: 'Admins only.' }, { status: 403 });

export async function GET() {
  if (!(await requireAdmin())) return deny();
  const rows = db().prepare(
    `SELECT b.id, b.ref, b.slug, d.name AS trip, b.travel_date, b.travellers, b.name, b.phone, u.email, b.total, b.status, b.created_at
       FROM bookings b JOIN users u ON u.id = b.user_id LEFT JOIN destinations d ON d.slug = b.slug ORDER BY b.id DESC LIMIT 500`
  ).all();
  const stats = db().prepare("SELECT status, COUNT(*) AS n, COALESCE(SUM(total),0) AS amount FROM bookings GROUP BY status").all();
  return NextResponse.json({ bookings: rows, stats });
}

const NEXT: Record<string, { to: string; from: string[] }> = {
  confirm: { to: 'confirmed', from: ['requested'] },
  cancel: { to: 'cancelled', from: ['requested', 'confirmed', 'paid'] },
  markpaid: { to: 'paid', from: ['confirmed'] } // for payments received outside Razorpay (bank transfer, cash)
};

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return deny();
  const { id, action } = await req.json().catch(() => ({}));
  const rule = NEXT[action as string];
  if (!rule) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  const r = db().prepare(`UPDATE bookings SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END WHERE id = ? AND status IN (${rule.from.map(() => '?').join(',')})`)
    .run(rule.to, rule.to, Date.now(), Number(id), ...rule.from);
  if (!r.changes) return NextResponse.json({ error: `A booking in this status cannot be changed with "${action}".` }, { status: 400 });
  return NextResponse.json({ ok: true });
}
