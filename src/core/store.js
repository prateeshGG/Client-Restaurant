/* Persistence layer. Today: localStorage (demo). In production swap these
 * functions for the hotel PMS / booking-engine and reservation APIs — the
 * UI only talks to this module. */
import { rooms, reservations as resCfg } from '../content.js';
import { hash, addDays, nightsBetween, parseISO } from './util.js';

const KEY = 'sh:records:v1';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};
const write = (list) => localStorage.setItem(KEY, JSON.stringify(list));

export const saveRecord = (rec) => {
  const list = read();
  list.push({ ...rec, createdAt: new Date().toISOString(), status: 'confirmed' });
  write(list);
  return rec;
};

export const getRecord = (c) => read().find((r) => r.code === c) || null;

/* Demo booking so "My booking" / Manage can always be tried (content: site.demoMode). */
export const DEMO_BOOKING = { code: 'SH-DEMO01', last: 'Guest' };
export const ensureDemoRecord = (checkIn, checkOut) => {
  const list = read();
  const r = list.find((x) => x.code === DEMO_BOOKING.code);
  if (r) {
    if (r.status !== 'confirmed') Object.assign(r, { status: 'confirmed' }), write(list); // demo resets itself
    return;
  }
  const room = rooms[0];
  list.push({
    code: DEMO_BOOKING.code, type: 'stay', demo: true, roomId: room.id, roomName: room.name, checkIn, checkOut, guests: 2, promo: '', nights: 2,
    total: Math.round(room.rate * 2 * 1.175 * 100) / 100, status: 'confirmed', createdAt: new Date().toISOString(),
    guest: { first: 'Demo', last: DEMO_BOOKING.last, email: 'demo.guest@example.com', phone: '(614) 555-0100', arrival: '15:00', requests: 'This is a sample booking for the demo.' },
  });
  write(list);
};
export const listRecords = () => read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
/** Owner actions: status = confirmed | cancelled | checked-in | checked-out | seated | no-show */
export const updateRecord = (codeStr, patch) => {
  const list = read();
  const r = list.find((x) => x.code === codeStr);
  if (r) Object.assign(r, patch, { updatedAt: new Date().toISOString() });
  write(list);
  return r || null;
};

export const findRecord = (codeStr, lastName) => {
  const c = String(codeStr).trim().toUpperCase();
  const l = String(lastName).trim().toLowerCase();
  return read().find((r) => r.code === c && r.guest.last.toLowerCase() === l) || null;
};

export const cancelRecord = (codeStr) => {
  const list = read();
  const r = list.find((x) => x.code === codeStr);
  if (r) {
    r.status = 'cancelled';
    r.cancelledAt = new Date().toISOString();
  }
  write(list);
  return r;
};

/* Simulated availability (deterministic). A room type is sold out on a night when
 * simulated occupancy + local bookings ≥ inventory. */
const localCount = (roomId, night) =>
  read().filter(
    (r) => r.type === 'stay' && r.status === 'confirmed' && r.roomId === roomId && night >= r.checkIn && night < r.checkOut
  ).length;

export const roomAvailable = (roomId, checkIn, checkOut) => {
  const room = rooms.find((r) => r.id === roomId);
  if (!room || room.closed) return false; // owner can close a room for maintenance
  const n = nightsBetween(checkIn, checkOut);
  for (let i = 0; i < n; i++) {
    const night = addDays(checkIn, i);
    const simulated = hash(roomId + night) % (room.inventory + 3); // 0..inventory+2
    const busy = Math.max(0, simulated - 2); // usually some rooms left
    if (busy + localCount(roomId, night) >= room.inventory) return false;
  }
  return true;
};

export const slotFull = (date, time, party) => {
  const taken = read().filter((r) => r.type === 'table' && r.status === 'confirmed' && r.date === date && r.time === time).length;
  return hash(date + time) % 6 === 0 || taken >= 3 || (party >= 7 && hash(date + time + 'l') % 3 === 0);
};

export const isClosed = (date) => resCfg.closedDays.includes(parseISO(date).getDay()) || (resCfg.closedDates || []).includes(date);

/* ── Messages (contact form) & newsletter subscribers — read by the Owner Dashboard ── */
const MKEY = 'sh:messages';
const SKEY = 'sh:subscribers';
const readKey = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || [];
  } catch {
    return [];
  }
};
export const saveMessage = (m) => {
  const list = readKey(MKEY);
  const msg = { id: 'M' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), read: false, at: new Date().toISOString(), ...m };
  list.push(msg);
  localStorage.setItem(MKEY, JSON.stringify(list));
  return msg;
};
export const listMessages = () => readKey(MKEY).sort((a, b) => (a.at < b.at ? 1 : -1));
export const updateMessage = (id, patch) => {
  const list = readKey(MKEY);
  const m = list.find((x) => x.id === id);
  if (m) Object.assign(m, patch);
  localStorage.setItem(MKEY, JSON.stringify(list));
  return m || null;
};
export const deleteMessage = (id) => localStorage.setItem(MKEY, JSON.stringify(readKey(MKEY).filter((x) => x.id !== id)));
export const saveSubscriber = (email) => {
  const list = readKey(SKEY);
  if (!list.some((s) => s.email.toLowerCase() === String(email).toLowerCase())) list.push({ email: String(email).trim(), at: new Date().toISOString() });
  localStorage.setItem(SKEY, JSON.stringify(list));
};
export const listSubscribers = () => readKey(SKEY);
