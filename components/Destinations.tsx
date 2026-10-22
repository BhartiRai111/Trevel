'use client';
import { useState } from 'react';
import { PLACES, unsplash } from '@/lib/places';
import { useSite } from './SiteProvider';

const FILTERS = [['all', 'All'], ['mountain', 'Mountains'], ['beach', 'Beaches'], ['city', 'Cities']] as const;

export default function Destinations() {
  const { query, openBook } = useSite();
  const [filter, setFilter] = useState<string>('all');
  const q = query.trim().toLowerCase();
  const list = PLACES.filter(p => (filter === 'all' || p.type === filter) && (!q || `${p.name} ${p.country}`.toLowerCase().includes(q)));

  return (
    <section className="section" id="places">
      <div className="head">
        <p className="eyebrow dark">Top places</p>
        <h2>Where will you go next?</h2>
      </div>
      <div className="filters" role="tablist">
        {FILTERS.map(([k, label]) => (
          <button key={k} className={`chip${filter === k ? ' on' : ''}`} type="button" onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>
      <div className="cards">
        {list.length ? list.map(p => (
          <article key={p.name} className="card" tabIndex={0} onClick={() => openBook(p.name)}
            onKeyDown={e => { if (e.key === 'Enter') openBook(p.name); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={unsplash(p.img)} alt={`${p.name}, ${p.country}`} loading="lazy" />
            <span className="tag">{p.country}</span>
            <div className="in"><h3>{p.name}</h3><div className="row"><span>★ 4.9</span><span className="price">from ${p.price}</span></div></div>
          </article>
        )) : <p>No places match yet. Try another search.</p>}
      </div>
    </section>
  );
}
