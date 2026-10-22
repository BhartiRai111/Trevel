import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getItem, listItems, saveItem, type Kind } from '@/lib/catalog';
import { parseCatalog } from '@/lib/validate';

export const dynamic = 'force-dynamic';
const deny = () => NextResponse.json({ error: 'Admins only.' }, { status: 403 });
const kindOf = (v: unknown): Kind | null => (v === 'hotel' || v === 'flight' || v === 'car' ? v : null);

export async function GET(req: Request) {
  if (!(await requireAdmin())) return deny();
  const kind = kindOf(new URL(req.url).searchParams.get('kind'));
  if (!kind) return NextResponse.json({ error: 'Unknown kind.' }, { status: 400 });
  return NextResponse.json({ items: await listItems(kind, false) });
}

/** Create or update a hotel, flight or car. Body: { kind, isNew?, ...fields } */
export async function PUT(req: Request) {
  if (!(await requireAdmin())) return deny();
  const b = await req.json().catch(() => ({}));
  const kind = kindOf(b.kind);
  if (!kind) return NextResponse.json({ error: 'Unknown kind.' }, { status: 400 });
  const it = parseCatalog(kind, b);
  if (typeof it === 'string') return NextResponse.json({ error: it }, { status: 400 });
  const exists = !!(await getItem(kind, it.slug, false));
  if (b.isNew && exists) return NextResponse.json({ error: 'An item with this slug already exists.' }, { status: 409 });
  if (!b.isNew && !exists) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
  await saveItem(kind, it, !!b.isNew);
  return NextResponse.json({ ok: true });
}
