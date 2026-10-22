/** GST on tour packages (5%). Change here if your tax setup differs. */
export const GST_RATE = 0.05;

export type Quote = { base: number; gst: number; fee: number; total: number; rate: number };
const make = (base: number, rate: number): Quote => { const gst = Math.round(base * rate); return { base, gst, fee: 0, total: base + gst, rate }; };

export const quote = (pricePerPerson: number, travellers: number) => make(pricePerPerson * travellers, GST_RATE);

/** Hotel GST depends on the room rate per night: up to ₹1,000 nil, ₹1,001 to ₹7,500 12%, above ₹7,500 18%. */
export const hotelGstRate = (ratePerNight: number) => (ratePerNight <= 1000 ? 0 : ratePerNight <= 7500 ? 0.12 : 0.18);
export const quoteHotel = (ratePerNight: number, nights: number, rooms: number) => make(ratePerNight * nights * rooms, hotelGstRate(ratePerNight));

/** Economy air fare: 5% GST. */
export const quoteFlight = (farePerPerson: number, passengers: number) => make(farePerPerson * passengers, 0.05);

/** Car with driver, rented per day: 5% GST. */
export const quoteCar = (ratePerDay: number, days: number) => make(ratePerDay * days, 0.05);

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

const DAY = 864e5;
/** Whole days from one yyyy-mm-dd to another (negative if reversed). */
export const daysBetween = (from: string, to: string) => Math.round((new Date(to + 'T00:00:00Z').getTime() - new Date(from + 'T00:00:00Z').getTime()) / DAY);
/** 0 = Sunday ... 6 = Saturday for a yyyy-mm-dd date. */
export const weekday = (d: string) => new Date(d + 'T00:00:00Z').getUTCDay();
