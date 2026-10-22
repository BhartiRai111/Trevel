import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { mailConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ user: await currentUser(), mailEnabled: mailConfigured() });
}
