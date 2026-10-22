import type { Metadata } from 'next';
import Link from 'next/link';
import { CAR_TYPES, CITIES, searchCars } from '@/lib/catalog';
import { img } from '@/lib/destinations';
import { daysBetween, inr, quoteCar } from '@/lib/pricing';
import { isDate, qs, readParams, type SP } from '@/lib/sp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Cars with driver' };

export default async function CarsPage({ searchParams }: { searchParams: SP }) {
  const p = await readParams(searchParams);
  const cars = await searchCars({ city: p.city, type: p.type, sort: p.sort });
  const days = isDate(p.from) && isDate(p.to) ? daysBetween(p.from, p.to) + 1 : 0;
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  return (
    <main className="page">
      <h1 className="ph">Cars with driver</h1>
      <form className="sform" method="get">
        <label className="f"><span>Pick-up city</span><input name="city" defaultValue={p.city} list="cities" placeholder="Jaipur" autoComplete="off" /></label>
        <label className="f"><span>Pick-up date</span><input type="date" name="from" min={tomorrow} defaultValue={p.from} /></label>
        <label className="f"><span>Return date</span><input type="date" name="to" min={p.from || tomorrow} defaultValue={p.to} /></label>
        <label className="f"><span>Car type</span><select name="type" defaultValue={p.type ?? ''}><option value="">Any</option>{CAR_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="f"><span>Sort</span><select name="sort" defaultValue={p.sort ?? ''}><option value="">Price: low to high</option><option value="high">Price: high to low</option></select></label>
        <button className="btn btn-dark" type="submit">Search</button>
        <datalist id="cities">{Object.keys(CITIES).map(c => <option key={c} value={c} />)}</datalist>
      </form>
      {p.from && p.to && days < 1 && <p className="err dark" role="alert">Return date cannot be before pick-up.</p>}
      <p className="muted" role="status">{cars.length} {cars.length === 1 ? 'car' : 'cars'}{days >= 1 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}. Rates include the driver, fuel and tolls for up to 250 km a day.</p>
      {cars.length === 0 ? <div className="empty"><p>No cars match. Try another city or type.</p><Link className="btn btn-dark inline" href="/cars">Clear search</Link></div> : (
        <ul className="rlist">{cars.map(c => (
          <li key={c.slug} className="rcard">
            <div className="rimg" style={{ backgroundImage: `url('${img(c.img, 600, 70)}')` }} role="img" aria-label={c.name} />
            <div className="rbody">
              <div><h2>{c.name}</h2><p className="muted">{c.city} · {c.type} · seats {c.seats}</p><p className="chips2"><span>Driver included</span><span>Fuel and tolls included</span><span>250 km/day</span></p></div>
              <div className="rprice"><b>{inr(c.price)}</b><span className="muted"> per day</span>
                {days >= 1 && <div><b>{inr(quoteCar(c.price, days).total)}</b><span className="muted"> total with GST</span></div>}
                <Link className="btn btn-dark inline" href={`/cars/${c.slug}${qs({ from: p.from, to: p.to })}`}>View and book</Link></div>
            </div>
          </li>))}</ul>)}
    </main>
  );
}
