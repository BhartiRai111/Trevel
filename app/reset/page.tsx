import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetClient from './ResetClient';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };
export default function ResetPage() { return <Suspense fallback={<main className="page"><p>Loading…</p></main>}><ResetClient /></Suspense>; }
