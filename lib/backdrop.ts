import { CITIES } from './catalogMeta';

/** Which photos or videos play as the full-screen background, by page. Safe for the browser (no database code). */
export type Backdrops = {
  dest: Record<string, string[]>;   // destination slug -> its photos
  hotel: Record<string, string[]>;  // hotel slug -> its photo
  car: Record<string, string[]>;
  hotels: string[]; cars: string[]; all: string[];
};
type D = { slug: string; name: string; state: string };

const CITY_DEST: Record<string, string> = { goa: 'goa-beaches', jaipur: 'jaipur-pink-city', udaipur: 'udaipur-lakes', leh: 'ladakh-leh', varanasi: 'varanasi-ghats', kochi: 'kerala-backwaters', delhi: 'taj-mahal-agra' };
const CODE_CITY = Object.fromEntries(Object.entries(CITIES).map(([c, code]) => [code.toLowerCase(), c]));

/** "Goa", "goa", "Rajasthan" -> the matching destination, if any. */
export function matchDest(text: string | null | undefined, dests: D[]): D | undefined {
  const t = (text ?? '').trim().toLowerCase();
  if (t.length < 3) return undefined;
  return dests.find(d => d.name.toLowerCase().includes(t) || d.slug.includes(t) || d.state.toLowerCase().includes(t))
    ?? dests.find(d => d.slug === CITY_DEST[t]);
}

export function pickBackdrop(path: string, sp: URLSearchParams, b: Backdrops, dests: D[]): string[] {
  if (path === '/') return []; // the home page has its own full-screen slideshow
  const seg = (re: RegExp) => path.match(re)?.[1];
  const dSlug = seg(/^\/destinations\/([^/]+)/);
  if (dSlug && b.dest[dSlug]) return b.dest[dSlug];
  const hSlug = seg(/^\/hotels\/([^/]+)$/); if (hSlug && b.hotel[hSlug]) return b.hotel[hSlug];
  const cSlug = seg(/^\/cars\/([^/]+)$/); if (cSlug && b.car[cSlug]) return b.car[cSlug];
  const fSlug = seg(/^\/flights\/([^/]+)$/);
  let text: string | null = null;
  if (fSlug) text = CODE_CITY[fSlug.split('-').pop() ?? ''] ?? null; // flight page: where it lands
  else if (path === '/hotels' || path === '/cars') text = sp.get('city');
  else if (path === '/flights') text = sp.get('to');
  else if (path === '/search') text = sp.get('q');
  const d = matchDest(text, dests);
  if (d && b.dest[d.slug]?.length) return b.dest[d.slug];
  if (path.startsWith('/hotels') && b.hotels.length) return b.hotels;
  if (path.startsWith('/cars') && b.cars.length) return b.cars;
  return b.all;
}
