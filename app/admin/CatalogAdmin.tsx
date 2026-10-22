'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CAR_TYPES, CITIES, DAY_NAMES, type Item, type Kind } from '@/lib/catalogMeta';
import { inr } from '@/lib/pricing';

/* eslint-disable @typescript-eslint/no-explicit-any */
type F = { key: string; label: string; type: 'text' | 'number' | 'select' | 'textarea' | 'days'; options?: string[]; hint?: string; help?: string };
const IMG: F = { key: 'img', label: 'Image (Unsplash photo id or https link)', type: 'text' };
const SPEC: Record<Kind, F[]> = {
  hotel: [
    { key: 'name', label: 'Hotel name', type: 'text' }, { key: 'city', label: 'City', type: 'text' }, { key: 'state', label: 'State', type: 'text' },
    { key: 'stars', label: 'Stars (1 to 5)', type: 'number' }, { key: 'price', label: 'Rate per room per night (₹, before GST)', type: 'number' },
    { key: 'amenities', label: 'Amenities (one per line)', type: 'textarea' }, { key: 'about', label: 'About', type: 'textarea' }, IMG],
  flight: [
    { key: 'airline', label: 'Airline', type: 'text' }, { key: 'flightNo', label: 'Flight number', type: 'text', hint: 'SI 101' },
    { key: 'from', label: 'From', type: 'select', options: Object.keys(CITIES) }, { key: 'to', label: 'To', type: 'select', options: Object.keys(CITIES) },
    { key: 'dep', label: 'Departure time (24h)', type: 'text', hint: '07:30' }, { key: 'duration', label: 'Duration (minutes)', type: 'number' },
    { key: 'price', label: 'Fare per person (₹, before GST)', type: 'number' }, { key: 'days', label: 'Runs on', type: 'days' }],
  car: [
    { key: 'name', label: 'Car name', type: 'text' }, { key: 'type', label: 'Type', type: 'select', options: CAR_TYPES }, { key: 'city', label: 'City', type: 'text' },
    { key: 'seats', label: 'Seats', type: 'number' }, { key: 'price', label: 'Rate per day with driver (₹, before GST)', type: 'number' },
    { key: 'about', label: 'About', type: 'textarea' }, IMG]
};
const BLANK: Record<Kind, any> = {
  hotel: { stars: 3, price: 3000, amenities: 'Free Wi-Fi\nBreakfast included', active: true },
  flight: { from: 'Delhi', to: 'Mumbai', dep: '09:00', duration: 120, price: 5000, days: [0, 1, 2, 3, 4, 5, 6], active: true },
  car: { type: 'Sedan', seats: 4, price: 2800, active: true }
};
const COLS: Record<Kind, [string, (i: any) => string][]> = {
  hotel: [['Name', i => i.name], ['City', i => i.city], ['Stars', i => '★'.repeat(i.stars)], ['Rate / night', i => inr(i.price)]],
  flight: [['Flight', i => `${i.airline} ${i.flightNo}`], ['Route', i => `${i.from} → ${i.to}`], ['Departs', i => i.dep], ['Fare', i => inr(i.price)]],
  car: [['Car', i => i.name], ['City', i => i.city], ['Type', i => `${i.type} (${i.seats})`], ['Rate / day', i => inr(i.price)]]
};
const toForm = (kind: Kind, it: any) => ({ ...it, ...(kind === 'hotel' ? { amenities: it.amenities.join('\n') } : {}), isNew: false });

export default function CatalogAdmin({ kind, onMsg }: { kind: Kind; onMsg: (m: { t: string; ok: boolean } | null) => void }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const load = useCallback(async () => { const r = await fetch(`/api/admin/catalog?kind=${kind}`); if (r.ok) setItems((await r.json()).items); }, [kind]);
  useEffect(() => { setForm(null); load(); }, [load]);

  const put = async (body: any, okText: string) => {
    const r = await fetch('/api/admin/catalog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, ...body }) });
    if (!r.ok) { onMsg({ t: (await r.json()).error, ok: false }); return false; }
    onMsg({ t: okText, ok: true }); load(); router.refresh(); return true;
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    const b = { ...form };
    if (kind === 'hotel') b.amenities = String(b.amenities ?? '').split('\n');
    if (await put(b, 'Saved. The website is updated.')) setForm(null);
  }
  const toggle = (it: any) => put({ ...it, active: !it.active }, it.active ? 'Hidden from the website.' : 'Visible on the website.');
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  if (form) return (
    <form className="aform" onSubmit={save}>
      <h2>{form.isNew ? 'New item' : `Edit ${form.name ?? form.flightNo}`}</h2>
      <label className="f"><span>Slug (web address)</span><input value={form.slug ?? ''} disabled={!form.isNew} onChange={e => set('slug', e.target.value)} placeholder="sunset-bay-resort" required /></label>
      {SPEC[kind].map(f => (
        <div key={f.key} className="f">
          {f.type === 'days' ? <><span>{f.label}</span><div className="daysrow">{DAY_NAMES.map((d, i) => (
            <label key={d} className="cb"><input type="checkbox" checked={(form.days ?? []).includes(i)} onChange={e => set('days', e.target.checked ? [...(form.days ?? []), i] : (form.days ?? []).filter((x: number) => x !== i))} /> {d}</label>))}</div></>
          : <label className="f"><span>{f.label}</span>
            {f.type === 'textarea' ? <textarea rows={4} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} required />
              : f.type === 'select' ? <select value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>{f.options!.map(o => <option key={o}>{o}</option>)}</select>
                : <input type={f.type} value={form[f.key] ?? ''} placeholder={f.hint} onChange={e => set(f.key, f.type === 'number' ? e.target.value : e.target.value)} required />}</label>}
        </div>))}
      <label className="cb"><input type="checkbox" checked={form.active !== false} onChange={e => set('active', e.target.checked)} /> Visible on the website</label>
      <div className="row2"><button className="btn btn-dark inline" type="submit">Save</button><button className="linkbtn" type="button" onClick={() => setForm(null)}>Cancel</button></div>
    </form>
  );

  return <>
    <p><button className="btn btn-dark inline" type="button" onClick={() => setForm({ ...BLANK[kind], isNew: true })}>+ New {kind}</button></p>
    <div className="tw"><table className="bt"><thead><tr>{COLS[kind].map(([h]) => <th key={h}>{h}</th>)}<th>Visible</th><th /></tr></thead>
      <tbody>{items.map((it: any) => (
        <tr key={it.slug}>{COLS[kind].map(([h, f]) => <td key={h}>{f(it)}</td>)}<td>{it.active ? 'Yes' : 'Hidden'}</td>
          <td className="acts"><button className="linkbtn" type="button" onClick={() => setForm(toForm(kind, it))}>Edit</button><button className="linkbtn" type="button" onClick={() => toggle(it)}>{it.active ? 'Hide' : 'Show'}</button></td></tr>))}
        {!items.length && <tr><td colSpan={6}>Nothing here yet.</td></tr>}</tbody></table></div>
    <p className="muted">Changing a rate does not change bookings that already exist; they keep the price they were made at. Flights in the sample data are fictional, replace them with your real schedules.</p>
  </>;
}
