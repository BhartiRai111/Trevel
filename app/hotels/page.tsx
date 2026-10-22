import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIES, searchHotels } from '@/lib/catalog';
import { img } from '@/lib/destinations';
import { daysBetween, hotelGstRate, inr, quoteHotel } from '@/lib/pricing';
import { isDate, qs, readParams, type SP } from '@/lib/sp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Hotels' };

export default async function HotelsPage({ searchParams }: { searchParams: SP }) {
  const p = await readParams(searchParams);
  const hotels = await searchHotels({ city: p.city, stars: Number(p.stars) || undefined, sort: p.sort });
  const nights = isDate(p.checkin) && isDate(p.checkout) ? daysBetween(p.checkin, p.checkout) : 0;
  const guests = Math.min(15, Math.max(1, Number(p.guests) || 2)), rooms = Math.ceil(guests / 3);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  return (
    <main className="page">
      <h1 className="ph">Hotels</h1>
      <form className="sform" method="get">
        <label className="f"><span>Destination or hotel</span><input name="city" defaultValue={p.city} list="cities" placeholder="Goa, Jaipur…" autoComplete="off" /></label>
        <label className="f"><span>Check-in</span><input type="date" name="checkin" min={tomorrow} defaultValue={p.checkin} /></label>
        <label className="f"><span>Check-out</span><input type="date" name="checkout" min={p.checkin || tomorrow} defaultValue={p.checkout} /></label>
        <label className="f"><span>Guests</span><select name="guests" defaultValue={String(guests)}>{[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="f"><span>Stars</span><select name="stars" defaultValue={p.stars ?? ''}><option value="">Any</option><option value="3">3+</option><option value="4">4+</option><option value="5">5</option></select></label>
        <label className="f"><span>Sort</span><select name="sort" defaultValue={p.sort ?? ''}><option value="">Recommended</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="stars">Stars</option></select></label>
        <button className="btn btn-dark" type="submit">Search</button>
        <datalist id="cities">{Object.keys(CITIES).map(c => <option key={c} value={c} />)}</datalist>
      </form>
      {p.checkin && p.checkout && nights < 1 && <p className="err dark" role="alert">Check-out must be after check-in.</p>}
      <p className="muted" role="status">{hotels.length} {hotels.length === 1 ? 'hotel' : 'hotels'}{nights >= 1 ? ` · ${nights} ${nights === 1 ? 'night' : 'nights'}, ${rooms} ${rooms === 1 ? 'room' : 'rooms'}, ${guests} guests` : ''}</p>
      {hotels.length === 0 ? <div className="empty"><p>No hotels match. Try another city or fewer filters.</p><Link className="btn btn-dark inline" href="/hotels">Clear search</Link></div> : (
        <ul className="rlist">{hotels.map(h => {
          const total = nights >= 1 ? quoteHotel(h.price, nights, rooms).total : 0;
          return (
            <li key={h.slug} className="rcard">
              <div className="rimg" style={{ backgroundImage: `url('${img(h.img, 600, 70)}')` }} role="img" aria-label={h.name} />
              <div className="rbody">
                <div><h2>{h.name}</h2><p className="muted">{h.city}, {h.state} · <span className="stars sm" aria-label={`${h.stars} star`}>{'★'.repeat(h.stars)}</span></p>
                  <p className="chips2">{h.amenities.slice(0, 4).map(a => <span key={a}>{a}</span>)}</p></div>
                <div className="rprice">
                  <b>{inr(h.price)}</b><span className="muted"> per night</span>
                  {total > 0 && <div><b>{inr(total)}</b><span className="muted"> total with GST</span></div>}
                  <span className="muted small">GST {Math.round(hotelGstRate(h.price) * 100)}% extra{total > 0 ? ' (included above)' : ''}</span>
                  <Link className="btn btn-dark inline" href={`/hotels/${h.slug}${qs({ checkin: p.checkin, checkout: p.checkout, guests: p.guests })}`}>View and book</Link>
                </div>
              </div>
            </li>);
        })}</ul>)}
    </main>
  );
}
