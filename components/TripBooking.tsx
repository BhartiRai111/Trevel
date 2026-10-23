'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { GST_RATE, inr, quote } from '@/lib/pricing';
import { bg } from '@/lib/destinations';
import { useSite } from './SiteProvider';

type Pkg = { id: string; name: string; text: string; includes: string[]; price: number };
type Props = { slug: string; name: string; state: string; days: number; img: string; packages: Pkg[]; initial: { pkg: string; date: string; n: number } };

/** The booking page for a tour: package, dates, travellers, details and the full price. It sends the request to the normal booking API. */
export default function TripBooking({ slug, name, state, days, img: image, packages, initial }: Props) {
  const { user, openAuth } = useSite();
  const [pkgId, setPkgId] = useState(initial.pkg);
  const [date, setDate] = useState(initial.date);
  const [n, setN] = useState(initial.n);
  const [lead, setLead] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string; total: number } | null>(null);
  const pkg = packages.find(p => p.id === pkgId) ?? packages[0];
  const q = quote(pkg.price, n);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  useEffect(() => { if (user) { setLead(l => l || user.name); setPhone(p => p || user.phone); } }, [user]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) { openAuth('login'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'tour', slug, packageId: pkg.id, date, travellers: n, name: lead, phone, notes }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Could not send your request.'); return; }
      setDone(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch { setErr('Could not reach the server. Please try again.'); }
    finally { setBusy(false); }
  }

  if (done) return (
    <section className="done" aria-live="polite">
      <h2>Booking request sent ✓</h2>
      <p>Your reference is <b className="ref">{done.ref}</b>. We have also sent you an email.</p>
      <dl className="price">
        <div><dt>Trip</dt><dd>{name} · {pkg.name} package</dd></div>
        <div><dt>Travel date</dt><dd>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
        <div><dt>Travellers</dt><dd>{n}</dd></div>
        <div className="tot"><dt>Total (GST included)</dt><dd>{inr(done.total)}</dd></div>
      </dl>
      <h3>What happens next</h3>
      <ol className="steps2"><li>We check availability for your dates.</li><li>You get an email when your trip is confirmed.</li><li>You pay from My trips once it is confirmed. Nothing has been charged yet.</li></ol>
      <p><Link className="btn btn-dark inline" href="/trips">View my trips</Link> <Link className="btn btn-ghost-dark inline" href="/search">Explore more trips</Link></p>
    </section>
  );

  return (
    <form className="bookgrid" onSubmit={submit}>
      <div className="bcol">
        <fieldset className="bstep"><legend><span className="n">1</span> Choose your package</legend>
          <div className="pkgs" role="radiogroup" aria-label="Package">
            {packages.map(k => (
              <label key={k.id} className={`pkg${k.id === pkg.id ? ' on' : ''}`}>
                <input type="radio" name="package" value={k.id} checked={k.id === pkg.id} onChange={() => setPkgId(k.id)} />
                <span className="pk-h"><b>{k.name}</b><span className="pk-p">{inr(k.price)}<small> per person</small></span></span>
                <span className="muted small">{k.text}</span>
                <ul className="tick sm">{k.includes.map(i => <li key={i}>{i}</li>)}</ul>
              </label>))}
          </div>
        </fieldset>

        <fieldset className="bstep"><legend><span className="n">2</span> Dates and travellers</legend>
          <div className="two">
            <label className="f"><span>Travel date</span><input type="date" min={tomorrow} value={date} onChange={e => setDate(e.target.value)} required /></label>
            <div className="f"><span>Travellers</span>
              <div className="step"><button type="button" aria-label="Fewer travellers" onClick={() => setN(v => Math.max(1, v - 1))}>−</button><output>{n}</output><button type="button" aria-label="More travellers" onClick={() => setN(v => Math.min(20, v + 1))}>+</button></div></div>
          </div>
          <p className="muted small">The trip is {days} days from your start date.</p>
        </fieldset>

        <fieldset className="bstep"><legend><span className="n">3</span> Traveller details</legend>
          <div className="two">
            <label className="f"><span>Lead traveller name</span><input value={lead} onChange={e => setLead(e.target.value)} autoComplete="name" required /></label>
            <label className="f"><span>Mobile number</span><input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="10-digit number" required /></label>
          </div>
          <label className="f"><span>Special requests (optional)</span><textarea rows={3} maxLength={300} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Food preferences, accessibility needs, celebrations…" /></label>
        </fieldset>
      </div>

      <aside className="panel bsum" aria-label="Price summary">
        <div className="bs-top" style={{ backgroundImage: bg(image, 500, 70) }} role="img" aria-label={name}><span><b>{name}</b><br />{state} · {days} days</span></div>
        <h2>Price summary</h2>
        <p className="muted small">{pkg.name} package{date ? ` · ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
        <dl className="price">
          <div><dt>{inr(pkg.price)} × {n} {n === 1 ? 'person' : 'people'}</dt><dd>{inr(q.base)}</dd></div>
          <div><dt>GST ({GST_RATE * 100}%)</dt><dd>{inr(q.gst)}</dd></div>
          <div><dt>Booking fee</dt><dd>₹0</dd></div>
          <div className="tot"><dt>Total</dt><dd>{inr(q.total)}</dd></div>
        </dl>
        {err && <p className="err dark" role="alert">{err}</p>}
        {!user && <p className="muted small">You will be asked to log in or sign up before the request is sent.</p>}
        <button className="btn btn-dark" type="submit" disabled={busy}>{busy ? 'Sending…' : user ? 'Send booking request' : 'Log in to book'}</button>
        <p className="small muted">No payment now. You can cancel from My trips until it is paid.</p>
      </aside>
    </form>
  );
}
