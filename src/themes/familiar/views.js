/* OPTION E — FAMILIAR: very close to the client’s sample (cleancreations.com) in structure and
 * rhythm — utility row, round logo, lime uppercase buttons, card carousels, plan cards,
 * tinted testimonials, photo bands — with every problem from SAMPLE-AUDIT.md fixed. */
import { site, rooms, menu, testimonials, staySteps, images, story, neighborhood, faqs, events, amenities } from '../../content.js';
import { esc, money, icon, $, $$, today, addDays, nightsBetween, columbusNow } from '../../core/util.js';
import { bookingWizard, reservationFlow, manageFlow, contactForm, roomsBrowser, roomGallery, menuBrowser } from '../../core/flows.js';
import { roomAvailable } from '../../core/store.js';
import { setupTabs } from '../../core/ui.js';
import { navigate } from '../../core/router.js';
import { mapHTML, mountMap, directionsUrl } from '../../core/map.js';
import { ui } from './kit.js';
import { carousel } from './carousel.js';
import { timeSelect } from './chrome.js';
import {
  ic, logo, emblem, tel, pageHead, sectionHead, hoursTable, nlForm, planCard, productCard, menuCard, quickViewDelegate,
  carouselHTML, slideWrap, band, ctaBand, PHOTO,
} from './parts.js';

const NAV = [['/stay', 'Rooms'], ['/dine', 'Online Menu'], ['/reserve', 'Reserve'], ['/about', 'About'], ['/contact', 'Contact']];

/* ───────────────────────────── HEADER ───────────────────────────── */
const header = () => `
  <div class="util">
    <div class="container util__in">
      <ul class="util__links" aria-label="Contact">
        <li class="util__phone"><a href="tel:${tel}">${icon('phone', 16)}<span class="util__t">${site.phone}</span></a></li>
        <li class="util__mail"><a href="mailto:${site.email}">${icon('mail', 16)}<span class="util__t">${site.email}</span></a></li>
        <li class="util__find"><a href="#/contact">${icon('pin', 16)}<span class="util__t">Find us · German Village</span></a></li>
      </ul>
      <p class="util__cd" data-countdown aria-label="Kitchen status"></p>
    </div>
  </div>
  <header class="site-header">
    <div class="container hdr">
      ${logo()}
      <nav class="hdr__nav" aria-label="Main"><ul class="nav-links">${NAV.map(([p, l]) => `<li><a href="#${p}" data-nav="${p}">${l}</a></li>`).join('')}</ul></nav>
      <div class="hdr__cta">
        <a class="btn btn--primary hdr__book" href="#/book">Book now</a>
        <a class="pill" href="#/manage" data-mybooking>${ic('bag', 18)}<span class="pill__t">My booking</span><span class="pill__n" data-mybooking-n hidden>0</span></a>
        <button class="menu-btn hdr__burger" type="button" data-drawer-open aria-expanded="false" aria-controls="drawer" aria-label="Menu">${icon('menu', 22).replace('class="i ', 'class="i i-bars ')}${icon('x', 22).replace('class="i ', 'class="i i-x ')}</button>
      </div>
    </div>
  </header>
  <div class="drawer" id="drawer" data-drawer hidden>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <ul class="drop__list">
        ${[['/', 'Home'], ...NAV, ['/manage', 'My booking']].map(([p, l]) => `<li><a href="#${p}" data-nav="${p}" ${p === '/manage' ? 'data-mybooking' : ''}><span class="drop__l">${l}${p === '/manage' ? '<span class="pill__n" data-mybooking-n hidden>0</span>' : ''}</span>${ic('chevRight', 20)}</a></li>`).join('')}
      </ul>
      <div class="drop__cta"><a class="btn btn--primary" href="#/book">Book now</a><a class="btn btn--secondary" href="#/reserve">Reserve a table</a></div>
      <div class="drop__meta">
        <p class="drop__cd" data-countdown></p>
        <p><a href="tel:${tel}">${icon('phone', 16)} ${site.phone}</a><a href="mailto:${site.email}">${icon('mail', 16)} ${site.email}</a></p>
      </div>
      <button class="drop__close" type="button" data-drawer-close>${icon('x', 18)} Close menu</button>
    </div>
  </div>`;

