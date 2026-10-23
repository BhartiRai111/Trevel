import { DEFAULT_PACKAGES, EMPTY_EXPLORE, TYPE_LABEL, type Destination, type Explore, type ExploreItem, type Pkg } from './destinations';
import { CAR_TYPES, CITIES, type Car, type Flight, type Hotel, type Item, type Kind } from './catalog';

export const isEmail = (s: unknown): s is string => typeof s === 'string' && s.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
/** Indian mobile number: 10 digits starting 6-9 (optional +91 / 0 prefix is stripped). */
export function cleanPhone(s: unknown): string | null {
  if (typeof s !== 'string') return null;
  const d = s.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}
export const cleanName = (s: unknown) => (typeof s === 'string' && s.trim().length >= 2 && s.trim().length <= 80 ? s.trim() : null);

const str = (v: unknown, min: number, max: number) => (typeof v === 'string' && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);
const int = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null; };

/** Validates an admin destination form. Returns the clean destination or an error message. */
export function parseDestination(b: Record<string, unknown>): Destination | string {
  const slug = typeof b.slug === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.slug) && b.slug.length <= 60 ? b.slug : null;
  if (!slug) return 'Slug must be lowercase letters, numbers and dashes, like "goa-beaches".';
  const name = str(b.name, 2, 80); if (!name) return 'Enter a name (2 to 80 characters).';
  const state = str(b.state, 2, 60); if (!state) return 'Enter the state.';
  const type = typeof b.type === 'string' && b.type in TYPE_LABEL ? (b.type as Destination['type']) : null; if (!type) return 'Choose a type.';
  const days = int(b.days, 1, 60); if (!days) return 'Days must be between 1 and 60.';
  const price = int(b.price, 500, 10_000_000); if (!price) return 'Price per person must be between ₹500 and ₹1,00,00,000.';
  const bestTime = str(b.bestTime, 2, 60); if (!bestTime) return 'Enter the best time to visit.';
  const tagline = str(b.tagline, 2, 120); if (!tagline) return 'Enter a short tagline.';
  const about = str(b.about, 10, 1500); if (!about) return 'The about text needs 10 to 1500 characters.';
  const image = typeof b.img === 'string' ? b.img.trim() : '';
  if (image && !/^(photo-[\w-]+|\/photos\/[\w\-./]+|https:\/\/\S+)$/.test(image)) return 'Image must be a photo from /photos/, an Unsplash id like "photo-123..." or a link starting with https://';
  const highlights = Array.isArray(b.highlights) ? b.highlights.map(x => String(x).trim()).filter(Boolean).slice(0, 12) : [];
  if (!highlights.length) return 'Add at least one highlight.';
  const itinerary = Array.isArray(b.itinerary)
    ? b.itinerary.map(x => ({ title: String((x as { title?: unknown })?.title ?? '').trim().slice(0, 100), text: String((x as { text?: unknown })?.text ?? '').trim().slice(0, 400) })).filter(x => x.title).slice(0, 60)
    : [];
  if (!itinerary.length) return 'Add at least one itinerary day.';
  const explore = b.explore === undefined ? EMPTY_EXPLORE : parseExplore(b.explore);
  if (typeof explore === 'string') return explore;
  const packages = b.packages === undefined ? DEFAULT_PACKAGES : parsePackages(b.packages);
  if (typeof packages === 'string') return packages;
  const gallery = b.gallery === undefined ? [] : parseGallery(b.gallery);
  if (typeof gallery === 'string') return gallery;
  return { slug, name, state, type, days, price, bestTime, tagline, about, highlights, itinerary, img: image, active: b.active !== false, explore, packages, gallery };
}

const slugOk = (v: unknown) => (typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) && v.length <= 80 ? v : null);
const imgOk = (v: unknown) => { const t = str(v, 3, 300); return t && /^(photo-[\w-]+|\/photos\/[\w\-./]+|https:\/\/\S+)$/.test(t) ? t : null; };
const lines = (v: unknown) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map(x => String(x).trim()).filter(Boolean).slice(0, 20);

