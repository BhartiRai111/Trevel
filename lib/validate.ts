import { TYPE_LABEL, type Destination } from './destinations';

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
