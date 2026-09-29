export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const money = (n, cents = false) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

/* Dates are handled as local 'YYYY-MM-DD' strings to avoid timezone drift. */
export const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
/* "Today" is always the hotel's date in Columbus (America/New_York), whatever the visitor's timezone. */
export const today = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
export const addDays = (s, n) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const nightsBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
export const fmtDate = (s, opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) =>
  parseISO(s).toLocaleDateString('en-US', opts);
export const fmtTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`;
};

/* Small deterministic hash — used for simulated availability so results are stable. */
export const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

export const code = (prefix) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const debounce = (fn, ms = 200) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

/* Original line-icon set (24×24, stroke = currentColor). */
const P = {
  wifi: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.4a10 10 0 0 1 14 0M8.5 15.9a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  car: '<path d="M5 16h14M3 16v-3.5L5 7h14l2 5.5V16M5 16v2M19 16v2"/><circle cx="7.5" cy="13" r="1"/><circle cx="16.5" cy="13" r="1"/>',
  paw: '<circle cx="6" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M8 17.5c0-2.8 1.8-5 4-5s4 2.2 4 5c0 1.4-1.2 2-2.2 1.6a4.8 4.8 0 0 0-3.6 0C9.2 19.5 8 18.9 8 17.5z"/>',
  glass: '<path d="M6 3h12l-1 7a5 5 0 0 1-10 0L6 3zM12 15v6M8 21h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  bed: '<path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M18 14.5c1.8.8 3 2.6 3 4.5"/>',
  size: '<path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15zM5 19l7-7"/>',
  plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".8"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.6 2.4 4.5 5 5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
};
export const icon = (name, size = 20, cls = '') =>
  `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;

/* Current time in Columbus (America/New_York) regardless of the visitor's timezone. */
export function columbusNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { day, hhmm: `${parts.hour}:${parts.minute}`, label: `${((+parts.hour + 11) % 12) + 1}:${parts.minute} ${+parts.hour >= 12 ? 'pm' : 'am'}` };
}

/* "Open now · Dinner until 10:00 pm" / "Closed · Opens 7:00 am" from the content schedule. */
export function kitchenStatus(schedule, now = columbusNow()) {
  const t = now.hhmm;
  const open = schedule.filter((s) => s.d.includes(now.day) && t >= s.open && t < s.close && s.label !== 'Rooftop bar');
  const fmt = (hm) => (hm === '24:00' ? 'midnight' : fmtTime(hm));
  if (open.length) return { open: true, text: `Kitchen open · ${open[0].label} until ${fmt(open[0].close)}`, now };
  for (let i = 0; i < 8; i++) {
    const day = (now.day + i) % 7;
    const next = schedule.filter((s) => s.d.includes(day) && s.label !== 'Rooftop bar' && (i > 0 || s.open > t)).sort((a, b) => (a.open < b.open ? -1 : 1))[0];
    if (next) return { open: false, text: `Kitchen closed · Opens ${i === 0 ? '' : i === 1 ? 'tomorrow ' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] + ' '}${fmt(next.open)}`, now };
  }
  return { open: false, text: 'Kitchen closed', now };
}
