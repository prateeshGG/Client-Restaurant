/* ─────────────────────────────────────────────────────────────────────────
 * OPTION A — FRESH  (bright, friendly, bento)
 * Signature patterns (see 04-architecture/DISTINCT-BRIEF.md, FRESH column):
 *  floating glass capsule header · bottom-sheet mobile nav with 2×3 icon tiles ·
 *  bento hero with booking · Stay/Dine toggle · pausable review marquee ·
 *  "good to know" tiles · segmented-pill room filters + grid/list toggle ·
 *  swipe carousel room detail with bento facts + sticky mobile Book bar ·
 *  grouped menu rows whose circular plate springs out on hover/focus (tap on touch) ·
 *  single centred wizard card with % progress + collapsible trip pill ·
 *  number/day/time chips · confetti confirmations · bento contact/about ·
 *  light-green rounded footer with Owner login.
 * All copy/data comes from src/content.js (editable in the Owner Dashboard).
 * ───────────────────────────────────────────────────────────────────────── */
import { site, rooms, menu, testimonials, images, story, hours, amenities, faqs, neighborhood, events, reservations as resCfg } from '../../content.js';
import { esc, money, icon, fmtDate, fmtTime, today, addDays, columbusNow, $, $$ } from '../../core/util.js';
import { defaultPages } from '../../core/pages.js';
import { bookingWizard, reservationFlow, manageFlow, contactForm, roomsBrowser, menuBrowser, dietBadges, newsletterForm } from '../../core/flows.js';
import { mapHTML, mountMap, directionsUrl } from '../../core/map.js';
import { setupTabs, lightbox } from '../../core/ui.js';

/* ── small helpers ─────────────────────────────────────────────────────── */
const FI = {
  home: '<path d="M4 11.2 12 4.5l8 6.7V20h-5.2v-5.6H9.2V20H4z"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
  list: '<rect x="4" y="4.5" width="16" height="6" rx="2"/><rect x="4" y="13.5" width="16" height="6" rx="2"/>',
  dots: '<circle cx="7.5" cy="7.5" r="2.2" fill="currentColor"/><circle cx="16.5" cy="7.5" r="2.2" fill="currentColor"/><circle cx="7.5" cy="16.5" r="2.2" fill="currentColor"/><circle cx="16.5" cy="16.5" r="2.2" fill="currentColor"/>',
  pause: '<path d="M9 6.5v11M15 6.5v11"/>',
  play: '<path d="M8.5 6v12l9.5-6z"/>',
  chat: '<path d="M4.5 5.5h15v10.5H10l-5.5 4z"/><path d="M8.5 10h7M8.5 13h4"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  bowl: '<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M8.5 8c0-1.4 1-1.6 1-3M12.5 8c0-1.4 1-1.6 1-3"/>',
  moon: '<path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.2 6.2 0 0 0 10.1 10.1z"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  coffee: '<path d="M4.5 9.5h12v4.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M16.5 11h1.2a2.3 2.3 0 0 1 0 4.6h-1.5M9 3.5c0 1.3 1.2 1.3 1.2 2.8M12.6 3.5c0 1.3 1.2 1.3 1.2 2.8"/>',
};
const fi = (name, size = 20) =>
  FI[name]
    ? `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${FI[name]}</svg>`
    : icon(name, size);
const bubble = (name, size = 22, cls = '') => `<span class="bubble ${cls}" aria-hidden="true">${fi(name, size)}</span>`;
const tel = () => site.phone.replace(/\D/g, '');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const shortDate = (s) => fmtDate(s, { month: 'short', day: 'numeric' });
const roomCount = () => rooms.reduce((a, r) => a + (+r.inventory || 0), 0) || rooms.length;
const minRate = () => Math.min(...rooms.map((r) => r.rate));
const hoursOf = (label) => hours.find((h) => h.label.toLowerCase().startsWith(label)) || { days: '', time: '' };
const promo = () => {
  const [code, pct] = Object.entries(site.promoCodes || {})[0] || [];
  return code ? { code, pct: Math.round(pct * 100) } : null;
};
const PERIOD_ICON = { breakfast: 'coffee', lunch: 'bowl', dinner: 'moon', drinks: 'glass' };
const nowPeriod = () => {
  const { hhmm } = columbusNow();
  const p = hhmm < '10:30' ? 'breakfast' : hhmm < '14:30' ? 'lunch' : 'dinner';
  return menu.periods.some((x) => x.id === p) ? p : menu.periods[0]?.id;
};

/* ── brand ─────────────────────────────────────────────────────────────── */
const mark = `<svg class="logo__mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect width="40" height="40" rx="13" fill="#8ED444"/><path d="M10 30V18.4L20 11l10 7.4V30z" fill="#17231A"/><path d="M16.8 30v-5.4a3.2 3.2 0 0 1 6.4 0V30z" fill="#8ED444"/><path d="M25.4 14.4V9.6h2.8v6.9z" fill="#17231A"/></svg>`;
const logo = (cls = '') => `<a class="logo ${cls}" href="#/" aria-label="${esc(site.name)} — home">${mark}<span class="logo__text"><strong>${esc(site.name)}</strong><small>${esc(site.tagline)}</small></span></a>`;

const NAV = [['/stay', 'Stay'], ['/dine', 'Dine'], ['/about', 'About'], ['/contact', 'Contact']];
const TILES = [
  ['/', 'Home', 'home', 'Start here'],
  ['/stay', 'Stay', 'bed', 'Our rooms'],
  ['/dine', 'Dine', 'plate', 'The menu'],
  ['/reserve', 'Reserve', 'calendar', 'Book a table'],
  ['/about', 'About', 'leaf', 'Our story'],
  ['/contact', 'Contact', 'chat', 'Say hello'],
];

const header = () => `
  <header class="site-header">
    <div class="capsule">
      ${logo()}
      <nav class="capsule__nav" aria-label="Main"><ul class="nav-links">${NAV.map(([p, l]) => `<li><a href="#${p}" data-nav="${p}">${l}</a></li>`).join('')}</ul></nav>
      <div class="capsule__cta">
        <a class="capsule__link hide-md" href="#/reserve">${icon('calendar', 18)}<span>Book a table</span></a>
        <a class="btn btn--primary capsule__book" href="#/book">Book<span class="hide-sm">&nbsp;a stay</span></a>
        <button class="menu-btn capsule__menu" type="button" data-drawer-open aria-expanded="false" aria-controls="drawer" aria-label="Open menu">${fi('dots', 20)}</button>
      </div>
    </div>
  </header>
  <div class="drawer sheet" id="drawer" data-drawer hidden>
    <div class="drawer__panel sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-t">
      <span class="sheet__grab" aria-hidden="true"></span>
      <div class="sheet__head"><h2 class="sheet__title" id="sheet-t">Where to?</h2><button class="sheet__close" type="button" data-drawer-close aria-label="Close menu">${icon('x', 20)}</button></div>
      <ul class="sheet__tiles">${TILES.map(([p, l, ic, s]) => `<li><a class="sheet__tile" href="#${p}" data-nav="${p}"><span class="sheet__ico">${fi(ic, 22)}</span><span class="sheet__lbl">${l}</span><span class="sheet__sub">${s}</span></a></li>`).join('')}</ul>
      <div class="sheet__cta"><a class="btn btn--primary btn--lg" href="#/book">Book a stay</a><a class="btn btn--soft btn--lg" href="#/manage">${icon('key', 18)} My booking</a></div>
      <p class="sheet__meta"><a href="tel:${tel()}">${icon('phone', 16)} ${esc(site.phone)}</a><span>${esc(site.address.line1)}, ${esc(site.address.line2)}</span></p>
    </div>
  </div>`;