/* ───────────────────────────── FOOTER ───────────────────────────── */
const footer = () => `
  <footer class="site-footer">
    <div class="container foot">
      <div class="foot__brand">
        <a class="foot__logo" href="#/" aria-label="${esc(site.name)} — home">${emblem()}<span><strong>${esc(site.name)}</strong><small>${esc(site.tagline)} · ${esc(site.city)}</small></span></a>
        <p>A 20-room hotel and all-day Kitchen in a restored ${site.since} brick corner building in German Village.</p>
        <ul class="social" aria-label="Social media">${[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']].map(([k, l]) => `<li><a href="${site.social[k]}" aria-label="${l}">${icon(k, 20)}</a></li>`).join('')}</ul>
      </div>
      <nav class="foot__col" aria-labelledby="f-shop"><h2 class="foot__h" id="f-shop">Explore</h2>
        <ul>${[['/stay', 'Rooms & suites'], ['/dine', 'Online menu'], ['/reserve', 'Reserve a table'], ['/book', 'Book a room'], ['/manage', 'Manage my booking']].map(([p, l]) => `<li><a href="#${p}">${l}</a></li>`).join('')}</ul>
      </nav>
      <div class="foot__col"><h2 class="foot__h">Visit us</h2>
        <address class="foot__addr">${esc(site.address.line1)}<br>${esc(site.address.line2)}</address>
        <ul class="foot__contact">
          <li><a href="tel:${tel}">${icon('phone', 16)} ${site.phone}</a></li>
          <li><a href="mailto:${site.email}">${icon('mail', 16)} ${site.email}</a></li>
          <li><a href="${directionsUrl()}" target="_blank" rel="noopener">${icon('pin', 16)} Get directions<span class="sr-only"> (opens in a new tab)</span></a></li>
        </ul>
      </div>
      <div class="foot__col foot__nl"><h2 class="foot__h">Newsletter</h2>
        <p>Opening news, new menus and founding-guest offers — about once a month.</p>
        ${nlForm('fnl', 'Email address', 'Subscribe')}
      </div>
    </div>
    <div class="foot__base">
      <div class="container foot__base-in">
        <p>© ${new Date().getFullYear()} ${esc(site.name)} · ${esc(site.city)}</p>
        <ul class="foot__legal"><li><a href="#/about">About us</a></li><li><a href="#/contact">Contact &amp; FAQ</a></li></ul>
        <div class="owner">
          <a class="btn btn--owner" href="/admin/" data-owner-link>${icon('key', 18)} Owner login</a>
          <span class="owner__note">Edit rooms, menu, prices &amp; hours</span>
        </div>
      </div>
    </div>
  </footer>`;

/* ───────────────────────────── HOME (sample order) ───────────────────────────── */
const HOW_IC = ['calendar', 'bed', 'key', 'plate'];
const menuChips = [['picks', 'Chef’s picks'], ...menu.periods.map((p) => [p.id, p.label])];
const homeMenuItems = (k) => menu.items.filter((i) => i.available !== false && (k === 'picks' ? i.featured : i.period === k));

