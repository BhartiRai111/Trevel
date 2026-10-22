'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { daysBetween, hotelGstRate, inr, quoteCar, quoteFlight, quoteHotel, weekday } from '@/lib/pricing';
import { DAY_NAMES } from '@/lib/catalogMeta';
import { useSite } from './SiteProvider';

type Props = {
  kind: 'hotel' | 'flight' | 'car';
  slug: string; title: string; price: number;
  /** flights: days of the week it operates (0 = Sunday) */ flightDays?: number[];
  /** cars: number of seats */ seats?: number;
  initial: { date?: string; end?: string; n?: number };
};

const Step = ({ label, value, set, min, max }: { label: string; value: number; set: (n: number) => void; min: number; max: number }) => (
  <div className="f"><span>{label}</span>
    <div className="step"><button type="button" aria-label={`Fewer ${label.toLowerCase()}`} onClick={() => set(Math.max(min, value - 1))}>−</button><output>{value}</output><button type="button" aria-label={`More ${label.toLowerCase()}`} onClick={() => set(Math.min(max, value + 1))}>+</button></div></div>
);

/** Booking box for hotels, flights and cars. Shows the full price with GST before the request is sent. */
export default function BookPanel({ kind, slug, title, price, flightDays, seats, initial }: Props) {
  const { user, openAuth } = useSite();
  const [date, setDate] = useState(initial.date ?? '');
  const [end, setEnd] = useState(initial.end ?? '');
  const [n, setN] = useState(initial.n ?? (kind === 'car' ? 2 : 2));
  const [rooms, setRooms] = useState(Math.max(1, Math.ceil((initial.n ?? 2) / 3)));
  const [lead, setLead] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string; total: number } | null>(null);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  useEffect(() => { if (user) { setLead(l => l || user.name); setPhone(p => p || user.phone); } }, [user]);

  const span = date && end ? daysBetween(date, end) : 0;
  const nights = kind === 'hotel' ? span : 0;
  const days = kind === 'car' ? span + 1 : 0;
  const maxGuests = rooms * 3;
  const flightOk = kind !== 'flight' || !date || !flightDays || flightDays.includes(weekday(date));

  let lines: [string, string][] = [], quoted: { base: number; gst: number; total: number; rate: number } | null = null, ready = false;
  if (kind === 'hotel') { ready = nights >= 1 && nights <= 30; if (ready) { quoted = quoteHotel(price, nights, rooms); lines = [[`${inr(price)} × ${nights} ${nights === 1 ? 'night' : 'nights'} × ${rooms} ${rooms === 1 ? 'room' : 'rooms'}`, inr(quoted.base)]]; } }
  if (kind === 'flight') { ready = !!date && flightOk; if (ready) { quoted = quoteFlight(price, n); lines = [[`${inr(price)} × ${n} ${n === 1 ? 'passenger' : 'passengers'}`, inr(quoted.base)]]; } }
  if (kind === 'car') { ready = !!date && !!end && days >= 1 && days <= 30; if (ready) { quoted = quoteCar(price, days); lines = [[`${inr(price)} × ${days} ${days === 1 ? 'day' : 'days'}`, inr(quoted.base)]]; } }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) { openAuth('login'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, slug, date, endDate: end || undefined, travellers: n, rooms, name: lead, phone }) });
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
      <p>Total shown: <b>{inr(done.total)}</b> (GST included). We will confirm availability and share the payment details. No payment has been taken yet.</p>
      <a className="btn btn-dark" href="/trips">View my trips</a>
    </aside>
  );

  const unit = kind === 'hotel' ? 'per room per night' : kind === 'flight' ? 'per person' : 'per day';
  return (
    <aside className="panel">
      <div className="ptop"><div><span className="from">From</span> <b className="big">{inr(price)}</b> <span className="from">{unit}</span></div></div>
      <form onSubmit={submit}>
        {kind === 'hotel' && <>
          <label className="f"><span>Check-in</span><input type="date" min={tomorrow} value={date} onChange={e => setDate(e.target.value)} required /></label>
          <label className="f"><span>Check-out</span><input type="date" min={date || tomorrow} value={end} onChange={e => setEnd(e.target.value)} required /></label>
          <Step label="Rooms" value={rooms} set={v => { setRooms(v); setN(x => Math.min(x, v * 3)); }} min={1} max={5} />
          <Step label="Guests" value={n} set={v => { setN(v); setRooms(r => Math.max(r, Math.ceil(v / 3))); }} min={1} max={Math.min(15, maxGuests + 3)} />
        </>}
        {kind === 'flight' && <>
          <label className="f"><span>Travel date</span><input type="date" min={tomorrow} value={date} onChange={e => setDate(e.target.value)} required /></label>
          {!flightOk && <p className="err dark" role="alert">This flight runs on {flightDays!.map(d => DAY_NAMES[d]).join(', ')}. Pick one of those days.</p>}
          <Step label="Passengers" value={n} set={setN} min={1} max={9} />
        </>}
        {kind === 'car' && <>
          <label className="f"><span>Pick-up date</span><input type="date" min={tomorrow} value={date} onChange={e => setDate(e.target.value)} required /></label>
          <label className="f"><span>Return date</span><input type="date" min={date || tomorrow} value={end} onChange={e => setEnd(e.target.value)} required /></label>
          <Step label="Passengers" value={n} set={setN} min={1} max={seats ?? 4} />
        </>}
        <label className="f"><span>Lead traveller name</span><input value={lead} onChange={e => setLead(e.target.value)} autoComplete="name" required /></label>
        <label className="f"><span>Mobile number</span><input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="10-digit number" required /></label>
        {quoted ? (
          <dl className="price">
            {lines.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}
            <div><dt>GST ({Math.round(quoted.rate * 100)}%{kind === 'hotel' && quoted.rate === 0 ? ', nil for rooms up to ₹1,000' : ''})</dt><dd>{inr(quoted.gst)}</dd></div>
            <div><dt>Booking fee</dt><dd>₹0</dd></div>
            <div className="tot"><dt>Total</dt><dd>{inr(quoted.total)}</dd></div>
          </dl>
        ) : <p className="muted">Choose your dates to see the total price with GST.</p>}
        {kind === 'hotel' && <p className="muted small">GST for hotels depends on the room rate: {Math.round(hotelGstRate(price) * 100)}% for this room.</p>}
        {err && <p className="err dark" role="alert">{err}</p>}
        <button className="btn btn-dark" type="submit" disabled={busy || (!!user && !ready)}>{busy ? 'Sending…' : user ? 'Send booking request' : 'Log in to book'}</button>
        <p className="small muted">No payment now. You can cancel from My trips.</p>
      </form>
    </aside>
  );
}
