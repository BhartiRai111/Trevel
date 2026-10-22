export type Place = { name: string; type: 'mountain' | 'beach' | 'city'; price: number; img: string; country: string };

export const unsplash = (id: string, w = 800, q = 75) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const PLACES: Place[] = [
  { name: 'Hill Track National Park', type: 'mountain', price: 120, img: 'photo-1464822759023-fed622ff2c3b', country: 'Hawaii' },
  { name: 'Swiss Alps', type: 'mountain', price: 340, img: 'photo-1506905925346-21bda4d32df4', country: 'Switzerland' },
  { name: 'Starlit Peaks', type: 'mountain', price: 180, img: 'photo-1519681393784-d120267933ba', country: 'Canada' },
  { name: 'Mirror Lake', type: 'mountain', price: 150, img: 'photo-1501785888041-af3ef285b470', country: 'Italy' },
  { name: 'Sunset Shore', type: 'beach', price: 210, img: 'photo-1507525428034-b723cf961d3e', country: 'Maldives' },
  { name: 'Bali Terraces', type: 'beach', price: 190, img: 'photo-1537996194471-e657df975ab4', country: 'Indonesia' },
  { name: 'Paris Nights', type: 'city', price: 290, img: 'photo-1502602898657-3e91760cbb34', country: 'France' },
  { name: 'Venice Canals', type: 'city', price: 260, img: 'photo-1523906834658-6e24ef2386f9', country: 'Italy' }
];

export const HERO_SLIDES = [
  'photo-1506905925346-21bda4d32df4',
  'photo-1507525428034-b723cf961d3e',
  'photo-1464822759023-fed622ff2c3b',
  'photo-1501785888041-af3ef285b470'
];
