import { parse } from './router.js';
import { setupDrawer, reveal, autoReveal } from './ui.js';
import { newsletter, bookingBar } from './flows.js';
import { configureUI } from './kit.js';
import { enablePickers } from './pickers.js';
import { site } from '../content.js';
import { $, $$, icon } from './util.js';

export const OPTIONS = [
  { id: 'familiar', label: 'Familiar', note: 'Closest to your sample' },
  { id: 'fresh', label: 'Fresh', note: 'Bright & friendly' },
  { id: 'atelier', label: 'Atelier', note: 'Professional' },
  { id: 'noir', label: 'Noir', note: 'After dark' },
  { id: 'terra', label: 'Terra', note: 'Sun-baked' },
];

function switcher(current) {
  return `
  <details class="switcher">
    <summary class="switcher__btn" aria-label="Design option: ${OPTIONS.find((o) => o.id === current).label}. Switch design" title="Switch design option">
      <span class="switcher__dot" aria-hidden="true"></span><span class="switcher__label">${OPTIONS.find((o) => o.id === current).label}</span>
    </summary>
    <div class="switcher__panel">
      <p class="switcher__title">Compare design options</p>
      <ul>
        ${OPTIONS.map((o) => `<li><a href="/${o.id}/" data-switch="${o.id}" ${o.id === current ? 'aria-current="true"' : ''}><span>${o.label}</span><small>${o.note}</small></a></li>`).join('')}
      </ul>
      <a class="switcher__all" href="/">See all options side by side</a>
    </div>
  </details>`;
}

export function createApp({ id, views }) {
  if (import.meta.env.DEV) import('./qa.js');
  const app = document.getElementById('app');
  document.documentElement.dataset.theme = id;
  configureUI(views.ui || {}); // design-specific markup for shared flows
  enablePickers(); // click anywhere on a date field to open the calendar
  const annKey = 'sh:announce-dismissed:' + site.announcement;
  const showAnn = site.announcement && !sessionStorage.getItem(annKey);
  app.innerHTML = `
    <a class="skip-link" href="#main" data-skip>Skip to content</a>
    ${showAnn ? `<div class="announce" role="region" aria-label="Announcement" data-announce><p>${String(site.announcement).replace(/[<>&]/g, '')}</p><button type="button" class="announce__x" aria-label="Dismiss announcement" data-announce-close>×</button></div>` : ''}
    ${views.header()}
    <main id="main" tabindex="-1"></main>
    ${views.footer()}
    ${switcher(id)}`;

  // If a photo is missing (e.g. not yet supplied), show a calm branded placeholder instead of a broken icon.
  const PH = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e7e1d6"/><path d="M170 175v-40l30-20 30 20v40h-20v-24h-20v24z" fill="#b9ae9c"/></svg>')}`;
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && !img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.style.mixBlendMode = 'normal';
      img.src = PH;
    }
  }, true);

  const main = $('#main');
  autoReveal(main);
  const header = $('.site-header');
  const closeDrawer = setupDrawer(app);
  newsletter(app);
  bookingBar(header || app);

  // Keep route when switching design options
  $$('[data-switch]', app).forEach((a) => a.addEventListener('click', () => (a.href = `/${a.dataset.switch}/${location.hash}`)));
  $('[data-skip]').addEventListener('click', (e) => {
    e.preventDefault();
    main.focus();
  });

  const ann = $('[data-announce]', app);
  const annH = () => (ann && ann.isConnected ? Math.max(0, ann.offsetHeight - scrollY) : 0);
  const onScroll = () => {
    header && header.classList.toggle('is-scrolled', scrollY > 12);
    document.documentElement.style.setProperty('--announce-h', annH() + 'px'); // lets fixed headers sit below the bar
  };
  $('[data-announce-close]', app)?.addEventListener('click', () => {
    sessionStorage.setItem(annKey, '1');
    ann.remove();
    onScroll();
  });
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let current = null;
  let first = true;

  const resolve = (r) => {
    const [a, b] = r.parts;
    if (!a) return views.pages.home;
    if (a === 'stay' && b) return views.pages.room;
    if (b) return views.pages.notFound;
    return views.pages[{ stay: 'stay', dine: 'dine', book: 'book', reserve: 'reserve', manage: 'manage', about: 'about', contact: 'contact' }[a]] || views.pages.notFound;
  };

  const render = () => {
    const r = parse();
    closeDrawer();
    document.documentElement.dataset.route = r.parts[0] || 'home';
    $$('[data-nav]', app).forEach((a) => {
      const on = a.dataset.nav === '/' + (r.parts[0] || '');
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });

    // Same page, only the query changed (wizard steps): update in place.
    if (current && current.path === r.path && current.page.onQuery) {
      current.page.onQuery(r);
      const flow = $('[data-flow]', main);
      if (flow) {
        const y = flow.getBoundingClientRect().top + scrollY - (header ? header.offsetHeight : 0) - 16;
        if (scrollY > y) scrollTo({ top: y, behavior: 'smooth' });
        const t = $('.wizard__title, .confirm__title', flow);
        t && t.focus({ preventScroll: true });
      }
      return;
    }

    const page = resolve(r)(r);
    document.title = page.title ? `${page.title} — ${site.name}` : `${site.name} · ${site.tagline} · ${site.city}`;
    main.innerHTML = page.html;
    main.classList.remove('page-enter');
    void main.offsetWidth;
    main.classList.add('page-enter');
    page.mount && page.mount(main, r);
    bookingBar(main);
    newsletter(main);
    reveal(main);
    current = { path: r.path, page };
    if (!first) {
      scrollTo({ top: 0, behavior: 'instant' });
      const h = $('h1', main);
      if (h) {
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      }
    }
    first = false;
  };

  addEventListener('hashchange', render);
  render();
}

export { icon };
