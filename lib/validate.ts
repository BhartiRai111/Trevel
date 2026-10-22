import { TYPE_LABEL, type Destination } from './destinations';
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
  const image = str(b.img, 3, 300); if (!image) return 'Enter an image: an Unsplash photo id or a full https link.';
  if (!/^(photo-[\w-]+|https:\/\/\S+)$/.test(image)) return 'Image must be an Unsplash id like "photo-123..." or a link starting with https://';
  const highlights = Array.isArray(b.highlights) ? b.highlights.map(x => String(x).trim()).filter(Boolean).slice(0, 12) : [];
  if (!highlights.length) return 'Add at least one highlight.';
  const itinerary = Array.isArray(b.itinerary)
    ? b.itinerary.map(x => ({ title: String((x as { title?: unknown })?.title ?? '').trim().slice(0, 100), text: String((x as { text?: unknown })?.text ?? '').trim().slice(0, 400) })).filter(x => x.title).slice(0, 60)
    : [];
  if (!itinerary.length) return 'Add at least one itinerary day.';
  return { slug, name, state, type, days, price, bestTime, tagline, about, highlights, itinerary, img: image, active: b.active !== false };
}

const slugOk = (v: unknown) => (typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) && v.length <= 80 ? v : null);
const imgOk = (v: unknown) => { const t = str(v, 3, 300); return t && /^(photo-[\w-]+|https:\/\/\S+)$/.test(t) ? t : null; };
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
    if (!img) return 'Image must be an Unsplash id like "photo-123..." or a link starting with https://';
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
  if (!img) return 'Image must be an Unsplash id like "photo-123..." or a link starting with https://';
  const c: Car = { slug, name, type, city, seats, price, about, img, active };
  return c;
}
