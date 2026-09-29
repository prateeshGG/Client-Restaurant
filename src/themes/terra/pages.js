/* TERRA — inner pages (rooms quiz + arch grid, arch/polaroid room detail, kraft market board,
 * scrapbook about, postcard contact, flow pages). */
import { site, rooms, amenities, hours, story, neighborhood, faqs, events, images, menu } from '../../content.js';
import { esc, money, icon, $, $$ } from '../../core/util.js';
import { mapHTML, mountMap, directionsUrl } from '../../core/map.js';
import { bookingWizard, reservationFlow, manageFlow, contactForm, roomsBrowser, roomGallery, menuBrowser, dietBadges } from '../../core/flows.js';
import { openDialog } from '../../core/ui.js';
import { sun, squiggle, postmark, doodleArrow } from './art.js';
import { stamp, pmDate } from './kit.js';

/* ── shared bits ─────────────────────────────────────────────── */
export const pageHead = ({ eyebrow, title, lead = '', image = '', imageAlt = '', cta = '', compact = false, extra = '' }) => `
  <section class="phead ${compact ? 'phead--compact' : ''}">
    <div class="container phead__grid">
      <div class="phead__text">
        <p class="eyebrow">${sun()} ${eyebrow}</p>
        <h1 class="phead__title">${title}</h1>
        ${compact ? '' : `<span class="phead__squiggle">${squiggle}</span>`}
        ${lead ? `<p class="lead">${lead}</p>` : ''}
        ${cta ? `<div class="phead__cta">${cta}</div>` : ''}
      </div>
      ${image ? `<div class="phead__visual"><div class="arch phead__arch"><img src="${image}" alt="${imageAlt}" loading="eager"></div>${extra}</div>` : ''}
    </div>
  </section>`;

export const sectionHead = (e, t, l = '') => `<div class="shead"><p class="eyebrow">${e}</p><h2 class="shead__title">${t}</h2>${l ? `<p class="lead">${l}</p>` : ''}</div>`;

/* Arch room card — used by the rooms grid, home and "other rooms". No data-reveal on the
 * filtered grid (cards re-render on every filter change; they animate in with CSS instead). */
export const archCard = (r, i = 0, reveal = false) => `
  <article class="acard" style="--i:${i}" ${reveal ? 'data-reveal' : ''}>
    <div class="acard__media">
      <a class="arch acard__arch" href="#/stay/${r.id}" tabindex="-1" aria-hidden="true"><img src="${r.images[0]}" alt="" loading="lazy"></a>
      <p class="acard__price"><small>from</small><b>${money(r.rate)}</b><small>a night</small></p>
    </div>
    <div class="acard__body">
      <ul class="acard__tags" aria-label="Room facts"><li>${esc(r.bed)}</li><li>Sleeps ${r.sleeps}</li><li>${r.size} ft²</li></ul>
      <h3 class="acard__name"><a href="#/stay/${r.id}">${esc(r.name)}</a></h3>
      <p class="acard__desc">${esc(r.short)}</p>
      <div class="acard__foot"><a class="link" href="#/stay/${r.id}">Look inside<span class="sr-only"> ${esc(r.name)}</span></a><a class="btn btn--primary" href="#/book?room=${r.id}&step=1" aria-label="Book ${esc(r.name)}">Book</a></div>
    </div>
  </article>`;

/* ── Dish photo: tilted arch polaroid (hover/focus) + inline arch thumb (touch) ── */
export const dishPhoto = (i) => `
  <button type="button" class="dish-thumb" data-peek="${i.id}" tabindex="-1" aria-hidden="true"><img src="${i.image}" alt="${esc(i.name)}" loading="lazy" width="60" height="76"></button>
  <figure class="dish-pola" aria-hidden="true"><span class="dish-pola__arch"><img src="${i.image}" alt="${esc(i.name)}" loading="lazy" width="220" height="260"></span><figcaption>${esc(i.name)}</figcaption></figure>`;

export const dishButton = (i, cls) =>
  `<button type="button" class="${cls}" data-peek="${i.id}" aria-haspopup="dialog">${esc(i.name)}<span class="sr-only"> — view photo</span></button>`;

