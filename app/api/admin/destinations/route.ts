import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { allDestinations, getDestination, saveDestination } from '@/lib/repo';
import { parseDestination } from '@/lib/validate';

export const dynamic = 'force-dynamic';
const deny = () => NextResponse.json({ error: 'Admins only.' }, { status: 403 });

export async function GET() {
  if (!(await requireAdmin())) return deny();
  return NextResponse.json({ destinations: await allDestinations(false) });
}

/** Create or update. Body is the destination; `isNew: true` creates it. */
export async function PUT(req: Request) {
  if (!(await requireAdmin())) return deny();
  const b = await req.json().catch(() => ({}));
  const d = parseDestination(b);
  if (typeof d === 'string') return NextResponse.json({ error: d }, { status: 400 });
  const exists = !!(await getDestination(d.slug, false));
  if (b.isNew && exists) return NextResponse.json({ error: 'A destination with this slug already exists.' }, { status: 409 });
  if (!b.isNew && !exists) return NextResponse.json({ error: 'Destination not found.' }, { status: 404 });
  await saveDestination(d, !!b.isNew);
  return NextResponse.json({ ok: true });
}
