/* NOIR — small shared helpers used by views, kit overrides and page modules. */
import { site, schedule } from '../../content.js';
import { esc, money, icon, fmtDate, kitchenStatus } from '../../core/util.js';
import { dietBadges } from '../../core/flows.js';

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export const WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const pad2 = (n) => String(n).padStart(2, '0');
export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
export const shortDate = (s) => fmtDate(s, { weekday: 'short', month: 'short', day: 'numeric' });
export const longDate = (s) => fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric' });
/* Long date that collapses to the short form on narrow screens (tickets). */
export const fitDate = (s) => `<span class="d-long">${longDate(s)}</span><span class="d-short">${shortDate(s)}</span>`;
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const NAV = [['/stay', 'Stay'], ['/dine', 'Dine'], ['/about', 'House'], ['/contact', 'Contact']];

export const word = (cls = '') => `<a class="word ${cls}" href="#/" aria-label="${esc(site.name)} home"><span>Scioto</span><span>House</span></a>`;

export const statusHTML = () => {
  const s = kitchenStatus(schedule);
  return `<span class="status-dot ${s.open ? 'is-open' : ''}" aria-hidden="true"></span><span>Columbus ${s.now.label} · ${s.text}</span>`;
};

/* Poster card used by the home film strip and "other rooms" on the room page. */
export const roomCard = (r, i = 0) => `
  <article class="room-card">
    <a class="room-card__link" href="#/stay/${r.id}" aria-label="${esc(r.name)} — from ${money(r.rate)} per night">
      <img src="${r.images[0]}" alt="" loading="lazy">
      <span class="room-card__n">${pad2(i + 1)}</span>
      <span class="room-card__body">
        <span class="room-card__name">${esc(r.name)}</span>
        <span class="room-card__meta">${r.bed} · ${r.size} sq ft · from ${money(r.rate)}</span>
        <span class="room-card__more">View room ${icon('arrow', 16)}</span>
      </span>
    </a>
  </article>`;

/* Horizontal film strip with arrows + progress (behaviour: bindStrip). */
export const roomStrip = (list, { id, eyebrow, title }) => `
  <section class="strip-section" aria-labelledby="${id}">
    <div class="strip-head">
      <div><p class="eyebrow">${eyebrow}</p><h2 class="shead__title" id="${id}">${title}</h2></div>
      <div class="strip-nav"><button class="btn btn--icon" type="button" data-strip="-1" aria-label="Previous rooms">${icon('arrowLeft')}</button><button class="btn btn--icon" type="button" data-strip="1" aria-label="Next rooms">${icon('arrow')}</button></div>
    </div>
    <div class="strip" tabindex="0" role="region" aria-label="${esc(title)} — scroll horizontally">${list.map((r, i) => roomCard(r, i)).join('')}</div>
    <div class="strip-progress" aria-hidden="true"><span></span></div>
  </section>`;

/* One dish on the dark carte. The name is a disclosure button:
 *  – pointer hover / keyboard focus → the page crossfades a full-bleed photo (bindPeek → onShow)
 *  – tap / click / Enter → a wide photo strip opens under the row (works everywhere, required on touch). */
export const dishHTML = (i, { level = 3 } = {}) => `
  <article class="dish" data-menu-item="${i.id}" data-img="${esc(i.image || '')}" data-name="${esc(i.name)}">
    <div class="dish__top">
      <h${level} class="dish__h"><button class="dish__btn" type="button" aria-expanded="false" aria-controls="peek-${i.id}"><span class="dish__name">${esc(i.name)}</span><span class="dish__cue" aria-hidden="true"></span></button></h${level}>
      <span class="dish__price">${i.price}<span class="sr-only"> dollars</span></span>
    </div>
    <p class="dish__desc">${esc(i.desc)}</p>
    ${i.diet && i.diet.length ? `<p class="dish__diet">${dietBadges(i)}</p>` : ''}
    <figure class="dish__strip" id="peek-${i.id}" hidden><img alt="${esc(i.name)}" data-src="${esc(i.image || '')}" width="1200" height="514" decoding="async"></figure>
  </article>`;

/* Champagne ticket stub (confirmations). `rows` = [[label, html]]. The code element carries [data-code]. */
export const ticket = ({ kind, admit, what, rows, code, codeLabel = 'Confirmation', note = 'Keep this stub' }) => `
  <div class="ticket">
    <div class="ticket__main">
      <p class="ticket__house"><span>${esc(site.name)}</span><span>${kind}</span></p>
      <p class="ticket__admit">Admit ${WORDS[admit] || admit}</p>
      <p class="ticket__what">${esc(what)}</p>
      <dl class="ticket__rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </div>
    <div class="ticket__stub">
      <p class="ticket__k">${codeLabel}</p>
      <p class="ticket__code" data-code>${code}</p>
      <p class="ticket__k ticket__k--end">${note}</p>
    </div>
  </div>`;
