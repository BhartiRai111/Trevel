import { one, q, run, type Conn } from './db';
import { weekday } from './pricing';

export * from './catalogMeta';
import { CITIES, type Kind, type Hotel, type Flight, type Car, type Item } from './catalogMeta';

/* ---------------- sample data (replace in /admin) ---------------- */
const IMG = {
  hotel: ['photo-1566073771259-6a8506099945', 'photo-1520250497591-112f2f40a3f4', 'photo-1542314831-068cd1dbfeeb', 'photo-1564501049412-61c2a3083791', 'photo-1571896349842-33c89424de2d', 'photo-1551882547-ff40c63fe5fa'],
  car: ['photo-1549317661-bd32c8ce0db2', 'photo-1503376780353-7e6692767b70', 'photo-1494976388531-d1058494cdd8', 'photo-1533473359331-0135ef1b58bf']
};
const AM = ['Free Wi-Fi', 'Breakfast included', 'Air conditioning', 'Swimming pool', 'Restaurant', 'Parking', 'Airport pickup', '24-hour front desk'];
const am = (n: number) => AM.slice(0, n);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const HOTEL_RAW: [string, string, string, number, number, number][] = [
  // name, city, state, stars, price per night, amenity count
  ['Sunset Bay Resort', 'Goa', 'Goa', 4, 6200, 8], ['Palm Grove Stay', 'Goa', 'Goa', 3, 2400, 5],
  ['Amber View Haveli', 'Jaipur', 'Rajasthan', 4, 5400, 7], ['Pink City Inn', 'Jaipur', 'Rajasthan', 3, 2100, 5],
  ['Lakeside Palace Hotel', 'Udaipur', 'Rajasthan', 5, 11800, 8], ['Taj View Residency', 'Agra', 'Uttar Pradesh', 4, 4300, 7],
  ['Capital Business Hotel', 'Delhi', 'Delhi', 4, 5600, 7], ['Metro Budget Stay', 'Delhi', 'Delhi', 2, 1500, 4],
  ['Marine Drive Suites', 'Mumbai', 'Maharashtra', 5, 9800, 8], ['Garden City Hotel', 'Bengaluru', 'Karnataka', 4, 4800, 7],
  ['Himalayan Pine Lodge', 'Manali', 'Himachal Pradesh', 3, 3200, 6], ['Ganga Riverside Camp', 'Rishikesh', 'Uttarakhand', 3, 2800, 5],
  ['Backwater Heritage Villa', 'Kochi', 'Kerala', 4, 5200, 7], ['Ghat View Guest House', 'Varanasi', 'Uttar Pradesh', 2, 1600, 4],
  ['High Pass Residency', 'Leh', 'Ladakh', 3, 3900, 6]
];
export const HOTEL_SEED: Hotel[] = HOTEL_RAW.map(([name, city, state, stars, price, n], i) => ({
  slug: slugify(name), name, city, state, stars, price, amenities: am(n), img: IMG.hotel[i % IMG.hotel.length], active: true,
  about: `${stars}-star stay in ${city}. Comfortable rooms, helpful staff and an easy base for exploring ${city}. Rates are per room per night for up to 3 guests.`
}));

const CAR_RAW: [string, string, string, number, number][] = [
  ['Maruti Swift (with driver)', 'Hatchback', 'Delhi', 4, 2200], ['Toyota Etios (with driver)', 'Sedan', 'Delhi', 4, 2800], ['Toyota Innova (with driver)', 'SUV', 'Delhi', 7, 4200],
  ['Tempo Traveller 12-seater', 'Tempo Traveller', 'Delhi', 12, 6800], ['Maruti Dzire (with driver)', 'Sedan', 'Jaipur', 4, 2500], ['Toyota Innova (with driver)', 'SUV', 'Jaipur', 7, 3900],
  ['Maruti Swift (with driver)', 'Hatchback', 'Goa', 4, 2300], ['Mahindra XUV (with driver)', 'SUV', 'Goa', 6, 4000], ['Honda Amaze (with driver)', 'Sedan', 'Mumbai', 4, 2900],
  ['Toyota Innova (with driver)', 'SUV', 'Bengaluru', 7, 4100], ['Mahindra Scorpio (with driver)', 'SUV', 'Leh', 6, 5200], ['Toyota Innova (with driver)', 'SUV', 'Kochi', 7, 3800]
];
export const CAR_SEED: Car[] = CAR_RAW.map(([name, type, city, seats, price], i) => ({
  slug: slugify(`${name.replace(/ \(with driver\)/, '')} ${city}`), name, type, city, seats, price, img: IMG.car[i % IMG.car.length], active: true,
  about: `${type} for up to ${seats} people with an experienced driver. Fuel, driver allowance and tolls are in the rate for up to 250 km per day. Extra km are charged by the driver.`
}));

