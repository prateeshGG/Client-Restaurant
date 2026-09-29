import { site, rooms, menu, testimonials, images } from '../../content.js';
import { esc, money, icon, $, $$ } from '../../core/util.js';
import { bookingBarHTML, newsletterForm } from '../../core/flows.js';
import { word, sectionHead, gather } from './parts.js';
import { pages } from './pages.js';
import { atelierUI, two } from './kit.js';
import { dish, mountCarte } from './carte.js';

const NAV = [['/stay', 'Stay'], ['/dine', 'Dine'], ['/about', 'About'], ['/contact', 'Contact'], ['/manage', 'Manage booking']];
const tel = site.phone.replace(/\D/g, '');

/* Full-screen overlay menu: numbered serif index + a photograph that changes with the hovered/focused entry. */
const OVERLAY = () => [
  ['/', 'Home', images.hero, 'The house at dusk'],
  ['/stay', 'Rooms', rooms[0]?.images[0] || images.lobby, rooms[0] ? rooms[0].name : 'Rooms'],
  ['/dine', 'The Kitchen', images.dining, 'The dining room'],
  ['/about', 'About', images.neighborhood, 'German Village'],
  ['/contact', 'Contact', images.lobby, 'The front desk'],
  ['/manage', 'Manage booking', images.bar, 'The bar'],
];

const header = () => {
  const ov = OVERLAY();
  return `
  <header class="site-header">
    <div class="container site-header__row">
      ${word()}
      <div class="site-header__book">${bookingBarHTML('bookbar--header', 'hb')}</div>
      <div class="site-header__cta">
        <a class="btn btn--secondary hide-md" href="#/reserve">Reserve</a>
        <a class="btn btn--primary site-header__bookbtn" href="#/book">Book</a>
        <button class="btn btn--icon menu-btn" type="button" data-drawer-open aria-expanded="false" aria-controls="drawer" aria-label="Open menu">${icon('menu', 22)}</button>
      </div>
    </div>
    <div class="container site-header__nav">
      <nav aria-label="Main"><ul class="nav-links">${NAV.map(([p, l]) => `<li><a href="#${p}" data-nav="${p}">${l}</a></li>`).join('')}</ul></nav>
      <p class="site-header__loc hide-md">${esc(site.address.line2.replace(/ \d+$/, ''))} · <a href="tel:${tel}">${esc(site.phone)}</a></p>
    </div>
  </header>
  <div class="drawer ov" id="drawer" data-drawer hidden>
    <div class="drawer__panel ov__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="ov__top">${word()}<button class="ov__close" type="button" data-drawer-close aria-label="Close menu"><span aria-hidden="true">Close</span>${icon('x', 18)}</button></div>
      <div class="ov__body">
        <nav aria-label="Site sections"><ol class="ov__index">${ov
          .map(([p, l, img, cap], i) => `<li style="--i:${i}"><a href="#${p}" data-nav="${p}" data-ov-img="${img}" data-ov-cap="Fig. ${two(i + 1)} — ${esc(cap)}"><span class="ov__n">${two(i + 1)}</span><span class="ov__t">${l}</span></a></li>`)
          .join('')}</ol></nav>
        <figure class="ov__fig" aria-hidden="true"><img src="${ov[0][2]}" alt=""><figcaption>Fig. 01 — ${esc(ov[0][3])}</figcaption></figure>
      </div>
      <div class="ov__foot">
        <div class="ov__cta"><a class="btn btn--primary" href="#/book">Book a room</a><a class="btn btn--secondary" href="#/reserve">Reserve a table</a></div>
        <p class="ov__meta"><span>${esc(site.address.line1)}, ${esc(site.address.line2)}</span><a href="tel:${tel}">${esc(site.phone)}</a><a href="mailto:${site.email}">${esc(site.email)}</a></p>
      </div>
    </div>
  </div>`;
};

