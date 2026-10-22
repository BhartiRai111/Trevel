import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { mailConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const rows = db().prepare('SELECT id, to_addr, subject, body, status, error, created_at FROM outbox ORDER BY id DESC LIMIT 100').all();
  return NextResponse.json({ emails: rows, configured: mailConfigured() });
}
