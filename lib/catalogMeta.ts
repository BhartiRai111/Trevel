/** Plain constants and types for hotels, flights and cars. No database code, so browser components can import it. */
export type Kind = 'hotel' | 'flight' | 'car';
export type Hotel = { slug: string; name: string; city: string; state: string; stars: number; price: number; amenities: string[]; about: string; img: string; active: boolean };
export type Flight = { slug: string; airline: string; flightNo: string; from: string; to: string; dep: string; duration: number; price: number; days: number[]; active: boolean };
export type Car = { slug: string; name: string; type: string; city: string; seats: number; price: number; about: string; img: string; active: boolean };
export type Item = Hotel | Flight | Car;

export const CAR_TYPES = ['Hatchback', 'Sedan', 'SUV', 'Tempo Traveller'];
export const CITIES: Record<string, string> = {
  Delhi: 'DEL', Mumbai: 'BOM', Bengaluru: 'BLR', Goa: 'GOI', Jaipur: 'JAI', Kolkata: 'CCU', Chennai: 'MAA',
  Hyderabad: 'HYD', Kochi: 'COK', Leh: 'IXL', Varanasi: 'VNS', Udaipur: 'UDR'
};
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "07:30" + 95 minutes -> "09:05" */
export function arrival(dep: string, duration: number) {
  const [h, m] = dep.split(':').map(Number);
  const t = (h * 60 + m + duration) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
export const fmtDuration = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;

