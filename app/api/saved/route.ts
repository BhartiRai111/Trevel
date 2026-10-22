import { NextResponse } from 'next/server';
import { q, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getDestination } from '@/lib/repo';

export const dynamic = 'force-dynamic';
const unauth = () => NextResponse.json({ error: 'Please log in.' }, { status: 401 });

export async function GET() {
  const u = await currentUser(); if (!u) return unauth();
  const rows = await q<{ slug: string }>('SELECT slug FROM saved WHERE user_id = $1', [u.id]);
  return NextResponse.json({ slugs: rows.map(r => r.slug) });
}

export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const { slug } = await req.json().catch(() => ({}));
  if (typeof slug !== 'string' || !(await getDestination(slug))) return NextResponse.json({ error: 'Unknown destination.' }, { status: 400 });
  await run('INSERT INTO saved (user_id, slug) VALUES ($1, $2) ON CONFLICT DO NOTHING', [u.id, slug]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  await run('DELETE FROM saved WHERE user_id = $1 AND slug = $2', [u.id, slug]);
  return NextResponse.json({ ok: true });
}
