import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchClient from './SearchClient';

export const metadata: Metadata = { title: 'Destinations' };

export default function SearchPage() {
  return <Suspense fallback={<main className="page"><p>Loading destinations…</p></main>}><SearchClient /></Suspense>;
}
