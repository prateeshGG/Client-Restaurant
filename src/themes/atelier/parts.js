/* ATELIER — small shared compositions used by several pages. */
import { site, events, images } from '../../content.js';
import { esc, icon } from '../../core/util.js';

export const word = (cls = '') => `<a class="word ${cls}" href="#/" aria-label="${esc(site.name)} home">Scioto<em>House</em></a>`;

export const pageHead = ({ eyebrow, title, lead = '', image = '', alt = '', cta = '', compact = false }) => `
  <section class="phead ${compact ? 'phead--compact' : ''}">
    <div class="container phead__grid">
      <p class="label">${eyebrow}</p>
      <div>
        <h1 class="phead__title">${title}</h1>
        ${lead ? `<p class="lead">${lead}</p>` : ''}
        ${cta ? `<div class="phead__cta">${cta}</div>` : ''}
      </div>
    </div>
    ${image ? `<div class="phead__img"><img src="${image}" alt="${alt}" loading="eager"></div>` : ''}
  </section>`;

export const sectionHead = (e, t, l = '') => `<div class="shead"><p class="label">${e}</p><div><h2 class="shead__title">${t}</h2>${l ? `<p class="lead">${l}</p>` : ''}</div></div>`;

/* Private dining — typographic capacities + a wide photograph (replaces the shared events block). */
export const gather = (label = '03 — Gather') => `
  <section class="section gather"><div class="container">
    <div class="gather__grid">
      <div class="gather__intro">
        <p class="label">${label}</p>
        <h2 class="shead__title">${esc(events.title)}</h2>
        <p class="gather__text">${esc(events.text)}</p>
        <a class="btn btn--secondary" href="#/contact?topic=event">Plan an event ${icon('arrow', 16)}</a>
      </div>
      <dl class="gather__cap">${events.capacity
        .map((c) => {
          const [, n, rest] = String(c.value).match(/^(\d[\d,]*)\s*(.*)$/) || [null, c.value, ''];
          return `<div><dt>${esc(c.label)}</dt><dd><span>${esc(n)}</span>${esc(rest)}</dd></div>`;
        })
        .join('')}</dl>
    </div>
    <figure class="gather__img at-reveal" data-reveal><img src="${images.events}" alt="Long candle-lit table set in the brick-walled private dining room" loading="lazy"></figure>
  </div></section>`;
