'use client';
import Link from 'next/link';
import { img, TYPE_LABEL, type Destination } from '@/lib/destinations';
import { inr } from '@/lib/pricing';
import { useSite } from './SiteProvider';

export default function DestinationCard({ d }: { d: Destination }) {
  const { saved, toggleSave } = useSite();
  const on = saved.has(d.slug);
  return (
    <article className="card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(d.img)} alt={`${d.name}, ${d.state}`} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />
      <span className="tag">{d.state}</span>
      <Link className="cl" href={`/destinations/${d.slug}`} aria-label={`${d.name}, ${d.days} days from ${inr(d.price)}`}>
        <div className="in">
          <h3>{d.name}</h3>
          <div className="row"><span>{d.days} days · {TYPE_LABEL[d.type]}</span><span className="price">from {inr(d.price)}</span></div>
        </div>
      </Link>
      <button className={`heart${on ? ' on' : ''}`} type="button" aria-pressed={on} aria-label={on ? `Remove ${d.name} from saved` : `Save ${d.name}`} onClick={() => toggleSave(d.slug)}>{on ? '♥' : '♡'}</button>
    </article>
  );
}