const footer = () => `
  <footer class="site-footer">
    <div class="foot">
      <div class="foot__grid">
        <div class="foot__brand">
          ${logo('logo--foot')}
          <p>A ${roomCount()}-room hotel, an all-day Kitchen and a rooftop bar in a restored ${esc(site.since)} brick corner of ${esc(site.city)}.</p>
          <div class="foot__social">${[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']].map(([s, l]) => `<a href="${esc(site.social[s] || '#')}" aria-label="${l}">${icon(s, 20)}</a>`).join('')}</div>
        </div>
        <nav class="foot__nav" aria-label="Footer">
          <div><h2 class="foot__h">Stay</h2><ul><li><a href="#/stay">Rooms &amp; rates</a></li><li><a href="#/book">Book a stay</a></li><li><a href="#/manage">Manage booking</a></li></ul></div>
          <div><h2 class="foot__h">Eat &amp; drink</h2><ul><li><a href="#/dine">Menus</a></li><li><a href="#/reserve">Reserve a table</a></li><li><a href="#/contact?topic=event">Private events</a></li></ul></div>
          <div><h2 class="foot__h">House</h2><ul><li><a href="#/about">Our story</a></li><li><a href="#/contact">Contact &amp; FAQ</a></li><li><a href="${directionsUrl()}" target="_blank" rel="noopener">Directions<span class="sr-only"> (opens in a new tab)</span></a></li></ul></div>
        </nav>
        <div class="foot__news">
          <h2 class="foot__h">Letters from the house</h2>
          <p>One friendly email a month — openings, new dishes and founding-guest offers.</p>
          ${newsletterForm('Your email address')}
        </div>
      </div>
      <div class="foot__base">
        <p>© ${new Date().getFullYear()} ${esc(site.name)} · ${esc(site.address.line1)}, ${esc(site.address.line2)} · <a href="tel:${tel()}">${esc(site.phone)}</a></p>
        <a class="owner-btn" href="/admin/" data-owner-link><span class="owner-btn__ico" aria-hidden="true">${icon('key', 16)}</span><span>Owner login</span></a>
      </div>
    </div>
  </footer>`;

/* ── page pieces ───────────────────────────────────────────────────────── */
const pageHead = ({ eyebrow, title, lead = '', image = '', cta = '', side = '', compact = false }) =>
  compact
    ? `<section class="phead phead--compact"><div class="container phead__inner"><p class="eyebrow">${eyebrow}</p><h1 class="phead__title">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div></section>`
    : `<section class="phead"><div class="container"><div class="phead__card ${image || side ? 'has-side' : ''}">
        <div class="phead__text"><p class="eyebrow">${eyebrow}</p><h1 class="phead__title">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}${cta ? `<div class="phead__cta">${cta}</div>` : ''}</div>
        ${image ? `<div class="phead__media"><img src="${image}" alt=""></div>` : side}
      </div></div></section>`;

const shead = (e, t, l = '', { id = '', cls = '' } = {}) =>
  `<div class="shead ${cls}"><p class="eyebrow">${e}</p><h2 class="shead__title"${id ? ` id="${id}"` : ''}>${t}</h2>${l ? `<p class="lead">${l}</p>` : ''}</div>`;

const hoursDl = (cls = 'hrs') => `<dl class="${cls}">${hours.map((h) => `<div><dt>${esc(h.label)}<small>${esc(h.days)}</small></dt><dd>${esc(h.time)}</dd></div>`).join('')}</dl>`;

const roomCard = (r, i = 0) => `
  <article class="rcard" style="--i:${i}">
    <div class="rcard__top">
      <a class="rcard__media" href="#/stay/${r.id}" tabindex="-1" aria-hidden="true"><img src="${r.images[0]}" alt="" loading="lazy"></a>
      <span class="rcard__sleeps">${icon('users', 14)} Sleeps ${r.sleeps}</span>
      <p class="rcard__price"><strong>${money(r.rate)}</strong><span>/ night</span></p>
    </div>
    <div class="rcard__body">
      <h3 class="rcard__name"><a href="#/stay/${r.id}">${esc(r.name)}</a></h3>
      <ul class="rcard__facts"><li>${icon('bed', 15)} ${esc(r.bed)}</li><li>${icon('size', 15)} ${r.size} sq ft</li></ul>
      <p class="rcard__desc">${esc(r.short)}</p>
      <ul class="rcard__amen">${r.amenities.slice(0, 5).map((a) => `<li>${icon('check', 13)} ${esc(a)}</li>`).join('')}</ul>
      <div class="rcard__actions"><a class="rcard__more" href="#/stay/${r.id}">Room details<span class="sr-only">: ${esc(r.name)}</span> ${icon('arrow', 16)}</a><a class="btn btn--primary btn--sm" href="#/book?room=${r.id}&step=1" aria-label="Book ${esc(r.name)}">Book</a></div>
    </div>
  </article>`;

/* Grouped menu row. Hover / keyboard focus → a round plate springs out beside the row;
 * touch (hover:none) → tap expands the row with a round thumbnail (button toggles aria-expanded). */
const mrow = (i) => `
  <article class="mrow" data-menu-item="${i.id}">
    <div class="mrow__main">
      <h3 class="mrow__name"><button class="mrow__btn" type="button" aria-expanded="false" aria-controls="plate-${i.id}">${esc(i.name)}</button></h3>
      <p class="mrow__desc">${esc(i.desc)}</p>
      ${i.diet && i.diet.length ? `<p class="mrow__diet">${dietBadges(i)}</p>` : ''}
    </div>
    <div class="mrow__side"><p class="mrow__price">${money(i.price)}</p><span class="mrow__cue" aria-hidden="true">${icon('plus', 16)}</span></div>
    <div class="mrow__plate" id="plate-${i.id}"><img src="${i.image || images.dining}" alt="${esc(i.name)}" loading="lazy" decoding="async" width="240" height="240"></div>
  </article>`;

function bindPlates(root) {
  if (!root || root.dataset.plates) return;
  root.dataset.plates = '1';
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.mrow__btn');
    if (!b || !root.contains(b)) return;
    const on = b.getAttribute('aria-expanded') !== 'true';
    $$('.mrow__btn[aria-expanded="true"]', root).forEach((x) => x !== b && x.setAttribute('aria-expanded', 'false'));
    b.setAttribute('aria-expanded', String(on));
  });
}
const plateHint = `<span class="hint-hover">Hover or tab to a dish to see it plated</span><span class="hint-touch">Tap a dish to see it</span>`;

/* Confetti dots (deterministic, decorative). They land in the top band around the badge. */
const CONF = ['#8ED444', '#3A7D1F', '#FFC857', '#FF8A65', '#7CC6FE', '#17231A'];
const confetti = (n = 24) =>
  `<div class="confetti" aria-hidden="true">${Array.from({ length: n }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const x = 50 + side * (12 + ((i * 17) % 36));
    const y = 14 + ((i * 29) % 120);
    return `<i class="${i % 3 === 0 ? 'is-bar' : ''}" style="--x:${x}%;--y:${y}px;--c:${CONF[i % CONF.length]};--r:${(i * 47) % 180}deg;--d:${(i % 8) * 55}ms;--s:${7 + (i % 4) * 3}px;--fx:${-side * (40 + (i % 5) * 12)}px"></i>`;
  }).join('')}</div>`;

/* ── UI-kit overrides (shared flows, Fresh markup) ─────────────────────── */
const priceLines = (d, q) => `
  <dl class="plines">
    <div><dt>${money(q.room.rate)} × ${plural(q.nights, 'night')}</dt><dd>${money(q.subtotal, true)}</dd></div>
    ${q.discount ? `<div class="is-discount"><dt>Code ${esc(d.promo)} (−${Math.round(q.pct * 100)}%)</dt><dd>−${money(q.discount, true)}</dd></div>` : ''}
    <div><dt>Lodging tax (${(site.lodgingTaxRate * 100).toFixed(1)}%)</dt><dd>${money(q.tax, true)}</dd></div>
    <div class="is-total"><dt>Total · pay at the hotel</dt><dd>${money(q.total, true)}</dd></div>
  </dl>`;
const roomsLoading = () => '<div class="skeleton skeleton--row"></div>'.repeat(3);
const leadPills = (parts, href) => `<p class="wizard__lead">${parts.map((p) => `<span class="pill-note">${p}</span>`).join('')}<a class="link" href="${href}">Change</a></p>`;

