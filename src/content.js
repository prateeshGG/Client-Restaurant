/*
 * ─────────────────────────────────────────────────────────────
 *  SCIOTO HOUSE — SITE CONTENT
 *  This is the ONE file to edit for names, prices, menus, hours,
 *  photos and copy. All four design options read from here.
 *  Images live in /public/images — replace a file with the same
 *  name, or change the path below.
 *  Everything marked PLACEHOLDER must be confirmed by the owner.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: 'Scioto House', // PLACEHOLDER brand name
  shortName: 'Scioto',
  tagline: 'Hotel & Kitchen',
  city: 'Columbus, Ohio',
  since: '1891',
  announcement: 'Now taking founding-guest reservations — 15% off your first stay with code FOUNDING',
  address: { line1: '123 Brick Street', line2: 'Columbus, OH 43206', mapsQuery: 'German Village Columbus Ohio' }, // PLACEHOLDER
  geo: { lat: 39.9481, lng: -82.9962 }, // PLACEHOLDER — map pin (German Village). Set to the real building's coordinates.
  phone: '(614) 555-0142', // PLACEHOLDER (555 = fictional)
  email: 'hello@sciotohouse.com', // PLACEHOLDER
  social: { instagram: '#', facebook: '#', tiktok: '#' },
  checkIn: '3:00 pm',
  checkOut: '11:00 am',
  demoMode: true, // DEMO: keeps a sample booking (SH-DEMO01 / Guest) available to look up. Set false for the live site.
  lodgingTaxRate: 0.175, // Columbus/Franklin County combined lodging tax — confirm with accountant
  promoCodes: { FOUNDING: 0.15 },
};

export const hours = [
  { label: 'Breakfast', days: 'Daily', time: '7:00 – 10:30 am' },
  { label: 'Lunch', days: 'Tue – Sun', time: '11:30 am – 2:30 pm' },
  { label: 'Dinner', days: 'Tue – Thu, Sun', time: '5:00 – 10:00 pm' },
  { label: 'Dinner', days: 'Fri – Sat', time: '5:00 – 11:00 pm' },
  { label: 'Rooftop bar', days: 'Daily', time: '4:00 pm – midnight' },
];

/* Machine-readable schedule (Columbus time) — powers the live "open now" status.
 * d = weekdays (0 = Sunday … 6 = Saturday). Keep in sync with `hours` above. */
export const schedule = [
  { label: 'Breakfast', d: [0, 1, 2, 3, 4, 5, 6], open: '07:00', close: '10:30' },
  { label: 'Lunch', d: [0, 2, 3, 4, 5, 6], open: '11:30', close: '14:30' },
  { label: 'Dinner', d: [0, 2, 3, 4], open: '17:00', close: '22:00' },
  { label: 'Dinner', d: [5, 6], open: '17:00', close: '23:00' },
  { label: 'Rooftop bar', d: [0, 1, 2, 3, 4, 5, 6], open: '16:00', close: '24:00' },
];

/* Table reservations — dinner only. 0 = Sunday … 6 = Saturday */
export const reservations = {
  closedDays: [1], // Mondays
  closedDates: [], // one-off closures 'YYYY-MM-DD' (set from the Owner Dashboard)
  maxParty: 10,
  daysAhead: 60,
  slots: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
  occasions: ['None', 'Birthday', 'Anniversary', 'Date night', 'Business', 'Celebration'],
};

export const images = {
  hero: '/images/hero-exterior-dusk.jpg',
  lobby: '/images/lobby.jpg',
  rooftop: '/images/rooftop.jpg',
  dining: '/images/dining-room.jpg',
  bar: '/images/bar.jpg',
  chef: '/images/chef-plating.jpg',
  breakfast: '/images/breakfast.jpg',
  cocktail: '/images/cocktail.jpg',
  events: '/images/events.jpg',
  neighborhood: '/images/neighborhood.jpg',
  coffee: '/images/coffee-counter.jpg',
  bathroom: '/images/bathroom.jpg',
};

/* Design-specific media. Leave a video '' until the file exists in /public/video.
 * Stand-in photos are used until the requested images arrive. */
