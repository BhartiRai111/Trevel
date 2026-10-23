import photoData from './photoManifest.json';
import { DEFAULT_PACKAGES, makeItinerary, type Destination, type Explore, type ExploreItem, type ExploreKind } from './destinations';

/**
 * Starting data for the 12 destinations (server only; copied into the database on first run, then edited in /admin).
 * Everything here is SAMPLE information written for demonstration. It is not verified live data:
 * no ratings, no restaurant prices, no availability. Check opening times, permits and prices before you go.
 */
type Raw = Omit<Destination, 'itinerary' | 'active' | 'explore' | 'packages' | 'gallery'>;

const RAW: Raw[] = [
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

/* ---------- guide content: [kind, type, name, description] ---------- */
type Row = [ExploreKind, string, string, string];
type Guide = { items: Row[]; reach: string; around: string; tips: string[] };

const GUIDE: Record<string, Guide> = {
  'goa-beaches': {
    items: [
      ['see', 'Beach', 'Baga and Calangute beaches', 'The busiest stretch of North Goa: golden sand, beach shacks, music in the evening and every kind of water sport.'],
      ['see', 'Beach', 'Palolem Beach', 'A calm crescent bay in South Goa with gentle water, hills at both ends and a relaxed, quieter feel.'],
      ['see', 'Fort', 'Fort Aguada', 'A 17th-century Portuguese fort above the sea at Sinquerim, with a lighthouse and wide views of the Arabian Sea.'],
      ['see', 'Church', 'Basilica of Bom Jesus, Old Goa', 'A UNESCO World Heritage church that holds the remains of St Francis Xavier, among other old Portuguese-era churches nearby.'],
      ['see', 'Heritage', 'Fontainhas Latin Quarter, Panaji', 'Narrow lanes of colourful Portuguese-style houses, small chapels and cafés that are best explored on foot.'],
      ['see', 'Waterfall', 'Dudhsagar Falls', 'A tall, four-tiered waterfall on the Goa-Karnataka border, reached by jeep from Mollem. It is strongest after the monsoon.'],
      ['food', 'Local food', 'Goan fish curry and rice', 'The everyday Goan meal: a tangy coconut and kokum curry with rice, served in homes and local eateries across the state.'],
      ['food', 'Local food', 'Bebinca and Goan sweets', 'A layered coconut and egg dessert that is traditional at Christmas and sold in bakeries all year.'],
      ['food', 'Restaurant', 'Beach shacks', 'Casual seafood and drinks right on the sand at Baga, Palolem and other beaches. Most shacks run from October to May only.'],
      ['do', 'Activity', 'Sunset river cruise on the Mandovi', 'An evening boat ride with Goan music and dance, popular with first-time visitors.'],
      ['do', 'Activity', 'Water sports at Baga', 'Parasailing, jet-ski and banana-boat rides run by licensed operators in the season.'],
      ['do', 'Activity', 'Spice plantation visit, Ponda', 'A guided walk through spice gardens, followed by a traditional Goan lunch at many plantations.']
    ],
    reach: 'Goa has two airports: Dabolim (GOI) in the south and Manohar International (GOX) at Mopa in the north. Madgaon and Thivim are the main railway stations.',
    around: 'Hire a scooter or a taxi for the day. Distances between North and South Goa are longer than they look, so plan one area per day.',
    tips: ['Beach shacks and water sports are seasonal, roughly October to May.', 'Dress modestly when you visit churches and temples.', 'Swim only where lifeguards and flags are present.']
  },
  'manali-snow': {
    items: [
      ['see', 'Valley', 'Solang Valley', 'A wide meadow that turns into a ski slope in winter and a paragliding spot in summer, with mountain views all around.'],
      ['see', 'Temple', 'Hadimba Devi Temple', 'A wooden temple built among tall cedar trees, dedicated to Hidimba Devi. It is one of the best-known sights of Manali.'],
      ['see', 'Pass', 'Atal Tunnel and Sissu', 'A long highway tunnel under the Rohtang range that opens up the Lahaul side, with the quiet village of Sissu just beyond.'],
      ['see', 'Pass', 'Rohtang Pass', 'A high mountain pass with snow for much of the year. Entry is permit-controlled and seasonal, so check before planning.'],
      ['see', 'Village', 'Old Manali', 'A hillside village of apple orchards, guest houses and cafés above the Manali bazaar.'],
      ['see', 'Springs', 'Vashisht village and hot springs', 'A village known for its natural hot water springs and old stone temples, a short ride from town.'],
      ['food', 'Local food', 'Siddu with ghee', 'A steamed, stuffed Himachali bread eaten hot with ghee and chutney, a local favourite.'],
      ['food', 'Local food', 'River trout', 'Freshly cooked trout from the cold streams of the Beas valley, served at riverside restaurants.'],
      ['food', 'Café', 'Old Manali cafés', 'Cosy cafés with river views, wood-fired pizza, fresh bakes and hot chocolate for cold evenings.'],
      ['do', 'Activity', 'Paragliding at Solang', 'Tandem flights with trained pilots in good weather, with views across the valley.'],
      ['do', 'Activity', 'River rafting on the Beas', 'A short rafting stretch near Kullu in the warmer months, suitable for beginners.'],
      ['do', 'Activity', 'Short forest walks', 'Easy walks through cedar and pine forest around Manali, good for a slow morning.']
    ],
    reach: 'The nearest airport is Bhuntar (Kullu), about 50 km away. Many travellers come by road from Delhi or Chandigarh, an overnight or long day journey.',
    around: 'Local taxis run on fixed-rate lists. Walking is easy inside Old Manali and the Mall Road area.',
    tips: ['Rohtang Pass needs a permit and is closed for much of winter.', 'Carry warm clothes even in summer evenings.', 'Landslides can delay roads in the monsoon, so keep spare time.']
  },
  'darjeeling-hills': {
    items: [
      ['see', 'Viewpoint', 'Tiger Hill sunrise', 'A very early start for the sunrise over the Kanchenjunga range on clear mornings. Clouds can hide the view, so go with patience.'],
      ['see', 'Railway', 'Batasia Loop and War Memorial', 'A spiral section of the Darjeeling Himalayan Railway with a garden, a memorial and views of the peaks.'],
      ['see', 'Railway', 'Darjeeling Himalayan Railway', 'The narrow-gauge "Toy Train", a UNESCO World Heritage railway, which still runs steam and diesel joy rides.'],
      ['see', 'Tea estate', 'Happy Valley Tea Estate', 'A working tea estate close to town where you can see how the leaf is plucked and processed.'],
      ['see', 'Temple', 'Peace Pagoda', 'A white Buddhist stupa on a hillside, calm and quiet, with a view over the town.'],
      ['see', 'Museum', 'Himalayan Mountaineering Institute and Zoo', 'A museum about mountaineering with the zoo next door, which breeds snow leopards and red pandas.'],
      ['food', 'Local food', 'Momos and thukpa', 'Steamed dumplings and hot noodle soup, the best comfort food on a cold hill evening.'],
      ['food', 'Café', 'Darjeeling tea lounges', 'Tea rooms and cafés where you can taste first-flush and second-flush teas with snacks.'],
      ['food', 'Local food', 'Tibetan bread and local thali', 'Simple, filling Tibetan and Nepali-style meals served in small family-run restaurants.'],
      ['do', 'Activity', 'Toy train joy ride', 'A short ride on the heritage railway between Darjeeling and Ghum.'],
      ['do', 'Activity', 'Tea garden walk', 'A guided walk between the tea rows with a tasting at the end.'],
      ['do', 'Activity', 'Mall Road stroll and shopping', 'Local tea, woollens and handicrafts around Chowrasta, the town square.']
    ],
    reach: 'The nearest airport is Bagdogra (IXB) and the nearest main railway station is New Jalpaiguri (NJP). Both are a few hours away by road.',
    around: 'Shared jeeps and taxis connect the main points. The town centre is best explored on foot.',
    tips: ['Tiger Hill needs a very early start, usually before 4 am.', 'Mist is common, so keep a flexible plan for views.', 'Carry a light jacket even in summer.']
  },
  'ladakh-leh': {
    items: [
      ['see', 'Lake', 'Pangong Tso', 'A very large high-altitude lake whose colour shifts from blue to green through the day. An Inner Line Permit is needed.'],
      ['see', 'Valley', 'Nubra Valley', 'A green valley beyond Khardung La with Diskit Monastery and the sand dunes of Hunder. An Inner Line Permit is needed.'],
      ['see', 'Pass', 'Khardung La', 'One of the world\'s highest motorable passes, on the road to Nubra. Stay only briefly because of the altitude.'],
      ['see', 'Monastery', 'Thiksey Monastery', 'A large hilltop monastery that looks like a small palace, with morning prayers that visitors can attend quietly.'],
      ['see', 'Stupa', 'Shanti Stupa, Leh', 'A white-domed stupa above Leh town, popular at sunset with a wide view of the valley.'],
      ['see', 'Palace', 'Leh Palace', 'A nine-storey former royal palace above the old town, with views over the rooftops and the surrounding peaks.'],
      ['food', 'Local food', 'Thukpa and momos', 'Hot noodle soup and dumplings, easy to find in Leh and a good choice at altitude.'],
      ['food', 'Local food', 'Butter tea and skyu', 'Salted butter tea and a hearty wheat-pasta stew, traditional Ladakhi food worth trying once.'],
      ['food', 'Café', 'Leh Main Bazaar cafés', 'Rooftop cafés and German-style bakeries serving coffee, pastries and light meals.'],
      ['do', 'Activity', 'Camel ride at Hunder', 'A short ride on double-humped camels across the dunes in Nubra.'],
      ['do', 'Activity', 'River rafting on the Indus or Zanskar', 'Rafting in the summer months, from easy to more adventurous stretches.'],
      ['do', 'Activity', 'Stargazing', 'Ladakh\'s clear, dry air gives very dark skies and a bright view of the stars away from the town lights.']
    ],
    reach: 'Fly into Leh (Kushok Bakula Rimpochee Airport, IXL). The Manali-Leh and Srinagar-Leh roads are open mainly in summer.',
    around: 'Local taxi unions run fixed-rate trips to the main sights. Longer trips like Pangong and Nubra are done with a vehicle and driver.',
    tips: ['Rest for the first 24 to 48 hours to adjust to the altitude.', 'Inner Line Permits are needed for Pangong and Nubra. Your team can arrange them.', 'Carry cash. ATMs and mobile network are limited outside Leh.']
  },
  'andaman-islands': {
    items: [
      ['see', 'Beach', 'Radhanagar Beach, Havelock', 'A long white-sand beach with clear water and forest behind it, often named among the finest beaches in Asia.'],
      ['see', 'Heritage', 'Cellular Jail, Port Blair', 'The colonial-era prison and national memorial, with a light and sound show in the evening telling its story.'],
      ['see', 'Beach', 'Elephant Beach', 'A short boat ride from Havelock, known for snorkelling over shallow coral.'],
      ['see', 'Island', 'Neil Island (Shaheed Dweep)', 'A small, quiet island with Bharatpur Beach, natural coral formations and slow village life.'],
      ['see', 'Ruins', 'Ross Island', 'The ruined former British headquarters, now covered in roots and trees, with deer wandering through.'],
      ['see', 'Beach', 'Chidiya Tapu', 'A sunset spot at the southern tip of South Andaman, good for birdwatching.'],
      ['food', 'Local food', 'Fresh seafood', 'Grilled fish, prawns and crab, usually the catch of the day, served at small restaurants on the islands.'],
      ['food', 'Café', 'Havelock beach cafés', 'Relaxed cafés near Beach No. 2 and Govind Nagar with coffee, smoothies and light meals.'],
      ['do', 'Activity', 'Snorkelling and scuba diving', 'Guided dives and snorkelling trips for beginners with certified instructors.'],
      ['do', 'Activity', 'Glass-bottom boat ride', 'See coral and fish without getting wet, a good option for children.'],
      ['do', 'Activity', 'Island hopping by ferry', 'Government and private ferries link Port Blair, Havelock and Neil Island.']
    ],
    reach: 'Fly to Veer Savarkar International Airport, Port Blair (IXZ). Ferries connect Port Blair with Havelock and Neil Island.',
    around: 'Taxis and scooters on the islands. Ferry tickets should be booked ahead and depend on weather.',
    tips: ['Ferries can be cancelled in rough weather, so avoid a very tight return plan.', 'Carry cash and ID. ATMs and mobile signal are limited on the smaller islands.', 'Use reef-safe sunscreen and do not touch or remove coral.']
  },
  'taj-mahal-agra': {
    items: [
      ['see', 'Monument', 'Taj Mahal', 'The white marble tomb built by Shah Jahan, best seen at sunrise. It is closed to visitors on Fridays.'],
      ['see', 'Fort', 'Agra Fort', 'A red sandstone Mughal fort with palaces, courtyards and a view of the Taj from its walls.'],
      ['see', 'Heritage', 'Fatehpur Sikri', 'The abandoned Mughal capital built by Akbar, a well-preserved city of courtyards and palaces, about 40 km from Agra.'],
      ['see', 'Garden', 'Mehtab Bagh', 'A garden across the Yamuna from the Taj with a calm, wide view, especially at sunset.'],
      ['see', 'Tomb', 'Itimad-ud-Daulah', 'A small marble tomb with fine inlay work, often called the "Baby Taj".'],
      ['see', 'Tomb', 'Akbar\'s Tomb, Sikandra', 'The large red sandstone tomb of Emperor Akbar, set in quiet gardens.'],
      ['food', 'Local food', 'Petha', 'Agra\'s famous translucent sweet made from ash gourd, sold in plain and flavoured varieties.'],
      ['food', 'Local food', 'Bedai and jalebi breakfast', 'A traditional breakfast of fried bread with spiced potato curry, followed by hot jalebi.'],
      ['food', 'Restaurant', 'Mughlai restaurants near Sadar Bazaar', 'Kebabs, biryani and rich curries in the Mughal tradition.'],
      ['do', 'Activity', 'Sunrise visit to the Taj', 'Arrive early to avoid heat and crowds. Tickets can be bought online.'],
      ['do', 'Activity', 'Marble inlay workshop', 'See craftspeople make pietra dura work using the same technique as the Taj.'],
      ['do', 'Activity', 'Old city walk', 'A guided walk through the bazaars near Kinari Bazaar for food and crafts.']
    ],
    reach: 'Agra has a railway link with Delhi, about two to three hours by fast train. The nearest airport is in Agra, and Delhi is also an option.',
    around: 'Auto-rickshaws, app cabs and hired cars. The area near the Taj Mahal has restrictions on petrol vehicles, so you may need to walk or use an electric vehicle for the last stretch.',
    tips: ['The Taj Mahal is closed on Fridays.', 'Book tickets online and carry a valid photo ID.', 'Start early. Mid-day summer heat is strong.']
  },
  'jaipur-pink-city': {
    items: [
      ['see', 'Fort', 'Amber Fort', 'A hilltop fort-palace of sandstone and marble above Maota Lake, with mirrored halls and wide courtyards.'],
      ['see', 'Palace', 'City Palace', 'The royal residence in the old city, partly open as a museum of textiles, weapons and art.'],
      ['see', 'Monument', 'Hawa Mahal', 'The "Palace of Winds", a pink sandstone facade with hundreds of small windows, best photographed in the morning.'],
      ['see', 'Heritage', 'Jantar Mantar', 'An 18th-century astronomical observatory with giant stone instruments, a UNESCO World Heritage site.'],
      ['see', 'Fort', 'Nahargarh Fort', 'A fort on the ridge above the city, popular for sunset views over Jaipur.'],
      ['see', 'Palace', 'Jal Mahal', 'A palace in the middle of Man Sagar Lake, usually viewed from the lakeside promenade.'],
      ['food', 'Local food', 'Dal baati churma', 'The classic Rajasthani meal of baked wheat balls with lentils and a sweet crumbled churma.'],
      ['food', 'Local food', 'Pyaaz kachori and lassi', 'A crisp onion-filled snack and thick sweet lassi in a clay cup, found around the old city.'],
      ['food', 'Restaurant', 'Rajasthani thali restaurants', 'Unlimited-style thali meals in traditional settings, some with folk music in the evening.'],
      ['do', 'Activity', 'Bazaar shopping', 'Johari Bazaar for jewellery and Bapu Bazaar for textiles, footwear and handicrafts. Bargain politely.'],
      ['do', 'Activity', 'Block-printing workshop, Sanganer', 'Try hand block printing with local artisans and watch fabric being dyed.'],
      ['do', 'Activity', 'Hot-air balloon ride', 'Seasonal morning flights over the city and forts, weather permitting.']
    ],
    reach: 'Jaipur has its own airport (JAI) and a main railway station, Jaipur Junction, with frequent trains from Delhi.',
    around: 'App cabs, autos and e-rickshaws work well. A private car with a driver is convenient for the forts outside the city.',
    tips: ['Visit Amber Fort early in the morning for fewer crowds.', 'Wear comfortable shoes, there are many steps and cobbled lanes.', 'Agree on the price before using an auto or buying in a bazaar.']
  },
  'udaipur-lakes': {
    items: [
      ['see', 'Palace', 'City Palace, Udaipur', 'A large palace complex on the edge of Lake Pichola, with museums, balconies and views over the water.'],
      ['see', 'Lake', 'Lake Pichola', 'The main lake of the city, with ghats, palaces on its banks and boat rides, especially lovely at sunset.'],
      ['see', 'Palace', 'Jag Mandir', 'A lake palace on an island in Lake Pichola, reached by boat.'],
      ['see', 'Garden', 'Saheliyon-ki-Bari', 'A garden with fountains and lotus pools, once built for the ladies of the royal household.'],
      ['see', 'Fort', 'Kumbhalgarh Fort', 'A massive hill fort with a very long wall, a day trip of about 85 km from Udaipur.'],
      ['see', 'Palace', 'Monsoon Palace (Sajjangarh)', 'A hilltop palace with panoramic views over the city and lakes, best near sunset.'],
      ['food', 'Local food', 'Dal baati and Mewari thali', 'Traditional Mewar food with baked wheat balls, lentils and regional vegetable dishes.'],
      ['food', 'Restaurant', 'Lakeside rooftop restaurants', 'Rooftops around Lake Pichola with views of the City Palace, popular for dinner at sunset.'],
      ['food', 'Café', 'Old-city cafés', 'Small cafés with coffee, fresh juices and light meals along the narrow streets near the ghats.'],
      ['do', 'Activity', 'Sunset boat ride on Lake Pichola', 'A short ride past the palaces as the light changes, one of the best-loved things to do in Udaipur.'],
      ['do', 'Activity', 'Folk dance evening', 'An evening of Rajasthani music and puppetry at a heritage haveli in the old town.'],
      ['do', 'Activity', 'Rajasthani cooking class', 'Learn a few local dishes with a home cook, then eat what you make.']
    ],
    reach: 'Maharana Pratap Airport (UDR) at Dabok is about 22 km from the city. Udaipur City is the main railway station.',
    around: 'Autos and walking in the old city. Hire a car for Kumbhalgarh and day trips.',
    tips: ['Lake water levels vary with the season, so boat rides can differ.', 'Dress modestly in temples.', 'Keep a morning for the City Palace before it gets crowded.']
  },
  'hampi-ruins': {
    items: [
      ['see', 'Temple', 'Virupaksha Temple', 'A living temple still in daily use, at the western end of Hampi Bazaar and one of the oldest sights here.'],
      ['see', 'Temple', 'Vittala Temple and Stone Chariot', 'The most famous complex in Hampi, with carved pillars and the stone chariot shrine.'],
      ['see', 'Hill', 'Hemakuta Hill', 'A hill of early temples with a view across the ruins and the surrounding boulders.'],
      ['see', 'Hill', 'Matanga Hill sunrise', 'A short early climb for one of the best sunrise views over the whole site.'],
      ['see', 'Heritage', 'Lotus Mahal and Elephant Stables', 'Elegant buildings inside the royal enclosure, a mix of Hindu and Islamic styles.'],
      ['see', 'River', 'Tungabhadra river and coracles', 'The river that flows past the ruins, crossed by round coracle boats.'],
      ['food', 'Local food', 'South Indian meals on a banana leaf', 'Rice, sambar, vegetables and chutneys served in simple local restaurants.'],
      ['food', 'Café', 'Cafés across the river', 'Relaxed cafés on the Virupapur Gadde side with breakfast, coffee and a slow pace.'],
      ['do', 'Activity', 'Cycling among the ruins', 'Cycle between temples and fields, a pleasant way to cover the site in the cooler hours.'],
      ['do', 'Activity', 'Coracle ride', 'A short ride on the river in a traditional round boat, with an experienced boatman.'],
      ['do', 'Activity', 'Bouldering', 'Hampi is known among climbers for its rocks. Beginners can try it with a local guide.']
    ],
    reach: 'The nearest railway station is Hospet, about 13 km away. Nearby airports include Hubballi and Vidyanagar (Ballari).',
    around: 'Bicycles, scooters and auto-rickshaws. Many sights are spread out, so plan by area.',
    tips: ['Start early. The site is hot and open with little shade.', 'Carry water, a hat and sunscreen.', 'Remove shoes at temples and respect the places of worship.']
  },
  'varanasi-ghats': {
    items: [
      ['see', 'Ghat', 'Dashashwamedh Ghat and Ganga Aarti', 'The main ghat, where an evening aarti with lamps, chants and music is performed on the riverbank.'],
      ['see', 'Temple', 'Kashi Vishwanath Temple', 'One of the most important Shiva temples in India, in the heart of the old city.'],
      ['see', 'Heritage', 'Sarnath', 'The place where the Buddha gave his first sermon, with stupas, ruins and a museum, about 10 km from the city.'],
      ['see', 'Ghat', 'Assi Ghat', 'A quieter ghat at the southern end, popular for morning yoga, music and sunrise.'],
      ['see', 'Fort', 'Ramnagar Fort', 'A fort across the river, once the seat of the Kashi king, with a museum of vintage items.'],
      ['see', 'University', 'Banaras Hindu University', 'A large, green campus with temples and a museum, a calm break from the old lanes.'],
      ['food', 'Local food', 'Kachori-sabzi breakfast', 'A typical Banarasi morning meal of fried kachori with potato curry, eaten hot.'],
      ['food', 'Local food', 'Banarasi paan and sweets', 'Betel-leaf paan and local sweets such as malaiyo in winter.'],
      ['food', 'Café', 'Riverside cafés', 'Cafés near the ghats with views of the Ganga, a place to rest between walks.'],
      ['do', 'Activity', 'Sunrise boat ride on the Ganga', 'A guided boat trip along the ghats in the soft early light.'],
      ['do', 'Activity', 'Walk through the old lanes', 'A guided walk through the narrow galis to see temples, shops and daily life.'],
      ['do', 'Activity', 'Silk weaving visit', 'See how Banarasi silk is woven by hand at a local workshop.']
    ],
    reach: 'Varanasi has its own airport (VNS) and two main railway stations, Varanasi Junction and Banaras (Manduadih).',
    around: 'Walk the old city and ghats, and use e-rickshaws or app cabs for longer distances. Boats cover the river.',
    tips: ['Respect the rituals and do not take photos at cremation areas.', 'The old lanes are narrow and busy. Keep your belongings close.', 'Agree on boat prices before you start.']
  },
  'rishikesh-adventure': {
    items: [
      ['see', 'Bridge', 'Laxman Jhula and Ram Jhula', 'Two pedestrian suspension bridges over the Ganga, with temples, cafés and shops on both sides.'],
      ['see', 'Ghat', 'Triveni Ghat aarti', 'An evening prayer ceremony with lamps and songs on the riverbank.'],
      ['see', 'Heritage', 'Beatles Ashram (Chaurasi Kutia)', 'The old ashram where the Beatles stayed, now covered in street art and open to visitors.'],
      ['see', 'Temple', 'Neelkanth Mahadev Temple', 'A hilltop Shiva temple in the forest, reached by road or trek.'],
      ['see', 'Waterfall', 'Neer Garh Waterfall', 'A short forest walk to a cool waterfall near Laxman Jhula.'],
      ['see', 'Viewpoint', 'Kunjapuri Devi Temple', 'A temple on a ridge with sunrise views of the Himalayan range on clear days.'],
      ['food', 'Local food', 'Aloo puri and kachori breakfast', 'Simple, hot breakfast at small eateries near the bridges.'],
      ['food', 'Café', 'Ganga-view cafés', 'Relaxed cafés with vegetarian food, juices and a view of the river.'],
      ['food', 'Restaurant', 'Vegetarian thali restaurants', 'The riverside area is mostly vegetarian, with alcohol and non-vegetarian food restricted.'],
      ['do', 'Activity', 'White-water rafting', 'Day rafting runs on the Ganga with certified guides. It is usually paused in the monsoon months.'],
      ['do', 'Activity', 'Yoga and meditation', 'Morning classes at ashrams and studios, with options for beginners.'],
      ['do', 'Activity', 'Cliff and forest walks', 'Short treks and viewpoints around the town for a half-day outing.']
    ],
    reach: 'The nearest airport is Jolly Grant, Dehradun, about 35 km away. Haridwar is the closest main railway station.',
    around: 'Shared tuk-tuks and taxis, and walking near the bridges.',
    tips: ['Rafting is seasonal and usually paused in the monsoon.', 'Alcohol and non-vegetarian food are restricted along the river.', 'Dress modestly near temples and ashrams.']
  },
  'kerala-backwaters': {
    items: [
      ['see', 'Backwaters', 'Alleppey (Alappuzha) backwaters', 'A network of calm canals and lagoons lined with palms, best seen from a houseboat or a small canoe.'],
      ['see', 'Hill', 'Munnar tea gardens', 'Rolling green hills covered in tea plantations, with cool air and mist in the mornings.'],
      ['see', 'Heritage', 'Fort Kochi and the Chinese fishing nets', 'A historic seafront with old churches, colonial houses, galleries and large cantilevered fishing nets.'],
      ['see', 'Waterfall', 'Athirappilly Falls', 'A wide waterfall in the forest, strongest in and after the monsoon.'],
      ['see', 'Palace', 'Mattancherry Palace', 'A Portuguese-built palace with Kerala murals, near the old Jew Town area.'],
      ['see', 'Garden', 'Spice plantations', 'Walks through gardens of cardamom, pepper, cinnamon and vanilla around Munnar and Thekkady.'],
      ['food', 'Local food', 'Kerala sadya', 'A vegetarian feast served on a banana leaf with many small dishes, traditional at festivals.'],
      ['food', 'Local food', 'Karimeen pollichathu', 'Pearl spot fish marinated in spices, wrapped in banana leaf and grilled, a signature backwater dish.'],
      ['food', 'Local food', 'Appam with stew', 'Soft rice pancakes with a mild coconut milk stew, a common breakfast.'],
      ['do', 'Activity', 'Houseboat night in Alleppey', 'An overnight cruise with meals cooked on board and quiet canals at sunset.'],
      ['do', 'Activity', 'Kathakali performance, Kochi', 'A short show of the classical dance-drama, with make-up shown before the performance.'],
      ['do', 'Activity', 'Tea factory visit', 'See how tea is made and taste fresh leaf at a plantation near Munnar.']
    ],
    reach: 'Cochin International Airport (COK) near Kochi is the main gateway. Alappuzha and Ernakulam are the main railway stations.',
    around: 'Taxis, local ferries and boats. Houseboats move slowly, so plan a full night rather than a quick stop.',
    tips: ['Humid weather: wear light cotton clothes.', 'Monsoon (June to September) is green and quiet, but some boat trips can be limited.', 'Check what is included in the houseboat price, including meals.']
  }
};

/* ---------- photos ----------
 * Real photographs from Wikimedia Commons, resized into public/photos by scripts/build-photos.mjs (credits: /credits).
 * A place or activity only gets a photo if one that really shows it exists; otherwise its card is text only.
 * Destinations without credited photos yet keep their previous image until photos with licence details are added. */
type Plan = { hero: string; gallery: string[]; items: Record<string, string> };
export const PHOTOS = (photoData as { dest: Record<string, Plan> }).dest;

function buildExplore(d: Raw): Explore {
  const g = GUIDE[d.slug];
  if (!g) return { items: [], info: { howToReach: '', gettingAround: '', tips: [] } };
  const items: ExploreItem[] = g.items.map(([kind, type, name, text]) => ({ kind, type, name, text, img: PHOTOS[d.slug]?.items[name] ?? '' }));
  return { items, info: { howToReach: g.reach, gettingAround: g.around, tips: g.tips } };
}

/** The image each destination had before local photos, to tell an untouched destination from one an admin changed. */
export const ORIGINAL_IMG: Record<string, string> = Object.fromEntries(RAW.map(d => [d.slug, d.img]));

export const SEED: Destination[] = RAW.map(d => ({ ...d, img: PHOTOS[d.slug]?.hero ?? '', active: true, itinerary: makeItinerary(d), explore: buildExplore(d), packages: DEFAULT_PACKAGES, gallery: PHOTOS[d.slug]?.gallery ?? [] }));
