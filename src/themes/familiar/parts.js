/* FAMILIAR — shared building blocks (icons, logo, countdown, cards, quick view, carousel markup). */
import { site, menu, hours, schedule, media, images } from '../../content.js';
import { esc, money, icon, columbusNow, fmtTime } from '../../core/util.js';
import { dietBadges } from '../../core/flows.js';
import { openDialog } from '../../core/ui.js';

/* Stand-in photos until the Familiar-specific shots arrive (see report: media.familiar). */
const FM = (media && media.familiar) || {};
export const PHOTO = {
  hero: FM.hero || images.breakfast,
  mission: FM.mission || images.dining,
  cta: FM.cta || images.hero,
  menuHead: FM.menuHead || images.dining,
  aboutHead: FM.aboutHead || images.hero,
  events: FM.events || images.events,
  newsletter: FM.newsletter || images.coffee,
};

/* Extra original line icons (24×24, stroke = currentColor). Falls back to the core set. */
const X = {
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevRight: '<path d="m9 6 6 6-6 6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  bag: '<path d="M5 8.5h14l-1.1 11.3a1.2 1.2 0 0 1-1.2 1.1H7.3a1.2 1.2 0 0 1-1.2-1.1L5 8.5z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.6"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  filter: '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  cup: '<path d="M4 9h13v4.5A5.5 5.5 0 0 1 11.5 19h-2A5.5 5.5 0 0 1 4 13.5V9z"/><path d="M17 10.5h1.2a2.5 2.5 0 0 1 0 5H16.6M8 3.5v2.5M12 3.5v2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.6A8 8 0 1 1 9.4 4a6.4 6.4 0 0 0 10.6 10.6z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6l-7-3z"/><path d="m9 12 2 2 4-4"/>',
  door: '<path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M4 21h16"/><circle cx="14.5" cy="12" r=".9"/>',
  receipt: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21V3z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  quote: '<path d="M10 7H6.5A2.5 2.5 0 0 0 4 9.5V13h5v5H4M20 7h-3.5A2.5 2.5 0 0 0 14 9.5V13h5v5h-5"/>',
};
export const ic = (name, size = 20, cls = '') =>
  X[name]
    ? `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${X[name]}</svg>`
    : icon(name, size, cls);

/* Round emblem logo (original artwork: arched 1891 window over the name). */
export const emblem = (cls = '') => `
  <svg class="emblem ${cls}" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
    <circle cx="36" cy="36" r="35.5" fill="#8ED444"/>
    <circle cx="36" cy="36" r="32" fill="#17231A"/>
    <path d="M30.5 29.5v-7a5.5 5.5 0 0 1 11 0v7z" fill="none" stroke="#8ED444" stroke-width="1.9" stroke-linejoin="round"/>
    <path d="M36 17.2v12.3M30.6 24.2h10.8M28 29.5h16" fill="none" stroke="#8ED444" stroke-width="1.3" stroke-linecap="round"/>
    <text x="36" y="43" text-anchor="middle" fill="#FFFFFF" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="11.2" letter-spacing=".7">SCIOTO</text>
    <text x="36" y="53.6" text-anchor="middle" fill="#8ED444" font-family="Poppins, system-ui, sans-serif" font-weight="600" font-size="8.4" letter-spacing="2.4">HOUSE</text>
  </svg>`;
export const logo = (cls = '') => `<a class="logo ${cls}" href="#/" aria-label="${esc(site.name)} — home">${emblem()}</a>`;

export const tel = site.phone.replace(/\D/g, '');

/* ── Live, labelled kitchen countdown (fixes the sample's unlabeled “1 Day, , 00 h…” timer) ── */
const toMin = (hm) => {
  const [h, m] = String(hm).split(':').map(Number);
  return h * 60 + (m || 0);
};
const dur = (m) => {
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d) return `${d} d ${h} h`;
  return h ? `${h} h ${mm} m` : `${mm} m`;
};
export function kitchenCountdown(now = columbusNow()) {
  const t = toMin(now.hhmm);
  const k = schedule.filter((s) => s.label !== 'Rooftop bar');
  const open = k.find((s) => s.d.includes(now.day) && t >= toMin(s.open) && t < toMin(s.close));
  if (open) return { open: true, label: `${open.label} service ends in`, time: dur(toMin(open.close) - t), detail: `Open until ${fmtTime(open.close)}` };
  for (let i = 0; i < 8; i++) {
    const day = (now.day + i) % 7;
    const next = k.filter((s) => s.d.includes(day) && (i > 0 || toMin(s.open) > t)).sort((a, b) => toMin(a.open) - toMin(b.open))[0];
    if (next) {
      const when = i === 0 ? '' : i === 1 ? 'tomorrow ' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] + ' ';
      return { open: false, label: 'Kitchen opens in', time: dur(i * 1440 + toMin(next.open) - t), detail: `${next.label} ${when}from ${fmtTime(next.open)}` };
    }
  }
  return { open: false, label: 'Kitchen', time: 'closed', detail: '' };
}
export const countdownHTML = () => {
  const c = kitchenCountdown();
  return `<span class="cd__dot ${c.open ? 'is-open' : ''}" aria-hidden="true"></span><span class="cd__label">${c.label}</span> <strong class="cd__time">${c.time}</strong>${c.detail ? `<span class="cd__detail"> · ${c.detail} (Columbus time)</span>` : ''}`;
};

