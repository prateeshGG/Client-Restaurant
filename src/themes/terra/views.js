import { site, rooms, menu, testimonials, images, media, neighborhood, staySteps } from '../../content.js';
import { esc, money, icon, $, $$, columbusNow, fmtTime, today, addDays } from '../../core/util.js';
import { newsletterForm, dietBadges } from '../../core/flows.js';
import { mapHTML, mountMap, directionsUrl } from '../../core/map.js';
import { sun, squiggle, badge, keyfob } from './art.js';
import { terraPages, sectionHead, archCard, dishPhoto, dishButton, bindPeek } from './pages.js';
import ui from './kit.js';

const M = media.terra;
const NAV = [['/stay', 'Rooms'], ['/dine', 'Kitchen'], ['/about', 'Story'], ['/contact', 'Visit']];

const logo = (cls = '') => `<a class="logo ${cls}" href="#/" aria-label="${site.name} home">${sun()}<span>Scioto House</span></a>`;

const header = () => `
  <header class="site-header">
    <div class="container site-header__inner">
      ${logo()}
      <nav aria-label="Main"><ul class="nav-links">${NAV.map(([p, l]) => `<li><a href="#${p}" data-nav="${p}">${l}</a></li>`).join('')}</ul></nav>
      <div class="site-header__cta">
        <a class="btn btn--secondary hide-md" href="#/reserve">Table</a>
        <a class="btn btn--primary" href="#/book"><span>Book<span class="hide-sm"> a stay</span></span></a>
        <button class="btn btn--icon menu-btn" type="button" data-drawer-open aria-expanded="false" aria-controls="drawer" aria-label="Open menu">${icon('menu', 22)}</button>
      </div>
    </div>
  </header>
  <div class="drawer" id="drawer" data-drawer hidden>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="drawer__top">${logo()}<button class="btn btn--icon" type="button" data-drawer-close aria-label="Close menu">${icon('x', 22)}</button></div>
      <ul class="drawer__links">${[['/', 'Home'], ...NAV, ['/manage', 'My booking']].map(([p, l]) => `<li><a href="#${p}" data-nav="${p}">${l}</a></li>`).join('')}</ul>
      <div class="drawer__cta"><a class="btn btn--primary btn--lg" href="#/book">Book a stay</a><a class="btn btn--secondary btn--lg" href="#/reserve">Reserve a table</a></div>
      <p class="drawer__meta">${site.address.line1}, ${site.address.line2}<br>${site.phone}</p>
    </div>
  </div>`;

const footer = () => `
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__top">
        <p class="site-footer__big">Stay a while.</p>
        <div class="newsletter">${newsletterForm('Postcards from the house — seasonal menus & slow news')}</div>
      </div>
      <div class="site-footer__grid">
        <div><h2 class="site-footer__h">Visit</h2><p>${site.address.line1}<br>${site.address.line2}<br><a href="${directionsUrl()}" target="_blank" rel="noopener">Directions ↗</a></p></div>
        <div><h2 class="site-footer__h">Talk</h2><p><a href="tel:${site.phone.replace(/\D/g, '')}">${site.phone}</a><br><a href="mailto:${site.email}">${site.email}</a></p></div>
        <div><h2 class="site-footer__h">Wander</h2><ul>${[['/stay', 'Rooms'], ['/dine', 'Kitchen'], ['/reserve', 'Reservations'], ['/about', 'Story'], ['/manage', 'My booking'], ['/contact', 'Visit & FAQ']].map(([p, l]) => `<li><a href="#${p}">${l}</a></li>`).join('')}</ul></div>
        <div class="site-footer__owner">
          <h2 class="site-footer__h">For the owners</h2>
          <p>Update rooms, prices, menus, photos and hours yourself.</p>
          <a class="btn owner-link" href="/admin/" data-owner-link><span class="owner-link__hole" aria-hidden="true"></span>${keyfob}<span>Owner login</span></a>
        </div>
      </div>
      <div class="site-footer__base"><p>© ${new Date().getFullYear()} ${site.name} · ${site.city}</p><p>${['Instagram', 'Facebook', 'TikTok'].map((s) => `<a href="${site.social[s.toLowerCase()]}">${s}</a>`).join(' · ')}</p></div>
    </div>
  </footer>`;