export const media = {
  noir: {
    heroVideo: '', // '/video/noir-hero.mp4'
    heroPoster: '/images/hero-exterior-dusk.jpg', // → '/images/noir-hero-poster.jpg'
    exteriorNight: '/images/hero-exterior-dusk.jpg', // → '/images/noir-exterior-night.jpg'
    roomNight: '/images/room-suite.jpg', // → '/images/noir-room-night.jpg'
    dish: '/images/dish-walleye.jpg', // → '/images/noir-dish-dark.jpg'
    cocktail: '/images/cocktail.jpg', // → '/images/noir-cocktail-smoke.jpg'
  },
  terra: {
    heroVideo: '', // '/video/terra-hero.mp4'
    heroPoster: '/images/breakfast.jpg', // → '/images/terra-hero-poster.jpg'
    courtyard: '/images/lobby.jpg', // → '/images/terra-courtyard.jpg'
    bread: '/images/chef-plating.jpg', // → '/images/terra-bread.jpg'
    market: '/images/dish-salad.jpg', // → '/images/terra-market.jpg'
    ceramics: '/images/coffee-counter.jpg', // → '/images/terra-ceramics.jpg'
  },
};

export const rooms = [
  {
    id: 'brick-king',
    name: 'The Brick King',
    short: 'Our signature room: original 1891 brick, a king bed and tall windows over the street.',
    description:
      'Exposed brick from the original 1891 build, an oak headboard made in Ohio, and tall sash windows that pour in afternoon light. A green velvet reading chair, rain shower and a proper desk make it as good for a work trip as a weekend.',
    bed: 'King',
    bedType: 'king',
    sleeps: 2,
    size: 290,
    rate: 219,
    inventory: 8,
    images: ['/images/room-king.jpg', '/images/bathroom.jpg', '/images/lobby.jpg'],
    amenities: ['King bed', 'Rain shower', 'Work desk', 'Smart TV', 'Nespresso', 'Free Wi-Fi'],
  },
  {
    id: 'double-queen',
    name: 'Double Queen',
    short: 'Two queen beds and room to spread out — made for families and game-day friends.',
    description:
      'Two queen beds dressed in crisp percale, a long oak bench for bags and boots, and framed botanical prints of Ohio wildflowers. Ideal for families, friends in town for a Buckeyes game, or anyone who likes a little extra floor.',
    bed: '2 Queens',
    bedType: 'queen',
    sleeps: 4,
    size: 360,
    rate: 249,
    inventory: 6,
    images: ['/images/room-double.jpg', '/images/bathroom.jpg', '/images/breakfast.jpg'],
    amenities: ['2 queen beds', 'Walk-in shower', 'Mini fridge', 'Smart TV', 'Crib on request', 'Free Wi-Fi'],
  },
  {
    id: 'accessible-king',
    name: 'Accessible King',
    short: 'Step-free king room with a roll-in shower, grab bars and lowered fixtures.',
    description:
      'Designed to ADA standards without feeling clinical: a roll-in rain shower with fold-down bench, lowered closet rail and desk, visual alarms and extra turning space — all finished in the same brick, brass and oak as every other room.',
    bed: 'King',
    bedType: 'king',
    sleeps: 2,
    size: 330,
    rate: 219,
    inventory: 2,
    images: ['/images/bathroom.jpg', '/images/room-king.jpg', '/images/lobby.jpg'],
    amenities: ['King bed', 'Roll-in shower', 'Grab bars', 'Visual alarms', 'Lowered fixtures', 'Free Wi-Fi'],
  },
  {
    id: 'parlor-suite',
    name: 'Parlor Suite',
    short: 'A separate parlor with leather sofa and bar cart — host friends before dinner downstairs.',
    description:
      'A proper sitting room with a Chesterfield sofa (which pulls out for a third guest), a stocked bar cart and shelves of Ohio authors, leading through to a king bedroom. Book it for anniversaries, or for pre-dinner drinks with friends.',
    bed: 'King + sofa bed',
    bedType: 'king',
    sleeps: 3,
    size: 520,
    rate: 329,
    inventory: 3,
    images: ['/images/room-suite.jpg', '/images/room-king.jpg', '/images/bar.jpg'],
    amenities: ['Separate parlor', 'Sofa bed', 'Bar cart', 'Soaking tub', 'Two TVs', 'Free Wi-Fi'],
  },
  {
    id: 'the-loft',
    name: 'The Loft',
    short: 'Top-floor hideaway under the original timber beams, with a clawfoot tub by the window.',
    description:
      'Our only room on the fourth floor: original timber roof beams, a skylight over the bed and a freestanding clawfoot tub looking out over the brick rooftops of the neighbourhood. Private access to the rooftop bar before it opens.',
    bed: 'King',
    bedType: 'king',
    sleeps: 2,
    size: 610,
    rate: 449,
    inventory: 1,
    images: ['/images/room-loft.jpg', '/images/rooftop.jpg', '/images/bathroom.jpg'],
    amenities: ['King bed', 'Clawfoot tub', 'Skylight', 'Rooftop access', 'Record player', 'Free Wi-Fi'],
  },
];