/** Validates an admin form for a hotel, flight or car. Returns the clean item or an error message. */
export function parseCatalog(kind: Kind, b: Record<string, unknown>): Item | string {
  const slug = slugOk(b.slug);
  if (!slug) return 'Slug must be lowercase letters, numbers and dashes, like "sunset-bay-resort".';
  const active = b.active !== false;
  const price = int(b.price, 100, 10_000_000);
  if (!price) return 'Price must be between ₹100 and ₹1,00,00,000.';
  if (kind === 'hotel') {
    const name = str(b.name, 2, 80), city = str(b.city, 2, 60), state = str(b.state, 2, 60), stars = int(b.stars, 1, 5), about = str(b.about, 10, 1000), img = imgOk(b.img);
    if (!name) return 'Enter the hotel name.'; if (!city) return 'Enter the city.'; if (!state) return 'Enter the state.';
    if (!stars) return 'Stars must be 1 to 5.'; if (!about) return 'The about text needs 10 to 1000 characters.';
    if (!img) return 'Image must be a photo from /photos/, an Unsplash id like "photo-123..." or a link starting with https://';
    const h: Hotel = { slug, name, city, state, stars, price, amenities: lines(b.amenities), about, img, active };
    return h;
  }
  if (kind === 'flight') {
    const airline = str(b.airline, 2, 60), flightNo = str(b.flightNo, 2, 12), from = str(b.from, 2, 40), to = str(b.to, 2, 40), duration = int(b.duration, 20, 1200);
    const dep = typeof b.dep === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(b.dep) ? b.dep : null;
    const days = Array.isArray(b.days) ? [...new Set(b.days.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort() : [];
    if (!airline) return 'Enter the airline.'; if (!flightNo) return 'Enter the flight number.';
    if (!from || !to) return 'Enter both cities.'; if (from === to) return 'From and To must be different.';
    if (!(from in CITIES) || !(to in CITIES)) return `Cities must be one of: ${Object.keys(CITIES).join(', ')}.`;
    if (!dep) return 'Departure time must look like 07:30.'; if (!duration) return 'Duration must be 20 to 1200 minutes.';
    if (!days.length) return 'Choose at least one day of the week.';
    const f: Flight = { slug, airline, flightNo, from, to, dep, duration, price, days, active };
    return f;
  }
  const name = str(b.name, 2, 80), city = str(b.city, 2, 60), seats = int(b.seats, 1, 60), about = str(b.about, 10, 1000), img = imgOk(b.img);
  const type = typeof b.type === 'string' && CAR_TYPES.includes(b.type) ? b.type : null;
  if (!name) return 'Enter the car name.'; if (!city) return 'Enter the city.'; if (!type) return `Type must be one of: ${CAR_TYPES.join(', ')}.`;
  if (!seats) return 'Seats must be 1 to 60.'; if (!about) return 'The about text needs 10 to 1000 characters.';
  if (!img) return 'Image must be a photo from /photos/, an Unsplash id like "photo-123..." or a link starting with https://';
  const c: Car = { slug, name, type, city, seats, price, about, img, active };
  return c;
}

const imgOptional = (v: unknown) => (v === undefined || v === null || String(v).trim() === '' ? '' : imgOk(v));

/** Validates the "explore" guide (places, food, activities, visitor info). Returns it clean, or an error message. */
export function parseExplore(v: unknown): Explore | string {
  const o = (v ?? {}) as { items?: unknown; info?: Record<string, unknown> };
  const raw = Array.isArray(o.items) ? o.items : [];
  if (raw.length > 40) return 'A guide can have at most 40 places, foods and activities.';
  const items: ExploreItem[] = [];
  for (const [i, x] of raw.entries()) {
    const it = x as Record<string, unknown>;
    const kind = it.kind === 'see' || it.kind === 'food' || it.kind === 'do' ? it.kind : null;
    const name = str(it.name, 2, 80), text = str(it.text, 5, 400), type = typeof it.type === 'string' ? it.type.trim().slice(0, 30) : '';
    const image = imgOptional(it.img);
    if (!kind) return `Guide item ${i + 1}: kind must be see, food or do.`;
    if (!name) return `Guide item ${i + 1}: enter a name (2 to 80 characters).`;
    if (!text) return `Guide item ${i + 1} (${name}): the description needs 5 to 400 characters.`;
    if (image === null) return `Guide item ${i + 1} (${name}): image must be an Unsplash id or an https link, or left empty.`;
    items.push({ kind, type, name, text, img: image });
  }
  const info = o.info ?? {};
  const tips = (Array.isArray(info.tips) ? info.tips : []).map(t => String(t).trim().slice(0, 200)).filter(Boolean).slice(0, 8);
  return { items, info: { howToReach: String(info.howToReach ?? '').trim().slice(0, 400), gettingAround: String(info.gettingAround ?? '').trim().slice(0, 400), tips } };
}

/** Validates booking packages. The first one is the base price (multiplier 1). */
export function parsePackages(v: unknown): Pkg[] | string {
  if (!Array.isArray(v) || v.length < 1 || v.length > 4) return 'Add 1 to 4 packages.';
  const out: Pkg[] = [], seen = new Set<string>();
  for (const [i, x] of v.entries()) {
    const p = x as Record<string, unknown>;
    const name = str(p.name, 2, 30);
    if (!name) return `Package ${i + 1}: enter a name (2 to 30 characters).`;
    const id = typeof p.id === 'string' && /^[a-z0-9-]{2,20}$/.test(p.id) ? p.id : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    if (!id || seen.has(id)) return `Package ${i + 1} (${name}): each package needs a different name.`;
    seen.add(id);
    const mult = Number(p.mult);
    if (!Number.isFinite(mult) || mult < 0.5 || mult > 5) return `Package ${name}: the price multiplier must be between 0.5 and 5.`;
    if (i === 0 && mult !== 1) return 'The first package is the base price, so its multiplier must be 1.';
    const text = typeof p.text === 'string' ? p.text.trim().slice(0, 200) : '';
    const includes = (Array.isArray(p.includes) ? p.includes : []).map(t => String(t).trim().slice(0, 120)).filter(Boolean).slice(0, 10);
    if (!includes.length) return `Package ${name}: list at least one thing that is included.`;
    out.push({ id, name, text, mult: Math.round(mult * 100) / 100, includes });
  }
  return out;
}

/** Background photos or videos for a destination: Unsplash ids or https links (video links end in .mp4 or .webm). */
export function parseGallery(v: unknown): string[] | string {
  const raw = (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map(x => String(x).trim()).filter(Boolean);
  if (raw.length > 8) return 'Use at most 8 background photos or videos.';
  for (const x of raw) if (x.length > 300 || !/^(photo-[\w-]+|\/photos\/[\w\-./]+|https:\/\/\S+)$/.test(x)) return `Background "${x.slice(0, 40)}": use a /photos/ file, an Unsplash photo id like "photo-123..." or a link starting with https://`;
  return [...new Set(raw)];
}
