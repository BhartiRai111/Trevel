import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchClient from './SearchClient';
import Shell from '@/components/Shell';

export const metadata: Metadata = { title: 'Destinations' };

export default function SearchPage() {
  return <Suspense fallback={<Shell title="Find your destination"><p>Loading destinations…</p></Shell>}><SearchClient /></Suspense>;
}
