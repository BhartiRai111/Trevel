import { Suspense } from 'react';
import type { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = { title: 'Verify email', robots: { index: false } };
export default function VerifyPage() { return <Suspense fallback={<main className="page"><p>Checking…</p></main>}><VerifyClient /></Suspense>; }
