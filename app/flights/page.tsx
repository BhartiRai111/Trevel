import type { Metadata } from 'next';
import Link from 'next/link';
import { arrival, CITIES, DAY_NAMES, fmtDuration, searchFlights } from '@/lib/catalog';
import { inr, quoteFlight } from '@/lib/pricing';
import { isDate, qs, readParams, type SP } from '@/lib/sp';
import Shell from '@/components/Shell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Flights' };

export default async function FlightsPage({ searchParams }: { searchParams: SP }) {
  const p = await readParams(searchParams);
  const date = isDate(p.date) ? p.date : undefined;
  const pax = Math.min(9, Math.max(1, Number(p.pax) || 1));
  const flights = await searchFlights({ from: p.from, to: p.to, date, sort: p.sort });
  const anyDay = date ? await searchFlights({ from: p.from, to: p.to }) : flights;
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const same = !!p.from && p.from.toLowerCase() === (p.to ?? '').toLowerCase();
  return (
    <Shell title="Flights">
      <form className="sform" method="get">
        <label className="f"><span>From</span><input name="from" defaultValue={p.from} list="cities" placeholder="Delhi" autoComplete="off" /></label>
        <label className="f"><span>To</span><input name="to" defaultValue={p.to} list="cities" placeholder="Goa" autoComplete="off" /></label>
        <label className="f"><span>Depart</span><input type="date" name="date" min={tomorrow} defaultValue={p.date} /></label>
        <label className="f"><span>Passengers</span><select name="pax" defaultValue={String(pax)}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="f"><span>Sort</span><select name="sort" defaultValue={p.sort ?? ''}><option value="">Earliest</option><option value="price">Cheapest</option></select></label>
        <button className="btn btn-dark" type="submit">Search</button>
        <datalist id="cities">{Object.keys(CITIES).map(c => <option key={c} value={c} />)}</datalist>
      </form>
      {same && <p className="err dark" role="alert">Choose two different cities.</p>}
      <p className="muted" role="status">{flights.length} {flights.length === 1 ? 'flight' : 'flights'}{date ? ` on ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}` : ''}. Fares are per person with 5% GST added.</p>
      {flights.length === 0 ? (
        <div className="empty">
          <p>{date && anyDay.length ? 'No flights on this date for that route. It runs on other days:' : 'No flights found for this route. Try a nearby city.'}</p>
          {date && anyDay.length > 0 && <p>{[...new Set(anyDay.flatMap(f => f.days))].sort().map(d => DAY_NAMES[d]).join(', ')}</p>}
          <Link className="btn btn-dark inline" href={`/flights${qs({ from: p.from, to: p.to })}`}>See all days</Link>
        </div>
      ) : (
        <ul className="flist">{flights.map(f => {
          const total = quoteFlight(f.price, pax).total;
          return (
            <li key={f.slug} className="frow">
              <div className="fair"><b>{f.airline}</b><span className="muted">{f.flightNo}</span></div>
              <div className="ftime"><b>{f.dep}</b><span className="muted">{f.from}</span></div>
              <div className="fmid"><span className="muted">{fmtDuration(f.duration)} · non-stop</span><i /></div>
              <div className="ftime"><b>{arrival(f.dep, f.duration)}</b><span className="muted">{f.to}</span></div>
              <div className="rprice"><b>{inr(f.price)}</b><span className="muted"> per person</span>
                {pax > 1 && <div><b>{inr(total)}</b><span className="muted"> for {pax} with GST</span></div>}</div>
              <Link className="btn btn-dark inline" href={`/flights/${f.slug}${qs({ date, pax: p.pax })}`}>Book</Link>
              {!date && <p className="muted small fdays">Runs {f.days.length === 7 ? 'daily' : f.days.map(d => DAY_NAMES[d]).join(', ')}</p>}
            </li>);
        })}</ul>)}
    </Shell>
  );
}