const CARRIERS: [string, string][] = [['SkyIndia', 'SI'], ['Deccan Wings', 'DW']];
// from, to, base fare, minutes, operating days (undefined = daily)
const ROUTES: [string, string, number, number, number[]?][] = [
  ['Delhi', 'Mumbai', 5200, 130], ['Delhi', 'Bengaluru', 6100, 170], ['Delhi', 'Goa', 6400, 175], ['Delhi', 'Jaipur', 2900, 65], ['Delhi', 'Kolkata', 5600, 140],
  ['Delhi', 'Chennai', 6500, 175], ['Delhi', 'Hyderabad', 5400, 130], ['Delhi', 'Varanasi', 4300, 90], ['Delhi', 'Leh', 7200, 90, [1, 3, 5, 0]], ['Delhi', 'Udaipur', 4100, 85],
  ['Mumbai', 'Goa', 3200, 70], ['Mumbai', 'Bengaluru', 4300, 105], ['Mumbai', 'Kochi', 5200, 125], ['Bengaluru', 'Goa', 3600, 70], ['Bengaluru', 'Chennai', 2700, 55],
  ['Hyderabad', 'Bengaluru', 3100, 75], ['Kolkata', 'Varanasi', 4400, 85, [1, 2, 4, 6]], ['Chennai', 'Kochi', 3400, 75]
];
const DEPS = [['06:30', 0], ['10:15', 1], ['14:40', 0], ['19:20', 1]] as const;
export const FLIGHT_SEED: Flight[] = ROUTES.flatMap(([a, b, fare, mins, days], r) =>
  [[a, b], [b, a]].flatMap(([from, to], dir) =>
    [0, 1].map(k => {
      const [dep, ci] = DEPS[(r + dir * 2 + k * 2) % DEPS.length];
      const [airline, code] = CARRIERS[(ci + k) % CARRIERS.length]; // the two daily flights on a route use different airlines
      const num = 100 + r * 10 + dir * 5 + k;
      return { slug: `${code.toLowerCase()}-${num}-${CITIES[from].toLowerCase()}-${CITIES[to].toLowerCase()}`, airline, flightNo: `${code} ${num}`, from, to, dep, duration: mins, price: Math.round((fare * (k ? 1.12 : 1)) / 50) * 50, days: days ?? [0, 1, 2, 3, 4, 5, 6], active: true };
    })));

/* ---------------- database mapping ---------------- */
type Def = { table: string; cols: string[]; json: string[]; bool: string[] };
const DEF: Record<Kind, Def> = {
  hotel: { table: 'hotels', cols: ['name', 'city', 'state', 'stars', 'price', 'amenities', 'about', 'img', 'active'], json: ['amenities'], bool: ['active'] },
  flight: { table: 'flights', cols: ['airline', 'flight_no', 'from_city', 'to_city', 'dep', 'duration', 'price', 'days', 'active'], json: ['days'], bool: ['active'] },
  car: { table: 'cars', cols: ['name', 'type', 'city', 'seats', 'price', 'about', 'img', 'active'], json: [], bool: ['active'] }
};
export const KIND_PATH: Record<Kind, string> = { hotel: 'hotels', flight: 'flights', car: 'cars' };

type R = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const fromRow = (kind: Kind, r: R): Item => {
  const j = (v: string) => JSON.parse(v);
  if (kind === 'hotel') return { slug: r.slug, name: r.name, city: r.city, state: r.state, stars: r.stars, price: r.price, amenities: j(r.amenities), about: r.about, img: r.img, active: !!r.active };
  if (kind === 'flight') return { slug: r.slug, airline: r.airline, flightNo: r.flight_no, from: r.from_city, to: r.to_city, dep: r.dep, duration: r.duration, price: r.price, days: j(r.days), active: !!r.active };
  return { slug: r.slug, name: r.name, type: r.type, city: r.city, seats: r.seats, price: r.price, about: r.about, img: r.img, active: !!r.active };
};
const toRow = (kind: Kind, it: Item): unknown[] => {
  const x = it as R;
  const v: R = kind === 'flight' ? { ...x, flight_no: x.flightNo, from_city: x.from, to_city: x.to } : x;
  return DEF[kind].cols.map(c => (DEF[kind].json.includes(c) ? JSON.stringify(v[c]) : DEF[kind].bool.includes(c) ? (v[c] ? 1 : 0) : v[c]));
};

