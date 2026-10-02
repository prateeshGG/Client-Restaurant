/*
 * ─────────────────────────────────────────────────────────────
 *  PROPOSAL CONFIG — everything the sales proposal page says.
 *  Edit this file (or use ?client=Name in the URL, and ?presenter
 *  on the call to edit prices live) — no HTML changes needed.
 *  Anything marked PLACEHOLDER must be replaced before sending.
 * ─────────────────────────────────────────────────────────────
 */

export const proposal = {
  agency: 'Your Agency', // PLACEHOLDER — your company name
  presenter: 'Your Name', // PLACEHOLDER — who is presenting
  client: { name: 'Scioto House', place: 'Columbus, Ohio', type: 'boutique hotel & restaurant' },
  contactEmail: '', // PLACEHOLDER — where the "send my choice" email goes
  paymentUrl: '', // PLACEHOLDER — Stripe / invoice payment link opened by "Accept". Empty = we send the link after.
};

/* Proof. Sections hide themselves when these are empty, so add only real, approved items. */
export const proof = {
  stats: [
    // { value: '$100M+', label: 'in bookings generated for clients' },   // PLACEHOLDER — real numbers only
  ],
  testimonials: [
    // { quote: '…', name: 'Name', role: 'Owner, Business', result: 'Result in one line' }, // PLACEHOLDER
  ],
};

export const pricing = {
  currency: 'USD',
  setupList: 15000, // PLACEHOLDER — normal one-time setup fee
  setupOffer: 10000, // PLACEHOLDER — one-time offer if accepted on the call
  hosting: 297, // PLACEHOLDER — monthly hosting, security & support
  freeMonths: 1, // months of the selected add-ons included free with the one-time offer
  guarantee: "If you're unhappy for any reason, you don't pay.", // PLACEHOLDER — confirm the actual terms
  /* Add-ons: price-anchored in the Traffic section, then sweetened as "free" in the offer. */
  addOns: [
    { id: 'meta', name: 'Facebook & Instagram ads', monthly: 2500, on: true, blurb: 'Targeted ads to travellers and locals, with bookings tracked back to the ad.' },
    { id: 'seo', name: 'Local SEO', monthly: 1500, on: true, blurb: 'Google Business Profile, hotel & restaurant listings and the page plan above.' },
    { id: 'lsa', name: 'Google local ads', monthly: 1000, on: false, blurb: 'Paid placement for "boutique hotel near me" and "dinner tonight" searches.' },
    { id: 'chat', name: 'AI concierge chat + instant lead alert', monthly: 400, on: false, blurb: 'Answers guest questions 24/7 and calls you within seconds of a new enquiry.' },
  ],
};

/* The plan. Day-by-day keeps it concrete. */
export const plan = [
  { day: 'Day 1', title: 'Choose & confirm', body: 'You pick the design direction. We confirm the name, rooms, menu, hours and prices, and you send your photos.' },
  { day: 'Day 2', title: 'Connect & polish', body: 'We connect your booking and reservation systems, domain, analytics and the Owner Dashboard, then test every flow on phone and desktop.' },
  { day: 'Day 3', title: 'Go live', body: 'The site launches, we walk you through the dashboard, and the traffic work (SEO and ads) starts.' },
];

/* The five designs. Screenshots are real captures from /public/proposal/. */
export const designs = [
  {
    id: 'familiar', n: 'A', name: 'Familiar', url: '/familiar/', vibe: 'Practical · friendly · conversion-first',
    blurb: 'Closest to the sample you showed us: utility bar, big photo hero, "how it works", menu carousel and plan-style room cards, with its problems fixed — no pop-up on load, readable text, accessible buttons.',
    bestIf: 'you want the safest, most familiar layout that guests understand instantly.',
    features: ['Utility bar with phone and "my booking"', 'Menu carousel with filters and search', 'Plan-style room cards', 'Green reviews band'],
    palette: ['#FFFFFF', '#8ED444', '#333333', '#D11A2A'], type: 'Poppins', font: "'Poppins', sans-serif", accent: '#3A7D1F',
  },
  {
    id: 'fresh', n: 'B', name: 'Fresh', url: '/fresh/', vibe: 'Bright · friendly · modern',
    blurb: 'White and green with rounded "bento" tiles, a floating capsule menu, a stay / dine switcher, a scrolling reviews ribbon and a bottom-sheet menu on phones.',
    bestIf: 'you want a clean, upbeat look that feels modern without being fussy.',
    features: ['Bento tile layout', 'Stay / Dine switcher', 'Scrolling reviews ribbon', 'Bottom-sheet menu on phones'],
    palette: ['#FFFFFF', '#8ED444', '#3A7D1F', '#17231A'], type: 'Plus Jakarta Sans', font: "'Plus Jakarta Sans Variable', sans-serif", accent: '#2F6E17',
  },
  {
    id: 'atelier', n: 'C', name: 'Atelier', url: '/atelier/', vibe: 'Professional · editorial · no-nonsense',
    blurb: 'Bone and ink tones, hairline rules, square corners and very large photos. A booking bar in the header, magazine-style room pages and a menu whose dish photos follow your cursor.',
    bestIf: 'you want to be taken seriously by business travellers, couples and event bookers.',
    features: ['Header booking bar', 'Magazine-style room pages', 'Dish photos follow the cursor', 'Very large photography'],
    palette: ['#F3F0EB', '#E3DDD3', '#6B6A4B', '#1B1A18'], type: 'Instrument Serif + Inter', font: "'Instrument Serif', serif", accent: '#4F4E36',
  },
  {
    id: 'noir', n: 'D', name: 'Noir', url: '/noir/', vibe: 'Cinematic · evening luxury · moody',
    blurb: 'Black canvas, champagne accents and fashion-serif type. Full-screen "slides", a live "kitchen open now" status, rooms as a film strip and a dark map. Inspired by EDITION and Proper hotels.',
    bestIf: 'you want to sell the evening: the bar, the dinner, the date-night stay.',
    features: ['Live "kitchen open now" status', 'Rooms as a film strip', 'Full-screen slides', 'Dark map'],
    palette: ['#0B0B0A', '#1C1B19', '#C8AE83', '#F4EFE6'], type: 'Bodoni Moda + Inter', font: "'Bodoni Moda', serif", accent: '#8A7650',
  },
  {
    id: 'terra', n: 'E', name: 'Terra', url: '/terra/', vibe: 'Sun-baked · earthy · handmade',
    blurb: 'Sand, terracotta and olive tones, arch-shaped photos, hand-drawn squiggles and a typewriter font. A "day at the house" timeline, a sticky booking bar and an earthy map. Inspired by Casa Cook and 1 Hotels.',
    bestIf: 'you want warmth and personality that no other Columbus hotel has.',
    features: ['"Day at the house" timeline', 'Sticky booking bar', 'Arch-shaped photography', 'Earthy illustrated map'],
    palette: ['#F3EBDD', '#A34A27', '#5F6446', '#D9A47E'], type: 'Big Shoulders Display + DM Mono', font: "'Big Shoulders Display', sans-serif", accent: '#A34A27',
  },
];
