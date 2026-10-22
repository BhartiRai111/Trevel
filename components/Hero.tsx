'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { img } from '@/lib/destinations';

const SLIDES = ['photo-1564507592333-c60657eea523', 'photo-1602216056096-3b40cc0c9944', 'photo-1512343879784-a960bf40e7f2', 'photo-1626015365107-2cfd4e8e3e19'];

type Field = { label: string; kind: 'text' | 'date' | 'select'; hint?: string; options?: string[] };
const TABS: Record<string, { label: string; go: string; live: boolean; fields: Field[] }> = {
  tours: { label: 'Tours', go: 'Search tours', live: true, fields: [
    { label: 'Where to?', kind: 'text', hint: 'Goa, Ladakh, Jaipur' },
    { label: 'When', kind: 'date' },
    { label: 'Travellers', kind: 'select', options: ['1 person', '2 people', '3–5 people', '6+ people'] }] },
  hotels: { label: 'Hotels', go: 'Search hotels', live: false, fields: [
    { label: 'Destination', kind: 'text', hint: 'City or resort' }, { label: 'Check-in', kind: 'date' }, { label: 'Check-out', kind: 'date' },
    { label: 'Guests', kind: 'select', options: ['1 guest', '2 guests', '3–4 guests', '5+ guests'] }] },
  flights: { label: 'Flights', go: 'Search flights', live: false, fields: [
    { label: 'From', kind: 'text', hint: 'Delhi' }, { label: 'To', kind: 'text', hint: 'Goa' }, { label: 'Depart', kind: 'date' },
    { label: 'Passengers', kind: 'select', options: ['1 adult', '2 adults', '3–5 people'] }] },
  cars: { label: 'Cars', go: 'Search cars', live: false, fields: [
    { label: 'Pick-up city', kind: 'text', hint: 'Jaipur' }, { label: 'Pick-up date', kind: 'date' }, { label: 'Return date', kind: 'date' },
    { label: 'Car type', kind: 'select', options: ['Any', 'Hatchback', 'SUV', 'Tempo Traveller'] }] }
};

export default function Hero() {
  const router = useRouter();
  const [tab, setTab] = useState('tours');
  const [slide, setSlide] = useState(0);
  const [video, setVideo] = useState(true);
  const [note, setNote] = useState('');
  const t = TABS[tab];

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!t.live) { setNote(`${t.label} booking is coming soon. Tours are open now.`); return; }
    const q = String(new FormData(e.currentTarget).get('f0') ?? '').trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
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
        <p className="lead">Tours with the final price, GST included, shown before you book.</p>

        <div className="glass">
          <div className="tabs" role="tablist" aria-label="Booking type">
            {Object.entries(TABS).map(([k, v]) => (
              <button key={k} className={`tab${k === tab ? ' on' : ''}`} role="tab" aria-selected={k === tab} type="button" onClick={() => { setTab(k); setNote(''); }}>{v.label}</button>
            ))}
          </div>
          <form className={`search n${t.fields.length}`} onSubmit={submit} key={tab}>
            {t.fields.map((f, i) => (
              <label key={f.label}><span>{f.label}</span>
                {f.kind === 'select'
                  ? <select name={`f${i}`} aria-label={f.label} defaultValue={f.options![1] ?? f.options![0]}>{f.options!.map(o => <option key={o}>{o}</option>)}</select>
                  : <input name={`f${i}`} type={f.kind} placeholder={f.hint} aria-label={f.label} />}
              </label>
            ))}
            <button className="btn btn-gold" type="submit">{t.go}</button>
          </form>
          {note && <p className="note" role="status">{note}</p>}
        </div>
      </div>

      <div className="stats">
        <div><b>12</b><span>Destinations</span></div>
        <div><b>GST</b><span>Shown upfront</span></div>
        <div><b>Free</b><span>Online cancellation</span></div>
      </div>
    </section>
  );
}
