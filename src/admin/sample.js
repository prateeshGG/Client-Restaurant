/* "Load sample bookings" — realistic demo data created through the same store APIs the website uses. */
import { saveRecord, updateRecord, saveMessage, saveSubscriber, listRecords, listMessages, listSubscribers } from '../core/store.js';
import { getContent } from '../core/cms.js';
import { addDays, code, columbus } from './lib.js';

const GUESTS = [
  ['Maya', 'Chen', 'maya.chen@example.com', '(614) 555-0188'],
  ['Marcus', 'Bell', 'marcus.bell@example.com', '(614) 555-0131'],
  ['Priya', 'Raman', 'priya.r@example.com', '(937) 555-0164'],
  ['Tom', 'Kowalski', 'tkowalski@example.com', '(216) 555-0102'],
  ['Aisha', 'Okafor', 'aisha.okafor@example.com', '(614) 555-0177'],
  ['Hannah', 'Lindqvist', 'hannah.l@example.com', '(513) 555-0149'],
  ['Diego', 'Morales', 'dmorales@example.com', '(614) 555-0120'],
  ['Grace', 'Whitfield', 'grace.w@example.com', '(740) 555-0193'],
  ['Sam', 'Ortiz', 'sam.ortiz@example.com', '(614) 555-0110'],
  ['Nora', 'Fitzgerald', 'nora.fitz@example.com', '(419) 555-0156'],
  ['Kenji', 'Watanabe', 'kenji.w@example.com', '(614) 555-0172'],
  ['Leah', 'Brennan', 'leah.brennan@example.com', '(330) 555-0138'],
];

export const hasRecords = () => listRecords().length > 0;

export function loadSampleData() {
  const c = getContent();
  const t = columbus().iso;
  const tax = c.site.lodgingTaxRate || 0;
  const room = (id) => c.rooms.find((r) => r.id === id) || c.rooms[0];
  const g = (i, extra = {}) => {
    const [first, last, email, phone] = GUESTS[i % GUESTS.length];
    return { first, last, email, phone, ...extra };
  };

  // Stays: [guestIdx, roomId, offsetIn, nights, guests, status, extra]
  const stays = [
    [0, 'brick-king', -1, 3, 2, 'checked-in', { arrival: '15:00', requests: 'Anniversary — a quiet room if possible.' }],
    [1, 'double-queen', 0, 2, 4, 'confirmed', { arrival: '16:00', requests: 'Travelling with two kids; a crib would be great.' }],
    [2, 'the-loft', 0, 1, 2, 'confirmed', { arrival: '19:00', requests: '' }],
    [3, 'parlor-suite', 2, 2, 3, 'confirmed', { arrival: '15:00', requests: 'In town for the Buckeyes game.' }],
    [4, 'accessible-king', 3, 4, 2, 'confirmed', { arrival: '14:00', requests: 'Need the roll-in shower, please.' }],
    [5, 'brick-king', 5, 2, 1, 'confirmed', { arrival: '17:00', requests: 'Early check-in if you can.', promo: 'FOUNDING' }],
    [6, 'double-queen', 9, 3, 3, 'confirmed', { arrival: '15:00', requests: '' }],
    [7, 'brick-king', -4, 2, 2, 'checked-out', { arrival: '15:00', requests: '' }],
    [8, 'parlor-suite', 6, 2, 2, 'cancelled', { arrival: '18:00', requests: 'Dog-friendly please.' }],
  ];
  for (const [gi, roomId, off, nights, guests, status, extra] of stays) {
    const r = room(roomId);
    const checkIn = addDays(t, off);
    const { promo = '', ...gx } = extra;
    const sub = r.rate * nights * (promo ? 0.85 : 1);
    const rec = saveRecord({
      code: code('SH'),
      type: 'stay',
      roomId: r.id,
      roomName: r.name,
      checkIn,
      checkOut: addDays(checkIn, nights),
      guests,
      promo,
      guest: g(gi, { policy: true, ...gx }),
      total: Math.round(sub * (1 + tax) * 100) / 100,
      nights,
      sample: true,
    });
    if (status !== 'confirmed') updateRecord(rec.code, { status });
  }

  // Tables: [guestIdx, dayOffset, time, party, occasion, notes, status]
  const tables = [
    [9, 0, '17:30', 2, 'None', '', 'seated'],
    [10, 0, '18:00', 4, 'Birthday', 'Candle on the Buckeye Tart, please.', 'confirmed'],
    [11, 0, '18:30', 2, 'Date night', '', 'confirmed'],
    [2, 0, '19:00', 6, 'Business', 'One vegetarian.', 'confirmed'],
    [5, 0, '19:30', 3, 'None', 'High chair needed.', 'confirmed'],
    [3, 0, '20:30', 2, 'Anniversary', '', 'confirmed'],
    [1, 1, '18:00', 5, 'Celebration', '', 'confirmed'],
    [6, 2, '19:00', 2, 'None', 'Nut allergy.', 'confirmed'],
    [7, 3, '20:00', 8, 'Birthday', 'Private corner if possible.', 'confirmed'],
    [8, -1, '19:00', 2, 'None', '', 'no-show'],
  ];
  const nowHM = columbus().hhmm;
  for (const [gi, off, time, party, occasion, notes, wanted] of tables) {
    // Only mark tonight's table seated once its time has actually passed in Columbus.
    const status = wanted === 'seated' && off === 0 && time > nowHM ? 'confirmed' : wanted;
    const rec = saveRecord({ code: code('ST'), type: 'table', date: addDays(t, off), time, party, guest: g(gi, { occasion, notes }), sample: true });
    if (status !== 'confirmed') updateRecord(rec.code, { status });
  }

  // Messages (contact form)
  const now = Date.now();
  const msgs = [
    { name: 'Rachel Moore', email: 'rachel.moore@example.com', topic: 'event', eventDate: addDays(t, 40), eventGuests: '45', message: 'Hi! We’re planning a rehearsal dinner for about 45 people and love the look of the rooftop. Is it available on that date, and do you have set menus?', mins: 35 },
    { name: 'Jordan Pike', email: 'jordan@example.com', topic: 'general', message: 'Do you allow dogs in the Double Queen? We have a very well-behaved 30 lb beagle.', mins: 190 },
    { name: 'Columbus Eats (Ana Ruiz)', email: 'ana@example.com', topic: 'press', message: 'I write a weekly food newsletter and would love to feature your opening menu. Could I come by for a tasting next week?', mins: 60 * 26 },
    { name: 'Walter Greene', email: 'walt.greene@example.com', topic: 'general', message: 'Thank you for a wonderful stay last weekend — the front desk team was lovely. Will be back for the Loft!', mins: 60 * 50, read: true },
  ];
  for (const m of msgs) {
    const { mins, read = false, ...rest } = m;
    saveMessage({ ...rest, read, at: new Date(now - mins * 60000).toISOString(), sample: true });
  }
  ['megan.ho@example.com', 'luis.v@example.com', 'the.carters@example.com', 'bea.l@example.com', 'owen.p@example.com'].forEach(saveSubscriber);
  return { records: listRecords().length, messages: listMessages().length, subscribers: listSubscribers().length };
}

/** Remove bookings, reservations, messages and subscribers stored in this browser (demo data). */
export function clearRecords() {
  localStorage.removeItem('sh:records:v1');
  localStorage.removeItem('sh:messages');
  localStorage.removeItem('sh:subscribers');
}
