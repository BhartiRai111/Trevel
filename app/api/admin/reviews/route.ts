import { NextResponse } from 'next/server';
import { q, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const deny = () => NextResponse.json({ error: 'Admins only.' }, { status: 403 });

export async function GET() {
  if (!(await requireAdmin())) return deny();
  const rows = await q('SELECT r.id, r.slug, r.rating, r.text, r.hidden, r.created_at, u.name FROM reviews r JOIN users u ON u.id = r.user_id ORDER BY r.id DESC LIMIT 200');
  return NextResponse.json({ reviews: rows });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return deny();
  const { id, hidden } = await req.json().catch(() => ({}));
  if (Number.isInteger(Number(id))) await run('UPDATE reviews SET hidden = $1 WHERE id = $2', [hidden ? 1 : 0, Number(id)]);
  return NextResponse.json({ ok: true });
}
