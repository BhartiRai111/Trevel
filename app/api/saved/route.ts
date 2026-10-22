import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { bySlug } from '@/lib/destinations';

export const dynamic = 'force-dynamic';
const unauth = () => NextResponse.json({ error: 'Please log in.' }, { status: 401 });

export async function GET() {
  const u = await currentUser(); if (!u) return unauth();
  const rows = db().prepare('SELECT slug FROM saved WHERE user_id = ?').all(u.id) as { slug: string }[];
  return NextResponse.json({ slugs: rows.map(r => r.slug) });
}

export async function POST(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const { slug } = await req.json().catch(() => ({}));
  if (typeof slug !== 'string' || !bySlug(slug)) return NextResponse.json({ error: 'Unknown destination.' }, { status: 400 });
  db().prepare('INSERT OR IGNORE INTO saved (user_id, slug) VALUES (?, ?)').run(u.id, slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await currentUser(); if (!u) return unauth();
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  db().prepare('DELETE FROM saved WHERE user_id = ? AND slug = ?').run(u.id, slug);
  return NextResponse.json({ ok: true });
}
