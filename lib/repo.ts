import { db } from './db';
import type { Destination } from './destinations';

type Row = { slug: string; name: string; state: string; type: Destination['type']; days: number; price: number; best_time: string; tagline: string; about: string; highlights: string; itinerary: string; img: string; active: number };

const toDest = (r: Row): Destination => ({
  slug: r.slug, name: r.name, state: r.state, type: r.type, days: r.days, price: r.price, bestTime: r.best_time,
  tagline: r.tagline, about: r.about, highlights: JSON.parse(r.highlights), itinerary: JSON.parse(r.itinerary), img: r.img, active: !!r.active
});

export function allDestinations(activeOnly = true): Destination[] {
  const rows = db().prepare(`SELECT * FROM destinations ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort, name`).all() as unknown as Row[];
  return rows.map(toDest);
}

export function getDestination(slug: string, activeOnly = true): Destination | undefined {
  const r = db().prepare('SELECT * FROM destinations WHERE slug = ?').get(slug) as unknown as Row | undefined;
  if (!r || (activeOnly && !r.active)) return undefined;
  return toDest(r);
}

export function saveDestination(d: Destination, create: boolean) {
  const args = [d.name, d.state, d.type, d.days, d.price, d.bestTime, d.tagline, d.about, JSON.stringify(d.highlights), JSON.stringify(d.itinerary), d.img, d.active ? 1 : 0];
  if (create) {
    const max = (db().prepare('SELECT COALESCE(MAX(sort),0) AS m FROM destinations').get() as unknown as { m: number }).m;
    db().prepare('INSERT INTO destinations (name,state,type,days,price,best_time,tagline,about,highlights,itinerary,img,active,slug,sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(...args, d.slug, max + 1);
  } else {
    db().prepare('UPDATE destinations SET name=?,state=?,type=?,days=?,price=?,best_time=?,tagline=?,about=?,highlights=?,itinerary=?,img=?,active=? WHERE slug=?').run(...args, d.slug);
  }
}

export type PublicReview = { id: number; rating: number; text: string; author: string; date: string };

/** Visible reviews for a destination. Only first name and last initial are public. */
export function reviewsFor(slug: string): { list: PublicReview[]; avg: number; count: number } {
  const rows = db().prepare(
    'SELECT r.id, r.rating, r.text, r.created_at, u.name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.slug = ? AND r.hidden = 0 ORDER BY r.id DESC'
  ).all(slug) as unknown as { id: number; rating: number; text: string; created_at: number; name: string }[];
  const list = rows.map(r => {
    const parts = r.name.trim().split(/\s+/);
    return { id: r.id, rating: r.rating, text: r.text, author: parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0], date: new Date(r.created_at).toISOString().slice(0, 10) };
  });
  const avg = list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0;
  return { list, avg, count: list.length };
}