/* A day at the house — driven by the schedule; the current moment is highlighted. */
const DAY = [
  { t: '07:00', title: 'Slow breakfast', text: 'Buttermilk pancakes, Ohio maple, bottomless local coffee.', img: M.heroPoster, link: '#/dine' },
  { t: '11:30', title: 'Long lunch', text: 'Sweet corn salad, the smash burger, a glass of something cold.', img: M.market, link: '#/dine' },
  { t: '16:00', title: 'Rooftop hour', text: 'Spritzes and sunset over the brick rooftops of German Village.', img: images.rooftop, link: '#/about' },
  { t: '19:00', title: 'Supper', text: 'Lake Erie walleye by candlelight, then just the stairs to bed.', img: images.dining, link: '#/reserve' },
];
const currentSlot = () => {
  const { hhmm } = columbusNow();
  let idx = 0;
  DAY.forEach((d, i) => {
    if (hhmm >= d.t) idx = i;
  });
  return hhmm < DAY[0].t ? -1 : idx;
};

const bookbarSticky = () => {
  const t = today();
  return `
  <form class="bookbar bookbar--sticky" novalidate data-bookbar aria-label="Book a stay">
    <div class="bookbar__field"><label for="sb-in">Arrive</label><input id="sb-in" name="in" type="date" min="${t}" value="${t}" required></div>
    <div class="bookbar__field"><label for="sb-out">Depart</label><input id="sb-out" name="out" type="date" min="${addDays(t, 1)}" value="${addDays(t, 2)}" required></div>
    <div class="bookbar__field"><label for="sb-g">Guests</label><select id="sb-g" name="guests">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} guest${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
    <button class="btn btn--primary bookbar__go" type="submit">Find a room</button>
    <p class="bookbar__err" role="alert"></p>
  </form>`;
};

