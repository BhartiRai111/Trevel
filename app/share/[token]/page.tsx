import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getDestination } from '@/lib/repo';
import { img } from '@/lib/destinations';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Shared trip', robots: { index: false, follow: false } };

type Row = { slug: string; travel_date: string; travellers: number; name: string; status: string };

/** Public, read-only trip page. Shows no phone, email or price. */
export default async function SharedTrip({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = db().prepare("SELECT slug, travel_date, travellers, name, status FROM bookings WHERE share_token = ? AND status != 'cancelled'").get(token) as unknown as Row | undefined;
  const d = b && getDestination(b.slug, false);
  if (!b || !d) notFound();
  const first = b.name.split(/\s+/)[0];
  const date = new Date(b.travel_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <main>
      <section className="dhero photo" style={{ ['--img' as string]: `url('${img(d.img, 2000, 80)}')` }}>
        <div className="dh-in">
          <p className="eyebrow">{first}&apos;s trip</p>
          <h1>{d.name}</h1>
          <p className="lead">{d.state}</p>
          <p className="facts"><span>{date}</span><span>{b.travellers} {b.travellers === 1 ? 'traveller' : 'travellers'}</span><span>{d.days} days</span></p>
        </div>
      </section>
      <div className="detail one">
        <div className="dcol">
          <h2>Plan</h2>
          <ol className="days">{d.itinerary.map((x, i) => <li key={i}><span className="dn">Day {i + 1}</span><div><b>{x.title}</b><p>{x.text}</p></div></li>)}</ol>
          <p><Link className="btn btn-dark inline" href={`/destinations/${d.slug}`}>Plan your own {d.name} trip</Link></p>
        </div>
      </div>
    </main>
  );
}
