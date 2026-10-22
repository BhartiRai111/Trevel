import Link from 'next/link';
import { img } from '@/lib/destinations';
import { allDestinations, getDestination } from '@/lib/repo';
import { inr } from '@/lib/pricing';

export async function Featured() {
  const d = (await getDestination('ladakh-leh')) ?? (await allDestinations(true))[0];
  if (!d) return null;
  return (
    <section className="featured photo" id="featured" style={{ ['--img' as string]: `url('${img(d.img, 2000, 80)}')` }}>
      <div className="feat-in">
        <p className="eyebrow">Featured trip</p>
        <h2>{d.name}</h2>
        <p>{d.about}</p>
        <p><b>{d.days} days</b> · from <b>{inr(d.price)}</b> per person · best time {d.bestTime}</p>
        <div className="actions">
          <Link className="btn btn-gold" href={`/destinations/${d.slug}`}>See the trip</Link>
          <Link className="btn btn-ghost" href="/search">All destinations</Link>
        </div>
      </div>
    </section>
  );
}

const WHY = [
  ['₹', 'Final price upfront', 'Base price, GST and total are shown before you send a request. No surprise at the end.'],
  ['♡', 'Save and compare', 'Save places you like and compare days, price and best season side by side.'],
  ['🗂', 'Everything in one place', 'Your saved trips and booking requests live in one My trips page.'],
  ['✕', 'Cancel online', 'Cancel a request from your account yourself, without chasing anyone.']
];

export function Why() {
  return (
    <section className="section" id="why">
      <div className="head"><p className="eyebrow dark">Why Roamora</p><h2>Travel booking without the guesswork</h2></div>
      <div className="why">{WHY.map(([ic, h, p]) => <article key={h}><div className="ic">{ic}</div><h3>{h}</h3><p>{p}</p></article>)}</div>
    </section>
  );
}

export function How() {
  const steps = [['Pick a place', 'Search or browse destinations across India.'], ['Choose date and travellers', 'The total, with GST, updates as you change it.'], ['Send your request', 'We confirm your booking and share the payment details.']];
  return (
    <section className="section alt" id="how">
      <div className="head"><p className="eyebrow dark">How it works</p><h2>Three steps to your trip</h2></div>
      <ol className="steps">{steps.map(([h, p], i) => <li key={h}><span className="n">{i + 1}</span><h3>{h}</h3><p>{p}</p></li>)}</ol>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <Link className="logo" href="/">Roamora</Link>
      <p>© 2026 Roamora. Prices in Indian rupees (₹).</p>
    </footer>
  );
}