const home = () => {
  const slot = currentSlot();
  return {
    title: '',
    html: `
    <section class="hero"><div class="container hero__grid">
      <div class="hero__text">
        <p class="eyebrow">${sun()} Hotel &amp; Kitchen · German Village</p>
        <h1 class="hero__title">Slow mornings.<br>Long <span class="hl">suppers.${squiggle}</span></h1>
        <p class="hero__lead">Twenty sun-washed rooms and an all-day kitchen cooking from Ohio farms, inside a red-brick corner house from ${site.since}.</p>
        <div class="hero__cta"><a class="btn btn--primary btn--lg" href="#/book">Book a stay</a><a class="btn btn--secondary btn--lg" href="#/dine">See the kitchen</a></div>
      </div>
      <div class="hero__visual">
        <div class="arch hero__arch">
          ${M.heroVideo
            ? `<video autoplay muted loop playsinline preload="metadata" poster="${M.heroPoster}" aria-hidden="true"><source src="${M.heroVideo}" type="video/mp4"></video>`
            : `<img src="${M.heroPoster}" alt="Breakfast in morning light: pancakes, berries, coffee on an oak table">`}
        </div>
        <div class="hero__badge">${badge('HOTEL & KITCHEN · EST. 1891 · GERMAN VILLAGE · COLUMBUS · ')}<span class="hero__badge-core">${sun()}</span></div>
        <div class="arch arch--small hero__arch2"><img src="${M.courtyard}" alt="" loading="lazy"></div>
      </div>
    </div></section>

    <section class="section day"><div class="container">
      ${sectionHead('A day at the house', 'From first coffee to last candle', 'Everything happens under one roof — and it’s all open to neighbours, not just guests.')}
      <ol class="day__list">${DAY.map(
        (d, i) => `
        <li class="day__item ${i === slot ? 'is-now' : ''}" data-reveal>
          <a href="${d.link}">
            <span class="day__time">${fmtTime(d.t)}${i === slot ? '<em>Now</em>' : ''}</span>
            <span class="arch arch--small day__img"><img src="${d.img}" alt="" loading="lazy"></span>
            <span class="day__title">${d.title}</span>
            <span class="day__text">${d.text}</span>
          </a>
        </li>`
      ).join('')}</ol>
    </div></section>

    <section class="section rooms-section"><div class="container">
      <div class="rooms-head">${sectionHead('Rooms', 'Sun in the morning,<br>brick all around')}<a class="btn btn--secondary" href="#/stay">All rooms</a></div>
      <div class="arch-grid arch-grid--static">${rooms.slice(0, 3).map((r, i) => archCard(r, i, true)).join('')}</div>
    </div></section>

    <section class="farm"><div class="container farm__grid">
      <div class="farm__media" data-reveal>
        <div class="arch farm__arch"><img src="${M.bread}" alt="A chef’s hands plating at the kitchen pass" loading="lazy"></div>
        <div class="farm__stamp">${sun()}<span>Cooked from farms within two hours of the city</span></div>
      </div>
      <div class="farm__body">
        <p class="eyebrow">The Kitchen</p>
        <h2 class="shead__title">What’s good<br>this week</h2>
        <ul class="farm__list">${menu.items
          .filter((i) => i.featured && i.available !== false)
          .slice(0, 5)
          .map(
            (i) => `
          <li class="farm__item"><span class="farm__name">${dishButton(i, 'farm__btn')}</span><span class="farm__desc">${esc(i.desc)}</span><span class="farm__meta">${money(i.price)} ${dietBadges(i)}</span>${dishPhoto(i)}</li>`
          )
          .join('')}</ul>
        <div class="farm__cta"><a class="btn btn--primary" href="#/reserve">Reserve a table</a><a class="link" href="#/dine">The full menu →</a></div>
      </div>
    </div></section>

    <section class="quote"><div class="container quote__inner" data-reveal>
      ${sun()}
      <blockquote class="quote__text">“${esc(testimonials[1].quote)}”</blockquote>
      <p class="quote__who">${esc(testimonials[1].name)} — ${esc(testimonials[1].where)}</p>
    </div></section>

    <section class="section visit"><div class="container visit__grid">
      <div class="visit__text">
        ${sectionHead('Find us', 'A short walk<br>from everything')}
        <ul class="walks">${neighborhood.slice(0, 5).map((n) => `<li><span>${n.name}</span><span class="walks__dots" aria-hidden="true"></span><span>${n.distance}</span></li>`).join('')}</ul>
        <p class="visit__addr">${site.address.line1}, ${site.address.line2} · <a class="link" href="${directionsUrl()}" target="_blank" rel="noopener">Directions ↗</a></p>
      </div>
      ${mapHTML('map--terra arch-map')}
    </div></section>

    <section class="section how"><div class="container">
      ${sectionHead('Booking, simply', 'Four stops to<br>a slow morning')}
      <ol class="route">${staySteps.map((s, i) => `<li class="route__stop" data-reveal><span class="route__mark" aria-hidden="true">${i === staySteps.length - 1 ? sun() : `<span>${i + 1}</span>`}</span><h3>${s.title}</h3><p>${s.text}</p></li>`).join('')}</ol>
      <div class="route__cta"><a class="btn btn--primary btn--lg" href="#/book">Start the journey ${icon('arrow', 18)}</a></div>
    </div></section>

    <div class="sticky-book" data-sticky-book aria-hidden="true">
      <div class="container">${bookbarSticky()}</div>
      <div class="sticky-book__mobile"><a class="btn btn--primary" href="#/book">Book a stay</a><a class="btn btn--secondary" href="#/reserve">Table</a></div>
    </div>`,
    mount: (el) => {
      mountMap($('[data-map]', el), { zoom: 14.8 });
      bindPeek($('.farm__list', el));
      // Sticky booking bar appears after the hero (Casa Cook pattern) and hides near the footer.
      const bar = $('[data-sticky-book]', el);
      const hero = $('.hero', el);
      const foot = document.querySelector('.site-footer');
      const onScroll = () => {
        if (!document.body.contains(bar)) return removeEventListener('scroll', onScroll);
        const past = hero.getBoundingClientRect().bottom < 0;
        const nearFoot = foot && foot.getBoundingClientRect().top < innerHeight;
        const show = past && !nearFoot;
        bar.classList.toggle('is-on', show);
        bar.setAttribute('aria-hidden', String(!show));
        $$('input, select, button, a', bar).forEach((x) => (x.tabIndex = show ? 0 : -1));
      };
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    },
  };
};

export default { header, footer, pages: { ...terraPages(), home }, ui };