/** Tap / click / Enter on a dish opens an enlarged polaroid. Delegated, so re-rendered lists keep working. */
export function bindPeek(root) {
  if (!root || root.dataset.peekBound) return;
  root.dataset.peekBound = '1';
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-peek]');
    if (!b || !root.contains(b)) return;
    const item = menu.items.find((x) => x.id === b.dataset.peek);
    if (!item) return;
    const opener = b.classList.contains('dish-thumb') ? b.closest('[data-menu-item], li')?.querySelector('button[data-peek]:not(.dish-thumb)') || b : b;
    openDialog({
      title: esc(item.name),
      className: 'dialog--peek',
      opener,
      body: `<figure class="peek"><span class="peek__arch"><img src="${item.image}" alt="${esc(item.name)}"></span>
        <figcaption><span class="hand">${esc(item.desc)}</span><b>${money(item.price)}</b></figcaption></figure>`,
    });
  });
}

/* ── Kraft market board item ── */
const menuItem = (i) => `
  <article class="mi" data-menu-item="${i.id}">
    <div class="mi__row">
      <h3 class="mi__name">${dishButton(i, 'mi__btn')}</h3>
      <span class="mi__dots" aria-hidden="true"></span>
      <span class="mi__price">${money(i.price)}</span>
    </div>
    <p class="mi__desc">${esc(i.desc)}</p>
    ${i.diet.length ? `<p class="mi__diet">${dietBadges(i)}</p>` : ''}
    ${dishPhoto(i)}
  </article>`;

const hoursDL = (cls) => `<dl class="${cls}">${hours.map((h) => `<div><dt>${h.label} <span>${h.days}</span></dt><dd>${h.time}</dd></div>`).join('')}</dl>`;

const CAPS = { room: 'the room', bathroom: 'the bathroom', lobby: 'the lobby, downstairs', breakfast: 'breakfast downstairs', rooftop: 'up on the roof', bar: 'the bar cart', suite: 'the parlor', loft: 'under the beams' };
const caption = (src, n) => {
  const f = String(src).split('/').pop().replace(/\.\w+$/, '');
  if (f.startsWith('room-')) return CAPS[f.slice(5)] || CAPS.room;
  return CAPS[f] || `photo ${n}`;
};

/* ── flow page helper (same pattern as core/pages.js flowPage) ── */
const flowPage = (title, head, fn, after) => (r) => ({
  title,
  html: `${head}<section class="section section--tight flow-section"><div class="container" data-flow></div></section>`,
  mount: (el) => {
    const host = $('[data-flow]', el);
    fn(host, r.query);
    after && after(host, true);
  },
  onQuery: (r2) => {
    const host = $('[data-flow]');
    fn(host, r2.query);
    after && after(host, false);
  },
});

/* Day-tag row: keep the chosen tag in view; prev/next buttons scroll the row. */
function dayTags(host, first) {
  const center = (smooth) => {
    const row = $('[data-days]', host);
    const on = row && $('input:checked', row);
    if (!row || !on) return;
    const tag = on.closest('.daytag');
    const left = tag.offsetLeft - (row.clientWidth - tag.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'instant' });
  };
  center(false);
  if (!first) return;
  host.addEventListener('change', (e) => e.target.name === 'date' && center(true));
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-days-scroll]');
    if (!b) return;
    const row = $('[data-days]', host);
    row && row.scrollBy({ left: +b.dataset.daysScroll * row.clientWidth * 0.8, behavior: 'smooth' });
  });
}