const footer = () => `
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__top">
        <p class="site-footer__big">Scioto<em>House</em></p>
        <div class="newsletter">${newsletterForm('Letters from the house — rarely, and only when worth it')}</div>
      </div>
      <div class="site-footer__grid">
        <div><h2 class="site-footer__h">Address</h2><p>${esc(site.address.line1)}<br>${esc(site.address.line2)}</p></div>
        <div><h2 class="site-footer__h">Contact</h2><p><a href="tel:${tel}">${esc(site.phone)}</a><br><a href="mailto:${site.email}">${esc(site.email)}</a></p></div>
        <div><h2 class="site-footer__h">Index</h2><ul>${[['/stay', 'Rooms'], ['/dine', 'The Kitchen'], ['/reserve', 'Reservations'], ['/about', 'About'], ['/contact', 'Contact & FAQ'], ['/manage', 'Manage booking']].map(([p, l]) => `<li><a href="#${p}">${l}</a></li>`).join('')}</ul></div>
        <div><h2 class="site-footer__h">Follow</h2><ul>${['Instagram', 'Facebook', 'TikTok'].map((s) => `<li><a href="${site.social[s.toLowerCase()]}">${s}</a></li>`).join('')}</ul></div>
      </div>
      <div class="site-footer__base">
        <p>© ${new Date().getFullYear()} ${esc(site.name)} · ${esc(site.city)}</p>
        <a class="owner-link" href="/admin/" data-owner-link>${icon('key', 18)}<span>Owner login</span><small>Rooms, menu &amp; hours</small></a>
      </div>
    </div>
  </footer>`;

/* Home keeps its signature composition; the dish list now uses the same cursor-following carte as /dine. */
const featured = () => {
  const f = menu.items.filter((i) => i.featured && i.available !== false);
  return [...f.filter((i) => i.period === 'dinner'), ...f.filter((i) => i.period !== 'dinner')].slice(0, 5);
};