/* ── Headings ── */
export const sectionHead = (title, lead = '', cls = '') =>
  `<header class="sh ${cls}"><h2 class="sh__t">${title}</h2>${lead ? `<p class="sh__l">${lead}</p>` : ''}</header>`;

export const crumbs = (trail) => `
  <nav class="crumbs" aria-label="Breadcrumb"><ol>
    <li><a href="#/">Home</a></li>
    ${trail.map(([label, href], i) => (i === trail.length - 1 || !href ? `<li aria-current="page">${label}</li>` : `<li><a href="${href}">${label}</a></li>`)).join('')}
  </ol></nav>`;

/* Page head: grey e-commerce band, or a photo band when an image is passed. */
export const pageHead = ({ title, lead = '', image = '', cta = '', crumb = null, compact = false, trust = false }) => `
  <section class="phead ${image ? 'phead--band' : ''} ${compact ? 'phead--compact' : ''}">
    ${image ? `<img class="phead__img" src="${image}" alt="" fetchpriority="high">` : ''}
    <div class="container phead__in">
      ${crumbs(crumb || [[title]])}
      <h1 class="phead__title">${title}</h1>
      ${lead ? `<p class="phead__lead">${lead}</p>` : ''}
      ${trust ? `<ul class="trust">${[['lock', 'Secure booking'], ['shield', 'Best rate — book direct'], ['check', 'Pay at the hotel']].map(([i, t]) => `<li>${ic(i, 16)} ${t}</li>`).join('')}</ul>` : ''}
      ${cta ? `<div class="phead__cta">${cta}</div>` : ''}
    </div>
  </section>`;

export const hoursTable = (cls = '') => `
  <table class="hrs ${cls}"><caption class="sr-only">Kitchen and bar hours</caption><tbody>
    ${hours.map((h) => `<tr><th scope="row">${esc(h.label)}<span>${esc(h.days)}</span></th><td>${esc(h.time)}</td></tr>`).join('')}
  </tbody></table>`;

/* ── Newsletter form (unique ids per instance) ── */
export const nlForm = (p = 'nl', label = 'Email address', btn = 'Subscribe') => `
  <form class="nlf" data-newsletter novalidate>
    <div class="field">
      <label class="field__label" for="${p}-email">${label}</label>
      <div class="nlf__row">
        <input class="field__input" id="${p}-email" name="nlEmail" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="${p}-err">
        <button class="btn btn--primary" type="submit">${btn}</button>
      </div>
      <p class="field__error" id="${p}-err" role="alert"></p>
    </div>
  </form>`;

/* ── Room cards ── */
/* Home “Rooms for Everyone” plan card (sample’s plan cards: as low as $x … CHOOSE). */
export const planCard = (r) => `
  <article class="plan">
    <a class="plan__media" href="#/stay/${r.id}" tabindex="-1" aria-hidden="true"><img src="${r.images[0]}" alt="" loading="lazy" decoding="async"></a>
    <div class="plan__body">
      <h3 class="plan__name">${esc(r.name)}</h3>
      <p class="plan__meta">${esc(r.bed)} · Sleeps ${r.sleeps}</p>
      <p class="plan__price"><span class="plan__low">as low as</span><strong>${money(r.rate)}</strong><span>per night</span></p>
      <a class="btn btn--primary plan__cta" href="#/book?room=${r.id}&step=1" aria-label="Choose ${esc(r.name)}">Choose</a>
      <a class="plan__more" href="#/stay/${r.id}">Room details<span class="sr-only">: ${esc(r.name)}</span></a>
    </div>
  </article>`;

