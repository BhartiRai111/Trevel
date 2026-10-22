'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { bySlug } from '@/lib/destinations';
import { inr } from '@/lib/pricing';
import DestinationCard from '@/components/DestinationCard';
import { useSite } from '@/components/SiteProvider';

type B = { id: number; ref: string; slug: string; travel_date: string; travellers: number; total: number; status: string };
const STATUS: Record<string, string> = { requested: 'Requested', confirmed: 'Confirmed', cancelled: 'Cancelled' };

export default function TripsClient() {
  const { user, ready, saved, openAuth } = useSite();
  const [bookings, setBookings] = useState<B[] | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/bookings');
    if (res.ok) setBookings((await res.json()).bookings);
  }, []);
  useEffect(() => { if (user) load(); else setBookings(null); }, [user, load]);

  async function cancel(id: number) {
    setMsg('');
    const res = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
    if (!res.ok) setMsg((await res.json()).error || 'Could not cancel.');
    load();
  }

  if (!ready) return <main className="page"><p>Loading…</p></main>;
  if (!user) return (
    <main className="page"><h1 className="ph">My trips</h1>
      <div className="empty"><p>Log in to see your saved places and booking requests.</p><button className="btn btn-dark inline" type="button" onClick={() => openAuth('login')}>Log in</button></div></main>
  );

  const savedList = [...saved].map(bySlug).filter(Boolean);
  return (
    <main className="page">
      <h1 className="ph">My trips</h1>
      <h2 className="sh">Booking requests</h2>
      {msg && <p className="err dark" role="alert">{msg}</p>}
      {bookings === null ? <p>Loading…</p> : bookings.length === 0
        ? <div className="empty"><p>No bookings yet.</p><Link className="btn btn-dark inline" href="/search">Find a trip</Link></div>
        : <div className="tw"><table className="bt"><thead><tr><th>Reference</th><th>Trip</th><th>Date</th><th>People</th><th>Total</th><th>Status</th><th /></tr></thead>
          <tbody>{bookings.map(b => (
            <tr key={b.id}><td data-l="Reference">{b.ref}</td><td data-l="Trip"><Link href={`/destinations/${b.slug}`}>{bySlug(b.slug)?.name ?? b.slug}</Link></td>
              <td data-l="Date">{new Date(b.travel_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              <td data-l="People">{b.travellers}</td><td data-l="Total">{inr(b.total)}</td>
              <td data-l="Status"><span className={`st ${b.status}`}>{STATUS[b.status] ?? b.status}</span></td>
              <td>{b.status !== 'cancelled' && <button className="linkbtn danger" type="button" onClick={() => cancel(b.id)}>Cancel</button>}</td></tr>
          ))}</tbody></table></div>}
      <h2 className="sh">Saved places</h2>
      {savedList.length ? <div className="cards">{savedList.map(d => <DestinationCard key={d!.slug} d={d!} />)}</div>
        : <div className="empty"><p>Tap the heart on any destination to save it here.</p></div>}
    </main>
  );
}
