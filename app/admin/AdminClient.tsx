'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TYPE_LABEL, type Destination } from '@/lib/destinations';
import { inr } from '@/lib/pricing';
import { useSite } from '@/components/SiteProvider';

type Bk = { id: number; ref: string; trip: string | null; slug: string; travel_date: string; travellers: number; name: string; phone: string; email: string; total: number; status: string };
type Stat = { status: string; n: number; amount: number };
type Rv = { id: number; slug: string; rating: number; text: string; hidden: number; name: string };
type Em = { id: number; to_addr: string; subject: string; body: string; status: string; error: string | null; created_at: number };
type Form = { isNew: boolean; slug: string; name: string; state: string; type: string; days: string; price: string; bestTime: string; tagline: string; about: string; img: string; active: boolean; highlights: string; itinerary: string };

const toForm = (d: Destination): Form => ({ isNew: false, slug: d.slug, name: d.name, state: d.state, type: d.type, days: String(d.days), price: String(d.price), bestTime: d.bestTime, tagline: d.tagline, about: d.about, img: d.img, active: d.active, highlights: d.highlights.join('\n'), itinerary: d.itinerary.map(i => `${i.title} | ${i.text}`).join('\n') });
const waText = (b: Bk) => {
  const t = b.trip ?? b.slug, f = b.name.split(/\s+/)[0];
  const d = new Date(b.travel_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (b.status === 'confirmed') return `Hi ${f}, your Roamora booking ${b.ref} for ${t} on ${d} is confirmed. Total ${inr(b.total)} (GST included). We will share the payment details here.`;
  if (b.status === 'paid') return `Hi ${f}, we received your payment for ${t} (${b.ref}). Your trip on ${d} is booked. Thank you!`;
  return `Hi ${f}, this is Roamora about your booking request ${b.ref} for ${t} on ${d}.`;
};
const wa = (b: Bk) => `https://wa.me/91${b.phone}?text=${encodeURIComponent(waText(b))}`;
const blank: Form = { isNew: true, slug: '', name: '', state: '', type: 'heritage', days: '3', price: '10000', bestTime: '', tagline: '', about: '', img: '', active: true, highlights: '', itinerary: '' };

export default function AdminClient() {
  const { user, ready, openAuth } = useSite();
  const router = useRouter();
  const [tab, setTab] = useState<'bookings' | 'destinations' | 'reviews' | 'emails'>('bookings');
  const [bookings, setBookings] = useState<Bk[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [filter, setFilter] = useState('all');
  const [dests, setDests] = useState<Destination[]>([]);
  const [reviews, setReviews] = useState<Rv[]>([]);
  const [emails, setEmails] = useState<Em[]>([]);
  const [mailOn, setMailOn] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  const loadB = useCallback(async () => { const r = await fetch('/api/admin/bookings'); if (r.ok) { const d = await r.json(); setBookings(d.bookings); setStats(d.stats); } }, []);
  const loadD = useCallback(async () => { const r = await fetch('/api/admin/destinations'); if (r.ok) setDests((await r.json()).destinations); }, []);
  const loadR = useCallback(async () => { const r = await fetch('/api/admin/reviews'); if (r.ok) setReviews((await r.json()).reviews); }, []);
  const loadE = useCallback(async () => { const r = await fetch('/api/admin/emails'); if (r.ok) { const d = await r.json(); setEmails(d.emails); setMailOn(d.configured); } }, []);
  useEffect(() => { if (user?.isAdmin) { loadB(); loadD(); loadR(); loadE(); } }, [user, loadB, loadD, loadR, loadE]);

  async function act(id: number, action: string) {
    const r = await fetch('/api/admin/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
    setMsg(r.ok ? { t: 'Updated.', ok: true } : { t: (await r.json()).error, ok: false });
    loadB();
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const body = {
      ...form, days: Number(form.days), price: Number(form.price),
      highlights: form.highlights.split('\n'),
      itinerary: form.itinerary.split('\n').filter(l => l.trim()).map(l => { const [t, ...r] = l.split('|'); return { title: t, text: r.join('|') }; })
    };
    const r = await fetch('/api/admin/destinations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { setMsg({ t: (await r.json()).error, ok: false }); return; }
    setMsg({ t: 'Saved. The website is updated.', ok: true }); setForm(null); loadD(); router.refresh();
  }

  async function toggleActive(d: Destination) {
    const r = await fetch('/api/admin/destinations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, active: !d.active }) });
    setMsg(r.ok ? { t: d.active ? 'Hidden from the website.' : 'Visible on the website.', ok: true } : { t: (await r.json()).error, ok: false });
    loadD(); router.refresh();
  }

  async function hideReview(r: Rv) {
    await fetch('/api/admin/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, hidden: !r.hidden }) });
    loadR();
  }

  if (!ready) return <main className="page"><p>Loading…</p></main>;
  if (!user) return <main className="page"><h1 className="ph">Admin</h1><div className="empty"><p>Log in with an admin account.</p><button className="btn btn-dark inline" type="button" onClick={() => openAuth('login')}>Log in</button></div></main>;
  if (!user.isAdmin) return <main className="page"><h1 className="ph">Admin</h1><div className="empty"><p>This page is only for Roamora admins.</p></div></main>;

  const stat = (s: string) => stats.find(x => x.status === s);
  const set = (k: keyof Form, v: string | boolean) => setForm(f => f && { ...f, [k]: v });
  const shown = bookings.filter(b => filter === 'all' || b.status === filter);

  return (
    <main className="page wide">
      <h1 className="ph">Admin</h1>
      <div className="kpis">
        <div><b>{stat('requested')?.n ?? 0}</b><span>Waiting for you</span></div>
        <div><b>{stat('confirmed')?.n ?? 0}</b><span>Confirmed, unpaid</span></div>
        <div><b>{stat('paid')?.n ?? 0}</b><span>Paid</span></div>
        <div><b>{inr(stat('paid')?.amount ?? 0)}</b><span>Paid revenue (incl. GST)</span></div>
      </div>
      <div className="filters" role="tablist">
        {(['bookings', 'destinations', 'reviews', 'emails'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} className={`chip${tab === t ? ' on' : ''}`} type="button" onClick={() => { setTab(t); setMsg(null); }}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      {msg && <p className={`err dark${msg.ok ? ' okmsg' : ''}`} role="status">{msg.t}</p>}

      {tab === 'bookings' && <>
        <label className="f fil"><span>Show</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All</option><option value="requested">Requested</option><option value="confirmed">Confirmed</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></label>
        <div className="tw"><table className="bt"><thead><tr><th>Ref</th><th>Trip</th><th>Date</th><th>People</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{shown.map(b => (
            <tr key={b.id}><td>{b.ref}</td><td>{b.trip ?? b.slug}</td><td>{b.travel_date}</td><td>{b.travellers}</td>
              <td>{b.name}<br /><span className="muted">{b.phone} · {b.email}</span></td><td>{inr(b.total)}</td>
              <td><span className={`st ${b.status}`}>{b.status}</span></td>
              <td className="acts">
                {b.status === 'requested' && <button className="linkbtn" type="button" onClick={() => act(b.id, 'confirm')}>Confirm</button>}
                {b.status === 'confirmed' && <button className="linkbtn" type="button" onClick={() => act(b.id, 'markpaid')}>Mark paid</button>}
                <a className="linkbtn" target="_blank" rel="noreferrer" href={wa(b)}>WhatsApp</a>
                {b.status !== 'cancelled' && <button className="linkbtn danger" type="button" onClick={() => act(b.id, 'cancel')}>Cancel</button>}
              </td></tr>))}
            {!shown.length && <tr><td colSpan={8}>No bookings here.</td></tr>}</tbody></table></div>
        <p className="muted">&quot;Mark paid&quot; is for money received outside Razorpay (bank transfer, cash). Cancelling a paid trip does not refund it; refund from the Razorpay dashboard.</p>
      </>}

      {tab === 'destinations' && (form ? (
        <form className="aform" onSubmit={save}>
          <h2>{form.isNew ? 'New destination' : `Edit ${form.name}`}</h2>
          <label className="f"><span>Slug (web address)</span><input value={form.slug} disabled={!form.isNew} onChange={e => set('slug', e.target.value)} placeholder="goa-beaches" required /></label>
          <label className="f"><span>Name</span><input value={form.name} onChange={e => set('name', e.target.value)} required /></label>
          <label className="f"><span>State</span><input value={form.state} onChange={e => set('state', e.target.value)} required /></label>
          <label className="f"><span>Type</span><select value={form.type} onChange={e => set('type', e.target.value)}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="f"><span>Days</span><input type="number" min={1} max={60} value={form.days} onChange={e => set('days', e.target.value)} required /></label>
          <label className="f"><span>Price per person (₹, before GST)</span><input type="number" min={500} value={form.price} onChange={e => set('price', e.target.value)} required /></label>
          <label className="f"><span>Best time to visit</span><input value={form.bestTime} onChange={e => set('bestTime', e.target.value)} required /></label>
          <label className="f"><span>Tagline</span><input value={form.tagline} onChange={e => set('tagline', e.target.value)} required /></label>
          <label className="f"><span>About</span><textarea rows={4} value={form.about} onChange={e => set('about', e.target.value)} required /></label>
          <label className="f"><span>Image (Unsplash photo id or https link)</span><input value={form.img} onChange={e => set('img', e.target.value)} required /></label>
          <label className="f"><span>Highlights (one per line)</span><textarea rows={4} value={form.highlights} onChange={e => set('highlights', e.target.value)} required /></label>
          <label className="f"><span>Day by day (one line per day: Title | Description)</span><textarea rows={6} value={form.itinerary} onChange={e => set('itinerary', e.target.value)} required /></label>
          <label className="cb"><input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} /> Visible on the website</label>
          <div className="row2"><button className="btn btn-dark inline" type="submit">Save</button><button className="linkbtn" type="button" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      ) : <>
        <p><button className="btn btn-dark inline" type="button" onClick={() => setForm(blank)}>+ New destination</button></p>
        <div className="tw"><table className="bt"><thead><tr><th>Name</th><th>State</th><th>Days</th><th>Price / person</th><th>Visible</th><th /></tr></thead>
          <tbody>{dests.map(d => (
            <tr key={d.slug}><td>{d.name}</td><td>{d.state}</td><td>{d.days}</td><td>{inr(d.price)}</td><td>{d.active ? 'Yes' : 'Hidden'}</td>
              <td className="acts"><button className="linkbtn" type="button" onClick={() => setForm(toForm(d))}>Edit</button><button className="linkbtn" type="button" onClick={() => toggleActive(d)}>{d.active ? 'Hide' : 'Show'}</button></td></tr>))}</tbody></table></div>
        <p className="muted">Changing a price here does not change bookings that already exist; they keep the price they were made at.</p>
      </>)}

      {tab === 'emails' && <>
        <p className={mailOn ? 'muted' : 'err dark'}>{mailOn ? 'Email is connected. Every email the site sends is listed here.' : 'Email is not connected yet, so nothing is being sent. Add the SMTP settings from .env.example. Emails below were only recorded.'}</p>
        <div className="tw"><table className="bt"><thead><tr><th>When</th><th>To</th><th>Subject</th><th>Status</th></tr></thead>
          <tbody>{emails.map(e => (<tr key={e.id}><td>{new Date(e.created_at).toLocaleString('en-IN')}</td><td>{e.to_addr}</td><td>{e.subject}</td>
            <td><span className={`st ${e.status === 'sent' ? 'confirmed' : e.status === 'failed' ? 'cancelled' : ''}`}>{e.status}</span>{e.error && <div className="muted">{e.error}</div>}</td></tr>))}
            {!emails.length && <tr><td colSpan={4}>No emails yet.</td></tr>}</tbody></table></div>
      </>}

      {tab === 'reviews' && (reviews.length === 0 ? <div className="empty"><p>No reviews yet.</p></div> : <ul className="rev admin">{reviews.map(r => (
        <li key={r.id}><div><span className="stars sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> <b>{r.name}</b> on <i>{r.slug}</i> {r.hidden ? <span className="st cancelled">hidden</span> : null}</div><p>{r.text}</p>
          <button className="linkbtn" type="button" onClick={() => hideReview(r)}>{r.hidden ? 'Show again' : 'Hide from website'}</button></li>))}</ul>)}
    </main>
  );
}
