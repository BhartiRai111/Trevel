'use client';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TYPE_LABEL, type DestType } from '@/lib/destinations';
import { inr } from '@/lib/pricing';
import DestinationCard from '@/components/DestinationCard';
import { useSite } from '@/components/SiteProvider';

export default function SearchClient() {
  const { dests } = useSite();
  const MAX = Math.max(5000, ...dests.map(d => d.price));
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [types, setTypes] = useState<DestType[]>(() => { const t = sp.get('type'); return t && t in TYPE_LABEL ? [t as DestType] : []; });
  const [maxSel, setMax] = useState<number | null>(null);
  const max = maxSel ?? MAX;
  const [days, setDays] = useState('any');
  const [sort, setSort] = useState('recommended');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const r = dests.filter(d =>
      (!s || `${d.name} ${d.state} ${d.tagline} ${TYPE_LABEL[d.type]}`.toLowerCase().includes(s)) &&
      (!types.length || types.includes(d.type)) && d.price <= max &&
      (days === 'any' || (days === 'short' && d.days <= 4) || (days === 'mid' && d.days >= 5 && d.days <= 6) || (days === 'long' && d.days >= 7)));
    if (sort === 'low') r.sort((a, b) => a.price - b.price);
    if (sort === 'high') r.sort((a, b) => b.price - a.price);
    if (sort === 'days') r.sort((a, b) => a.days - b.days);
    return r;
  }, [dests, q, types, max, days, sort]);

  const clear = () => { setQ(''); setTypes([]); setMax(null); setDays('any'); setSort('recommended'); };
  const toggle = (t: DestType) => setTypes(a => a.includes(t) ? a.filter(x => x !== t) : [...a, t]);

  return (
    <main className="page">
      <h1 className="ph">Find your destination</h1>
      <div className="layout">
        <aside className="filt" aria-label="Filters">
          <label className="f"><span>Search</span><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Goa, Ladakh, Rajasthan…" /></label>
          <fieldset><legend>Type</legend>
            {(Object.keys(TYPE_LABEL) as DestType[]).map(t => (
              <label key={t} className="cb"><input type="checkbox" checked={types.includes(t)} onChange={() => toggle(t)} /> {TYPE_LABEL[t]}</label>
            ))}
          </fieldset>
          <label className="f"><span>Max price per person: <b>{inr(max)}</b></span>
            <input type="range" min={5000} max={MAX} step={500} value={max} onChange={e => setMax(+e.target.value)} /></label>
          <label className="f"><span>Trip length</span>
            <select value={days} onChange={e => setDays(e.target.value)}>
              <option value="any">Any</option><option value="short">Up to 4 days</option><option value="mid">5 to 6 days</option><option value="long">7+ days</option>
            </select></label>
          <button className="btn btn-ghost-dark" type="button" onClick={clear}>Clear filters</button>
        </aside>
        <section>
          <div className="bar2">
            <p role="status">{list.length} {list.length === 1 ? 'destination' : 'destinations'}</p>
            <label>Sort <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recommended">Recommended</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="days">Shortest first</option>
            </select></label>
          </div>
          {list.length
            ? <div className="cards">{list.map(d => <DestinationCard key={d.slug} d={d} />)}</div>
            : <div className="empty"><p>No destinations match these filters.</p><button className="btn btn-dark inline" type="button" onClick={clear}>Clear filters</button></div>}
        </section>
      </div>
    </main>
  );
}
