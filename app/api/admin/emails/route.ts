import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { mailConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const rows = await q('SELECT id, to_addr, subject, body, status, error, created_at FROM outbox ORDER BY id DESC LIMIT 100');
  return NextResponse.json({ emails: rows, configured: mailConfigured() });
}