export function terraPages() {
  /* ── ROOMS ─────────────────────────────────────────────── */
  const stay = () => ({
    title: 'Rooms',
    html: `
      ${pageHead({ eyebrow: 'Stay', title: 'A room for every kind of trip', lead: 'Tell us who’s coming and we’ll show the rooms that fit. Every one has original brick or timber, a very good bed and our best rate — always lowest here.', image: images.lobby, imageAlt: 'The brick-walled lobby with a green velvet sofa and plants' })}
      <section class="section section--tight rooms-quiz"><div class="container" data-rooms></div></section>
      <section class="section every"><div class="container">
        ${sectionHead('Every stay includes', 'The small things,<br>done properly')}
        <ul class="every__list">${amenities.map((a, i) => `<li style="--r:${[-4, 3, -2, 5, -3, 2][i % 6]}deg"><span class="every__ring">${icon(a.icon, 26)}</span><span>${esc(a.label)}</span></li>`).join('')}</ul>
      </div></section>`,
    mount: (el) => roomsBrowser($('[data-rooms]', el), (r, i) => archCard(r, i)),
  });

  const room = (r) => {
    const rm = rooms.find((x) => x.id === r.parts[1]);
    if (!rm) return notFound(r, 'That room doesn’t exist — maybe it was renamed.');
    const others = rooms.filter((x) => x.id !== rm.id).slice(0, 3);
    const tilt = [-6, 4, -2, 5];
    return {
      title: rm.name,
      html: `
        <div class="container rd">
          <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#/">Home</a></li><li><a href="#/stay">Rooms</a></li><li aria-current="page">${esc(rm.name)}</li></ol></nav>
          <div class="rd__hero">
            <div class="rd__gallery">
              <button class="arch rd__main" type="button" data-gallery-main aria-label="Open photo gallery for ${esc(rm.name)}">
                <img src="${rm.images[0]}" alt="${esc(rm.name)} — photo 1 of ${rm.images.length}">
                <span class="rd__zoom">${icon('plus', 16)} Enlarge</span>
              </button>
            </div>
            <div class="rd__intro">
              <p class="eyebrow">${sun()} Room · sleeps ${rm.sleeps}</p>
              <h1 class="rd__title">${esc(rm.name)}</h1>
              <p class="rd__short">${esc(rm.short)}</p>
              <div class="rd__polas" role="group" aria-label="Choose photo">
                ${rm.images.map((src, i) => `<button type="button" class="pola pola--thumb" data-thumb aria-pressed="${i === 0}" aria-label="Show photo ${i + 1} of ${rm.images.length}: ${caption(src, i + 1)}" style="--r:${tilt[i % 4]}deg"><img src="${src}" alt="" loading="lazy"><span class="pola__cap">${caption(src, i + 1)}</span></button>`).join('')}
              </div>
              <p class="rd__hint hand">${doodleArrow} tap a snapshot to swap the big photo</p>
            </div>
          </div>

          <article class="postcard postcard--room" aria-labelledby="rd-msg">
            <div class="postcard__msg">
              <h2 class="postcard__dear hand" id="rd-msg">Dear guest,</h2>
              <p class="rd__desc">${esc(rm.description)}</p>
              <h3 class="postcard__h">In the room</h3>
              <ul class="ticks">${rm.amenities.map((a) => `<li>${icon('check', 16)} ${esc(a)}</li>`).join('')}</ul>
              <p class="hand postcard__sign">— see you upstairs</p>
            </div>
            <div class="postcard__back">
              <div class="postcard__corner">
                ${postmark(pmDate(), 'postcard__pm')}
                <p class="stamp-w stamp-w--price"><span class="stamp stamp--price"><span class="stamp__in"><small>from</small><b>${money(rm.rate)}</b><small>per night</small></span></span></p>
              </div>
              <dl class="postcard__lines">
                <div><dt>Bed</dt><dd>${esc(rm.bed)}</dd></div>
                <div><dt>Sleeps</dt><dd>Up to ${rm.sleeps}</dd></div>
                <div><dt>Size</dt><dd>${rm.size} sq ft</dd></div>
                <div><dt>Check-in</dt><dd>from ${site.checkIn}</dd></div>
                <div><dt>Check-out</dt><dd>by ${site.checkOut}</dd></div>
              </dl>
              <a class="btn btn--primary btn--lg postcard__cta" href="#/book?room=${rm.id}&step=1">Book this room ${icon('arrow', 18)}</a>
              <p class="postcard__note">${icon('check', 14)} Free cancellation up to 48 hours before arrival</p>
            </div>
          </article>
        </div>
        <section class="section section--tint"><div class="container">
          ${sectionHead('Also consider', 'Other rooms')}
          <div class="arch-grid arch-grid--static">${others.map((o, i) => archCard(o, i, true)).join('')}</div>
        </div></section>`,
      mount: (el) => roomGallery(el, rm),
    };
  };

  /* ── DINE: kraft market board ─────────────────────────── */
  const dine = () => ({
    title: 'Dine',
    html: `
      ${pageHead({
        eyebrow: 'The Kitchen',
        title: 'Modern Midwestern, all day',
        lead: 'Breakfast for guests and neighbours, a smash burger at lunch, and Lake Erie walleye by candlelight. Open to everyone — no room key required.',
        image: images.dining,
        imageAlt: 'The candle-lit dining room with brick walls',
        cta: `<a class="btn btn--primary btn--lg" href="#/reserve">Reserve a table</a><a class="btn btn--secondary btn--lg" href="#/contact?topic=event">Private dining</a>`,
        extra: `<div class="hours-tag"><span class="hours-tag__hole" aria-hidden="true"></span><p class="hours-tag__t">Kitchen hours</p>${hoursDL('hours-tag__list')}</div>`,
      })}
      <section class="section section--tight"><div class="container">
        <div class="board" data-menu></div>
        <p class="board__foot">${icon('info', 16)} <span>Breakfast, lunch and the rooftop bar are walk-in. Dinner reservations open 60 days ahead. Tell your server about allergies — most dishes can be adapted.</span></p>
      </div></section>
      ${eventsBlock()}`,
    mount: (el) => {
      const host = $('[data-menu]', el);
      menuBrowser(host, menuItem, { initial: 'dinner' });
      bindPeek(host);
    },
  });

  const eventsBlock = () => `
    <section class="section events-terra"><div class="container events-terra__grid">
      <figure class="pola pola--big" style="--r:-3deg" data-reveal><img src="${images.events}" alt="Long candle-lit table set in the brick-walled private dining room" loading="lazy"><figcaption>the private room, set for 32</figcaption></figure>
      <div class="events-terra__body">
        ${sectionHead('Gatherings', esc(events.title), esc(events.text))}
        <ul class="events-terra__tags">${events.capacity.map((c) => `<li><span>${esc(c.label)}</span><b>${esc(c.value)}</b></li>`).join('')}</ul>
        <a class="btn btn--secondary" href="#/contact?topic=event">Plan an event</a>
      </div>
    </div></section>`;

  /* ── ABOUT: scrapbook ─────────────────────────────────── */
  const about = () => ({
    title: 'About',
    html: `
      <section class="scrap-hero"><div class="container scrap-hero__grid">
        <div class="scrap-hero__text">
          <p class="eyebrow">${sun()} Since ${site.since}</p>
          <h1 class="phead__title">${esc(story.headline)}</h1>
          <span class="phead__squiggle">${squiggle}</span>
          <p class="lead">${esc(story.intro)}</p>
        </div>
        <div class="scrap-hero__collage">
          <figure class="pola pola--a" style="--r:-5deg"><img src="${images.hero}" alt="The red-brick corner building at dusk" loading="eager"><figcaption>the corner, at dusk</figcaption></figure>
          <figure class="pola pola--b" style="--r:4deg"><img src="${images.lobby}" alt="Lobby with exposed brick and a green sofa" loading="eager"><figcaption>every brick we could keep</figcaption></figure>
          <figure class="pola pola--c" style="--r:-2deg"><img src="${images.coffee}" alt="The coffee counter with ceramic cups" loading="lazy"><figcaption>first coffee, 7 am</figcaption></figure>
        </div>
      </div></section>

      <section class="section journal-wrap"><div class="container journal-grid">
        <article class="journal" data-reveal>
          <p class="journal__head hand">notes from the front desk</p>
          ${story.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
          <p class="journal__sign hand">— everyone at ${esc(site.name)}</p>
        </article>
        <div class="journal-pins">
          <figure class="pola" style="--r:3deg" data-reveal><img src="${images.chef}" alt="Chef’s hands plating a dish at the kitchen pass" loading="lazy"><figcaption>chef at the pass</figcaption></figure>
          <figure class="pola" style="--r:-4deg" data-reveal><img src="${images.rooftop}" alt="The rooftop bar at sunset" loading="lazy"><figcaption>rooftop, golden hour</figcaption></figure>
        </div>
      </div></section>

      <section class="section rules"><div class="container">
        ${sectionHead('What we believe', 'House rules<br>(the good kind)')}
        <ol class="rules__notes">${story.values.map((v, i) => `<li class="scrapnote" style="--r:${[-2.5, 1.8, -1.2][i % 3]}deg" data-reveal><span class="scrapnote__n hand">no. ${i + 1}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join('')}</ol>
      </div></section>

      <section class="section patch"><div class="container patch__grid">
        <figure class="pola pola--big" style="--r:2deg" data-reveal><img src="${images.neighborhood}" alt="Brick-paved street of red-brick houses in German Village" loading="lazy"><figcaption>our street, on a Sunday</figcaption></figure>
        <div>
          ${sectionHead('The neighbourhood', 'Our patch<br>of Columbus')}
          <ul class="walks walks--big">${neighborhood.map((n) => `<li><span class="walks__name"><b>${esc(n.name)}</b><small>${esc(n.text)}</small></span><span class="walks__dots" aria-hidden="true"></span><span class="walks__dist">${esc(n.distance)}</span></li>`).join('')}</ul>
        </div>
      </div></section>`,
  });

  /* ── CONTACT: postcard (arch map + letter form) + folded FAQ tags ── */
  const contact = (r) => ({
    title: 'Contact',
    html: `
      ${pageHead({ eyebrow: 'Visit & write', title: 'Send us a postcard', lead: 'Questions about a stay, a big table or a wedding weekend — a real person writes back within one business day.', image: images.hero, imageAlt: 'The red-brick corner building of Scioto House at dusk' })}
      <section class="section section--tight"><div class="container">
        <div class="pc-contact">
          <div class="pc-contact__pic">
            ${mapHTML('map--terra arch-map pc-contact__map')}
            <ul class="pc-contact__lines">
              <li>${icon('pin', 20)}<div><strong>${site.address.line1}</strong><br>${site.address.line2}<br><a class="link" href="${directionsUrl()}" target="_blank" rel="noopener">Get directions ↗</a></div></li>
              <li>${icon('phone', 20)}<div><a class="link" href="tel:${site.phone.replace(/\D/g, '')}">${site.phone}</a><br><span class="muted">Front desk, 24 hours</span></div></li>
              <li>${icon('mail', 20)}<div><a class="link" href="mailto:${site.email}">${site.email}</a></div></li>
            </ul>
            <h2 class="pc-contact__h">Hours</h2>
            ${hoursDL('hours pc-contact__hours')}
          </div>
          <div class="pc-contact__write">
            <div class="pc-contact__corner">${postmark(pmDate(), 'postcard__pm')}${stamp('Write', site.city.split(',')[0])}</div>
            <h2 class="sr-only">Send a message</h2>
            <div data-contact></div>
          </div>
        </div>
      </div></section>
      <section class="section faqtags"><div class="container">
        ${sectionHead('Good to know', 'Questions, answered', 'Tap a tag to unfold it.')}
        <div class="tagcards">${faqs.map((f, i) => `<details class="tagcard" style="--r:${[-1.5, 1, -0.6, 1.4, -1.1, 0.7, -1.3][i % 7]}deg"><summary><span class="tagcard__hole" aria-hidden="true"></span><span class="tagcard__q">${esc(f.q)}</span><span class="tagcard__fold" aria-hidden="true"></span></summary><p>${esc(f.a)}</p></details>`).join('')}</div>
      </div></section>`,
    mount: (el) => {
      contactForm($('[data-contact]', el), r.query);
      mountMap($('[data-map]', el), { zoom: 15 });
    },
  });

  const book = flowPage('Book a room', pageHead({ eyebrow: 'Book direct · best rate', title: 'Plan your stay', compact: true }), bookingWizard);
  const reserve = flowPage('Reserve a table', pageHead({ eyebrow: 'The Kitchen', title: 'Reserve a table', compact: true }), reservationFlow, dayTags);
  const manage = flowPage('Manage booking', pageHead({ eyebrow: 'Your booking', title: 'Find your booking', lead: 'Look up a room booking or a table reservation to see the details or cancel.', compact: true }), manageFlow);

  const notFound = (r, msg) => ({
    title: 'Page not found',
    html: `<section class="section"><div class="container lost">
      <div class="lost__tag" aria-hidden="true"><span class="lost__hole"></span><b>404</b><small>Room not on this floor</small></div>
      <div class="lost__text">
        <p class="eyebrow">${sun()} Wrong door</p><h1>This door is locked.</h1>
        <p class="lead">${msg || 'We couldn’t find that page. It may have moved while we were renovating.'}</p>
        <div class="lost__actions"><a class="btn btn--primary" href="#/">Back to the house</a><a class="btn btn--secondary" href="#/stay">See rooms</a></div>
      </div>
    </div></section>`,
  });

  return { stay, room, dine, about, contact, book, reserve, manage, notFound };
}

export { $$ };