export const amenities = [
  { icon: 'wifi', label: 'Fast free Wi-Fi' },
  { icon: 'car', label: 'Valet parking · $28/night' },
  { icon: 'paw', label: 'Dogs welcome' },
  { icon: 'glass', label: 'Rooftop bar' },
  { icon: 'clock', label: '24-hour front desk' },
  { icon: 'bolt', label: 'EV charging' },
];

export const staySteps = [
  { title: 'Pick your dates', text: 'Check live availability and our best rate — always lowest here, never a booking fee.' },
  { title: 'Choose your room', text: 'Five room types, from the Brick King to the top-floor Loft with its clawfoot tub.' },
  { title: 'Arrive & settle in', text: 'Check in from 3 pm. We’ll have a glass of something local and your key ready.' },
  { title: 'Eat downstairs', text: 'Hotel guests get priority tables in the Kitchen and first seats on the roof.' },
];

export const menu = {
  periods: [
    { id: 'breakfast', label: 'Breakfast', note: 'Daily 7:00 – 10:30 am' },
    { id: 'lunch', label: 'Lunch', note: 'Tue – Sun 11:30 am – 2:30 pm' },
    { id: 'dinner', label: 'Dinner', note: 'Tue – Sun from 5:00 pm' },
    { id: 'drinks', label: 'Drinks', note: 'Rooftop & bar from 4:00 pm' },
  ],
  diets: [
    { id: 'v', label: 'Vegetarian' },
    { id: 'vg', label: 'Vegan' },
    { id: 'gf', label: 'Gluten-free' },
  ],
  items: [
    // Breakfast
    { id: 'pancakes', period: 'breakfast', name: 'Buttermilk Pancakes', desc: 'Ohio maple syrup, cultured butter, macerated berries', price: 14, diet: ['v'], image: '/images/breakfast.jpg', featured: true },
    { id: 'hash', period: 'breakfast', name: 'Brisket Hash', desc: 'Smoked brisket, crispy potatoes, peppers, two farm eggs', price: 17, diet: ['gf'], image: '/images/breakfast.jpg' /* stand-in → /images/menu-hash.jpg */ },
    { id: 'goetta', period: 'breakfast', name: 'Goetta & Eggs', desc: 'Cincinnati-style pork & oat sausage, eggs any style, sourdough toast', price: 15, diet: [], image: '/images/breakfast.jpg' /* stand-in → /images/menu-goetta.jpg */ },
    { id: 'oats', period: 'breakfast', name: 'Steel-Cut Oats', desc: 'Oat milk, roasted apples, toasted pecans, brown sugar', price: 11, diet: ['v', 'vg'], image: '/images/coffee-counter.jpg' /* stand-in → /images/menu-oats.jpg */ },
    { id: 'avotoast', period: 'breakfast', name: 'Tomato Toast', desc: 'Heirloom tomatoes, whipped ricotta, basil, olive oil, seeded rye', price: 13, diet: ['v'], image: '/images/dish-salad.jpg' /* stand-in → /images/menu-avotoast.jpg */ },
    { id: 'coffee', period: 'breakfast', name: 'Stauf’s Drip Coffee', desc: 'Local Columbus roaster, bottomless', price: 4, diet: ['v', 'vg', 'gf'], image: '/images/coffee-counter.jpg' },
    // Lunch
    { id: 'smash', period: 'lunch', name: 'Double Smash Burger', desc: 'Two griddled patties, sharp cheddar, pickles, house sauce, potato bun, fries', price: 18, diet: [], image: '/images/dish-burger.jpg', featured: true },
    { id: 'salad', period: 'lunch', name: 'Sweet Corn & Tomato Salad', desc: 'Grilled Ohio sweet corn, heirloom tomatoes, burrata, basil', price: 15, diet: ['v', 'gf'], image: '/images/dish-salad.jpg', featured: true },
    { id: 'reuben', period: 'lunch', name: 'Katzinger-Style Reuben', desc: 'House corned beef, sauerkraut, Swiss, Russian dressing, rye', price: 17, diet: [], image: '/images/dish-burger.jpg' /* stand-in → /images/menu-reuben.jpg */ },
    { id: 'grainbowl', period: 'lunch', name: 'Farro Grain Bowl', desc: 'Roasted squash, kale, pickled onion, tahini, pepitas', price: 15, diet: ['v', 'vg'], image: '/images/dish-salad.jpg' /* stand-in → /images/menu-grainbowl.jpg */ },
    { id: 'soup', period: 'lunch', name: 'Tomato Bisque & Grilled Cheese', desc: 'Aged cheddar on sourdough, basil oil', price: 14, diet: ['v'], image: '/images/chef-plating.jpg' /* stand-in → /images/menu-soup.jpg */ },
    // Dinner
    { id: 'walleye', period: 'dinner', name: 'Lake Erie Walleye', desc: 'Brown butter, sweet corn purée, charred green beans, lemon', price: 34, diet: ['gf'], image: '/images/dish-walleye.jpg', featured: true },
    { id: 'pasta', period: 'dinner', name: 'Wild Mushroom Pappardelle', desc: 'Hand-cut pasta, Ohio mushroom ragù, parmesan, thyme', price: 26, diet: ['v'], image: '/images/dish-pasta.jpg', featured: true },
    { id: 'porkchop', period: 'dinner', name: 'Bone-In Pork Chop', desc: 'Apple mostarda, braised greens, cheddar grits', price: 36, diet: ['gf'], image: '/images/dish-walleye.jpg' /* stand-in → /images/menu-porkchop.jpg */ },
    { id: 'steak', period: 'dinner', name: 'Ohio Strip Steak', desc: '12 oz dry-aged, beef-fat potatoes, peppercorn sauce', price: 48, diet: ['gf'], image: '/images/chef-plating.jpg' /* stand-in → /images/menu-steak.jpg */ },
    { id: 'squash', period: 'dinner', name: 'Roasted Delicata Squash', desc: 'Farro, hazelnut dukkah, maple-miso glaze, herbs', price: 24, diet: ['v', 'vg'], image: '/images/dish-salad.jpg' /* stand-in → /images/menu-squash.jpg */ },
    { id: 'pierogi', period: 'dinner', name: 'Potato & Cheddar Pierogi', desc: 'Brown butter onions, sour cream, chives', price: 16, diet: ['v'], image: '/images/dish-pasta.jpg' /* stand-in → /images/menu-pierogi.jpg */ },
    { id: 'buckeye', period: 'dinner', name: 'Buckeye Tart', desc: 'Dark chocolate, salted peanut butter, whipped cream', price: 12, diet: ['v'], image: '/images/dish-dessert.jpg', featured: true },
    // Drinks
    { id: 'oldfashioned', period: 'drinks', name: 'Scioto Old Fashioned', desc: 'Ohio rye, maple, black walnut bitters, orange', price: 15, diet: ['v', 'vg', 'gf'], image: '/images/cocktail.jpg', featured: true },
    { id: 'spritz', period: 'drinks', name: 'Rooftop Spritz', desc: 'Aperitivo, sparkling wine, grapefruit, soda', price: 13, diet: ['v', 'vg', 'gf'], image: '/images/rooftop.jpg' /* stand-in → /images/menu-spritz.jpg */ },
    { id: 'beer', period: 'drinks', name: 'Columbus Draft Rotation', desc: 'Four local taps — ask what’s pouring', price: 8, diet: ['v', 'vg'], image: '/images/bar.jpg' /* stand-in → /images/menu-beer.jpg */ },
    { id: 'wine', period: 'drinks', name: 'Ohio River Valley Red', desc: 'By the glass from our cellar list', price: 14, diet: ['v', 'vg', 'gf'], image: '/images/bar.jpg' /* stand-in → /images/menu-wine.jpg */ },
    { id: 'zero', period: 'drinks', name: 'Garden Tonic (0%)', desc: 'Cucumber, basil, lime, house tonic', price: 9, diet: ['v', 'vg', 'gf'], image: '/images/cocktail.jpg' /* stand-in → /images/menu-zero.jpg */ },
  ],
};

