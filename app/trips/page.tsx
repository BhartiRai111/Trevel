import type { Metadata } from 'next';
import TripsClient from './TripsClient';

export const metadata: Metadata = { title: 'My trips' };
export default function TripsPage() { return <TripsClient />; }
