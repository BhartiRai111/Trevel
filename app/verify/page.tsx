import { Suspense } from 'react';
import type { Metadata } from 'next';
import VerifyClient from './VerifyClient';
import Shell from '@/components/Shell';

export const metadata: Metadata = { title: 'Verify email', robots: { index: false } };
export default function VerifyPage() { return <Suspense fallback={<Shell title="Verify email"><p>Checking…</p></Shell>}><VerifyClient /></Suspense>; }