/* PLACEHOLDER — preview-dinner quotes. Replace with real reviews after opening. */
export const testimonials = [
  { quote: 'The walleye alone is worth the drive from Dublin. The room upstairs made it a whole weekend.', name: 'Preview guest', where: 'Friends & family dinner' },
  { quote: 'It feels like the building has always been a hotel — brick, brass and the kindest front desk.', name: 'Preview guest', where: 'Soft-opening stay' },
  { quote: 'Best smash burger in Columbus, and I have done the research. The Buckeye Tart is dangerous.', name: 'Preview guest', where: 'Tasting night' },
  { quote: 'Booked the Loft for our anniversary. The clawfoot tub by the window — enough said.', name: 'Preview guest', where: 'Soft-opening stay' },
];

export const story = {
  headline: 'A corner building with 130 years of stories',
  intro:
    'Built in 1891 as a dry-goods store with apartments above, our red-brick corner has been a bakery, a printer and a very good record shop. We restored every arched window and kept every brick we could.',
  paragraphs: [
    'Scioto House is a small hotel on purpose: 20 rooms, one kitchen, one rooftop. Big enough to feel like an occasion, small enough that the front desk learns your name.',
    'Downstairs, the Kitchen cooks modern Midwestern food from farms within a couple of hours of Columbus — Lake Erie walleye, Ohio sweet corn, heritage pork — plus the smash burger you will think about later.',
  ],
  values: [
    { title: 'Ohio-made', text: 'Headboards from a Holmes County woodshop, ceramics from a Short North studio, coffee roasted across town.' },
    { title: 'Honest rates', text: 'The price you see is the price you pay. No resort fee, no booking fee, ever.' },
    { title: 'Neighbours first', text: 'Locals get the same welcome as guests — the bar and Kitchen are for everyone.' },
  ],
  team: 'Opening team to be announced', // PLACEHOLDER
};