export async function listItems<T extends Item = Item>(kind: Kind, activeOnly = true): Promise<T[]> {
  const rows = await q(`SELECT * FROM ${DEF[kind].table} ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort, slug`);
  return rows.map(r => fromRow(kind, r)) as T[];
}

export async function getItem<T extends Item = Item>(kind: Kind, slug: string, activeOnly = true): Promise<T | undefined> {
  const r = await one(`SELECT * FROM ${DEF[kind].table} WHERE slug = $1`, [slug]);
  if (!r || (activeOnly && !r.active)) return undefined;
  return fromRow(kind, r) as T;
}

export async function saveItem(kind: Kind, it: Item, create: boolean) {
  const d = DEF[kind], vals = toRow(kind, it);
  if (create) {
    const m = await one<{ m: number }>(`SELECT COALESCE(MAX(sort),0) AS m FROM ${d.table}`);
    await run(`INSERT INTO ${d.table} (${d.cols.join(',')},slug,sort) VALUES (${[...d.cols, 'slug', 'sort'].map((_, i) => `$${i + 1}`).join(',')})`, [...vals, it.slug, (m?.m ?? 0) + 1]);
  } else {
    await run(`UPDATE ${d.table} SET ${d.cols.map((c, i) => `${c}=$${i + 1}`).join(',')} WHERE slug=$${d.cols.length + 1}`, [...vals, it.slug]);
  }
}

/** Seeds the three catalogs the first time (empty tables only). */
export async function seedCatalog(c: Conn) {
  const seeds: [Kind, Item[]][] = [['hotel', HOTEL_SEED], ['flight', FLIGHT_SEED], ['car', CAR_SEED]];
  for (const [kind, items] of seeds) {
    const d = DEF[kind];
    const n = await c.one<{ n: number }>(`SELECT COUNT(*) AS n FROM ${d.table}`);
    if (Number(n?.n) > 0) continue;
    for (const [i, it] of items.entries())
      await c.run(`INSERT INTO ${d.table} (${[...d.cols, 'slug', 'sort'].join(',')}) VALUES (${[...d.cols, 'slug', 'sort'].map((_, k) => `$${k + 1}`).join(',')}) ON CONFLICT (slug) DO NOTHING`, [...toRow(kind, it), it.slug, i]);
  }
}

/* ---------------- search ---------------- */
const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

export async function searchHotels(p: { city?: string; maxPrice?: number; stars?: number; sort?: string }) {
  const c = norm(p.city);
  let r = (await listItems<Hotel>('hotel')).filter(h => (!c || `${h.city} ${h.state} ${h.name}`.toLowerCase().includes(c)) && (!p.maxPrice || h.price <= p.maxPrice) && (!p.stars || h.stars >= p.stars));
  if (p.sort === 'low') r = r.sort((a, b) => a.price - b.price);
  else if (p.sort === 'high') r = r.sort((a, b) => b.price - a.price);
  else if (p.sort === 'stars') r = r.sort((a, b) => b.stars - a.stars || a.price - b.price);
  return r;
}

export async function searchFlights(p: { from?: string; to?: string; date?: string; sort?: string }) {
  const f = norm(p.from), t = norm(p.to);
  const wd = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? weekday(p.date) : null;
  const match = (city: string, s: string) => !s || city.toLowerCase().startsWith(s) || CITIES[city]?.toLowerCase() === s;
  let r = (await listItems<Flight>('flight')).filter(x => match(x.from, f) && match(x.to, t) && (wd === null || x.days.includes(wd)));
  r = p.sort === 'price' ? r.sort((a, b) => a.price - b.price) : r.sort((a, b) => a.dep.localeCompare(b.dep));
  return r;
}

export async function searchCars(p: { city?: string; type?: string; sort?: string }) {
  const c = norm(p.city);
  let r = (await listItems<Car>('car')).filter(x => (!c || x.city.toLowerCase().includes(c)) && (!p.type || x.type === p.type));
  if (p.sort === 'high') r = r.sort((a, b) => b.price - a.price); else r = r.sort((a, b) => a.price - b.price);
  return r;
}
