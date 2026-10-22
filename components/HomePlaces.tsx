'use client';
import Link from 'next/link';
import { useState } from 'react';
import { DESTINATIONS, TYPE_LABEL, type DestType } from '@/lib/destinations';
import DestinationCard from './DestinationCard';

export default function HomePlaces() {
  const [f, setF] = useState<'all' | DestType>('all');
  const list = DESTINATIONS.filter(d => f === 'all' || d.type === f).slice(0, 8);
  return (
    <section className="section" id="places">
      <div className="head"><p className="eyebrow dark">Popular places</p><h2>Where will you go next?</h2></div>
      <div className="filters">
        {(['all', ...Object.keys(TYPE_LABEL)] as ('all' | DestType)[]).map(k => (
          <button key={k} className={`chip${f === k ? ' on' : ''}`} type="button" onClick={() => setF(k)}>{k === 'all' ? 'All' : TYPE_LABEL[k]}</button>
        ))}
      </div>
      <div className="cards">{list.map(d => <DestinationCard key={d.slug} d={d} />)}</div>
      <p className="more"><Link className="btn btn-dark inline" href="/search">See all destinations</Link></p>
    </section>
  );
}
