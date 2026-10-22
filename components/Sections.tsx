'use client';
import { useState, type FormEvent } from 'react';
import { unsplash } from '@/lib/places';

const WHY = [
  ['🧭', 'Local guides', 'Every trip is led by someone who lives there and knows the quiet spots.'],
  ['💳', 'Simple pricing', 'One price, no hidden fees. Free cancellation up to 48 hours before.'],
  ['👥', 'Travel together', 'Plan with friends, split the cost and keep the whole itinerary in one place.'],
  ['🌿', 'Responsible', 'Small groups and eco-certified stays that give back to the place you visit.']
];
const QUOTES = [
  ['“The sunrise ridge walk was the best morning of my year. Booking took two minutes.”', 'Aisha K.', 'Hill Track'],
  ['“Our group of eight planned everything in one place. No more endless chats.”', 'Rohan M.', 'Bali'],
  ['“Honest prices and a guide who knew every hidden beach. Already booked again.”', 'Lena S.', 'Santorini']
];

export function Why() {
  return (
    <section className="section" id="why">
      <div className="head"><p className="eyebrow dark">Why Roamora</p><h2>Trips that feel effortless</h2></div>
      <div className="why">
        {WHY.map(([ic, h, p]) => (
          <article key={h}><div className="ic">{ic}</div><h3>{h}</h3><p>{p}</p></article>
        ))}
      </div>
    </section>
  );
}

export function Stories() {
  return (
    <section className="section alt" id="stories">
      <div className="head"><p className="eyebrow dark">Stories</p><h2>Loved by travellers</h2></div>
      <div className="quotes">
        {QUOTES.map(([q, who, where]) => (
          <figure key={who}><blockquote>{q}</blockquote><figcaption><b>{who}</b> · {where}</figcaption></figure>
        ))}
      </div>
    </section>
  );
}

export function Cta() {
  const [done, setDone] = useState(false);
  const onSubmit = (e: FormEvent) => { e.preventDefault(); setDone(true); };
  return (
    <section className="cta photo" style={{ ['--img' as string]: `url('${unsplash('photo-1469854523086-cc02fe5d8800', 2000, 80)}')` }}>
      <h2>Your next adventure starts here.</h2>
      <p>Join Roamora and get 10% off your first trip.</p>
      <form className="news" onSubmit={onSubmit}>
        <input type="email" placeholder="Your email" aria-label="Email" required />
        <button className="btn btn-gold" type="submit">Get my 10%</button>
      </form>
      {done && <p className="ok">Thanks! Check your inbox for your code.</p>}
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <a className="logo" href="#top">Roamora</a>
      <p>© 2026 Roamora. Travel the world, your way.</p>
    </footer>
  );
}
