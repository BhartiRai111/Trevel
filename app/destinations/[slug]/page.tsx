import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DESTINATIONS, INCLUSIONS, TYPE_LABEL, bySlug, img } from '@/lib/destinations';
import { inr } from '@/lib/pricing';
import BookingPanel from '@/components/BookingPanel';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return DESTINATIONS.map(d => ({ slug: d.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = bySlug((await params).slug);
  return d ? { title: d.name, description: d.tagline } : {};
}

export default async function DestinationPage({ params }: Props) {
  const d = bySlug((await params).slug);
  if (!d) notFound();
  return (
    <main>
      <section className="dhero photo" style={{ ['--img' as string]: `url('${img(d.img, 2000, 80)}')` }}>
        <div className="dh-in">
          <p className="eyebrow">{d.state} · {TYPE_LABEL[d.type]}</p>
          <h1>{d.name}</h1>
          <p className="lead">{d.tagline}</p>
          <p className="facts"><span>{d.days} days</span><span>Best time: {d.bestTime}</span><span>From {inr(d.price)} per person</span></p>
        </div>
      </section>
      <div className="detail">
        <div className="dcol">
          <h2>About this trip</h2>
          <p>{d.about}</p>
          <h2>Highlights</h2>
          <ul className="tick">{d.highlights.map(h => <li key={h}>{h}</li>)}</ul>
          <h2>Included in the price</h2>
          <ul className="tick">{INCLUSIONS.map(h => <li key={h}>{h}</li>)}</ul>
          <p className="muted">Flights or train tickets to the starting city, entry tickets, meals other than breakfast and personal expenses are not included.</p>
        </div>
        <BookingPanel slug={d.slug} name={d.name} price={d.price} days={d.days} />
      </div>
    </main>
  );
}
