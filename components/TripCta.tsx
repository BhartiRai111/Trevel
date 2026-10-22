'use client';
import Link from 'next/link';
import { inr } from '@/lib/pricing';
import { useSite } from './SiteProvider';

/** Price card on the destination page: the main "Book This Trip" button and the save heart. */
export default function TripCta({ slug, name, price, days, sticky }: { slug: string; name: string; price: number; days: number; sticky?: boolean }) {
  const { saved, toggleSave } = useSite();
  const on = saved.has(slug);
  const href = `/destinations/${slug}/book`;
  if (sticky) return (
    <div className="ctabar"><div><span className="from">From</span> <b>{inr(price)}</b> <span className="from">per person</span></div>
      <Link className="btn btn-gold" href={href}>Book This Trip</Link></div>
  );
  return (
    <aside className="panel">
      <div className="ptop"><div><span className="from">From</span> <b className="big">{inr(price)}</b> <span className="from">per person · {days} days</span></div>
        <button type="button" className={`heart ghost${on ? ' on' : ''}`} aria-pressed={on} aria-label={on ? `Remove ${name} from saved` : `Save ${name}`} onClick={() => toggleSave(slug)}>{on ? '♥' : '♡'}</button></div>
      <p className="muted small">Choose a Standard, Comfort or Premium package, your dates and travellers on the next page. The full price with GST is shown before you send anything.</p>
      <Link className="btn btn-gold bigbtn" href={href}>Book This Trip</Link>
      <p className="small muted">No payment now. We confirm availability first, then you pay.</p>
    </aside>
  );
}
