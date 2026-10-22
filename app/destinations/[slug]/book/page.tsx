import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDestination } from '@/lib/repo';
import { packagePrice } from '@/lib/pricing';
import { isDate, readParams, type SP } from '@/lib/sp';
import TripBooking from '@/components/TripBooking';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: SP };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d ? { title: `Book ${d.name}`, robots: { index: false } } : {};
}

export default async function BookTripPage({ params, searchParams }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const p = await readParams(searchParams);
  const packages = d.packages.map(k => ({ id: k.id, name: k.name, text: k.text, includes: k.includes, price: packagePrice(d.price, k.mult) }));
  const start = packages.some(k => k.id === p.package) ? p.package : packages[0].id;
  return (
    <main className="page wide">
      <p className="crumbs"><Link href="/search">Tours</Link> › <Link href={`/destinations/${d.slug}`}>{d.name}</Link> › <span>Book</span></p>
      <h1 className="ph">Book {d.name}</h1>
      <TripBooking slug={d.slug} name={d.name} state={d.state} days={d.days} img={d.img} packages={packages}
        initial={{ pkg: start, date: isDate(p.date) ? p.date : '', n: Math.min(20, Math.max(1, Number(p.n) || 2)) }} />
    </main>
  );
}
