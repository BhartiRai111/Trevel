export type DestType = 'mountain' | 'beach' | 'heritage' | 'spiritual' | 'nature';

export type Destination = {
  slug: string;
  name: string;
  state: string;
  type: DestType;
  days: number;
  /** sample price per person in INR, before GST (replace with your real package prices) */
  price: number;
  bestTime: string;
  tagline: string;
  about: string;
  highlights: string[];
  /** Unsplash photo id, or a full https image URL */
  img: string;
  itinerary: { title: string; text: string }[];
  active: boolean;
  /** what to see, eat and do, plus visitor information (sample content, editable in /admin) */
  explore: Explore;
  /** booking options (Standard, Comfort, Premium); prices are the destination price times `mult` */
  packages: Pkg[];
};

export type ExploreKind = 'see' | 'food' | 'do';
export type ExploreItem = { kind: ExploreKind; type: string; name: string; text: string; img: string };
export type Explore = { items: ExploreItem[]; info: { howToReach: string; gettingAround: string; tips: string[] } };
export type Pkg = { id: string; name: string; text: string; includes: string[]; mult: number };

export const EXPLORE_KIND_LABEL: Record<ExploreKind, string> = { see: 'Places to see', food: 'Food and cafés', do: 'Things to do' };
export const EMPTY_EXPLORE: Explore = { items: [], info: { howToReach: '', gettingAround: '', tips: [] } };

/** Three standard tiers. Standard is always the destination price itself (mult 1). */
export const DEFAULT_PACKAGES: Pkg[] = [
  { id: 'standard', name: 'Standard', mult: 1, text: 'Comfortable stay and the essentials, shared transfers.',
    includes: ['Comfortable 3-star hotel stay', 'Daily breakfast', 'Local guide for sightseeing', 'Airport or station pickup and drop', 'Local transfers in a shared vehicle'] },
  { id: 'comfort', name: 'Comfort', mult: 1.4, text: 'A better hotel, dinners and a private car for sightseeing.',
    includes: ['Upgraded 4-star hotel stay', 'Breakfast and dinner', 'Private car for sightseeing', 'Local guide', 'Airport or station pickup and drop', 'One activity of your choice'] },
  { id: 'premium', name: 'Premium', mult: 1.9, text: 'Premium stay, all meals and a private driver all through the trip.',
    includes: ['Premium 5-star or boutique stay', 'All meals', 'Private car with driver for the whole trip', 'Expert guide', 'Airport or station pickup and drop', 'Two activities of your choice', 'Priority support during the trip'] }
];


export const TYPE_LABEL: Record<DestType, string> = {
  mountain: 'Mountains', beach: 'Beaches', heritage: 'Heritage', spiritual: 'Spiritual', nature: 'Nature & Adventure'
};

export const img = (id: string, w = 900, q = 75) =>
  /^https?:\/\//.test(id) ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const INCLUSIONS = ['Hotel stay with breakfast', 'Local guide', 'Airport / station pickup and drop', 'All local transfers'];

/** Simple day-by-day plan built from the highlights. Admin can edit it per destination. */
export function makeItinerary(d: Pick<Destination, 'name' | 'days' | 'highlights'>) {
  const out: { title: string; text: string }[] = [];
  for (let i = 0; i < d.days; i++) {
    if (i === 0) out.push({ title: `Arrive in ${d.name}`, text: 'Pickup from the airport or station, hotel check-in and a relaxed evening to settle in.' });
    else if (i === d.days - 1) out.push({ title: 'Departure', text: 'Breakfast, check-out and drop to the airport or station.' });
    else {
      const h = d.highlights[i - 1];
      out.push(h ? { title: h, text: `Guided visit: ${h}. Lunch and rest breaks are planned around it.` }
        : { title: 'Free day', text: 'Explore at your own pace, or add an optional activity with your guide.' });
    }
  }
  return out;
}