const home = () => ({
  title: '',
  html: `
    <section class="hero">
      <img class="hero__img" src="${PHOTO.hero}" alt="" fetchpriority="high">
      <div class="container hero__in">
        <p class="hero__offer"><b>New</b> 15% off your first stay with code FOUNDING</p>
        <h1 class="hero__t">Rest Easy,<span>Eat Well.</span></h1>
        <p class="hero__lead">A 20-room hotel with an all-day Kitchen downstairs, in a restored ${site.since} brick corner of German Village, Columbus.</p>
        <div class="hero__cta"><a class="btn btn--primary btn--lg" href="#/book">Get started</a><a class="btn btn--light btn--lg" href="#/dine">View the menu</a></div>
      </div>
    </section>

    <section class="section how"><div class="container">
      ${sectionHead('How It Works', 'Booking direct takes about two minutes — and you always get our best rate.')}
      <ol class="how__list">
        ${staySteps.map((s, i) => `<li class="how__item" data-reveal><span class="how__ic">${ic(HOW_IC[i] || 'check', 36)}<span class="how__n" aria-hidden="true">${i + 1}</span></span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}
      </ol>
    </div></section>

    <section class="section omh"><div class="container omh__grid">
      <div class="omh__intro">
        <h2 class="sh__t sh__t--left">Online Menu</h2>
        <p>Modern Midwestern cooking from farms within a couple of hours of Columbus — breakfast, lunch, dinner and the rooftop bar. Hover or tap a dish for a closer look.</p>
        <div class="fchips" role="group" aria-label="Show dishes from">
          ${menuChips.map(([k, l], i) => `<button class="fchip" type="button" data-mchip="${k}" aria-pressed="${i === 0}">${esc(l)}</button>`).join('')}
        </div>
        <a class="btn btn--secondary omh__learn" href="#/about">Meet the Kitchen</a>
      </div>
      <div class="omh__car">
        ${carouselHTML({ name: 'menu', label: 'Dishes from the menu', noun: 'dishes', slides: homeMenuItems('picks').map((i) => menuCard(i, { item: false })) })}
        <div class="omh__all"><a class="btn btn--primary btn--lg" href="#/dine">View entire menu</a></div>
      </div>
    </div></section>

    <section class="section plans"><div class="container">
      ${sectionHead('Rooms for Everyone', 'Five ways to stay, from our signature Brick King to the top-floor Loft. No booking fees, no resort fees, free cancellation up to 48 hours.')}
      ${carouselHTML({ name: 'rooms', label: 'Room types', noun: 'rooms', slides: rooms.map(planCard) })}
    </div></section>

    <section class="section says"><div class="container">
      ${sectionHead('What People Are Saying', 'From our friends-and-family previews and soft-opening stays.')}
      ${carouselHTML({
        name: 'says', label: 'Guest reviews', noun: 'reviews', pause: true,
        slides: testimonials.map((t) => `<figure class="quote">${ic('quote', 40, 'quote__mark')}<blockquote><p>${esc(t.quote)}</p></blockquote><figcaption>~ ${esc(t.name)} <span>· ${esc(t.where)}</span></figcaption></figure>`),
      })}
    </div></section>

    ${band(PHOTO.mission, `
      <div class="mission__in" data-reveal>
        <p class="kicker">Our mission</p>
        <h2>Make every stay feel like coming home to a great neighbourhood restaurant.</h2>
        <p>${esc(story.paragraphs[0])}</p>
        <a class="btn btn--primary" href="#/about">Learn more<span class="sr-only"> about our story</span></a>
      </div>`, 'mission')}

    ${ctaBand()}`,
  mount: (el) => {
    const mc = carousel($('[data-car=menu]', el), { noun: 'dishes' });
    const track = $('[data-car=menu] [data-car-track]', el);
    $$('[data-mchip]', el).forEach((b) =>
      b.addEventListener('click', () => {
        $$('[data-mchip]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        track.innerHTML = slideWrap(homeMenuItems(b.dataset.mchip).map((i) => menuCard(i, { item: false })));
        mc && mc.refresh(true);
      })
    );
    carousel($('[data-car=rooms]', el), { noun: 'rooms' });
    carousel($('[data-car=says]', el), { autoplay: 7000, noun: 'reviews' });
    quickViewDelegate($('.omh', el)); /* per-render root: <main> persists across routes */
  },
});

/* ───────────────────────────── ROOMS (e-commerce list) ───────────────────────────── */
const perks = () => `
  <section class="section section--grey perks"><div class="container">
    ${sectionHead('Every Stay Includes', 'The small things, done properly — in every room type.')}
    <ul class="perks__list">${amenities.map((a) => `<li><span class="perks__ic">${icon(a.icon, 26)}</span><span>${esc(a.label)}</span></li>`).join('')}</ul>
  </div></section>`;

const stay = () => ({
  title: 'Rooms',
  html: `
    ${pageHead({ title: 'Rooms &amp; Suites', lead: 'Five room types in a restored 1891 brick building. Filter by guests and bed type — every rate is our lowest when you book direct.', crumb: [['Rooms']] })}
    <section class="section section--shop"><div class="container" data-rooms></div></section>
    ${perks()}
    ${ctaBand('Not Sure Which Room?', 'We’ll Help You Pick', 'Call the front desk any time on ' + site.phone + ', or start a booking and compare every available room side by side.')}`,
  mount: (el) => {
    const host = $('[data-rooms]', el);
    const paintCount = () => {
      const g = +(host.querySelector('input[name=guests]:checked')?.value || 1);
      const b = host.querySelector('input[name=bed]:checked')?.value || 'all';
      const n = (g !== 1) + (b !== 'all');
      const out = $('[data-fcount]', host);
      if (out) out.textContent = n ? `(${n} active)` : '';
    };
    roomsBrowser(host, productCard, { onRender: paintCount });
    const det = $('.shop__filters', host);
    const mq = matchMedia('(min-width: 961px)');
    const sync = () => {
      if (!det.isConnected) return mq.removeEventListener('change', sync);
      if (mq.matches) det.open = true;
    };
    mq.addEventListener('change', sync);
    sync();
  },
});

/* ───────────────────────────── ROOM (product page) ───────────────────────────── */
const room = (r) => {
  const rm = rooms.find((x) => x.id === r.parts[1]);
  if (!rm) return notFound(r, 'That room doesn’t exist — it may have been renamed.');
  const others = rooms.filter((x) => x.id !== rm.id).slice(0, 3);
  const t = today();
  const policies = [
    ['Check-in', `From ${site.checkIn}. Early check-in is free when the room is ready.`],
    ['Check-out', `By ${site.checkOut}. Ask the front desk about late check-out.`],
    ['Cancellation', 'Free until 48 hours before arrival; after that one night is charged.'],
    ['Payment', 'Nothing is charged online. Your card is requested at check-in.'],
    ['Pets', 'Dogs up to 50 lb are welcome for a $35 per-stay cleaning fee.'],
    ['Parking', 'Valet parking $28 per night with in-and-out privileges; two EV chargers.'],
  ];
  return {
    title: rm.name,
    html: `
      <div class="container pdp">
        <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="#/">Home</a></li><li><a href="#/stay">Rooms</a></li><li aria-current="page">${esc(rm.name)}</li></ol></nav>
        <div class="pdp__grid">
          <div class="pdp__gallery">
            <div class="pdp__stage">
              <button class="pdp__main" type="button" data-gallery-main aria-label="Enlarge photos of ${esc(rm.name)}"><img src="${rm.images[0]}" alt="${esc(rm.name)} — photo 1 of ${rm.images.length}"></button>
              <button class="pdp__arrow pdp__arrow--prev" type="button" data-gallery-step="-1" aria-label="Previous photo">${icon('arrowLeft', 20)}</button>
              <button class="pdp__arrow pdp__arrow--next" type="button" data-gallery-step="1" aria-label="Next photo">${icon('arrow', 20)}</button>
              <span class="pdp__count" data-pdp-count aria-hidden="true">1 / ${rm.images.length}</span>
            </div>
            <div class="pdp__thumbs" role="group" aria-label="Choose photo">
              ${rm.images.map((src, i) => `<button type="button" class="pdp__thumb" data-thumb aria-pressed="${i === 0}" aria-label="Show photo ${i + 1} of ${rm.images.length}"><img src="${src}" alt="" loading="lazy"></button>`).join('')}
            </div>
          </div>
          <aside class="pdp__buy" aria-labelledby="pdp-t">
            <p class="pdp__kicker">Room · Sleeps ${rm.sleeps}</p>
            <h1 class="pdp__title" id="pdp-t">${esc(rm.name)}</h1>
            <ul class="pdp__facts"><li>${icon('bed', 16)} ${esc(rm.bed)}</li><li>${icon('users', 16)} Up to ${rm.sleeps}</li><li>${icon('size', 16)} ${rm.size} sq ft</li></ul>
            <p class="pdp__price"><small>as low as</small><strong>${money(rm.rate)}</strong><span>/ night</span></p>
            <p class="pdp__short">${esc(rm.short)}</p>
            <form class="buy" data-buy novalidate aria-label="Check dates and book ${esc(rm.name)}">
              <div class="buy__row">
                <div class="field"><label class="field__label" for="buy-in">Check-in</label><input class="field__input" id="buy-in" name="in" type="date" min="${t}" value="${t}" required></div>
                <div class="field"><label class="field__label" for="buy-out">Check-out</label><input class="field__input" id="buy-out" name="out" type="date" min="${addDays(t, 1)}" value="${addDays(t, 2)}" required></div>
              </div>
              <div class="field"><label class="field__label" for="buy-g">Guests</label><div class="field__select"><select class="field__input" id="buy-g" name="guests">${Array.from({ length: rm.sleeps }, (_, i) => `<option value="${i + 1}" ${i + 1 === Math.min(2, rm.sleeps) ? 'selected' : ''}>${i + 1} guest${i ? 's' : ''}</option>`).join('')}</select></div></div>
              <div class="buy__calc" data-buy-calc aria-live="polite"></div>
              <p class="field__error buy__err" data-buy-err role="alert"></p>
              <button class="btn btn--primary btn--xl" type="submit">Book now</button>
            </form>
            <ul class="buy__perks">
              <li>${icon('check', 16)} Free cancellation up to 48 hours</li>
              <li>${ic('lock', 16)} Pay at the hotel — nothing charged online</li>
              <li>${ic('shield', 16)} Best rate when you book direct</li>
            </ul>
          </aside>
        </div>

        <div class="ptabs">
          <div class="ptabs__list" role="tablist" aria-label="About this room">
            ${[['details', 'Details'], ['amenities', 'Amenities'], ['policies', 'Policies']].map(([v, l], i) => `<button class="ptab" role="tab" type="button" id="pt-${v}" data-value="${v}" aria-controls="pp-${v}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${l}</button>`).join('')}
          </div>
          <div class="ptabs__panel" role="tabpanel" id="pp-details" aria-labelledby="pt-details" tabindex="0" data-panel="details">
            <div class="ptabs__two">
              <p class="ptabs__lead">${esc(rm.description)}</p>
              <table class="spec"><caption class="sr-only">Room specifications</caption><tbody>
                <tr><th scope="row">Bed</th><td>${esc(rm.bed)}</td></tr><tr><th scope="row">Sleeps</th><td>Up to ${rm.sleeps}</td></tr>
                <tr><th scope="row">Size</th><td>${rm.size} sq ft</td></tr><tr><th scope="row">Rate</th><td>From ${money(rm.rate)} / night + tax</td></tr>
              </tbody></table>
            </div>
          </div>
          <div class="ptabs__panel" role="tabpanel" id="pp-amenities" aria-labelledby="pt-amenities" tabindex="0" data-panel="amenities" hidden>
            <h2 class="ptabs__h">In the room</h2>
            <ul class="ticks">${rm.amenities.map((a) => `<li>${icon('check', 18)} ${esc(a)}</li>`).join('')}</ul>
            <h2 class="ptabs__h">At the hotel</h2>
            <ul class="ticks">${amenities.map((a) => `<li>${icon(a.icon, 18)} ${esc(a.label)}</li>`).join('')}</ul>
          </div>
          <div class="ptabs__panel" role="tabpanel" id="pp-policies" aria-labelledby="pt-policies" tabindex="0" data-panel="policies" hidden>
            <dl class="policies">${policies.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
          </div>
        </div>
      </div>
      <section class="section section--grey"><div class="container">
        ${sectionHead('You May Also Like')}
        <div class="shop__grid shop__grid--3">${others.map(productCard).join('')}</div>
      </div></section>`,
    mount: (el) => {
      const count = $('[data-pdp-count]', el);
      roomGallery(el, rm, { onChange: (i) => count && (count.textContent = `${i + 1} / ${rm.images.length}`) });
      const tl = $('.ptabs__list', el);
      setupTabs(tl, (v) => $$('.ptabs__panel', el).forEach((p) => (p.hidden = p.dataset.panel !== v)));
      buyBox(el, rm);
    },
  };
};

function buyBox(el, rm) {
  const form = $('[data-buy]', el);
  const ci = form.elements.in, co = form.elements.out, g = form.elements.guests;
  const calc = $('[data-buy-calc]', form);
  const err = $('[data-buy-err]', form);
  const check = () => {
    if (!ci.value || !co.value || co.value <= ci.value) return { ok: false, msg: 'Check-out must be after check-in.', el: co };
    if (ci.value < today()) return { ok: false, msg: 'Check-in can’t be in the past.', el: ci };
    if (nightsBetween(ci.value, co.value) > 30) return { ok: false, msg: 'For stays over 30 nights, please contact us.', el: co };
    return { ok: true, avail: roomAvailable(rm.id, ci.value, co.value) };
  };
  const paint = () => {
    const c = check();
    err.textContent = '';
    if (!c.ok) return (calc.innerHTML = `<p class="buy__line">${icon('info', 16)} ${c.msg}</p>`);
    const n = nightsBetween(ci.value, co.value);
    calc.innerHTML = `
      <p class="buy__sum"><span>${money(rm.rate)} × ${n} night${n > 1 ? 's' : ''}</span><strong>${money(rm.rate * n)}</strong></p>
      <p class="buy__tax">+ lodging tax · pay at the hotel</p>
      <p class="buy__avail ${c.avail ? 'is-ok' : 'is-no'}">${icon(c.avail ? 'check' : 'info', 16)} ${c.avail ? 'Available for your dates' : 'Sold out on one or more of these nights'}</p>`;
  };
  ci.addEventListener('change', () => {
    co.min = addDays(ci.value, 1);
    if (!co.value || co.value <= ci.value) co.value = addDays(ci.value, 1);
    paint();
  });
  co.addEventListener('change', paint);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const c = check();
    if (!c.ok) {
      err.textContent = c.msg;
      return c.el.focus();
    }
    if (!c.avail) {
      err.textContent = 'This room is sold out for those dates. Try other dates or compare all rooms.';
      return ci.focus();
    }
    navigate(`/book?room=${rm.id}&in=${ci.value}&out=${co.value}&guests=${g.value}&step=3`);
  });
  paint();
}

/* ───────────────────────────── DINE (Online Menu) ───────────────────────────── */
const periodNow = () => {
  const t = columbusNow().hhmm;
  return t < '10:30' ? 'breakfast' : t < '15:00' ? 'lunch' : 'dinner';
};
const eventsBand = () =>
  band(PHOTO.events, `
    <div class="evb">
      <div class="evb__copy">
        <p class="kicker">Private dining</p>
        <h2>${esc(events.title)}</h2>
        <p>${esc(events.text)}</p>
        <a class="btn btn--primary" href="#/contact?topic=event">Plan an event</a>
      </div>
      <dl class="evb__cap">${events.capacity.map((c) => `<div><dt>${esc(c.label)}</dt><dd>${esc(c.value)}</dd></div>`).join('')}</dl>
    </div>`, 'evband');

const dine = () => ({
  title: 'Online Menu',
  html: `
    ${pageHead({ title: 'Online Menu', lead: 'Breakfast for guests and neighbours, a smash burger at lunch and Lake Erie walleye by candlelight. Open to everyone — no room key required.', image: PHOTO.menuHead, crumb: [['Online Menu']], cta: `<a class="btn btn--primary btn--lg" href="#/reserve">Reserve a table</a>` })}
    <section class="section section--shop"><div class="container">
      <div data-menu></div>
      <p class="om__legend">${menu.diets.map((d) => `<span><abbr class="diet diet--${d.id}" title="${esc(d.label)}">${d.id.toUpperCase()}</abbr> ${esc(d.label)}</span>`).join('')}<span>${ic('eye', 16)} Hover, focus or tap a photo for a quick view</span></p>
    </div></section>
    <section class="section section--grey only-md hours-strip"><div class="container">
      <h2 class="hours-strip__h">Kitchen hours</h2>
      ${hoursTable()}
      <a class="btn btn--primary" href="#/reserve">Reserve a table</a>
    </div></section>
    ${eventsBand()}`,
  mount: (el) => {
    const host = $('[data-menu]', el);
    menuBrowser(host, (i) => menuCard(i), { initial: periodNow() });
    quickViewDelegate(host, { onDine: true });
    const tl = $('[role=tablist]', host);
    tl.addEventListener('keydown', (e) => {
      const map = { ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft' };
      if (map[e.key] && e.target.matches('[role=tab]')) {
        e.preventDefault();
        e.target.dispatchEvent(new KeyboardEvent('keydown', { key: map[e.key], bubbles: true }));
      }
    });
  },
});

/* ───────────────────────────── ABOUT (mission style) ───────────────────────────── */
const VALUE_IC = ['leaf', 'shield', 'heart'];
const about = () => ({
  title: 'About',
  html: `
    ${pageHead({ title: 'About Us', lead: esc(story.headline) + '.', image: PHOTO.aboutHead, crumb: [['About Us']] })}
    <section class="section"><div class="container">
      <div class="alt" data-reveal>
        <div class="alt__media"><img src="${images.lobby}" alt="The lobby: green sofa, arched window and exposed brick" loading="lazy"></div>
        <div class="alt__copy"><p class="kicker kicker--dark">Our story</p><h2>Since ${site.since}, a corner worth keeping</h2><p>${esc(story.intro)}</p></div>
      </div>
      <div class="alt alt--rev" data-reveal>
        <div class="alt__media"><img src="${images.dining}" alt="The Kitchen dining room with green banquettes and brick walls" loading="lazy"></div>
        <div class="alt__copy"><p class="kicker kicker--dark">Small on purpose</p><h2>Twenty rooms, one kitchen, one rooftop</h2><p>${esc(story.paragraphs[0])}</p><a class="btn btn--primary" href="#/stay">See the rooms</a></div>
      </div>
      <div class="alt" data-reveal>
        <div class="alt__media"><img src="${images.chef}" alt="A chef plating a dish at the kitchen pass" loading="lazy"></div>
        <div class="alt__copy"><p class="kicker kicker--dark">The Kitchen</p><h2>Modern Midwestern, from farms nearby</h2><p>${esc(story.paragraphs[1])}</p><a class="btn btn--secondary" href="#/dine">View the menu</a></div>
      </div>
    </div></section>

    <section class="section says"><div class="container">
      ${sectionHead('What We Believe', 'Three house rules we won’t bend.')}
      <ul class="values">${story.values.map((v, i) => `<li class="value" data-reveal><span class="value__ic">${ic(VALUE_IC[i] || 'check', 32)}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join('')}</ul>
    </div></section>

    <section class="section"><div class="container">
      ${sectionHead('The Neighbourhood', 'German Village and the best of Columbus, on foot and nearby.')}
      <ul class="hood2">${neighborhood.map((n) => `<li><span class="hood2__ic">${icon('pin', 20)}</span><div><h3>${esc(n.name)}</h3><p>${esc(n.text)}</p></div><span class="hood2__d">${esc(n.distance)}</span></li>`).join('')}</ul>
    </div></section>
    ${ctaBand('Come Stay', 'With Us Soon')}`,
});

/* ───────────────────────────── CONTACT (form left, info right, map below) ───────────────────────────── */
const contact = (r) => ({
  title: 'Contact',
  html: `
    ${pageHead({ title: 'Contact Us', lead: 'Questions about a stay, a big table or a wedding weekend — a real person answers within one business day.', crumb: [['Contact Us']] })}
    <section class="section section--shop"><div class="container contact2">
      <div class="contact2__form"><h2 class="contact2__h">Send us a message</h2><div data-contact></div></div>
      <aside class="contact2__info" aria-labelledby="ci-h">
        <h2 class="contact2__h" id="ci-h">Get in touch</h2>
        <ul class="cinfo">
          <li><span class="cinfo__ic">${icon('pin', 20)}</span><div><strong>Address</strong><p>${esc(site.address.line1)}<br>${esc(site.address.line2)}</p><a class="link" href="${directionsUrl()}" target="_blank" rel="noopener">Get directions<span class="sr-only"> (opens in a new tab)</span></a></div></li>
          <li><span class="cinfo__ic">${icon('phone', 20)}</span><div><strong>Phone</strong><p><a class="link" href="tel:${tel}">${site.phone}</a><br>Front desk, 24 hours</p></div></li>
          <li><span class="cinfo__ic">${icon('mail', 20)}</span><div><strong>Email</strong><p><a class="link" href="mailto:${site.email}">${site.email}</a></p></div></li>
        </ul>
        <h3 class="contact2__h3">Kitchen hours</h3>
        ${hoursTable()}
        <p class="contact2__cd" data-countdown></p>
      </aside>
    </div></section>
    <section class="mapsec" aria-label="Map">${mapHTML('map--wide')}</section>
    <section class="section section--grey"><div class="container">
      ${sectionHead('Frequently Asked Questions')}
      <div class="qa">${faqs.map((f) => `<details class="qa__item"><summary>${esc(f.q)}${icon('plus', 20)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
    </div></section>`,
  mount: (el) => {
    contactForm($('[data-contact]', el), r.query);
    mountMap($('[data-map]', el), { zoom: 14.8 });
    const cd = $('[data-countdown]', el);
    if (cd) cd.innerHTML = document.querySelector('.util [data-countdown]')?.innerHTML || '';
  },
});

/* ───────────────────────────── FLOWS ───────────────────────────── */
const flowPage = (title, head, fn, after) => (r) => ({
  title,
  html: `${head}<section class="section section--flow"><div class="container" data-flow></div></section>`,
  mount: (el) => {
    fn($('[data-flow]', el), r.query);
    after && after($('[data-flow]', el));
  },
  onQuery: (r2) => fn($('[data-flow]'), r2.query),
});

const book = flowPage('Book a room', pageHead({ title: 'Book your stay', crumb: [['Rooms', '#/stay'], ['Checkout']], compact: true, trust: true }), bookingWizard);
const reserve = flowPage('Reserve a table', pageHead({ title: 'Reserve a Table', crumb: [['Online Menu', '#/dine'], ['Reserve']], compact: true, lead: 'Dinner Tuesday to Sunday from 5 pm. Breakfast, lunch and the rooftop bar are walk-in.' }), reservationFlow, timeSelect);
const manage = flowPage('Manage booking', pageHead({ title: 'My Booking', crumb: [['My booking']], compact: true, lead: 'Look up a room booking or table reservation to see the details or cancel.' }), manageFlow);

const notFound = (r, msg) => ({
  title: 'Page not found',
  html: `<section class="section"><div class="container nf">
    <p class="nf__code" aria-hidden="true">404</p>
    <h1 class="nf__t">This page checked out early.</h1>
    <p>${msg || 'We couldn’t find that page. It may have moved while we were renovating.'}</p>
    <div class="nf__actions"><a class="btn btn--primary" href="#/">Back to home</a><a class="btn btn--secondary" href="#/stay">See rooms</a><a class="btn btn--secondary" href="#/dine">Online menu</a></div>
  </div></section>`,
});

export default { header, footer, ui, pages: { home, stay, room, dine, about, contact, book, reserve, manage, notFound } };
