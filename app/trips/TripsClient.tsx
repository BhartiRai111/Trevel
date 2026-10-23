'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { inr } from '@/lib/pricing';
import DestinationCard from '@/components/DestinationCard';
import { useSite } from '@/components/SiteProvider';
import Shell from '@/components/Shell';

type B = { id: number; ref: string; kind: string; href: string; slug: string; name: string; travel_date: string; end_date: string | null; travellers: number; total: number; status: string; share_token: string | null; can_review: boolean; reviewed: boolean };
const KIND: Record<string, string> = { tour: 'Tour', hotel: 'Hotel', flight: 'Flight', car: 'Car' };
const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const STATUS: Record<string, string> = { requested: 'Requested', confirmed: 'Confirmed', paid: 'Paid', cancelled: 'Cancelled' };

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } } }

function loadRazorpay() {
  return new Promise<boolean>(res => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export default function TripsClient() {
  const { user, ready, saved, dests, openAuth } = useSite();
  const [bookings, setBookings] = useState<B[] | null>(null);
  const [payEnabled, setPayEnabled] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [links, setLinks] = useState<Record<number, string>>({});
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [stars, setStars] = useState(5);

  const load = useCallback(async () => {
    const res = await fetch('/api/bookings');
    if (res.ok) { const d = await res.json(); setBookings(d.bookings); setPayEnabled(d.payEnabled); }
  }, []);
  useEffect(() => { if (user) load(); else setBookings(null); }, [user, load]);

  const say = (t: string, ok = false) => setMsg({ t, ok });

  async function cancel(id: number) {
    say('');
    const res = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
    if (!res.ok) say((await res.json()).error || 'Could not cancel.');
    load();
  }

  async function pay(b: B) {
    say('');
    const res = await fetch('/api/payments/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: b.id }) });
    const o = await res.json();
    if (!res.ok) { say(o.error || 'Could not start payment.'); return; }
    if (!(await loadRazorpay()) || !window.Razorpay) { say('Could not load the payment window. Check your internet and try again.'); return; }
    const rzp = new window.Razorpay({
      key: o.keyId, amount: o.amount, currency: 'INR', name: 'Roamora', description: `${b.name} (${o.ref})`, order_id: o.orderId,
      prefill: { name: o.name, email: o.email, contact: o.phone }, theme: { color: '#0f8f86' },
      handler: async (r: RzpResponse) => {
        const v = await fetch('/api/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) });
        say(v.ok ? 'Payment received. Your trip is confirmed and paid.' : (await v.json()).error, v.ok);
        load();
      }
    });
    rzp.on('payment.failed', () => say('Payment failed. You were not charged. Please try again.'));
    rzp.open();
  }

  async function share(b: B) {
    const res = await fetch('/api/bookings/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id }) });
    const d = await res.json();
    if (!res.ok) { say(d.error || 'Could not create the link.'); return; }
    const url = `${location.origin}/share/${d.token}`;
    setLinks(l => ({ ...l, [b.id]: url }));
    try { await navigator.clipboard.writeText(url); say('Link copied. Anyone with the link can see this trip plan (no phone, email or price).', true); }
    catch { say('Copy the link shown under the trip.', true); }
    load();
  }

  async function unshare(b: B) {
    await fetch(`/api/bookings/share?id=${b.id}`, { method: 'DELETE' });
    setLinks(l => { const n = { ...l }; delete n[b.id]; return n; });
    say('Sharing turned off. The old link no longer works.', true);
    load();
  }

  async function review(e: FormEvent<HTMLFormElement>, b: B) {
    e.preventDefault();
    const text = String(new FormData(e.currentTarget).get('text') ?? '');
    const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: b.id, rating: stars, text }) });
    const d = await res.json();
    if (!res.ok) { say(d.error || 'Could not save the review.'); return; }
    say('Thanks! Your review is now on the destination page.', true);
    setReviewing(null); load();
  }

  if (!ready) return <Shell title="My trips"><p>Loading…</p></Shell>;
  if (!user) return (
    <Shell title="My trips">
      <div className="empty"><p>Log in to see your saved places and booking requests.</p><button className="btn btn-dark inline" type="button" onClick={() => openAuth('login')}>Log in</button></div></Shell>
  );

  const savedList = dests.filter(d => saved.has(d.slug));
  return (
    <Shell title="My trips">
      <h2 className="sh">Bookings</h2>
      {msg && msg.t && <p className={`err dark${msg.ok ? ' okmsg' : ''}`} role="status">{msg.t}</p>}
      {bookings === null ? <p>Loading…</p> : bookings.length === 0
        ? <div className="empty"><p>No bookings yet.</p><Link className="btn btn-dark inline" href="/search">Find a trip</Link></div>
        : <ul className="bks">{bookings.map(b => (
          <li key={b.id} className="bk">
            <div className="bk-top">
              <div><Link href={b.href}><b>{b.name}</b></Link> <span className="tag2">{KIND[b.kind] ?? 'Tour'}</span><div className="muted">{b.ref} · {fmt(b.travel_date)}{b.end_date ? ` to ${fmt(b.end_date)}` : ''} · {b.travellers} {b.kind === 'flight' ? (b.travellers === 1 ? 'passenger' : 'passengers') : b.kind === 'hotel' ? (b.travellers === 1 ? 'guest' : 'guests') : (b.travellers === 1 ? 'person' : 'people')}</div></div>
              <div className="bk-r"><b>{inr(b.total)}</b><span className={`st ${b.status}`}>{STATUS[b.status] ?? b.status}</span></div>
            </div>
            {b.status === 'requested' && <p className="muted">We will check availability and confirm. You can pay after that.</p>}
            {b.status === 'confirmed' && !payEnabled && <p className="muted">Confirmed. We will share the payment details with you.</p>}
            <div className="bk-act">
              {b.status === 'confirmed' && payEnabled && <button className="btn btn-dark inline" type="button" onClick={() => pay(b)}>Pay {inr(b.total)}</button>}
              {b.kind === 'tour' && b.status !== 'cancelled' && (b.share_token || links[b.id]
                ? <><button className="linkbtn" type="button" onClick={() => share(b)}>Copy share link</button><button className="linkbtn" type="button" onClick={() => unshare(b)}>Stop sharing</button></>
                : <button className="linkbtn" type="button" onClick={() => share(b)}>Share trip plan</button>)}
              {b.can_review && <button className="linkbtn" type="button" onClick={() => setReviewing(reviewing === b.id ? null : b.id)}>Write a review</button>}
              {b.reviewed && <span className="muted">Reviewed ✓</span>}
              {(b.status === 'requested' || b.status === 'confirmed') && <button className="linkbtn danger" type="button" onClick={() => cancel(b.id)}>Cancel</button>}
            </div>
            {b.kind === 'tour' && (links[b.id] || b.share_token) && <input className="linkbox" readOnly aria-label="Share link" value={links[b.id] ?? `${typeof location !== 'undefined' ? location.origin : ''}/share/${b.share_token}`} onFocus={e => e.currentTarget.select()} />}
            {reviewing === b.id && (
              <form className="rform" onSubmit={e => review(e, b)}>
                <div className="pick" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}>★</button>))}</div>
                <textarea name="text" rows={3} minLength={10} maxLength={1000} placeholder="How was your trip? (10 to 1000 characters)" required />
                <button className="btn btn-dark inline" type="submit">Post review</button>
              </form>
            )}
          </li>))}</ul>}
      <h2 className="sh">Saved places</h2>
      {savedList.length ? <div className="cards">{savedList.map(d => <DestinationCard key={d.slug} d={d} />)}</div>
        : <div className="empty"><p>Tap the heart on any destination to save it here.</p></div>}
    </Shell>
  );
}
