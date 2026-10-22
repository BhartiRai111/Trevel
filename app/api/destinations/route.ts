import { NextResponse } from 'next/server';
import { allDestinations } from '@/lib/repo';

export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ destinations: allDestinations(true) }); }