/* Rooms list product card (e-commerce grid). */
export const productCard = (r) => `
  <article class="pcard">
    <a class="pcard__media" href="#/stay/${r.id}" tabindex="-1" aria-hidden="true">
      <img src="${r.images[0]}" alt="" loading="lazy" decoding="async">
      <span class="pcard__tag">${ic('users', 14)} Sleeps ${r.sleeps}</span>
    </a>
    <div class="pcard__body">
      <h3 class="pcard__name"><a href="#/stay/${r.id}">${esc(r.name)}</a></h3>
      <p class="pcard__meta">${esc(r.bed)} · ${r.size} sq ft</p>
      <p class="pcard__desc">${esc(r.short)}</p>
      <div class="pcard__foot">
        <p class="pcard__price"><small>as low as</small><span><strong>${money(r.rate)}</strong> / night</span></p>
        <a class="btn btn--primary pcard__cta" href="#/book?room=${r.id}&step=1" aria-label="Choose ${esc(r.name)}">Choose</a>
      </div>
    </div>
  </article>`;

/* ── Dish photos ──
 * Several dishes still share one stand-in photo (three breakfast plates use the pancake shot).
 * A stack of pancakes on "Brisket Hash" misleads, so only the dish that owns a photo shows it; the
 * others get an honest illustrated tile (category line-art on the green tint) until their own photo is
 * uploaded. Once every item has a unique image this falls away automatically. */
const OWNER_PREF = ['coffee', 'steak', 'spritz', 'beer'];
const PH_ART = {
  breakfast: '<path d="M4 9h13v4.5A5.5 5.5 0 0 1 11.5 19h-2A5.5 5.5 0 0 1 4 13.5V9z"/><path d="M17 10.5h1.2a2.5 2.5 0 0 1 0 5H16.6M8 3.5v2.5M12 3.5v2.5"/>',
  lunch: '<circle cx="12" cy="13" r="6.5"/><circle cx="12" cy="13" r="3.6"/><path d="M2.8 4.5v4.2a1.6 1.6 0 0 0 3.2 0V4.5M4.4 10.3V20M21 4.5c-1.6 1-2.4 3-2.4 5.3v2.4H21V20"/>',
  dinner: '<path d="M3 17.5h18M5 17.5a7 7 0 0 1 14 0M12 9V7.6"/><circle cx="12" cy="6.4" r="1.2"/><path d="M5.5 20.5h13"/>',
  drinks: '<path d="M5.5 4.5h13L12 12.5z"/><path d="M12 12.5v7M8.5 19.5h7M15.5 7.5l3-4"/>',
};
const phCache = {};
const placeholder = (period) => {
  if (phCache[period]) return phCache[period];
  const art = PH_ART[period] || PH_ART.dinner;
  const rings = Array.from({ length: 9 }, (_, k) => `<circle cx="200" cy="122" r="${40 + k * 26}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#EEF6E4"/><g fill="none" stroke="#D6EABF" stroke-width="1.5">${rings}</g><circle cx="200" cy="122" r="54" fill="#fff" stroke="#8ED444" stroke-width="3"/><g transform="translate(170 92) scale(2.5)" fill="none" stroke="#2F5F12" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${art}</g><text x="200" y="210" text-anchor="middle" font-family="Poppins, Segoe UI, Arial, sans-serif" font-size="14" font-weight="600" letter-spacing="2.6" fill="#2F5F12">PHOTO COMING SOON</text></svg>`;
  return (phCache[period] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
};
const photoOwner = (src) => {
  const users = menu.items.filter((x) => x.image === src);
  return (users.find((x) => x.featured) || users.find((x) => OWNER_PREF.includes(x.id)) || users[0])?.id;
};
export const isStandIn = (i) => !!i.image && photoOwner(i.image) !== i.id;
export const dishImage = (i) => i.image || placeholder(i.period); // stand-ins show until real menu-<id>.jpg photos arrive

/* ── Menu product card with quick-view (hover: zoom + overlay · focus: same · touch: tap → dialog) ── */
export const dietNames = (i) => i.diet.map((d) => menu.diets.find((x) => x.id === d)?.label).filter(Boolean);
export const menuCard = (i, { item = true } = {}) => {
  const names = dietNames(i);
  return `
  <article class="mcard" ${item ? `data-menu-item="${i.id}"` : ''}>
    <button class="mcard__media" type="button" data-qv="${i.id}" aria-label="Quick view: ${esc(i.name)}">
      <img src="${esc(dishImage(i))}" alt="${esc(i.name)}" loading="lazy" decoding="async">
      ${i.featured ? '<span class="badge-red">Chef’s pick</span>' : ''}
      <span class="mcard__over" aria-hidden="true">
        <span class="mcard__over-desc">${esc(i.desc)}</span>
        ${names.length ? `<span class="mcard__over-diet">${names.join(' · ')}</span>` : ''}
        <span class="mcard__over-cta">${ic('eye', 15)} Quick view</span>
      </span>
      <span class="mcard__tap" aria-hidden="true">${ic('eye', 15)} Details</span>
    </button>
    <div class="mcard__body">
      <h3 class="mcard__name">${esc(i.name)}</h3>
      <p class="mcard__desc">${esc(i.desc)}</p>
      <div class="mcard__foot"><span class="mcard__price">${money(i.price)}</span>${i.diet.length ? `<span class="mcard__diets">${dietBadges(i)}</span>` : ''}</div>
    </div>
  </article>`;
};

export function quickView(item, opener, { onDine = false } = {}) {
  const names = dietNames(item);
  const p = menu.periods.find((x) => x.id === item.period);
  const dlg = openDialog({
    title: esc(item.name),
    opener,
    className: 'dialog--qv',
    body: `
      <div class="qv">
        <div class="qv__media"><img src="${esc(dishImage(item))}" alt="${esc(item.name)}">${item.featured ? '<span class="badge-red">Chef’s pick</span>' : ''}</div>
        <div class="qv__info">
          <p class="qv__price">${money(item.price)}</p>
          <p class="qv__desc">${esc(item.desc)}</p>
          ${names.length ? `<ul class="qv__diet">${names.map((n) => `<li>${ic('leaf', 16)} ${n}</li>`).join('')}</ul>` : ''}
          ${p ? `<p class="qv__when">${ic('clock', 16)} ${esc(p.label)} · ${esc(p.note)}</p>` : ''}
          <div class="qv__cta"><a class="btn btn--primary" href="#/reserve">Reserve a table</a>${onDine ? '' : '<a class="btn btn--secondary" href="#/dine">Full menu</a>'}</div>
        </div>
      </div>`,
  });
  dlg.el.addEventListener('click', (e) => e.target.closest('a[href]') && dlg.close());
  return dlg;
}

/* Attach once per (per-render) root. Idempotent, and never stacks a second quick view on top of one. */
export function quickViewDelegate(root, opts) {
  if (!root || root.dataset.qvBound) return;
  root.dataset.qvBound = '1';
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qv]');
    if (!b || !root.contains(b)) return;
    e.stopPropagation();
    if (document.querySelector('.dialog--qv[open]')) return;
    const item = menu.items.find((x) => x.id === b.dataset.qv);
    if (item) quickView(item, b, opts);
  });
}