const home = () => ({
  title: '',
  html: `
    <section class="hero">
      <div class="container">
        <p class="label hero__label">Hotel &amp; Kitchen — ${esc(site.city)} — Est. ${esc(site.since)}</p>
        <h1 class="hero__title">Quiet rooms.<br><em>Serious</em> cooking.</h1>
      </div>
      <div class="hero__media"><img src="${images.hero}" alt="The restored red-brick ${esc(site.name)} building at dusk, its arched windows lit"></div>
      <div class="container hero__index">
        <a href="#/stay"><span>01</span>Stay<small>20 rooms, 5 types</small></a>
        <a href="#/dine"><span>02</span>Dine<small>The Kitchen, all day</small></a>
        <a href="#/contact?topic=event"><span>03</span>Gather<small>Up to 140 guests</small></a>
      </div>
    </section>

    <section class="section index-rooms"><div class="container index-rooms__grid">
      <div class="index-rooms__intro">
        <p class="label">01 — Stay</p>
        <h2 class="shead__title">Five room types. One standard.</h2>
        <p>Original brick and timber, Ohio-made oak, linen from a mill that has been weaving since 1908. Book direct for the lowest rate; no resort fee, ever.</p>
        <a class="btn btn--secondary" href="#/stay">All rooms</a>
        <figure class="index-rooms__preview" aria-hidden="true"><img src="${rooms[0].images[0]}" alt=""></figure>
      </div>
      <ol class="index-list">${rooms.map((r, i) => `
        <li><a class="index-list__row" href="#/stay/${r.id}" data-preview="${r.images[0]}">
          <span class="index-list__n">${two(i + 1)}</span>
          <img class="index-list__thumb" src="${r.images[0]}" alt="" loading="lazy">
          <span class="index-list__name">${esc(r.name)}</span>
          <span class="index-list__meta">${esc(r.bed)} · ${r.size} sq ft</span>
          <span class="index-list__rate">from ${money(r.rate)}</span>
          ${icon('arrow', 18, 'index-list__arrow')}
        </a></li>`).join('')}</ol>
    </div></section>

    <section class="section dine-feature"><div class="container dine-feature__grid">
      <div class="dine-feature__media" data-reveal><img src="${images.dining}" alt="The Kitchen dining room in the evening: brick, oak tables and green leather banquettes" loading="lazy"></div>
      <div class="dine-feature__body">
        <p class="label">02 — Dine</p>
        <h2 class="shead__title">The Kitchen</h2>
        <p>Modern Midwestern cooking from farms within two hours of the city. Breakfast for early meetings, a proper lunch, and dinner that deserves the walk downstairs.</p>
        <div class="carte carte--home" data-home-carte>${featured().map(dish).join('')}</div>
        <div class="dine-feature__cta"><a class="btn btn--primary" href="#/reserve">Reserve a table</a><a class="btn btn--secondary" href="#/dine">Full menu</a></div>
      </div>
    </div></section>

    <section class="figures"><div class="container figures__grid">
      ${[['20', 'rooms, no two alike'], [site.since, 'year the house was built'], ['5 min', 'walk to German Village'], ['$0', 'resort or booking fees']].map(([n, t]) => `<div data-reveal><p class="figures__n">${esc(n)}</p><p class="figures__t">${t}</p></div>`).join('')}
    </div></section>

    <section class="section words"><div class="container">
      ${sectionHead('Notes from early guests', 'Said at the preview dinners')}
      <div class="words__grid">${testimonials.slice(0, 2).map((t) => `<figure data-reveal><blockquote>“${esc(t.quote)}”</blockquote><figcaption>${esc(t.name)} — ${esc(t.where)}</figcaption></figure>`).join('')}</div>
    </div></section>

    ${gather()}

    <section class="closing"><div class="container">
      <p class="label">Reservations</p>
      <h2 class="closing__title">Check availability</h2>
      ${bookingBarHTML('bookbar--dark', 'cb')}
      <p class="closing__note">Or call the front desk: <a href="tel:${tel}">${esc(site.phone)}</a> · Tables: <a href="#/reserve">reserve online</a></p>
    </div></section>`,
  mount: (el) => {
    const prev = $('.index-rooms__preview img', el);
    $$('[data-preview]', el).forEach((a) => {
      const show = () => {
        if (prev.getAttribute('src') !== a.dataset.preview) {
          prev.classList.remove('is-in');
          void prev.offsetWidth;
          prev.src = a.dataset.preview;
          prev.classList.add('is-in');
        }
      };
      a.addEventListener('mouseenter', show);
      a.addEventListener('focus', show);
    });
    mountCarte($('[data-home-carte]', el), $('.dine-feature', el));
  },
});

/* Global, theme-scoped delegation (header/overlay are rendered once, flows re-render often). */
if (!window.__atelierBound) {
  window.__atelierBound = true;
  const figOf = () => $('.ov__fig');
  const swap = (a) => {
    const fig = figOf();
    if (!fig || !a) return;
    const im = $('img', fig);
    if (im.getAttribute('src') !== a.dataset.ovImg) {
      im.classList.add('is-swap');
      im.onload = () => im.classList.remove('is-swap');
      im.src = a.dataset.ovImg;
    }
    $('figcaption', fig).textContent = a.dataset.ovCap;
  };
  document.addEventListener('pointerover', (e) => swap(e.target.closest?.('[data-ov-img]')));
  document.addEventListener('focusin', (e) => swap(e.target.closest?.('[data-ov-img]')));
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('[data-drawer-open]')) swap($('.ov__index a[aria-current="page"]') || $('.ov__index a'));
    const sc = e.target.closest?.('[data-at-scroll]');
    if (sc) {
      const t = $(sc.dataset.atScroll);
      if (!t) return;
      const head = $('.site-header');
      scrollTo({ top: t.getBoundingClientRect().top + scrollY - (head ? head.offsetHeight : 0) - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      t.focus({ preventScroll: true });
    }
  });
}

export default { header, footer, pages: { ...pages, home }, ui: atelierUI };
