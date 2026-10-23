import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetClient from './ResetClient';
import Shell from '@/components/Shell';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };
export default function ResetPage() { return <Suspense fallback={<Shell title="Choose a new password"><p>Loading…</p></Shell>}><ResetClient /></Suspense>; }
