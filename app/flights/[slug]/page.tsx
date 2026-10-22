import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { arrival, DAY_NAMES, fmtDuration, getItem, type Flight } from '@/lib/catalog';
import { isDate, readParams, type SP } from '@/lib/sp';
import BookPanel from '@/components/BookPanel';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: SP };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await getItem<Flight>('flight', (await params).slug);
  return f ? { title: `${f.from} to ${f.to} · ${f.flightNo}` } : {};
}

export default async function FlightPage({ params, searchParams }: Props) {
  const f = await getItem<Flight>('flight', (await params).slug);
  if (!f) notFound();
  const p = await readParams(searchParams);
  return (
    <main>
      <section className="dhero photo fl">
        <div className="dh-in">
          <p className="eyebrow">{f.airline} · {f.flightNo}</p>
          <h1>{f.from} to {f.to}</h1>
          <p className="facts"><span>{f.dep} → {arrival(f.dep, f.duration)}</span><span>{fmtDuration(f.duration)} non-stop</span><span>Runs {f.days.length === 7 ? 'daily' : f.days.map(d => DAY_NAMES[d]).join(', ')}</span></p>
        </div>
      </section>
      <div className="detail">
        <div className="dcol">
          <h2>Flight details</h2>
          <ul className="tick"><li>Economy fare per person, GST (5%) shown before you send the request</li><li>Departure {f.dep} from {f.from}, arrival {arrival(f.dep, f.duration)} in {f.to} (local time)</li><li>Reporting time: arrive at the airport 2 hours before departure</li></ul>
          <p className="muted">Seats are confirmed by our team after you send a request. You pay only after the booking is confirmed. Baggage rules follow the airline.</p>
        </div>
        <BookPanel kind="flight" slug={f.slug} title={`${f.from} to ${f.to}`} price={f.price} flightDays={f.days} initial={{ date: isDate(p.date) ? p.date : '', n: Number(p.pax) || 1 }} />
      </div>
    </main>
  );
}