const yayFacts = (rows) => `<dl class="yay__facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

const ui = {
  stepper: (steps, current, base) => {
    const n = steps.length;
    const pct = Math.round((current / n) * 100);
    const from = Math.round(((current - 1) / n) * 100);
    return `
    <nav class="prog" aria-label="Progress">
      <div class="prog__top"><p class="prog__label">Step ${current} of ${n} · <strong>${steps[current - 1]}</strong></p><p class="prog__pct" aria-hidden="true">${pct}%</p></div>
      <div class="prog__bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-valuetext="${pct}% — step ${current} of ${n}"><span style="--to:${pct}%;--from:${from}%"></span></div>
      <ol class="prog__dots" style="--n:${n}">${steps
        .map((s, i) => {
          const k = i + 1;
          const st = k < current ? 'done' : k === current ? 'current' : 'todo';
          const inner = `<span class="prog__dot">${st === 'done' ? icon('check', 14) : k}</span><span class="prog__name">${s}</span>`;
          return `<li class="is-${st}">${st === 'done' ? `<a href="${base}?step=${k}" aria-label="Step ${k}: ${s} (completed, edit)">${inner}</a>` : `<span ${st === 'current' ? 'aria-current="step"' : ''}>${inner}</span>`}</li>`;
        })
        .join('')}</ol>
    </nav>`;
  },

  wizardShell: ({ kind, stepperHTML, main, aside }) => `
    <div class="wz wz--${kind}">
      <div class="wz__card">${stepperHTML}${aside}<div class="wz__main">${main}</div></div>
      <ul class="wz__assure">${(kind === 'book' ? ['Best rate when you book direct', 'No booking or resort fees', 'Pay at the hotel'] : ['Free to reserve', 'Tables held for 15 minutes', 'Change or cancel online']).map((t) => `<li>${icon('check', 14)} ${t}</li>`).join('')}</ul>
    </div>`,

  summary: (d, q, room) => `
    <details class="trip">
      <summary class="trip__pill">
        <span class="trip__ico" aria-hidden="true">${icon('calendar', 18)}</span>
        <span class="trip__txt"><strong>Your trip</strong><span>${d.checkIn ? `${shortDate(d.checkIn)} → ${shortDate(d.checkOut)}` : 'Dates not set'} · ${plural(+d.guests || 2, 'guest')}${room ? ` · ${esc(room.name)}` : ''}</span></span>
        ${q ? `<span class="trip__total">${money(q.total, true)}</span>` : ''}
        <span class="trip__chev" aria-hidden="true">${fi('chev', 18)}</span>
      </summary>
      <div class="trip__body">
        ${room ? `<img class="trip__img" src="${room.images[0]}" alt="" loading="lazy">` : ''}
        <dl class="trip__list">
          <div><dt>Check-in</dt><dd>${d.checkIn ? fmtDate(d.checkIn) : '—'}</dd></div>
          <div><dt>Check-out</dt><dd>${d.checkOut ? fmtDate(d.checkOut) : '—'}</dd></div>
          <div><dt>Guests</dt><dd>${d.guests || '—'}</dd></div>
          <div><dt>Room</dt><dd>${room ? esc(room.name) : 'Not chosen yet'}</dd></div>
        </dl>
        ${q ? priceLines(d, q) : ''}
        <p class="trip__note">${icon('check', 14)} Free cancellation up to 48 hours before arrival</p>
      </div>
    </details>`,
  priceLines,

  datesStep: ({ f, values }) => `
    <form class="form" novalidate data-form="dates">
      <h2 class="wizard__title" tabindex="-1">When are you coming?</h2>
      <div class="form__grid">${f.checkIn}${f.checkOut}</div>
      <fieldset class="field field--chips" data-field>
        <legend class="field__label">Guests</legend>
        <div class="nchips">${[1, 2, 3, 4].map((n) => `<label class="nchip"><input type="radio" name="guests" value="${n}" aria-label="${plural(n, 'guest')}" ${+values.guests === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
        <p class="field__hint">Five or more? Book two rooms or <a class="link" href="#/contact?topic=event">ask about groups</a>.</p>
        <p class="field__error" role="alert"></p>
      </fieldset>
      <div class="form__grid form__grid--one">${f.promo}</div>
      <div class="form__actions"><button class="btn btn--primary btn--lg btn--block" type="submit">See available rooms ${icon('arrow', 18)}</button></div>
    </form>`,

  roomsStep: ({ d, nights }) => `
    <h2 class="wizard__title" tabindex="-1">Pick your room</h2>
    ${leadPills([`${icon('calendar', 15)} ${shortDate(d.checkIn)} → ${shortDate(d.checkOut)}`, plural(nights, 'night'), `${icon('users', 15)} ${plural(+d.guests, 'guest')}`], '#/book?step=1')}
    <div class="ropts" data-room-options aria-busy="true">${roomsLoading()}</div>`,
  roomsLoading,
  roomOption: (r, { avail, total, nights, picked }) => `
    <article class="ropt ${avail ? '' : 'is-soldout'} ${picked ? 'is-picked' : ''}">
      <img class="ropt__img" src="${r.images[0]}" alt="${esc(r.name)}" loading="lazy">
      <div class="ropt__body">
        <h3 class="ropt__name">${esc(r.name)} ${picked ? '<span class="badge">Your pick</span>' : ''}</h3>
        <p class="ropt__meta"><span>${icon('bed', 15)} ${esc(r.bed)}</span><span>${icon('users', 15)} Sleeps ${r.sleeps}</span><span>${icon('size', 15)} ${r.size} sq ft</span></p>
        <p class="ropt__desc">${esc(r.short)}</p>
      </div>
      <div class="ropt__foot">
        <p class="ropt__price"><strong>${money(r.rate)}</strong> / night<small>${money(total)} for ${plural(nights, 'night')} + tax</small></p>
        ${avail ? `<button class="btn btn--primary" type="button" data-pick="${r.id}" aria-label="Choose ${esc(r.name)}">Choose ${icon('arrow', 16)}</button>` : `<p class="ropt__sold">${icon('info', 16)} Sold out for these dates · <a class="link" href="#/book?step=1">Try other dates</a></p>`}
      </div>
    </article>`,
  roomsHiddenNotice: (hidden, guests) => `<p class="fnote">${icon('info', 16)} ${hidden} room type${hidden > 1 ? 's are' : ' is'} hidden because ${hidden > 1 ? 'they sleep' : 'it sleeps'} fewer than ${guests} guests.</p>`,
  roomsFull: () => `<div class="fempty">${bubble('calendar', 26)}<h3>We’re full on those dates</h3><p>Try moving your stay by a day or two — availability changes quickly.</p><a class="btn btn--primary" href="#/book?step=1">Change dates</a></div>`,

  detailsStep: ({ f }) => `
    <form class="form" novalidate data-form="details">
      <h2 class="wizard__title" tabindex="-1">Who’s checking in?</h2>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.arrival}${f.requests}${f.policy}</div>
      <div class="form__actions"><a class="btn btn--ghost" href="#/book?step=2">${icon('arrowLeft', 18)} Back</a><button class="btn btn--primary btn--lg" type="submit">Review booking ${icon('arrow', 18)}</button></div>
    </form>`,

  reviewStep: ({ d, q, g }) => `
    <h2 class="wizard__title" tabindex="-1">Looks good?</h2>
    <div class="rv">
      <section class="rv__tile"><div class="rv__head"><h3>${icon('calendar', 17)} Stay</h3><a class="link" href="#/book?step=1" aria-label="Edit dates">Edit</a></div><p>${fmtDate(d.checkIn)} →<br>${fmtDate(d.checkOut)}<br>${plural(q.nights, 'night')} · ${plural(+d.guests, 'guest')}</p></section>
      <section class="rv__tile"><div class="rv__head"><h3>${icon('bed', 17)} Room</h3><a class="link" href="#/book?step=2" aria-label="Change room">Edit</a></div><p>${esc(q.room.name)}<br>${esc(q.room.bed)} · ${money(q.room.rate)} / night</p></section>
      <section class="rv__tile rv__tile--wide"><div class="rv__head"><h3>${icon('users', 17)} Guest</h3><a class="link" href="#/book?step=3" aria-label="Edit guest details">Edit</a></div><p>${esc(g.first)} ${esc(g.last)} · ${esc(g.email)} · ${esc(g.phone)}<br>Arriving ${g.arrival === 'late' ? 'after 10 pm' : fmtTime(g.arrival)}${g.requests ? `<br><em>“${esc(g.requests)}”</em>` : ''}</p></section>
      <section class="rv__tile rv__tile--wide rv__tile--price" aria-label="Price">${priceLines(d, q)}</section>
    </div>
    <p class="review__small">No payment is taken online — your card is requested at check-in. By confirming you accept our booking policy.</p>
    <div class="form__actions"><a class="btn btn--ghost" href="#/book?step=3">${icon('arrowLeft', 18)} Back</a><button class="btn btn--primary btn--lg" type="button" data-confirm>Confirm booking · ${money(q.total, true)}</button></div>`,

  bookingDone: (rec, icsHref) => `
    <section class="yay">
      ${confetti()}
      <div class="yay__badge" aria-hidden="true">${icon('check', 36)}</div>
      <p class="eyebrow">Booking confirmed</p>
      <h2 class="confirm__title" tabindex="-1">Yay! See you soon, ${esc(rec.guest.first)}.</h2>
      <p class="yay__lead">A confirmation is on its way to <strong>${esc(rec.guest.email)}</strong>.</p>
      <div class="yay__code"><span>Confirmation code</span><strong data-code>${rec.code}</strong></div>
      ${yayFacts([['Room', esc(rec.roomName)], ['Dates', `${shortDate(rec.checkIn)} → ${shortDate(rec.checkOut)}`], ['Guests', rec.guests], ['Total · pay at hotel', money(rec.total, true)]])}
      <div class="yay__actions"><a class="btn btn--soft" href="${icsHref}" download="${rec.code}.ics">${icon('calendar', 18)} Add to calendar</a><a class="btn btn--primary" href="#/reserve">Add a dinner table ${icon('arrow', 18)}</a></div>
      <p class="yay__small">Need to change something? <a class="link" href="#/manage?code=${rec.code}">Manage this booking</a></p>
    </section>`,
  notFound: (title, text, cta) => `<div class="fempty">${bubble('info', 26)}<h2 class="confirm__title" tabindex="-1">${title}</h2><p>${text}</p>${cta}</div>`,

  /* ── table reservation: number chips · day chips · pill times ── */
  tableStep: (ctx) => {
    const days = ctx.days.slice(0, 14);
    const inRange = days.some((x) => x.iso === ctx.date);
    return `
    <form class="form" novalidate data-form="table">
      <h2 class="wizard__title" tabindex="-1">Grab a table for dinner</h2>
      <fieldset class="field field--chips" data-field>
        <legend class="field__label">How many of you?</legend>
        <div class="nchips nchips--party">${Array.from({ length: ctx.maxParty }, (_, i) => i + 1).map((n) => `<label class="nchip"><input type="radio" name="party" value="${n}" aria-label="${plural(n, 'guest')}" ${n === ctx.party ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
        <p class="field__hint">More than ${ctx.maxParty}? <a class="link" href="#/contact?topic=event">Send an event enquiry</a>.</p>
      </fieldset>
      <fieldset class="field field--chips" data-field>
        <legend class="field__label">Which day?</legend>
        <div class="dscroll is-start" data-dscroll><button class="dscroll__btn dscroll__btn--prev" type="button" data-dstep="-1" aria-label="Show earlier days" tabindex="-1">${icon('arrow', 16)}</button><div class="dchips" data-dchips>${days.map((x) => `<label class="dchip ${x.closed ? 'is-closed' : ''}"><input type="radio" name="date" value="${x.iso}" ${x.iso === ctx.date && !x.closed ? 'checked' : ''} ${x.closed ? 'disabled' : ''} aria-label="${x.label}${x.today ? ' (today)' : ''}${x.closed ? ' — closed' : ''}"><span><small>${x.today ? 'Today' : x.dow}</small><b>${x.day}</b><small>${x.closed ? 'Closed' : x.month}</small></span></label>`).join('')}</div><button class="dscroll__btn dscroll__btn--next" type="button" data-dstep="1" aria-label="Show later days" tabindex="-1">${icon('arrow', 16)}</button></div>
        <div class="dlater"><label class="dlater__lbl" for="f-later">${icon('calendar', 16)} Planning further ahead?</label><input class="field__input dlater__input" id="f-later" type="date" name="date" min="${addDays(ctx.t, 14)}" max="${ctx.max}" value="${inRange ? '' : ctx.date}"></div>
        <p class="field__error" role="alert"></p>
      </fieldset>
      <fieldset class="field field--chips">
        <legend class="field__label">What time?</legend>
        <div class="tpills" data-slots></div>
        <p class="field__error" data-slot-error role="alert"></p>
      </fieldset>
      <div class="form__actions"><button class="btn btn--primary btn--lg btn--block" type="submit">Continue ${icon('arrow', 18)}</button></div>
    </form>`;
  },
  partyLabel: (n) => plural(n, 'guest'),
  tableSlot: (s, { disabled, full, checked }) => `<label class="tpill ${disabled ? 'is-disabled' : ''}"><input type="radio" name="time" value="${s}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span>${fmtTime(s)}${full ? '<small>full</small>' : ''}</span></label>`,
  tableSlotGroups: () => null,
  tableClosed: (date) => `<p class="fnote">${icon('info', 16)} The Kitchen is closed for dinner on ${fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}. Pick another day — breakfast needs no booking.</p>`,
  tableNoSlots: () => `<p class="fnote">${icon('info', 16)} No tables left that day. Try another date, or walk in — the bar is first-come.</p>`,
  tableDetailsStep: ({ d, f }) => `
    <form class="form" novalidate data-form="rdetails">
      <h2 class="wizard__title" tabindex="-1">Almost there</h2>
      ${leadPills([`${icon('users', 15)} ${plural(d.party, 'guest')}`, `${icon('calendar', 15)} ${fmtDate(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}`, `${icon('clock', 15)} ${fmtTime(d.time)}`], '#/reserve?step=1')}
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.occasion}${f.notes}</div>
      <div class="form__actions"><a class="btn btn--ghost" href="#/reserve?step=1">${icon('arrowLeft', 18)} Back</a><button class="btn btn--primary btn--lg" type="submit">Reserve table</button></div>
    </form>`,
  tableDone: (rec) => `
    <section class="yay">
      ${confetti()}
      <div class="yay__badge" aria-hidden="true">${icon('check', 36)}</div>
      <p class="eyebrow">Table reserved</p>
      <h2 class="confirm__title" tabindex="-1">Your table is set, ${esc(rec.guest.first)}!</h2>
      <p class="yay__lead">${plural(rec.party, 'guest')} · ${fmtDate(rec.date, { weekday: 'long', month: 'long', day: 'numeric' })} at ${fmtTime(rec.time)}</p>
      <div class="yay__code"><span>Reservation code</span><strong data-code>${rec.code}</strong></div>
      <p class="yay__small">We hold tables for 15 minutes. Running late? Call <a class="link" href="tel:${tel()}">${esc(site.phone)}</a>.</p>
      <div class="yay__actions"><a class="btn btn--soft" href="#/dine">See the menu</a><a class="btn btn--primary" href="#/stay">Make it a night — see rooms ${icon('arrow', 18)}</a></div>
      <p class="yay__small"><a class="link" href="#/manage?code=${rec.code}">Change or cancel</a></p>
    </section>`,

  /* ── manage ── */
  manageForm: ({ f }) => `
    <div class="wz wz--manage">
      <div class="wz__card">
        <div class="mg__head">${bubble('key', 22, 'bubble--lime')}<div><h2 class="mg__title">Look it up</h2><p>Use the code from your confirmation email.</p></div></div>
        <form class="form" novalidate data-form="lookup"><div class="form__grid">${f.code}${f.last}</div><div class="form__actions"><button class="btn btn--primary btn--lg btn--block" type="submit">Find my booking</button></div></form>
      </div>
      <div class="mg__result" data-manage-result aria-live="polite"></div>
    </div>`,
  bookingCard: (rec) => {
    const isStay = rec.type === 'stay';
    const off = rec.status === 'cancelled';
    const rows = isStay
      ? [['Name', `${esc(rec.guest.first)} ${esc(rec.guest.last)}`], ['Room', esc(rec.roomName)], ['Dates', `${shortDate(rec.checkIn)} → ${shortDate(rec.checkOut)}`], ['Total', money(rec.total, true)]]
      : [['Name', `${esc(rec.guest.first)} ${esc(rec.guest.last)}`], ['When', `${fmtDate(rec.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${fmtTime(rec.time)}`], ['Party', plural(rec.party, 'guest')]];
    return `
    <article class="pass ${off ? 'is-cancelled' : ''}">
      <header class="pass__head"><div><p class="pass__kind">${icon(isStay ? 'bed' : 'plate', 16)} ${isStay ? 'Room booking' : 'Table reservation'}</p><h3 class="pass__code">${rec.code}</h3></div><span class="pass__status" data-booking-status>${off ? 'Cancelled' : 'Confirmed'}</span></header>
      <dl class="pass__facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${off ? `<p class="fnote pass__note">${icon('info', 16)} This ${isStay ? 'booking' : 'reservation'} was cancelled. <a class="link" href="#/${isStay ? 'book' : 'reserve'}">Make a new one</a></p>` : `<div class="pass__actions"><button class="btn btn--danger" type="button" data-cancel>Cancel ${isStay ? 'booking' : 'reservation'}</button></div>`}
    </article>`;
  },
  manageNotFound: () => `<div class="fempty fempty--inline">${bubble('search', 24)}<h3>No booking matches those details</h3><p>Check the code in your confirmation email and the last name used to book. Still stuck? Call <a class="link" href="tel:${tel()}">${esc(site.phone)}</a>.</p></div>`,

  /* ── contact ── */
  contactForm: ({ topic, f }) => `
    <form class="form" novalidate data-form="contact">
      <fieldset class="topics"><legend class="field__label">What’s it about?</legend>
        <div class="topics__row">${[['general', 'Just saying hi', 'chat'], ['event', 'Event or group', 'users'], ['press', 'Press', 'star']].map(([v, l, ic]) => `<label class="topic"><input type="radio" name="topic" value="${v}" ${v === topic ? 'checked' : ''}><span>${fi(ic, 22)}${l}</span></label>`).join('')}</div>
      </fieldset>
      <div class="form__grid">${f.name}${f.email}<div class="form__event field--full" data-event-fields ${topic === 'event' ? '' : 'hidden'}><div class="form__grid">${f.eventDate}${f.eventGuests}</div></div>${f.message}</div>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Send message ${icon('arrow', 18)}</button></div>
    </form>`,
  contactDone: ({ first, isEvent }) => `
    <div class="yay yay--compact">
      ${confetti(16)}
      <div class="yay__badge" aria-hidden="true">${icon('check', 30)}</div>
      <h3 class="confirm__title" tabindex="-1">Thanks, ${esc(first)} — message received!</h3>
      <p class="yay__lead">${isEvent ? 'Our events lead will reply within one business day.' : 'We reply to every message within one business day.'}</p>
      <button class="btn btn--soft" type="button" data-again>Send another message</button>
    </div>`,

  /* ── rooms browser: segmented pills + grid/list toggle ── */
  roomFilters: ({ guests, bed }) => `
    <form class="rf" aria-label="Filter rooms" data-room-filters onsubmit="return false">
      <div class="rf__group">
        <span class="rf__lbl" id="rf-bed-l">Bed</span>
        <div class="seg" role="group" aria-labelledby="rf-bed-l">${[['all', 'All'], ['king', 'King'], ['queen', 'Queens']].map(([v, l]) => `<button type="button" class="seg__opt" data-bed="${v}" aria-pressed="${v === bed}">${l}</button>`).join('')}</div>
      </div>
      <div class="rf__group">
        <span class="rf__lbl" id="rf-g-l">Guests</span>
        <div class="seg" role="radiogroup" aria-labelledby="rf-g-l">${[1, 2, 3, 4, 5].map((n) => `<label class="seg__opt"><input type="radio" name="guests" value="${n}" ${n === guests ? 'checked' : ''} aria-label="${n}${n === 5 ? ' or more' : ''} guest${n > 1 ? 's' : ''}"><span>${n}${n === 5 ? '+' : ''}</span></label>`).join('')}</div>
      </div>
      <div class="rf__group rf__sort">
        <label class="rf__lbl" for="rf-s">Sort</label>
        <div class="rf__select"><select id="rf-s" name="sort"><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="size-desc">Most space</option></select>${fi('chev', 16)}</div>
      </div>
      <div class="rf__group rf__view">
        <span class="rf__lbl" id="rf-v-l">View</span>
        <div class="vt" role="group" aria-labelledby="rf-v-l"><button type="button" class="vt__btn" data-vt="grid" aria-pressed="true" aria-label="Grid view">${fi('grid', 18)}</button><button type="button" class="vt__btn" data-vt="list" aria-pressed="false" aria-label="List view">${fi('list', 18)}</button></div>
      </div>
    </form>
    <p class="rf__count" data-count aria-live="polite"></p>
    <div class="rgrid" data-rooms-grid data-layout="grid"></div>`,
  roomsEmpty: ({ guests, bed }) => `<div class="fempty">${bubble('bed', 26)}<h3>No single room sleeps ${guests}${guests === 5 ? '+' : ''}${bed !== 'all' ? ` with ${bed === 'queen' ? 'queen beds' : 'a king bed'}` : ''}</h3><p>Book two connecting rooms, or ask us about a group rate.</p><div class="fempty__actions"><button class="btn btn--primary" type="button" data-reset>Clear filters</button><a class="btn btn--soft" href="#/contact?topic=event">Group enquiry</a></div></div>`,
  roomsCount: (n) => `${n} room type${n === 1 ? '' : 's'} to choose from`,

  /* ── menu browser: pill period switch + tick chips + grouped rows ── */
  menuTools: ({ period }) => `
    <div class="mtools">
      <div class="ptabs" role="tablist" aria-label="Menu">${menu.periods.map((p) => `<button class="ptab" role="tab" type="button" id="tab-${p.id}" aria-controls="menu-panel" data-value="${p.id}" aria-selected="${p.id === period}" tabindex="${p.id === period ? 0 : -1}">${fi(PERIOD_ICON[p.id] || 'plate', 20)}<span>${esc(p.label)}</span></button>`).join('')}</div>
      <div class="mtools__row">
        <div class="dietchips" role="group" aria-label="Dietary filters">${menu.diets.map((d) => `<button type="button" class="dchipx" data-diet="${d.id}" aria-pressed="false"><span class="dchipx__tick" aria-hidden="true">${icon('check', 14)}</span>${esc(d.label)}</button>`).join('')}</div>
        <div class="msearch">${icon('search', 18)}<label class="sr-only" for="menu-q">Search the menu</label><input id="menu-q" class="msearch__input" type="search" placeholder="Search dishes…" autocomplete="off" data-menu-search></div>
      </div>
    </div>
    <div class="mgroup">
      <div class="mgroup__head"><p class="mgroup__note" data-menu-note aria-live="polite"></p><p class="mgroup__hint">${plateHint}</p></div>
      <div class="mlist" id="menu-panel" role="tabpanel" tabindex="0" data-menu-list></div>
      <p class="mgroup__legend">${menu.diets.map((d) => `<span><abbr class="diet diet--${d.id}">${d.id.toUpperCase()}</abbr> ${esc(d.label)}</span>`).join('')}</p>
    </div>`,
  menuNote: (p, n) => `${p.label} · ${p.note} · ${n} dish${n === 1 ? '' : 'es'}`,
  menuEmpty: (q) => `<div class="fempty">${bubble('plate', 26)}<h3>Nothing matches${q ? ` “${esc(q)}”` : ''}</h3><p>Try removing a filter — or just ask your server, the Kitchen can adapt most dishes.</p><button class="btn btn--primary" type="button" data-clear>Clear filters</button></div>`,

  /* ── newsletter ── */
  newsletterForm: (label = 'Your email address') => `
    <form class="nl" data-newsletter novalidate>
      <div class="field">
        <label class="field__label nl__label" for="f-nlEmail">${label}</label>
        <div class="nl__pill">
          <input class="field__input nl__input" id="f-nlEmail" name="nlEmail" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="f-nlEmail-err">
          <button class="btn btn--primary nl__btn" type="submit">Subscribe</button>
        </div>
        <p class="field__error" id="f-nlEmail-err" role="alert"></p>
      </div>
    </form>`,
  newsletterDone: () => `<p class="nl__done" role="status"><span class="bubble bubble--lime" aria-hidden="true">${icon('check', 18)}</span> You’re on the list — first letter lands before opening night.</p>`,
};

/* ── pages ─────────────────────────────────────────────────────────────── */
const base = defaultPages({ pageHead, roomCard, menuItem: mrow, sectionHead: (e, t, l) => shead(e, t, l) });

const home = () => {
  const pr = promo();
  const t = today();
  const featured = menu.items.filter((i) => i.featured && i.available !== false).slice(0, 6);
  const [lead, ...rest] = rooms;
  const bf = hoursOf('breakfast');
  const roof = hoursOf('rooftop');
  const cards = testimonials.map((q, i) => `<li class="qcard qcard--${i % 4}"><figure><span class="qcard__mark" aria-hidden="true">“</span><blockquote>${esc(q.quote)}</blockquote><figcaption>${bubble('leaf', 18, 'bubble--sm')}<span><strong>${esc(q.name)}</strong><small>${esc(q.where)}</small></span></figcaption></figure></li>`).join('');
  const cardsDup = testimonials.map((q, i) => `<li class="qcard qcard--${i % 4}" aria-hidden="true"><figure><span class="qcard__mark">“</span><blockquote>${esc(q.quote)}</blockquote><figcaption>${bubble('leaf', 18, 'bubble--sm')}<span><strong>${esc(q.name)}</strong><small>${esc(q.where)}</small></span></figcaption></figure></li>`).join('');
  const gtkInfo = [
    ['clock', `Check-in ${esc(site.checkIn)}`, `Check-out by ${esc(site.checkOut)}. Early or late? Just ask — it’s free when we can.`, 'lime'],
    ['coffee', 'Breakfast for all', `${esc(bf.days)}, ${esc(bf.time)} in the Kitchen. Walk in, no key needed.`, ''],
    ['glass', 'Rooftop bar', `${esc(roof.days)}, ${esc(roof.time)}. Skyline views and Ohio rye.`, 'ink'],
    ['check', 'Free cancellation', 'Change your mind up to 48 hours before arrival — no fee.', 'white'],
  ];
  return {
    title: '',
    html: `
    <section class="hb" aria-label="Welcome">
      <div class="container hb__grid">
        <div class="hb__tile hb__intro">
          <p class="eyebrow">${icon('pin', 14)} German Village · ${esc(site.city)}</p>
          <h1 class="hb__title">Come for dinner. <span class="hl">Stay for breakfast.</span></h1>
          <p class="hb__lead">A ${roomCount()}-room hotel with an all-day Kitchen and a rooftop bar, tucked into a restored ${esc(site.since)} brick corner. Friendly rates, very good beds and pancakes worth waking up for.</p>
          <div class="hb__links"><a class="btn btn--light" href="#/stay">Explore rooms ${icon('arrow', 16)}</a><a class="btn btn--light" href="#/dine">See the menu ${icon('arrow', 16)}</a></div>
        </div>
        <form class="hb__tile hb__book" novalidate data-bookbar aria-label="Check room availability">
          <div class="hb__bookhead"><h2 class="hb__h">Check availability</h2><p>Best rate direct · no booking fees</p></div>
          <div class="hb__f"><label for="hb-in">Check-in</label><input id="hb-in" name="in" type="date" min="${t}" value="${t}" required></div>
          <div class="hb__f"><label for="hb-out">Check-out</label><input id="hb-out" name="out" type="date" min="${addDays(t, 1)}" value="${addDays(t, 2)}" required></div>
          <div class="hb__f hb__f--g"><label for="hb-g">Guests</label><select id="hb-g" name="guests">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${plural(n, 'guest')}</option>`).join('')}</select></div>
          <button class="btn btn--primary btn--lg hb__go" type="submit">See rooms ${icon('arrow', 18)}</button>
          <p class="hb__err" data-bookbar-err role="alert"></p>
        </form>
        <figure class="hb__tile hb__photo"><img src="${images.hero}" alt="The red-brick Scioto House on its German Village corner at dusk, windows glowing" fetchpriority="high"><figcaption>${icon('star', 14)} Restored ${esc(site.since)} corner building</figcaption></figure>
        <figure class="hb__tile hb__dish"><img src="${images.breakfast}" alt="Buttermilk pancakes with berries and maple syrup by a sunny window" loading="lazy"><figcaption>${fi('coffee', 15)} Breakfast · <span class="nw">${esc(bf.time)}</span></figcaption></figure>
        ${pr ? `<div class="hb__tile hb__promo"><p class="hb__kick">Founding guests</p><p class="hb__big">${pr.pct}% off</p><p class="hb__small">your first stay with&nbsp;code <strong>${esc(pr.code)}</strong></p></div>` : `<div class="hb__tile hb__promo"><p class="hb__kick">Book direct</p><p class="hb__big">$0 fees</p><p class="hb__small">No booking or resort fees, ever.</p></div>`}
        <a class="hb__tile hb__rate" href="#/stay"><span class="hb__kick">Rooms from</span><strong>${money(minRate())}</strong><span class="hb__small"><span class="nw">per night ·</span> <span class="nw">no resort fee</span></span><span class="hb__arrow" aria-hidden="true">${icon('arrow', 18)}</span></a>
        <figure class="hb__tile hb__roof"><img src="${images.rooftop}" alt="The rooftop bar at sunset with the Columbus skyline beyond" loading="lazy"><figcaption><strong class="nw">Rooftop bar</strong> · <span class="nw">${esc(roof.time)}</span></figcaption></figure>
      </div>
    </section>

    <section class="section sw" aria-labelledby="sw-h">
      <div class="container">
        <div class="sw__head">
          ${shead('Two ways in', 'Staying over, or just hungry?', '', { id: 'sw-h' })}
          <div class="toggle" role="tablist" aria-label="Show rooms or food" data-on="stay">
            <span class="toggle__thumb" aria-hidden="true"></span>
            <button class="toggle__opt" role="tab" type="button" id="sw-t-stay" data-value="stay" aria-selected="true" aria-controls="sw-stay" tabindex="0">${icon('bed', 18)} Stay</button>
            <button class="toggle__opt" role="tab" type="button" id="sw-t-dine" data-value="dine" aria-selected="false" aria-controls="sw-dine" tabindex="-1">${icon('plate', 18)} Dine</button>
          </div>
        </div>
        <div class="sw__panel" id="sw-stay" role="tabpanel" aria-labelledby="sw-t-stay">
          <div class="swstay">
            <article class="swstay__lead">
              <a class="swstay__media" href="#/stay/${lead.id}" tabindex="-1" aria-hidden="true"><img src="${lead.images[0]}" alt="" loading="lazy"><span class="swstay__tag">${icon('star', 13)} Guest favourite</span></a>
              <div class="swstay__body">
                <h3 class="swstay__name"><a href="#/stay/${lead.id}">${esc(lead.name)}</a></h3>
                <p>${esc(lead.short)}</p>
                <div class="swstay__row"><p class="swstay__price"><strong>${money(lead.rate)}</strong> / night</p><a class="btn btn--primary" href="#/book?room=${lead.id}&step=1" aria-label="Book ${esc(lead.name)}">Book</a></div>
              </div>
            </article>
            <ul class="swstay__list">${rest.slice(0, 4).map((r) => `<li><a class="swmini" href="#/stay/${r.id}"><img src="${r.images[0]}" alt="" loading="lazy"><span class="swmini__price">${money(r.rate)}</span><span class="swmini__name">${esc(r.name)}</span><span class="swmini__meta">${esc(r.bed)} · sleeps ${r.sleeps}</span></a></li>`).join('')}</ul>
          </div>
          <p class="sw__more"><a class="btn btn--soft" href="#/stay">Compare all ${rooms.length} rooms ${icon('arrow', 16)}</a></p>
        </div>
        <div class="sw__panel" id="sw-dine" role="tabpanel" aria-labelledby="sw-t-dine" hidden>
          <div class="swdine">
            <div class="mgroup swdine__menu">
              <div class="mgroup__head"><h3 class="mgroup__title">House favourites</h3><p class="mgroup__hint">${plateHint}</p></div>
              <div class="mlist">${featured.map(mrow).join('')}</div>
            </div>
            <div class="swdine__side">
              <figure class="swdine__photo"><img src="${images.dining}" alt="The Kitchen dining room with green leather banquettes and warm lamps" loading="lazy"></figure>
              <div class="swdine__hours"><h3 class="swdine__h">${icon('clock', 18)} Open all day</h3>${hoursDl('hrs hrs--sm')}<div class="swdine__btns"><a class="btn btn--primary" href="#/reserve">Reserve a table</a><a class="btn btn--light" href="#/dine">Full menu</a></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section mq" aria-labelledby="mq-h">
      <div class="container mq__head">
        ${shead('Kind words', 'Early guests, happy plates', '', { id: 'mq-h' })}
        <button class="mq__toggle" type="button" data-mq>${fi('pause', 18)}<span>Pause reviews</span></button>
      </div>
      <div class="marquee" data-marquee><ul class="marquee__track" style="--mq-dur:${testimonials.length * 11}s">${cards}${cardsDup}</ul></div>
      <p class="container mq__note">${icon('info', 14)} Quotes from preview dinners and soft-opening stays.</p>
    </section>

    <section class="section gtk" aria-labelledby="gtk-h">
      <div class="container">
        <div class="gtk__head">${shead('Good to know', 'Little answers, before you ask', '', { id: 'gtk-h' })}<a class="btn btn--soft" href="#/contact">All FAQs ${icon('arrow', 16)}</a></div>
        <ul class="gtk__grid">
          ${gtkInfo.map(([ic, h, p, tone]) => `<li class="gtk__tile ${tone ? `gtk__tile--${tone}` : ''}">${bubble(ic, 22)}<h3>${h}</h3><p>${p}</p></li>`).join('')}
          <li class="gtk__tile gtk__tile--amen"><h3>Also on the house</h3><ul class="gtk__chips">${amenities.filter((a) => a.icon !== 'glass').map((a) => `<li>${icon(a.icon, 18)} ${esc(a.label)}</li>`).join('')}</ul></li>
        </ul>
      </div>
    </section>`,
    mount: (el) => {
      const tl = $('.toggle', el);
      if (tl)
        setupTabs(tl, (v) => {
          tl.dataset.on = v;
          $$('.sw__panel', el).forEach((p) => (p.hidden = p.id !== `sw-${v}`));
        });
      bindPlates($('.swdine', el));
      const mq = $('[data-marquee]', el);
      const btn = $('[data-mq]', el);
      btn &&
        btn.addEventListener('click', () => {
          const paused = mq.classList.toggle('is-paused');
          btn.innerHTML = paused ? `${fi('play', 18)}<span>Play reviews</span>` : `${fi('pause', 18)}<span>Pause reviews</span>`;
        });
    },
  };
};

const stay = () => ({
  title: 'Rooms',
  html: `
    ${pageHead({ eyebrow: 'Stay', title: 'Find your favourite room', lead: 'Five ways to stay, all with original brick or timber, a very good bed and our best rate — always lowest when you book here.', image: images.lobby })}
    <section class="section section--tight"><div class="container" data-rooms></div></section>
    <section class="section incl" aria-labelledby="incl-h"><div class="container">
      ${shead('Every stay includes', 'The good stuff, on the house', '', { id: 'incl-h' })}
      <ul class="incl__grid">${amenities.map((a) => `<li class="incl__tile">${bubble(a.icon, 22)}<span>${esc(a.label)}</span></li>`).join('')}
        <li class="incl__tile incl__tile--cta"><span>Questions about a room?</span><a class="btn btn--light" href="#/contact">Ask us ${icon('arrow', 16)}</a></li></ul>
    </div></section>`,
  mount: (el) => {
    const host = $('[data-rooms]', el);
    roomsBrowser(host, roomCard);
    const grid = $('[data-rooms-grid]', host);
    const setView = (v) => {
      grid.dataset.layout = v;
      $$('[data-vt]', host).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vt === v)));
      try {
        sessionStorage.setItem('fresh:view', v);
      } catch {
        /* private mode */
      }
    };
    host.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-vt]');
      if (b) setView(b.dataset.vt);
    });
    let saved = 'grid';
    try {
      saved = sessionStorage.getItem('fresh:view') === 'list' ? 'list' : 'grid';
    } catch {
      /* ignore */
    }
    setView(saved);
  },
});

function carousel(root, room) {
  if (!root) return;
  const track = $('.car__track', root);
  const dots = $$('[data-dot]', root);
  const now = $('[data-count-now]', root);
  const n = room.images.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = 0;
  const paint = (i) => {
    idx = i;
    dots.forEach((d, j) => (j === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    if (now) now.textContent = i + 1;
  };
  const go = (i) => {
    i = (i + n) % n;
    track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    paint(i);
  };
  let raf;
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i !== idx && i >= 0 && i < n) paint(i);
      });
    },
    { passive: true }
  );
  $$('[data-step]', root).forEach((b) => b.addEventListener('click', () => go(idx + +b.dataset.step)));
  dots.forEach((d, j) => d.addEventListener('click', () => go(j)));
  $$('[data-zoom]', root).forEach((b) => b.addEventListener('click', () => lightbox(room.images, +b.dataset.zoom, room.name, b)));
  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') (e.preventDefault(), go(idx + 1));
    if (e.key === 'ArrowLeft') (e.preventDefault(), go(idx - 1));
  });
}

const room = (r) => {
  const rm = rooms.find((x) => x.id === r.parts[1]);
  if (!rm) return notFound(r, 'That room doesn’t exist — maybe it was renamed.');
  const others = rooms.filter((x) => x.id !== rm.id).slice(0, 3);
  const n = rm.images.length;
  return {
    title: rm.name,
    html: `
    <div class="container rd">
      <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="#/">Home</a></li><li><a href="#/stay">Rooms</a></li><li aria-current="page">${esc(rm.name)}</li></ol></nav>
      <div class="rd__grid">
        <div class="car" data-car data-n="${n}">
          <div class="car__track" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Photos of ${esc(rm.name)} — swipe or use the arrow keys">
            ${rm.images.map((src, i) => `<div class="car__slide" role="group" aria-roledescription="slide" aria-label="Photo ${i + 1} of ${n}"><button class="car__zoom" type="button" data-zoom="${i}" aria-label="Open photo ${i + 1} of ${n} full screen"><img src="${src}" alt="${esc(rm.name)} — photo ${i + 1} of ${n}" ${i ? 'loading="lazy"' : ''}></button></div>`).join('')}
          </div>
          <button class="car__nav car__nav--prev" type="button" data-step="-1" aria-label="Previous photo">${icon('arrowLeft', 20)}</button>
          <button class="car__nav car__nav--next" type="button" data-step="1" aria-label="Next photo">${icon('arrow', 20)}</button>
          <span class="car__count" aria-hidden="true"><b data-count-now>1</b> / ${n}</span>
          <div class="car__dots" role="group" aria-label="Choose photo">${rm.images.map((_, i) => `<button class="car__dot" type="button" data-dot="${i}" aria-label="Show photo ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}></button>`).join('')}</div>
        </div>
        <div class="rd__info">
          <p class="eyebrow">${icon('users', 14)} Sleeps ${rm.sleeps} · ${esc(rm.bed)}</p>
          <h1 class="rd__title">${esc(rm.name)}</h1>
          <p class="rd__desc">${esc(rm.description)}</p>
          <div class="rd__bento">
            <div class="fact fact--rate"><span>From</span><strong>${money(rm.rate)}</strong><span>per night</span></div>
            <div class="fact">${bubble('bed', 20)}<strong>${esc(rm.bed)}</strong><span>Bed</span></div>
            <div class="fact">${bubble('users', 20)}<strong>Up to ${rm.sleeps}</strong><span>Guests</span></div>
            <div class="fact">${bubble('size', 20)}<strong>${rm.size} sq ft</strong><span>Space</span></div>
            <div class="fact fact--wide"><h2 class="fact__h">In the room</h2><ul class="fact__amen">${rm.amenities.map((a) => `<li>${icon('check', 14)} ${esc(a)}</li>`).join('')}</ul></div>
            <div class="fact fact--wide fact--line">${bubble('clock', 20, 'bubble--lime')}<p>Check-in from <strong>${esc(site.checkIn)}</strong> · check-out by <strong>${esc(site.checkOut)}</strong> · free cancellation up to 48 hours before arrival.</p></div>
          </div>
          <div class="rd__cta"><a class="btn btn--primary btn--lg" href="#/book?room=${rm.id}&step=1">Book this room ${icon('arrow', 18)}</a><a class="btn btn--soft btn--lg" href="#/reserve">Add a dinner table</a></div>
        </div>
      </div>
    </div>
    <div class="rd-bar" role="region" aria-label="Quick book">
      <p><strong>${money(rm.rate)}</strong> / night<small>${esc(rm.name)} · free cancellation</small></p>
      <a class="btn btn--primary" href="#/book?room=${rm.id}&step=1">Book now</a>
    </div>
    <section class="section section--tint" aria-labelledby="more-h"><div class="container">
      ${shead('You might also like', 'More rooms upstairs', '', { id: 'more-h' })}
      <div class="rgrid" data-layout="grid">${others.map((o, i) => roomCard(o, i)).join('')}</div>
    </div></section>`,
    mount: (el) => {
      carousel($('[data-car]', el), rm);
      const cta = $('.rd__cta', el);
      const bar = $('.rd-bar', el);
      if (cta && bar && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(([en]) => {
          if (!bar.isConnected) return io.disconnect();
          bar.classList.toggle('is-away', en.isIntersecting);
        }, { threshold: 0.3 });
        io.observe(cta);
      }
    },
  };
};

const eventsBento = () => `
  <section class="section evb" aria-labelledby="evb-h"><div class="container evb__grid">
    <figure class="evb__photo"><img src="${images.events}" alt="Long candle-lit table set in the brick-walled private dining room" loading="lazy"></figure>
    <div class="evb__text"><p class="eyebrow">Gatherings</p><h2 class="evb__title" id="evb-h">${esc(events.title)}</h2><p>${esc(events.text)}</p><a class="btn btn--primary" href="#/contact?topic=event">Plan an event ${icon('arrow', 16)}</a></div>
    ${events.capacity.map((c, i) => `<div class="evb__cap evb__cap--${i}"><strong>${esc(c.value)}</strong><span>${esc(c.label)}</span></div>`).join('')}
  </div></section>`;

const dine = () => ({
  title: 'Dine',
  html: `
    ${pageHead({
      eyebrow: 'The Kitchen',
      title: 'Modern Midwestern, all day long',
      lead: 'Breakfast for guests and neighbours, a smash burger at lunch and Lake Erie walleye by candlelight. Open to everyone — no room key needed.',
      cta: `<a class="btn btn--primary btn--lg" href="#/reserve">Reserve a table ${icon('arrow', 18)}</a>`,
      side: `<div class="phead__side"><h2 class="phead__sideh">${icon('clock', 20)} Hours</h2>${hoursDl()}<p class="phead__sidenote">Breakfast, lunch and the rooftop bar are walk-in. Dinner books up to ${resCfg.daysAhead} days ahead.</p></div>`,
    })}
    <section class="section section--tight" aria-label="Menu"><div class="container dine" data-menu></div></section>
    ${eventsBento()}`,
  mount: (el) => {
    const host = $('[data-menu]', el);
    menuBrowser(host, mrow, { initial: nowPeriod() });
    bindPlates(host);
  },
});

const about = () => {
  const history = ['Dry-goods store', 'Bakery', 'Printer', 'Record shop', site.name];
  return {
    title: 'About',
    html: `
    <section class="section section--tight"><div class="container ab">
      <div class="ab__tile ab__intro"><p class="eyebrow">Since ${esc(site.since)}</p><h1 class="ab__title">${esc(story.headline)}</h1><p class="lead">${esc(story.intro)}</p></div>
      <figure class="ab__tile ab__photo ab__photo--hero"><img src="${images.hero}" alt="The restored red-brick Scioto House building at dusk"></figure>
      <div class="ab__tile ab__stat ab__stat--lime"><strong>${roomCount()}</strong><span>rooms, no two quite alike</span></div>
      <div class="ab__tile ab__stat"><strong>1</strong><span>kitchen, cooking from 7 am</span></div>
      <div class="ab__tile ab__stat ab__stat--ink"><strong>1</strong><span>rooftop bar with a skyline view</span></div>
      <div class="ab__tile ab__text">${bubble('home', 22)}<p>${esc(story.paragraphs[0] || '')}</p></div>
      <figure class="ab__tile ab__photo ab__photo--chef"><img src="${images.chef}" alt="Chef’s hands plating a dish at the kitchen pass" loading="lazy"></figure>
      <div class="ab__tile ab__text ab__text--mint">${bubble('plate', 22)}<p>${esc(story.paragraphs[1] || '')}</p></div>
      <div class="ab__tile ab__time"><h2 class="ab__h">One building, many lives</h2><ol class="ab__line">${history.map((h, i) => `<li><span class="ab__dot" aria-hidden="true"></span><strong>${i === 0 ? esc(site.since) : i === history.length - 1 ? 'Today' : 'Then'}</strong><span>${esc(h)}</span></li>`).join('')}</ol></div>
      ${story.values.map((v, i) => `<div class="ab__tile ab__value ab__value--${i}">${bubble(['leaf', 'star', 'users'][i % 3], 22)}<h2 class="ab__vh">${esc(v.title)}</h2><p>${esc(v.text)}</p></div>`).join('')}
      <figure class="ab__tile ab__photo ab__photo--hood"><img src="${images.neighborhood}" alt="Brick-paved street of red-brick houses in German Village" loading="lazy"></figure>
      <div class="ab__tile ab__hood"><h2 class="ab__h">On foot and nearby</h2><ul>${neighborhood.map((x) => `<li><span><strong>${esc(x.name)}</strong><small>${esc(x.text)}</small></span><em>${esc(x.distance)}</em></li>`).join('')}</ul></div>
      <div class="ab__tile ab__cta"><h2 class="ab__h">Come and see it for yourself</h2><div class="ab__btns"><a class="btn btn--primary btn--lg" href="#/book">Book a stay</a><a class="btn btn--light btn--lg" href="#/reserve">Reserve a table</a></div></div>
    </div></section>`,
  };
};

const contact = (r) => ({
  title: 'Contact',
  html: `
    <section class="section section--tight"><div class="container cb">
      <div class="cb__tile cb__intro"><p class="eyebrow">Contact</p><h1 class="cb__title">Say hello</h1><p class="lead">Questions about a stay, a big table or a wedding weekend? A real person answers within one business day.</p></div>
      <a class="cb__tile cb__quick cb__phone" href="tel:${tel()}">${bubble('phone', 22)}<span class="cb__k">Call the front desk</span><strong>${esc(site.phone)}</strong><small>Answered 24 hours a day</small></a>
      <a class="cb__tile cb__quick cb__mail" href="mailto:${esc(site.email)}">${bubble('mail', 22)}<span class="cb__k">Email us</span><strong>${esc(site.email)}</strong><small>Reply within one business day</small></a>
      <div class="cb__tile cb__map">${mapHTML('map--fresh')}</div>
      <div class="cb__tile cb__addr"><div class="cb__addrtop">${bubble('pin', 22, 'bubble--lime')}<div><span class="cb__k">Find us</span><strong>${esc(site.address.line1)}</strong><span>${esc(site.address.line2)}</span></div></div>${(() => { const g = amenities.filter((a) => ['car', 'bolt', 'paw', 'clock'].includes(a.icon)); return g.length ? `<ul class="cb__chips" aria-label="Getting here">${g.map((a) => `<li>${icon(a.icon, 16)} ${esc(a.label)}</li>`).join('')}</ul>` : ''; })()}<a class="btn btn--soft cb__go" href="${directionsUrl()}" target="_blank" rel="noopener">${icon('pin', 18)} Get directions<span class="sr-only"> (opens in a new tab)</span></a></div>
      <div class="cb__tile cb__hours"><h2 class="cb__h">${icon('clock', 18)} Hours</h2>${hoursDl('hrs hrs--sm')}</div>
      <div class="cb__tile cb__form"><h2 class="cb__h cb__h--lg">Send a message</h2><div data-contact></div></div>
    </div></section>
    <section class="section faqs" aria-labelledby="faq-h"><div class="container">
      ${shead('Good to know', 'Frequently asked questions', '', { id: 'faq-h', cls: 'shead--center' })}
      <div class="faqc">${faqs.map((f) => `<details class="faqc__item"><summary>${esc(f.q)}<span class="faqc__icon" aria-hidden="true">${icon('plus', 18)}</span></summary><p>${esc(f.a)}</p></details>`).join('')}</div>
    </div></section>`,
  mount: (el) => {
    contactForm($('[data-contact]', el), r.query);
    mountMap($('[data-map]', el));
  },
});

function enhanceReserve(host) {
  const form = $('[data-form=table]', host);
  if (!form) return;
  const row = $('[data-dchips]', form);
  const later = $('#f-later', form);
  const on = row && $('input:checked', row);
  if (on) row.scrollLeft = Math.max(0, on.closest('label').offsetLeft - 24);
  const wrap = row && row.closest('[data-dscroll]');
  if (wrap) {
    const edges = () => {
      wrap.classList.toggle('is-start', row.scrollLeft <= 8);
      wrap.classList.toggle('is-end', row.scrollLeft + row.clientWidth >= row.scrollWidth - 8);
    };
    edges();
    row.addEventListener('scroll', edges, { passive: true });
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dstep]');
      if (!b) return;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      row.scrollBy({ left: Number(b.dataset.dstep) * row.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (later && t === later) {
      $$('input[type=radio][name=date]', form).forEach((x) => (x.checked = false));
      if (!later.value) {
        const first = $('input[type=radio][name=date]:not([disabled])', form);
        if (first) {
          first.checked = true;
          first.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    } else if (t.name === 'date' && t.type === 'radio' && later) later.value = '';
  });
}

const flowPage = (title, head, run) => (r) => ({
  title,
  html: `${head}<section class="section section--tight flow-section"><div class="container" data-flow></div></section>`,
  mount: (el) => run($('[data-flow]', el), r.query),
  onQuery: (r2) => run($('[data-flow]'), r2.query),
});
const book = flowPage('Book a room', pageHead({ eyebrow: 'Book direct · best rate', title: 'Book your stay', compact: true }), bookingWizard);
const reserve = flowPage('Reserve a table', pageHead({ eyebrow: 'The Kitchen', title: 'Reserve a table', compact: true }), (h, q) => {
  reservationFlow(h, q);
  enhanceReserve(h);
});
const manage = flowPage('Manage booking', pageHead({ eyebrow: 'Your booking', title: 'Find your booking', lead: 'Look up a room booking or table reservation to see the details or cancel.', compact: true }), manageFlow);

const notFound = (r, msg) => ({
  title: 'Page not found',
  html: `<section class="section"><div class="container nf"><div class="nf__card">
    <p class="nf__big" aria-hidden="true">4<span>${fi('home', 56)}</span>4</p>
    <h1 class="nf__title">Oops — wrong door.</h1>
    <p class="lead">${msg || 'We couldn’t find that page. It may have moved while we were renovating.'}</p>
    <div class="nf__actions"><a class="btn btn--primary" href="#/">Back home</a><a class="btn btn--soft" href="#/stay">See rooms</a><a class="btn btn--soft" href="#/dine">See the menu</a></div>
  </div></div></section>`,
});

export default {
  header,
  footer,
  ui,
  pages: { ...base, home, stay, room, dine, about, contact, book, reserve, manage, notFound },
};
