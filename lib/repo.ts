import { one, q, run } from './db';
import { DEFAULT_PACKAGES, EMPTY_EXPLORE, type Destination } from './destinations';

type Row = { slug: string; name: string; state: string; type: Destination['type']; days: number; price: number; best_time: string; tagline: string; about: string; highlights: string; itinerary: string; img: string; active: number; explore: string; packages: string };

const toDest = (r: Row): Destination => ({
  slug: r.slug, name: r.name, state: r.state, type: r.type, days: r.days, price: r.price, bestTime: r.best_time,
  tagline: r.tagline, about: r.about, highlights: JSON.parse(r.highlights), itinerary: JSON.parse(r.itinerary), img: r.img, active: !!r.active,
  explore: r.explore ? JSON.parse(r.explore) : EMPTY_EXPLORE,
  packages: r.packages ? JSON.parse(r.packages) : DEFAULT_PACKAGES
});

export async function allDestinations(activeOnly = true): Promise<Destination[]> {
  const rows = await q<Row>(`SELECT * FROM destinations ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort, name`);
  return rows.map(toDest);
}

export async function getDestination(slug: string, activeOnly = true): Promise<Destination | undefined> {
  const r = await one<Row>('SELECT * FROM destinations WHERE slug = $1', [slug]);
  if (!r || (activeOnly && !r.active)) return undefined;
  return toDest(r);
}

export async function saveDestination(d: Destination, create: boolean) {
  const args = [d.name, d.state, d.type, d.days, d.price, d.bestTime, d.tagline, d.about, JSON.stringify(d.highlights), JSON.stringify(d.itinerary), d.img, d.active ? 1 : 0, JSON.stringify(d.explore), JSON.stringify(d.packages)];
  if (create) {
    const m = await one<{ m: number }>('SELECT COALESCE(MAX(sort),0) AS m FROM destinations');
    await run('INSERT INTO destinations (name,state,type,days,price,best_time,tagline,about,highlights,itinerary,img,active,explore,packages,slug,sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)', [...args, d.slug, (m?.m ?? 0) + 1]);
  } else {
    await run('UPDATE destinations SET name=$1,state=$2,type=$3,days=$4,price=$5,best_time=$6,tagline=$7,about=$8,highlights=$9,itinerary=$10,img=$11,active=$12,explore=$13,packages=$14 WHERE slug=$15', [...args, d.slug]);
  }
}

export type PublicReview = { id: number; rating: number; text: string; author: string; date: string };

/** Visible reviews for a destination. Only first name and last initial are public. */
export async function reviewsFor(slug: string): Promise<{ list: PublicReview[]; avg: number; count: number }> {
  const rows = await q<{ id: number; rating: number; text: string; created_at: number; name: string }>(
    'SELECT r.id, r.rating, r.text, r.created_at, u.name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.slug = $1 AND r.hidden = 0 ORDER BY r.id DESC', [slug]);
  const list = rows.map(r => {
    const parts = r.name.trim().split(/\s+/);
    return { id: r.id, rating: r.rating, text: r.text, author: parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0], date: new Date(r.created_at).toISOString().slice(0, 10) };
  });
  const avg = list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0;
  return { list, avg, count: list.length };
}