/* ── Carousel markup (behaviour in carousel.js) ── */
export const carouselHTML = ({ name, label, noun = 'slides', slides, cls = '', pause = false }) => `
  <div class="car car--${name} ${cls}" data-car="${name}">
    <div class="car__track" data-car-track tabindex="0" role="region" aria-roledescription="carousel" aria-label="${label}">
      ${slides.map((s, i) => `<div class="car__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">${s}</div>`).join('')}
    </div>
    <div class="car__ctrl">
      <button class="car__btn" type="button" data-car-prev aria-label="Previous ${noun}">${icon('arrowLeft', 20)}</button>
      <div class="car__dots" data-car-dots></div>
      <button class="car__btn" type="button" data-car-next aria-label="Next ${noun}">${icon('arrow', 20)}</button>
      ${pause ? `<button class="car__btn car__pause" type="button" data-car-pause aria-label="Pause ${noun}">${ic('pause', 18, 'i-pause')}${ic('play', 18, 'i-play')}</button>` : ''}
    </div>
  </div>`;
export const slideWrap = (list) => list.map((html, i, all) => `<div class="car__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${all.length}">${html}</div>`).join('');

/* Photo band (sample’s full-bleed image sections) with lazy <img> + scrim. */
export const band = (img, inner, cls = '') => `
  <section class="band ${cls}">
    <img class="band__img" src="${img}" alt="" loading="lazy" decoding="async">
    <div class="container band__in">${inner}</div>
  </section>`;

export const ctaBand = (title = 'Get Started', accent = 'With a Better Stay', text = 'A good bed upstairs, a great Kitchen downstairs and our lowest rate when you book direct.') =>
  band(
    PHOTO.cta,
    `<div class="cta__copy">
      <h2 class="cta__t">${title}<span>${accent}</span></h2>
      <p>${text}</p>
      <div class="cta__btns"><a class="btn btn--primary btn--lg" href="#/book">Book now</a><a class="btn btn--light btn--lg" href="#/reserve">Reserve a table</a></div>
    </div>`,
    'cta'
  );