export const neighborhood = [
  { name: 'German Village', distance: '5 min walk', text: 'Brick streets, the Book Loft and Schiller Park.' },
  { name: 'Scioto Mile', distance: '10 min walk', text: 'Riverfront trails, fountains and summer concerts.' },
  { name: 'Short North Arts District', distance: '8 min drive', text: 'Galleries, boutiques and Gallery Hop nights.' },
  { name: 'Greater Columbus Convention Center', distance: '7 min drive', text: 'Conferences, expos and the Arnold.' },
  { name: 'Ohio Stadium', distance: '15 min drive', text: 'Buckeyes game days — ask about shuttles.' },
  { name: 'John Glenn Airport (CMH)', distance: '15 min drive', text: 'Airport transfers on request.' },
];

export const faqs = [
  { q: 'What time is check-in and check-out?', a: 'Check-in is from 3:00 pm and check-out is by 11:00 am. Early check-in and late check-out are free when we can — just ask.' },
  { q: 'Is there parking?', a: 'Valet parking is $28 per night with in-and-out privileges. There are also two EV chargers for hotel guests.' },
  { q: 'Can I bring my dog?', a: 'Yes. Dogs up to 50 lb are welcome for a $35 per-stay cleaning fee, and we have a water bowl and treats at the desk.' },
  { q: 'What is your cancellation policy?', a: 'Cancel free of charge up to 48 hours before arrival through Manage booking. Later cancellations are charged one night.' },
  { q: 'Is breakfast included?', a: 'Breakfast is served daily in the Kitchen and is not included in the room rate, so you only pay for what you order. Founding-guest stays include a daily coffee.' },
  { q: 'Do you host private events?', a: 'Our private dining room seats 32 and the rooftop holds 80 standing. Send an event enquiry from the Contact page and our events lead will reply within one business day.' },
  { q: 'Is the hotel accessible?', a: 'Yes — step-free entrance, elevator to all floors, two Accessible King rooms with roll-in showers, and accessible restrooms in the Kitchen.' },
];

export const events = {
  title: 'Private dining & events',
  text: 'Rehearsal dinners, team offsites, birthdays with a view. Our brick-walled private room seats 32; the rooftop takes 80 for a reception.',
  capacity: [
    { label: 'Private dining room', value: '32 seated' },
    { label: 'Rooftop', value: '80 standing' },
    { label: 'Full buy-out', value: '140 guests' },
  ],
};

/* ─────────────────────────────────────────────────────────────
 *  OWNER DASHBOARD EDITS
 *  Changes saved in /admin are stored under CONTENT_KEY and layered
 *  over the defaults above when the site loads. (Demo: stored in this
 *  browser. In production the same JSON is served by the CMS/API.)
 * ───────────────────────────────────────────────────────────── */
export const CONTENT_KEY = 'sh:content:v1';
export const CONTENT_SECTIONS = { site, hours, schedule, reservations, images, media, rooms, amenities, staySteps, menu, testimonials, story, neighborhood, faqs, events };
export const DEFAULT_CONTENT = JSON.parse(JSON.stringify(CONTENT_SECTIONS));

export function applyContent(o) {
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    const target = CONTENT_SECTIONS[k];
    if (!target || v == null) continue;
    // Ignore malformed overrides so a bad save/import can never blank a public page.
    if (Array.isArray(target) !== Array.isArray(v) || typeof v !== 'object') continue;
    if (k === 'menu' && v.items && !Array.isArray(v.items)) continue;
    if (k === 'rooms' && !v.every((r) => r && r.id && Array.isArray(r.images))) continue;
    if (Array.isArray(target)) target.splice(0, target.length, ...v);
    else Object.assign(target, v);
  }
}
try {
  applyContent(JSON.parse(localStorage.getItem(CONTENT_KEY)));
} catch {
  /* no overrides or storage unavailable */
}
