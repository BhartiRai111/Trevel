import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EXPLORE_KIND_LABEL, INCLUSIONS, TYPE_LABEL, img, type Destination, type ExploreKind } from '@/lib/destinations';
import { getDestination, reviewsFor } from '@/lib/repo';
import { inr } from '@/lib/pricing';
import TripCta from '@/components/TripCta';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d ? { title: `${d.name}: places, food and trip`, description: d.tagline } : {};
}

const Stars = ({ n }: { n: number }) => <span className="stars sm" aria-label={`${n.toFixed(1)} out of 5`}>{'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}</span>;

const Icon = ({ kind }: { kind: ExploreKind }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'see' && <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>}
    {kind === 'food' && <><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" /><path d="M17 3c-2 2-3 5-3 8h3v10" /></>}
    {kind === 'do' && <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>}
  </svg>
);

const SECTIONS: { kind: ExploreKind; id: string }[] = [{ kind: 'see', id: 'places' }, { kind: 'food', id: 'food' }, { kind: 'do', id: 'things' }];

function Explore({ d }: { d: Destination }) {
  const { items, info } = d.explore;
  if (!items.length && !info.howToReach && !info.gettingAround && !info.tips.length) return null;
  const groups = SECTIONS.map(s => ({ ...s, list: items.filter(i => i.kind === s.kind) })).filter(g => g.list.length);
  const hasInfo = d.bestTime || info.howToReach || info.gettingAround || info.tips.length;
  return (
    <>
      <nav className="xnav" aria-label="Explore sections">
        {groups.map(g => <a key={g.id} href={`#${g.id}`}>{EXPLORE_KIND_LABEL[g.kind]}</a>)}
        {hasInfo && <a href="#info">Visitor information</a>}
      </nav>
      {groups.map(g => (
        <section key={g.id} id={g.id} className="xsec">
          <h2>{EXPLORE_KIND_LABEL[g.kind]} in {d.name}</h2>
          <div className="xgrid">
            {g.list.map(i => (
              <article key={i.name} className={`xcard${i.img ? '' : ' noimg'}`}>
                {i.img
                  ? <div className="xph" style={{ backgroundImage: `url('${img(i.img, 600, 70)}'), linear-gradient(135deg,#0f8f86,#073a37)` }} role="img" aria-label={i.name} />
                  : <span className="xico" aria-hidden="true"><Icon kind={g.kind} /></span>}
                <div className="xbody">{i.type && <span className="tag2">{i.type}</span>}<h3>{i.name}</h3><p>{i.text}</p></div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {hasInfo && (
        <section id="info" className="xsec">
          <h2>Visitor information</h2>
          <div className="infogrid">
            {d.bestTime && <div><h3>Best time to visit</h3><p>{d.bestTime}</p></div>}
            {info.howToReach && <div><h3>How to reach</h3><p>{info.howToReach}</p></div>}
            {info.gettingAround && <div><h3>Getting around</h3><p>{info.gettingAround}</p></div>}
            {info.tips.length > 0 && <div><h3>Good to know</h3><ul className="tick">{info.tips.map(t => <li key={t}>{t}</li>)}</ul></div>}
          </div>
        </section>
      )}
      <p className="sample" role="note">{d.img.startsWith('/photos/') && <>Photos: Wikimedia Commons contributors, see <Link href={`/credits#${d.slug}`}>photo credits</Link>. </>}Sample information to help you plan. Please check opening times, permits, seasons and prices before you go. Restaurants and activities are suggestions, not bookings or live availability.</p>
    </>
  );
}

export default async function DestinationPage({ params }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const rv = await reviewsFor(d.slug);
  return (
    <main>
      <section className="dhero photo" style={{ ['--img' as string]: (d.img ? `url('${img(d.img, 2000, 80)}')` : 'none') }}>
        <div className="dh-in">
          <p className="eyebrow">{d.state} · {TYPE_LABEL[d.type]}</p>
          <h1>{d.name}</h1>
          <p className="lead">{d.tagline}</p>
          <p className="facts">
            <span>{d.days} days</span><span>Best time: {d.bestTime}</span><span>From {inr(d.price)} per person</span>
            {rv.count > 0 && <span><Stars n={rv.avg} /> {rv.avg.toFixed(1)} ({rv.count})</span>}
          </p>
          <p className="hero-act"><Link className="btn btn-gold bigbtn" href={`/destinations/${d.slug}/book`}>Book This Trip</Link>
            <a className="btn btn-ghost" href={d.explore.items.length ? '#places' : '#plan'}>Explore {d.name}</a></p>
        </div>
      </section>
      <div className="detail">
        <div className="dcol">
          <h2>About this trip</h2>
          <p>{d.about}</p>
          {d.highlights.length > 0 && <><h2>Highlights</h2><ul className="tick">{d.highlights.map(h => <li key={h}>{h}</li>)}</ul></>}
          <Explore d={d} />
          <h2 id="plan">Day by day</h2>
          <ol className="days">{d.itinerary.map((x, i) => (
            <li key={i}><span className="dn">Day {i + 1}</span><div><b>{x.title}</b><p>{x.text}</p></div></li>
          ))}</ol>
          <h2>Included in the Standard package</h2>
          <ul className="tick">{(d.packages[0]?.includes ?? INCLUSIONS).map(h => <li key={h}>{h}</li>)}</ul>
          <p className="muted">Comfort and Premium packages add a better stay, more meals and a private car. See all options and prices on the booking page. Flights or train tickets to the starting city, entry tickets and personal expenses are not included.</p>
          <h2>Traveller reviews</h2>
          {rv.count === 0
            ? <p className="muted">No reviews yet. Reviews appear here from travellers who have taken this trip.</p>
            : <><p><Stars n={rv.avg} /> <b>{rv.avg.toFixed(1)}</b> from {rv.count} {rv.count === 1 ? 'review' : 'reviews'}</p>
              <ul className="rev">{rv.list.map(r => (
                <li key={r.id}><div><Stars n={r.rating} /> <b>{r.author}</b> <span className="muted">{r.date}</span></div><p>{r.text}</p></li>
              ))}</ul></>}
        </div>
        <TripCta slug={d.slug} name={d.name} price={d.price} days={d.days} />
      </div>
      <TripCta slug={d.slug} name={d.name} price={d.price} days={d.days} sticky />
    </main>
  );
}
