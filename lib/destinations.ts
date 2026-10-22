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
  img: string; // Unsplash photo id, see img() below
};

export const TYPE_LABEL: Record<DestType, string> = {
  mountain: 'Mountains', beach: 'Beaches', heritage: 'Heritage', spiritual: 'Spiritual', nature: 'Nature & Adventure'
};

export const img = (id: string, w = 900, q = 75) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const INCLUSIONS = ['Hotel stay with breakfast', 'Local guide', 'Airport / station pickup and drop', 'All local transfers'];

export const DESTINATIONS: Destination[] = [
  { slug: 'ladakh-leh', name: 'Leh Ladakh', state: 'Ladakh', type: 'mountain', days: 7, price: 32000, bestTime: 'Jun to Sep', img: 'photo-1626015365107-2cfd4e8e3e19',
    tagline: 'High passes, blue lakes and monasteries.', about: 'A week above 3,000 metres: Leh town, Nubra Valley, Pangong Lake and the monasteries in between. Days are planned slowly so your body can adjust to the altitude.',
    highlights: ['Pangong Lake at sunrise', 'Khardung La pass', 'Nubra Valley sand dunes', 'Thiksey Monastery'] },
  { slug: 'manali-snow', name: 'Manali', state: 'Himachal Pradesh', type: 'mountain', days: 5, price: 15000, bestTime: 'Mar to Jun, Dec to Feb', img: 'photo-1626621341517-bbf3d9990a23',
    tagline: 'Pine forests, snow and the Beas river.', about: 'Five relaxed days in the Kullu Valley with Solang, Old Manali and a day trip towards Atal Tunnel. Suitable for families and first-time hill travellers.',
    highlights: ['Solang Valley', 'Old Manali cafes', 'Hadimba Temple', 'Atal Tunnel and Sissu'] },
  { slug: 'darjeeling-hills', name: 'Darjeeling', state: 'West Bengal', type: 'mountain', days: 4, price: 14000, bestTime: 'Mar to May, Oct to Nov', img: 'photo-1544634076-a90160972d6b',
    tagline: 'Tea gardens and Kanchenjunga sunrise.', about: 'Toy train ride, Tiger Hill sunrise, tea estate visit and the Himalayan Mountaineering Institute, with time to just sit with a cup of Darjeeling tea.',
    highlights: ['Tiger Hill sunrise', 'Toy train ride', 'Happy Valley tea estate', 'Batasia Loop'] },
  { slug: 'goa-beaches', name: 'Goa', state: 'Goa', type: 'beach', days: 4, price: 13500, bestTime: 'Nov to Feb', img: 'photo-1512343879784-a960bf40e7f2',
    tagline: 'Beaches, Portuguese lanes and seafood.', about: 'North and South Goa in four days: beaches, Old Goa churches, Fontainhas lanes and sunset cruises. A good mix of quiet and lively.',
    highlights: ['Baga and Palolem beaches', 'Old Goa churches', 'Fontainhas Latin Quarter', 'Sunset river cruise'] },
  { slug: 'andaman-islands', name: 'Andaman Islands', state: 'Andaman and Nicobar', type: 'beach', days: 6, price: 38000, bestTime: 'Oct to May', img: 'photo-1589197331516-4d84b72ebde3',
    tagline: 'Clear water, coral reefs and white sand.', about: 'Port Blair, Havelock and Neil Island with snorkelling, Radhanagar Beach and the Cellular Jail light show. Ferry tickets are part of the plan.',
    highlights: ['Radhanagar Beach', 'Snorkelling at Elephant Beach', 'Cellular Jail light show', 'Neil Island'] },
  { slug: 'taj-mahal-agra', name: 'Agra and the Taj Mahal', state: 'Uttar Pradesh', type: 'heritage', days: 3, price: 8500, bestTime: 'Oct to Mar', img: 'photo-1564507592333-c60657eea523',
    tagline: 'The Taj at sunrise, and a Mughal capital.', about: 'Sunrise at the Taj Mahal, Agra Fort, Mehtab Bagh and a day at Fatehpur Sikri. Entry tickets are handled for you so you skip the queue confusion.',
    highlights: ['Taj Mahal sunrise', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh sunset view'] },
  { slug: 'jaipur-pink-city', name: 'Jaipur', state: 'Rajasthan', type: 'heritage', days: 4, price: 12000, bestTime: 'Oct to Mar', img: 'photo-1477587458883-47145ed94245',
    tagline: 'Forts, palaces and bazaars.', about: 'Amber Fort, City Palace, Hawa Mahal and the Johari and Bapu bazaars. Includes an evening at Chokhi Dhani and an optional elephant-free fort visit.',
    highlights: ['Amber Fort', 'City Palace and Hawa Mahal', 'Jantar Mantar', 'Bapu Bazaar shopping'] },
  { slug: 'udaipur-lakes', name: 'Udaipur', state: 'Rajasthan', type: 'heritage', days: 4, price: 14500, bestTime: 'Sep to Mar', img: 'photo-1599661046289-e31897846e41',
    tagline: 'The city of lakes and palaces.', about: 'City Palace, a Lake Pichola boat ride, Saheliyon ki Bari and a day trip to Kumbhalgarh. Evenings on the ghats are the highlight.',
    highlights: ['City Palace', 'Lake Pichola boat ride', 'Kumbhalgarh Fort', 'Jagdish Temple'] },
  { slug: 'hampi-ruins', name: 'Hampi', state: 'Karnataka', type: 'heritage', days: 3, price: 8000, bestTime: 'Oct to Feb', img: 'photo-1620766182966-c6eb5ed2b788',
    tagline: 'Boulders, temples and a lost empire.', about: 'Explore the Vijayanagara ruins by cycle and coracle: Virupaksha Temple, the Stone Chariot, Hemakuta Hill and sunset at Matanga Hill.',
    highlights: ['Virupaksha Temple', 'Vittala Temple and Stone Chariot', 'Coracle ride', 'Matanga Hill sunset'] },
  { slug: 'varanasi-ghats', name: 'Varanasi', state: 'Uttar Pradesh', type: 'spiritual', days: 3, price: 7500, bestTime: 'Oct to Mar', img: 'photo-1561361513-2d000a50f0dc',
    tagline: 'Ganga aarti and the oldest living city.', about: 'Dawn boat ride on the Ganga, evening aarti at Dashashwamedh Ghat, Sarnath and the old lanes with a local guide who explains what you are seeing.',
    highlights: ['Sunrise boat ride', 'Ganga aarti', 'Sarnath', 'Old city food walk'] },
  { slug: 'rishikesh-adventure', name: 'Rishikesh', state: 'Uttarakhand', type: 'nature', days: 3, price: 9000, bestTime: 'Sep to Jun', img: 'photo-1600100397608-f010b5bb1ea5',
    tagline: 'Rafting, yoga and the Ganga.', about: 'River rafting, a yoga session, Laxman Jhula, the evening aarti at Triveni Ghat and a short trek. Safety gear and certified guides are included.',
    highlights: ['White-water rafting', 'Morning yoga session', 'Laxman Jhula', 'Triveni Ghat aarti'] },
  { slug: 'kerala-backwaters', name: 'Kerala Backwaters', state: 'Kerala', type: 'nature', days: 5, price: 21000, bestTime: 'Sep to Mar', img: 'photo-1602216056096-3b40cc0c9944',
    tagline: 'Houseboats, tea hills and spice gardens.', about: 'Kochi, Munnar and a night on a houseboat in Alleppey. Slow days with tea estates, spice plantations and Kerala meals.',
    highlights: ['Alleppey houseboat night', 'Munnar tea gardens', 'Fort Kochi', 'Spice plantation walk'] }
];

export const bySlug = (slug: string) => DESTINATIONS.find(d => d.slug === slug);
