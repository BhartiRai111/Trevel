'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { GST_RATE, inr, quote } from '@/lib/pricing';
import { useSite } from './SiteProvider';

export default function BookingPanel({ slug, name, price, days }: { slug: string; name: string; price: number; days: number }) {
  const { user, openAuth, saved, toggleSave } = useSite();
  const [n, setN] = useState(2);
  const [date, setDate] = useState('');
  const [lead, setLead] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string; total: number } | null>(null);
  const q = quote(price, n);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  useEffect(() => { if (user) { setLead(l => l || user.name); setPhone(p => p || user.phone); } }, [user]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) { openAuth('login'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, date, travellers: n, name: lead, phone }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Could not send your request.'); return; }
      setDone(data);
    } catch { setErr('Could not reach the server. Please try again.'); }
    finally { setBusy(false); }
  }

  if (done) return (
    <aside className="panel" aria-live="polite">
      <h2>Request sent ✓</h2>
      <p>Your reference is <b className="ref">{done.ref}</b>.</p>
      <p>Total shown: <b>{inr(done.total)}</b> (GST included). We will confirm your booking and share the payment details. No payment has been taken yet.</p>
      <a className="btn btn-dark" href="/trips">View my trips</a>
    </aside>
  );

  const on = saved.has(slug);
  return (
    <aside className="panel">
      <div className="ptop"><div><span className="from">From</span> <b className="big">{inr(price)}</b> <span className="from">per person</span></div>
        <button type="button" className={`heart ghost${on ? ' on' : ''}`} aria-pressed={on} aria-label={on ? 'Remove from saved' : 'Save this trip'} onClick={() => toggleSave(slug)}>{on ? '♥' : '♡'}</button></div>
      <form onSubmit={submit}>
        <label className="f"><span>Travel date</span><input type="date" min={tomorrow} value={date} onChange={e => setDate(e.target.value)} required /></label>
        <div className="f"><span>Travellers</span>
          <div className="step"><button type="button" aria-label="Fewer travellers" onClick={() => setN(v => Math.max(1, v - 1))}>−</button><output>{n}</output><button type="button" aria-label="More travellers" onClick={() => setN(v => Math.min(20, v + 1))}>+</button></div></div>
        <label className="f"><span>Lead traveller name</span><input value={lead} onChange={e => setLead(e.target.value)} autoComplete="name" required /></label>
        <label className="f"><span>Mobile number</span><input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="10-digit number" required /></label>
        <dl className="price">
          <div><dt>{inr(price)} × {n} {n === 1 ? 'person' : 'people'}</dt><dd>{inr(q.base)}</dd></div>
          <div><dt>GST ({GST_RATE * 100}%)</dt><dd>{inr(q.gst)}</dd></div>
          <div><dt>Booking fee</dt><dd>₹0</dd></div>
          <div className="tot"><dt>Total ({days} days)</dt><dd>{inr(q.total)}</dd></div>
        </dl>
        {err && <p className="err dark" role="alert">{err}</p>}
        <button className="btn btn-dark" type="submit" disabled={busy}>{busy ? 'Sending…' : user ? 'Send booking request' : 'Log in to book'}</button>
        <p className="small muted">No payment now. You can cancel from My trips.</p>
      </form>
    </aside>
  );
}
