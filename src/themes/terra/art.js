/* TERRA — original hand-drawn SVG art (no external assets). */
import { site } from '../../content.js';
import { esc } from '../../core/util.js';

let uid = 0;
const nextId = (p) => `${p}-${++uid}`;

export const sun = (cls = '') =>
  `<svg class="sun ${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="11" fill="currentColor"/>${Array.from({ length: 12 }, (_, i) => `<path d="M32 6v9" stroke="currentColor" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 30} 32 32)"/>`).join('')}</svg>`;

export const squiggle = `<svg class="squiggle" viewBox="0 0 220 18" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M3 12c20-8 34 5 54-2s32-8 52 0 36 6 56-2 34-6 52 1" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`;

export const badge = (text) => {
  const id = nextId('ring');
  return `
  <svg class="badge-ring" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <defs><path id="${id}" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs>
    <text><textPath href="#${id}" textLength="488">${text}</textPath></text>
  </svg>`;
};

/* ── "Who's coming?" illustrations: people under a limewash arch ── */
const person = (cx, s = 1) => {
  const r = 6 * s;
  const hy = 64 - 20 * s;
  const b = 11 * s;
  return `<circle cx="${cx}" cy="${hy}" r="${r}"/><path d="M${cx - b} 64a${b} ${b} 0 0 1 ${2 * b} 0"/>`;
};
const who = (inner) => `
  <svg class="who__art" viewBox="0 0 96 72" aria-hidden="true" focusable="false">
    <path class="who__arch" d="M22 66V36a26 26 0 0 1 52 0v30z"/>
    <g class="who__line" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 64h80"/>${inner}
    </g>
  </svg>`;
export const WHO = [
  { v: 1, key: 'solo', title: 'Solo', sub: 'Just me · 1 guest', art: who(`${person(46)}<rect x="60" y="50" width="16" height="14" rx="2.5"/><path d="M64 50v-3.5h8V50"/>`) },
  { v: 2, key: 'couple', title: 'Couple', sub: 'The two of us · 2', art: who(`${person(37)}${person(59)}<path class="who__fill" d="M48 30c-4-3-7-5-7-8a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 3-3 5-7 8z"/>`) },
  { v: 4, key: 'family', title: 'Family', sub: 'Adults + kids · 4', art: who(`${person(24)}${person(72)}${person(42, 0.64)}${person(55, 0.56)}`) },
  { v: 3, key: 'friends', title: 'Friends', sub: 'A little crew · 3', art: who(`${person(27, 0.94)}${person(48, 1.06)}${person(69, 0.94)}<path d="M40 18l2 3M48 14v4M56 18l-2 3"/>`) },
];

/* ── Place setting (party size picker) ── */
export const plate = `<svg class="plate" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle class="plate__rim" cx="20" cy="20" r="15"/><circle class="plate__well" cx="20" cy="20" r="9"/></svg>`;

/* ── Postmark: double ring + city text on a path + wavy cancellation lines ── */
export const postmark = (line = '', cls = '') => {
  const id = nextId('pm');
  const city = `${site.city.split(',')[0].toUpperCase()} · ${(site.city.split(',')[1] || '').trim().toUpperCase()}`;
  return `
  <svg class="postmark ${cls}" viewBox="0 0 190 110" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor">
      <circle cx="55" cy="55" r="46" stroke-width="2.6"/>
      <circle cx="55" cy="55" r="32" stroke-width="1.3"/>
      ${[26, 42, 58, 74, 90].map((y) => `<path d="M104 ${y}c9-7 17 7 26 0s17 7 26 0 17 7 26 0" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
    </g>
    <defs><path id="${id}" d="M16 55a39 39 0 1 1 78 0a39 39 0 1 1 -78 0"/></defs>
    <text class="postmark__ring"><textPath href="#${id}" startOffset="0" textLength="236">${esc(city)} · SCIOTO HOUSE · </textPath></text>
    <text class="postmark__day" x="55" y="60" text-anchor="middle">${esc(line)}</text>
  </svg>`;
};

/* ── Key-fob glyph for the owner login ── */
export const keyfob = `<svg class="keyfob" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2"/></svg>`;

/* ── Tiny doodle arrow for handwritten notes ── */
export const doodleArrow = `<svg class="doodle-arrow" viewBox="0 0 60 30" aria-hidden="true" focusable="false"><path d="M3 22c14 4 30 2 44-12M38 8l10 1-2 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
