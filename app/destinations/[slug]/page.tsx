import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INCLUSIONS, TYPE_LABEL, img } from '@/lib/destinations';
import { getDestination, reviewsFor } from '@/lib/repo';
import { inr } from '@/lib/pricing';
import BookingPanel from '@/components/BookingPanel';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d ? { title: d.name, description: d.tagline } : {};
}

const Stars = ({ n }: { n: number }) => <span className="stars sm" aria-label={`${n.toFixed(1)} out of 5`}>{'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}</span>;

export default async function DestinationPage({ params }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const rv = await reviewsFor(d.slug);
  return (
    <main>
      <section className="dhero photo" style={{ ['--img' as string]: `url('${img(d.img, 2000, 80)}')` }}>
        <div className="dh-in">
          <p className="eyebrow">{d.state} · {TYPE_LABEL[d.type]}</p>
          <h1>{d.name}</h1>
          <p className="lead">{d.tagline}</p>
          <p className="facts">
            <span>{d.days} days</span><span>Best time: {d.bestTime}</span><span>From {inr(d.price)} per person</span>
            {rv.count > 0 && <span><Stars n={rv.avg} /> {rv.avg.toFixed(1)} ({rv.count})</span>}
          </p>
        </div>
      </section>
      <div className="detail">
        <div className="dcol">
          <h2>About this trip</h2>
          <p>{d.about}</p>
          <h2>Highlights</h2>
          <ul className="tick">{d.highlights.map(h => <li key={h}>{h}</li>)}</ul>
          <h2>Day by day</h2>
          <ol className="days">{d.itinerary.map((x, i) => (
            <li key={i}><span className="dn">Day {i + 1}</span><div><b>{x.title}</b><p>{x.text}</p></div></li>
          ))}</ol>
          <h2>Included in the price</h2>
          <ul className="tick">{INCLUSIONS.map(h => <li key={h}>{h}</li>)}</ul>
          <p className="muted">Flights or train tickets to the starting city, entry tickets, meals other than breakfast and personal expenses are not included.</p>
          <h2>Traveller reviews</h2>
          {rv.count === 0
            ? <p className="muted">No reviews yet. Reviews appear here from travellers who have taken this trip.</p>
            : <><p><Stars n={rv.avg} /> <b>{rv.avg.toFixed(1)}</b> from {rv.count} {rv.count === 1 ? 'review' : 'reviews'}</p>
              <ul className="rev">{rv.list.map(r => (
                <li key={r.id}><div><Stars n={r.rating} /> <b>{r.author}</b> <span className="muted">{r.date}</span></div><p>{r.text}</p></li>
              ))}</ul></>}
        </div>
        <BookingPanel slug={d.slug} name={d.name} price={d.price} days={d.days} />
      </div>
    </main>
  );
}
