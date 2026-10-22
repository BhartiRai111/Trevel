'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { HERO_SLIDES, unsplash } from '@/lib/places';
import { useSite } from './SiteProvider';

type Field = { label: string; kind: 'text' | 'date' | 'select'; hint?: string; options?: string[] };
const TABS: Record<string, { label: string; go: string; fields: Field[] }> = {
  tours: { label: 'Tours', go: 'Search tours', fields: [
    { label: 'Where to?', kind: 'text', hint: 'Hill Track, Bali, Swiss Alps' },
    { label: 'When', kind: 'date' },
    { label: 'Travellers', kind: 'select', options: ['1 person', '2 people', '3–5 people', '6+ people'] }] },
  hotels: { label: 'Hotels', go: 'Search hotels', fields: [
    { label: 'Destination', kind: 'text', hint: 'City or resort' },
    { label: 'Check-in', kind: 'date' }, { label: 'Check-out', kind: 'date' },
    { label: 'Guests', kind: 'select', options: ['1 guest', '2 guests', '3–4 guests', '5+ guests'] }] },
  flights: { label: 'Flights', go: 'Search flights', fields: [
    { label: 'From', kind: 'text', hint: 'Delhi' }, { label: 'To', kind: 'text', hint: 'Bali' },
    { label: 'Depart', kind: 'date' },
    { label: 'Passengers', kind: 'select', options: ['1 adult', '2 adults', '3–5 people'] }] },
  cars: { label: 'Cars', go: 'Search cars', fields: [
    { label: 'Pick-up city', kind: 'text', hint: 'Honolulu' },
    { label: 'Pick-up date', kind: 'date' }, { label: 'Return date', kind: 'date' },
    { label: 'Car type', kind: 'select', options: ['Any', 'Hatchback', 'SUV', 'Jeep'] }] }
};

export default function Hero() {
  const { setQuery } = useSite();
  const [tab, setTab] = useState('tours');
  const [slide, setSlide] = useState(0);
  const [video, setVideo] = useState(true);
  const t = TABS[tab];

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const first = new FormData(e.currentTarget).get('f0');
    setQuery(tab === 'tours' ? String(first ?? '') : '');
    document.getElementById('places')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="hero photo">
      <div className="bg" aria-hidden="true">
        {HERO_SLIDES.map((id, i) => (
          <div key={id} className={`slide${i === slide ? ' on' : ''}`} style={{ backgroundImage: `url('${unsplash(id, 2000, 80)}')` }} />
        ))}
        {/* Optional: put a travel clip at public/hero.mp4 and it plays over the photos */}
        {video && (
          <video autoPlay muted loop playsInline preload="metadata" onError={() => setVideo(false)} onCanPlay={e => e.currentTarget.classList.add('ready')}>
            <source src="/hero.mp4" type="video/mp4" onError={() => setVideo(false)} />
          </video>
        )}
      </div>

      <div className="hero-in">
        <p className="eyebrow">Explore · Discover · Roam</p>
        <h1>Everything for<br />your trip.</h1>
        <p className="lead">Search tours, hotels, flights and cars in one place.</p>

        <div className="glass">
          <div className="tabs" role="tablist" aria-label="Booking type">
            {Object.entries(TABS).map(([k, v]) => (
              <button key={k} className={`tab${k === tab ? ' on' : ''}`} role="tab" aria-selected={k === tab} type="button" onClick={() => setTab(k)}>
                {v.label}
              </button>
            ))}
          </div>
          <form className={`search n${t.fields.length}`} onSubmit={submit} key={tab}>
            {t.fields.map((f, i) => (
              <label key={f.label}>
                <span>{f.label}</span>
                {f.kind === 'select'
                  ? <select name={`f${i}`} aria-label={f.label} defaultValue={f.options![1] ?? f.options![0]}>{f.options!.map(o => <option key={o}>{o}</option>)}</select>
                  : <input name={`f${i}`} type={f.kind} placeholder={f.hint} aria-label={f.label} />}
              </label>
            ))}
            <button className="btn btn-gold" type="submit">{t.go}</button>
          </form>
        </div>
      </div>

      <div className="stats">
        <div><b>120+</b><span>Destinations</span></div>
        <div><b>48K</b><span>Happy travellers</span></div>
        <div><b>4.9★</b><span>Average rating</span></div>
      </div>
    </section>
  );
}
