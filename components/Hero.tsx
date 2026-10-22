'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { img } from '@/lib/destinations';
import { CAR_TYPES, CITIES } from '@/lib/catalogMeta';

const SLIDES = ['photo-1564507592333-c60657eea523', 'photo-1602216056096-3b40cc0c9944', 'photo-1512343879784-a960bf40e7f2', 'photo-1626015365107-2cfd4e8e3e19'];

type Field = { name: string; label: string; kind: 'text' | 'date' | 'select'; hint?: string; cities?: boolean; options?: [string, string][] };
const people = (word: string): [string, string][] => [1, 2, 3, 4, 5, 6].map(n => [String(n), `${n} ${word}${n > 1 ? 's' : ''}`]);

const TABS: Record<string, { label: string; go: string; path: string; fields: Field[] }> = {
  tours: { label: 'Tours', go: 'Search tours', path: '/search', fields: [
    { name: 'q', label: 'Where to?', kind: 'text', hint: 'Goa, Ladakh, Jaipur' }, { name: 'date', label: 'When', kind: 'date' },
    { name: 'pax', label: 'Travellers', kind: 'select', options: people('person').map(([v, l]) => [v, l.replace('persons', 'people')]) }] },
  hotels: { label: 'Hotels', go: 'Search hotels', path: '/hotels', fields: [
    { name: 'city', label: 'Destination', kind: 'text', hint: 'City or hotel', cities: true }, { name: 'checkin', label: 'Check-in', kind: 'date' }, { name: 'checkout', label: 'Check-out', kind: 'date' },
    { name: 'guests', label: 'Guests', kind: 'select', options: people('guest') }] },
  flights: { label: 'Flights', go: 'Search flights', path: '/flights', fields: [
    { name: 'from', label: 'From', kind: 'text', hint: 'Delhi', cities: true }, { name: 'to', label: 'To', kind: 'text', hint: 'Goa', cities: true }, { name: 'date', label: 'Depart', kind: 'date' },
    { name: 'pax', label: 'Passengers', kind: 'select', options: people('passenger') }] },
  cars: { label: 'Cars', go: 'Search cars', path: '/cars', fields: [
    { name: 'city', label: 'Pick-up city', kind: 'text', hint: 'Jaipur', cities: true }, { name: 'from', label: 'Pick-up date', kind: 'date' }, { name: 'to', label: 'Return date', kind: 'date' },
    { name: 'type', label: 'Car type', kind: 'select', options: [['', 'Any'], ...CAR_TYPES.map(t => [t, t] as [string, string])] }] }
};

export default function Hero() {
  const router = useRouter();
  const [tab, setTab] = useState('tours');
  const [slide, setSlide] = useState(0);
  const [video, setVideo] = useState(true);
  const [note, setNote] = useState('');
  const t = TABS[tab];
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? '').trim();
    if (tab === 'hotels' && get('checkin') && get('checkout') && get('checkout') <= get('checkin')) { setNote('Check-out must be after check-in.'); return; }
    if (tab === 'flights' && get('from') && get('from').toLowerCase() === get('to').toLowerCase()) { setNote('Choose two different cities.'); return; }
    if (tab === 'cars' && get('from') && get('to') && get('to') < get('from')) { setNote('Return date cannot be before pick-up.'); return; }
    const p = new URLSearchParams();
    t.fields.forEach(x => { const v = get(x.name); if (v) p.set(x.name, v); });
    router.push(p.size ? `${t.path}?${p}` : t.path);
  }

  return (
    <section className="hero photo">
      <div className="bg" aria-hidden="true">
        {SLIDES.map((id, i) => <div key={id} className={`slide${i === slide ? ' on' : ''}`} style={{ backgroundImage: `url('${img(id, 2000, 80)}')` }} />)}
        {/* Optional: put a travel clip at public/hero.mp4 and it plays over the photos */}
        {video && (
          <video autoPlay muted loop playsInline preload="metadata" onError={() => setVideo(false)} onCanPlay={e => e.currentTarget.classList.add('ready')}>
            <source src="/hero.mp4" type="video/mp4" onError={() => setVideo(false)} />
          </video>
        )}
      </div>

      <div className="hero-in">
        <p className="eyebrow">Incredible India</p>
        <h1>Plan your next<br />Indian trip.</h1>
        <p className="lead">Tours, hotels, flights and cars, with the final price and GST shown before you book.</p>

        <div className="glass">
          <div className="tabs" role="tablist" aria-label="Booking type">
            {Object.entries(TABS).map(([k, v]) => (
              <button key={k} className={`tab${k === tab ? ' on' : ''}`} role="tab" aria-selected={k === tab} type="button" onClick={() => { setTab(k); setNote(''); }}>{v.label}</button>
            ))}
          </div>
          <form className={`search n${t.fields.length}`} onSubmit={submit} key={tab}>
            {t.fields.map(f => (
              <label key={f.name}><span>{f.label}</span>
                {f.kind === 'select'
                  ? <select name={f.name} aria-label={f.label} defaultValue={f.options![1]?.[0] ?? f.options![0][0]}>{f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  : <input name={f.name} type={f.kind} placeholder={f.hint} aria-label={f.label} list={f.cities ? 'city-list' : undefined} min={f.kind === 'date' ? tomorrow : undefined} autoComplete="off" />}
              </label>
            ))}
            <button className="btn btn-gold" type="submit">{t.go}</button>
          </form>
          {note && <p className="note" role="status">{note}</p>}
          <datalist id="city-list">{Object.keys(CITIES).map(c => <option key={c} value={c} />)}</datalist>
        </div>
      </div>

      <div className="stats">
        <div><b>4</b><span>Ways to book</span></div>
        <div><b>GST</b><span>Shown upfront</span></div>
        <div><b>Free</b><span>Online cancellation</span></div>
      </div>
    </section>
  );
}
