/* Owner Dashboard — small helpers shared by every screen. */
import { esc, money, fmtTime, parseISO, addDays, iso, pad, fmtDate, nightsBetween, code, columbusNow, kitchenStatus } from '../core/util.js';
import { DEFAULT_PREVIEW } from './config.js';

export { esc, money, fmtTime, parseISO, addDays, iso, pad, fmtDate, nightsBetween, code, columbusNow, kitchenStatus };

export const clone = (x) => JSON.parse(JSON.stringify(x));
/** Key-order-insensitive deep equality (used for "has anything changed?"). */
const stable = (x) =>
  Array.isArray(x) ? `[${x.map(stable).join(',')}]` : x && typeof x === 'object' ? `{${Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(x[k])).join(',')}}` : JSON.stringify(x);
export const same = (a, b) => stable(a) === stable(b);
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8);
export const slug = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .slice(0, 40) || 'item';
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/* ── Columbus (America/New_York) date + time, whatever the device's timezone ── */
export function columbus(date = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  const hour = +p.hour;
  return {
    iso: `${p.year}-${p.month}-${p.day}`,
    hhmm: `${p.hour}:${p.minute}`,
    hour,
    time: `${((hour + 11) % 12) + 1}:${p.minute} ${hour >= 12 ? 'pm' : 'am'}`,
  };
}
export const longDate = (s) => fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric' });
export const shortDate = (s) => fmtDate(s, { weekday: 'short', month: 'short', day: 'numeric' });
export const dayMonth = (s) => fmtDate(s, { month: 'short', day: 'numeric' });
export const stamp = (isoStr) => {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
};
export const ago = (isoStr) => {
  const s = Math.max(0, (Date.now() - new Date(isoStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return stamp(isoStr);
};
export const timeLabel = (hm) => (hm === '24:00' ? 'midnight' : fmtTime(hm));
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ── Owner preferences (this browser) ── */
const PREF = 'sh:admin:prefs';
export const prefs = {
  get() {
    try {
      return { preview: DEFAULT_PREVIEW, ...JSON.parse(localStorage.getItem(PREF)) };
    } catch {
      return { preview: DEFAULT_PREVIEW };
    }
  },
  set(patch) {
    localStorage.setItem(PREF, JSON.stringify({ ...prefs.get(), ...patch }));
  },
};
export const DESIGNS = [
  { id: 'familiar', label: 'Familiar', note: 'Classic layout' },
  { id: 'fresh', label: 'Fresh', note: 'Bright & friendly' },
  { id: 'atelier', label: 'Atelier', note: 'Editorial' },
  { id: 'noir', label: 'Noir', note: 'After dark' },
  { id: 'terra', label: 'Terra', note: 'Sun-baked' },
];
/** Link to a page on the live site in the owner's preferred design. */
export const siteUrl = (path = '/') => `/${prefs.get().preview}/#${path}`;

/* ── Deep get/set by "a.b.0.c" path (used by form binding) ── */
export function getPath(obj, path) {
  return String(path)
    .split('.')
    .reduce((o, k) => (o == null ? o : o[k]), obj);
}
export function setPath(obj, path, value) {
  const keys = String(path).split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}

/* ── Download helper (Blob → file) ── */
export function download(filename, href) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => href.startsWith('blob:') && URL.revokeObjectURL(href), 4000);
}

/* ── Icons: original 24×24 line set for the dashboard ── */
const P = {
  home: '<path d="M3.5 10.5 12 4l8.5 6.5V19.5a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  dining: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.2 1-3.5 3.6-3.5 7v3H17"/>',
  menu: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="1.8"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z"/>',
  inbox: '<path d="M3.5 13.5 6 5.5h12l2.5 8V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5.5-5 4 3.5 2.5-2 4.5 3.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.6 7.6C4 9.3 2.5 12 2.5 12S6 18 12 18a9 9 0 0 0 4.2-1M9.9 10a3 3 0 0 0 4.1 4.1"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M18 14.5c1.8.8 3 2.6 3 4.5"/>',
  alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.5a2.3 2.3 0 0 1 4.4.8c0 1.6-2.2 2-2.2 3.4M12 16.8v.2"/>',
  undo: '<path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  sparkle: '<path d="M12 3.5c.6 4.2 2.8 6.5 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.5 6.4-2.8 7-7z"/>',
  door: '<path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h8A1.5 1.5 0 0 1 16 4.5V21M3 21h18M12.5 12v1.5M16 8h3v13"/>',
  tag: '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
  megaphone: '<path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
  userX: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 10.6-5M16 15l5 5M21 15l-5 5"/>',
  file: '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.3 3 7.8 7 9 4-1.2 7-4.7 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  reply: '<path d="M10 8 4.5 12.5 10 17M4.5 12.5H14a5.5 5.5 0 0 1 5.5 5.5v1"/>',
  dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
};
export const icon = (name, size = 20, cls = '') =>
  `<svg class="ai ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
