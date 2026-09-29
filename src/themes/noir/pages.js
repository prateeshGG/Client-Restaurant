/* NOIR — page compositions (every page redesigned in the after-dark language). */
import { site, rooms, menu, testimonials, images, media, hours, events, amenities, story, neighborhood, faqs } from '../../content.js';
import { esc, money, icon, $, $$ } from '../../core/util.js';
import { mapHTML, mountMap, directionsUrl } from '../../core/map.js';
import { bookingWizard, reservationFlow, manageFlow, contactForm, roomsBrowser, menuBrowser } from '../../core/flows.js';
import { ROMAN, pad2, statusHTML, roomCard, roomStrip, dishHTML } from './shared.js';
import { crossfader, bindPeek, bindStrip, tickStatus, enhanceFlow, bindSlides, bindCine, bindChapters } from './behave.js';

const M = media.noir;

/* ───────────────────────────── HOME (signature, kept) ───────────────────────────── */
const home = () => ({
  title: '',
  html: `
    <section class="hero" aria-label="Welcome">
      <div class="hero__media">
        ${M.heroVideo
          ? `<video class="hero__video" autoplay muted loop playsinline preload="metadata" poster="${M.heroPoster}" aria-hidden="true"><source src="${M.heroVideo}" type="video/mp4"></video>`
          : `<img class="hero__video" src="${M.heroPoster}" alt="" aria-hidden="true" fetchpriority="high">`}
      </div>
      <div class="hero__inner">
        <p class="hero__kicker">Hotel · Kitchen · Bar — German Village, ${site.city}</p>
        <h1 class="hero__title">Scioto<br><em>after dark</em></h1>
        <p class="hero__status" data-status>${statusHTML()}</p>
        <div class="hero__cta"><a class="btn btn--primary btn--lg" href="#/book">Reserve a room</a><a class="btn btn--secondary btn--lg" href="#/reserve">Book a table</a></div>
      </div>
      ${M.heroVideo ? `<button class="hero__pause" type="button" data-pause aria-pressed="false" aria-label="Pause background video">${icon('minus', 16)}<span>Pause</span></button>` : ''}
      <a class="hero__scroll" href="#intro" data-scroll aria-label="Scroll to content"><span></span></a>
    </section>

    <section class="statement" id="intro"><div class="statement__inner" data-reveal>
      <p class="eyebrow">Since ${site.since}</p>
      <p class="statement__text">Twenty rooms above a candle-lit kitchen. <em>Come for supper, stay for the night</em> — the stairs are right there.</p>
    </div></section>

    ${roomStrip(rooms, { id: 'rooms-h', eyebrow: 'The rooms', title: 'Five ways to stay the night' })}

    <section class="split" aria-labelledby="carte-h">
      <div class="split__media" aria-hidden="true">
        <div class="split__layer is-on" data-layer data-src="${M.dish}" style="background-image:url('${M.dish}')"></div>
        <div class="split__layer" data-layer></div>
        <p class="split__cap" data-cap></p>
      </div>
      <div class="split__body">
        <p class="eyebrow">The Kitchen · from 5 pm</p>
        <h2 class="shead__title" id="carte-h">Tonight’s carte</h2>
        <p class="split__hint"><span class="hint-hover">Hover a dish to see it on the plate.</span><span class="hint-touch">Tap a dish to see it on the plate.</span></p>
        <div class="dishes dishes--compact" data-home-carte>${menu.items.filter((i) => i.period === 'dinner' && i.available !== false).slice(0, 5).map((i) => dishHTML(i)).join('')}</div>
        <div class="split__cta"><a class="btn btn--primary" href="#/reserve">Book a table</a><a class="btn btn--secondary" href="#/dine">The full carte</a></div>
      </div>
    </section>

    <section class="bar-slide" style="--img:url('${M.cocktail}')">
      <div class="bar-slide__inner" data-reveal>
        <p class="eyebrow">From the guest book</p>
        <blockquote class="bar-slide__quote">“${esc(testimonials[2].quote)}”</blockquote>
        <p class="bar-slide__who">— ${esc(testimonials[2].name)}, ${esc(testimonials[2].where)}</p>
      </div>
    </section>

    ${eventsSlide()}

    <section class="find"><div class="find__grid">
      <div class="find__text" data-reveal>
        <p class="eyebrow">Find us</p>
        <h2 class="shead__title">On the corner of<br>German Village</h2>
        <p>${site.address.line1}<br>${site.address.line2}</p>
        <p class="find__meta">Valet at the door · 10 min walk to the Scioto Mile</p>
        <a class="btn btn--secondary" href="${directionsUrl()}" target="_blank" rel="noopener">Directions</a>
      </div>
      ${mapHTML('map--noir')}
    </div></section>

    <section class="closing">
      <a class="closing__line" href="#/book"><span class="closing__label">Stay</span><span class="closing__big">Reserve a room</span>${icon('arrow', 36)}</a>
      <a class="closing__line" href="#/reserve"><span class="closing__label">Dine</span><span class="closing__big">Book a table</span>${icon('arrow', 36)}</a>
    </section>`,
  mount: (el) => {
    const v = $('video', el);
    const pause = $('[data-pause]', el);
    if (v && matchMedia('(prefers-reduced-motion: reduce)').matches) v.pause();
    pause &&
      pause.addEventListener('click', () => {
        const paused = !v.paused;
        paused ? v.pause() : v.play();
        pause.setAttribute('aria-pressed', paused);
        pause.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
        pause.querySelector('span').textContent = paused ? 'Play' : 'Pause';
      });
    $('[data-scroll]', el).addEventListener('click', (e) => {
      e.preventDefault();
      $('#intro', el).scrollIntoView({ behavior: 'smooth' });
    });
    bindStrip(el);
    const media = $('.split__media', el);
    const fade = crossfader(media);
    const cap = $('[data-cap]', media);
    bindPeek($('[data-home-carte]', el), {
      onShow: (src, name) => {
        fade(src);
        cap.textContent = name;
        media.classList.add('is-peek');
      },
      onReset: () => {
        fade(M.dish);
        media.classList.remove('is-peek');
      },
    });
    mountMap($('[data-map]', el), { zoom: 15 });
    tickStatus(el);
  },
});

function eventsSlide() {
  return `
    <section class="events-slide" style="--img:url('${images.events}')"><div class="events-slide__inner" data-reveal>
      <p class="eyebrow">Private dining</p>
      <h2 class="shead__title">${esc(events.title)}</h2>
      <p class="lead">${esc(events.text)}</p>
      <dl class="events-slide__cap">${events.capacity.map((c) => `<div><dt>${c.label}</dt><dd>${c.value}</dd></div>`).join('')}</dl>
      <a class="btn btn--secondary" href="#/contact?topic=event">Plan an evening</a>
    </div></section>`;
}

/* ───────────────────────────── STAY: one room per viewport ───────────────────────────── */
const slideHTML = (r, i) => `
  <article class="rslide" id="room-${r.id}" data-room="${r.id}" aria-labelledby="rs-${r.id}">
    <img class="rslide__img" src="${r.images[0]}" alt="" ${i > 0 ? 'loading="lazy"' : 'fetchpriority="high"'}>
    <div class="rslide__body">
      <p class="rslide__idx"><span data-at>${pad2(i + 1)}</span><span class="rslide__of"> / <span data-of>${pad2(rooms.length)}</span></span></p>
      <h2 class="rslide__name" id="rs-${r.id}">${esc(r.name)}</h2>
      <p class="rslide__short">${esc(r.short)}</p>
      <ul class="rslide__facts"><li>${icon('bed', 18)} ${r.bed}</li><li>${icon('users', 18)} Sleeps ${r.sleeps}</li><li>${icon('size', 18)} ${r.size} sq ft</li></ul>
      <div class="rslide__foot">
        <p class="rslide__rate"><span>From</span> <strong>${money(r.rate)}</strong> <span>a night</span></p>
        <div class="rslide__cta">
          <a class="btn btn--primary" href="#/stay/${r.id}">Discover<span class="sr-only"> ${esc(r.name)}</span></a>
          <a class="btn btn--secondary" href="#/book?room=${r.id}&step=1">Reserve<span class="sr-only"> ${esc(r.name)}</span></a>
        </div>
      </div>
    </div>
    <div class="rslide__peek" aria-hidden="true">${r.images.slice(1, 3).map((src) => `<img src="${src}" alt="" loading="lazy">`).join('')}</div>
  </article>`;

const stay = () => ({
  title: 'Rooms',
  html: `
    <div class="rstage" data-rooms></div>
    <section class="credits" aria-labelledby="credits-h">
      <p class="eyebrow">Every stay includes</p>
      <h2 class="credits__title" id="credits-h">The small print, done properly</h2>
      <ul class="credits__list">${amenities.map((a) => `<li>${icon(a.icon, 22)}<span>${esc(a.label)}</span></li>`).join('')}</ul>
      <p class="credits__foot">Check-in from ${site.checkIn} · Check-out by ${site.checkOut} · Best rate when you book direct</p>
    </section>`,
  mount: (el) => {
    const host = $('[data-rooms]', el);
    roomsBrowser(host, slideHTML, { onRender: bindSlides(host) });
  },
});

/* ───────────────────────────── ROOM: cinematic slideshow ───────────────────────────── */
const room = (r) => {
  const rm = rooms.find((x) => x.id === r.parts[1]);
  if (!rm) return notFound(r, 'That room doesn’t exist — maybe it was renamed.');
  const n = rm.images.length;
  const others = rooms.filter((x) => x.id !== rm.id);
  return {
    title: rm.name,
    html: `
      <section class="cine" aria-roledescription="slideshow" aria-label="${esc(rm.name)}">
        <div class="cine__stage">
          <button class="cine__main" type="button" data-gallery-main aria-label="Open ${esc(rm.name)} photos full screen">
            <img class="cine__img" src="${rm.images[0]}" alt="${esc(rm.name)} — photo 1 of ${n}" fetchpriority="high">
            <img class="cine__prev" src="${rm.images[0]}" alt="" aria-hidden="true">
          </button>
        </div>
        <nav class="cine__crumbs" aria-label="Breadcrumb"><ol><li><a href="#/stay">Rooms</a></li><li aria-current="page">${esc(rm.name)}</li></ol></nav>
        <div class="cine__chrome">
          <div class="cine__progress" role="group" aria-label="Choose photo">
            ${rm.images.map((_, i) => `<button type="button" class="cine__seg" data-thumb aria-pressed="${i === 0}" aria-label="Show photo ${i + 1} of ${n}"><span class="cine__segn" aria-hidden="true">${pad2(i + 1)}</span><span class="cine__track"><span class="cine__fill"></span></span></button>`).join('')}
          </div>
          <div class="cine__controls">
            <button class="cine__ctl" type="button" data-gallery-step="-1" aria-label="Previous photo">${icon('arrowLeft', 18)}</button>
            <p class="cine__count" aria-live="polite"><span class="sr-only">Photo </span><span data-now>01</span> / ${pad2(n)}</p>
            <button class="cine__ctl" type="button" data-gallery-step="1" aria-label="Next photo">${icon('arrow', 18)}</button>
            <button class="cine__ctl cine__play" type="button" data-play aria-pressed="false" aria-label="Pause slideshow"><i aria-hidden="true"></i><span>Pause</span></button>
          </div>
        </div>
        <aside class="cine__panel" aria-labelledby="room-h">
          <p class="eyebrow">Room · sleeps ${rm.sleeps}</p>
          <h1 class="cine__title" id="room-h">${esc(rm.name)}</h1>
          <ul class="cine__facts"><li>${icon('bed', 18)} ${rm.bed}</li><li>${icon('users', 18)} Up to ${rm.sleeps}</li><li>${icon('size', 18)} ${rm.size} sq ft</li></ul>
          <p class="cine__desc">${esc(rm.description)}</p>
          <div class="cine__book">
            <p class="cine__rate"><span>From</span> <strong>${money(rm.rate)}</strong> <span>a night</span></p>
            <a class="btn btn--primary btn--lg" href="#/book?room=${rm.id}&step=1">Book this room ${icon('arrow', 18)}</a>
            <p class="cine__note">${icon('check', 14)} Free cancellation up to 48 hours before arrival</p>
          </div>
        </aside>
      </section>
      <section class="rinfo">
        <div class="rinfo__grid">
          <div>
            <p class="eyebrow">In the room</p>
            <ul class="rinfo__list">${rm.amenities.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
          </div>
          <div>
            <p class="eyebrow">Good to know</p>
            <dl class="rinfo__dl">
              <div><dt>Check-in</dt><dd>from ${site.checkIn}</dd></div>
              <div><dt>Check-out</dt><dd>by ${site.checkOut}</dd></div>
              <div><dt>Cancellation</dt><dd>Free until 48 hours before arrival</dd></div>
              <div><dt>Rate</dt><dd>Lowest here — no booking fee</dd></div>
            </dl>
          </div>
        </div>
      </section>
      ${roomStrip(others, { id: 'others-h', eyebrow: 'Also showing', title: 'The other rooms' })}`,
    mount: (el) => {
      bindCine($('.cine', el), rm);
      bindStrip(el);
    },
  };
};

/* ───────────────────────────── DINE: backdrop carte ───────────────────────────── */
const AMBIENT = { breakfast: images.coffee, lunch: images.dining, dinner: images.events, drinks: images.bar };
const dine = () => ({
  title: 'Dine',
  html: `
    <section class="carte-stage" aria-labelledby="dine-h">
      <div class="carte-bg" aria-hidden="true">
        <div class="carte-bg__layer is-on" data-layer data-src="${AMBIENT.dinner}" style="background-image:url('${AMBIENT.dinner}')"></div>
        <div class="carte-bg__layer" data-layer></div>
        <div class="carte-bg__veil"></div>
        <p class="carte-bg__cap" data-cap></p>
      </div>
      <div class="carte-body">
        <header class="carte-head">
          <p class="eyebrow">The Kitchen · open to everyone</p>
          <h1 class="carte-head__title" id="dine-h">The carte</h1>
          <p class="carte-head__lead">Breakfast for guests and neighbours, a smash burger at lunch and Lake Erie walleye by candlelight. No room key required.</p>
          <p class="carte-head__status" data-status>${statusHTML()}</p>
          <p class="carte-head__hint"><span class="hint-hover">Hover or tab through a dish — its photograph fills the room.</span><span class="hint-touch">Tap a dish to see its photograph.</span></p>
        </header>
        <div class="carte-col" data-menu></div>
        <div class="carte-foot"><a class="btn btn--primary btn--lg" href="#/reserve">Reserve a table</a><p>Breakfast, lunch and the rooftop are walk-in.</p></div>
      </div>
    </section>
    <section class="programme" aria-labelledby="prog-h">
      <div class="programme__inner">
        <div class="programme__head">
          <p class="eyebrow">Hours</p>
          <h2 class="shead__title" id="prog-h">The programme</h2>
          <p>Dinner reservations open 60 days ahead. Everything else, just walk in — the bar is first-come.</p>
          <a class="btn btn--secondary" href="#/reserve">Reserve dinner</a>
        </div>
        <ol class="programme__list">${hours.map((h, i) => `<li><span class="programme__n" aria-hidden="true">${ROMAN[i]}</span><span class="programme__what">${h.label}<small>${h.days}</small></span><span class="programme__time">${h.time}</span></li>`).join('')}</ol>
        <p class="programme__legend">${menu.diets.map((d) => `<span><abbr class="diet diet--${d.id}" title="${d.label}">${d.id.toUpperCase()}</abbr> ${d.label}</span>`).join('')}</p>
      </div>
    </section>
    ${eventsSlide()}`,
  mount: (el) => {
    const stage = $('.carte-stage', el);
    const bg = $('.carte-bg', stage);
    const fade = crossfader(bg);
    const cap = $('[data-cap]', bg);
    let period = 'dinner';
    menuBrowser($('[data-menu]', el), (i) => dishHTML(i), {
      initial: 'dinner',
      onRender: (list, items, p) => {
        period = p;
        if (!list.classList.contains('is-peeking')) fade(AMBIENT[p]);
      },
    });
    bindPeek($('[data-menu-list]', el), {
      onShow: (src, name) => {
        fade(src);
        cap.textContent = name;
        stage.classList.add('is-peek');
      },
      onReset: () => {
        fade(AMBIENT[period]);
        stage.classList.remove('is-peek');
      },
    });
    tickStatus(el);
  },
});

/* ───────────────────────────── ABOUT: chapters ───────────────────────────── */
/* PLACEHOLDER years/copy for II–III — the owner should confirm (see report: story.chapters in content.js). */
const chapters = () =>
  story.chapters || [
    { year: site.since, title: 'A dry-goods store on the corner', text: story.intro, image: images.hero },
    { year: '1934', title: 'Bread in the window, then ink', text: 'The ground floor turned bakery, then print shop. Flour and ink are still in the grain of the oak boards we saved.', image: images.coffee },
    { year: '1978', title: 'A very good record shop', text: 'Crates, a listening booth and Saturday queues around the block. The record player in the Loft is our nod to those years.', image: images.lobby },
    { year: 'Today', title: 'Twenty rooms, one kitchen, one rooftop', text: story.paragraphs.join(' '), image: images.dining },
  ];

const about = () => {
  const ch = chapters();
  return {
    title: 'About',
    html: `
      <section class="prologue">
        <p class="eyebrow">The house · since ${site.since}</p>
        <h1 class="prologue__title">${esc(story.headline)}</h1>
        <p class="prologue__sub">In ${ch.length} chapters</p>
        <span class="prologue__cue" aria-hidden="true"></span>
      </section>
      <div class="chapters">
        ${ch
          .map(
            (c, i) => `
          <section class="chapter chapter--${i % 2 ? 'b' : 'a'}" id="ch-${i}" aria-labelledby="ch-${i}-h">
            <img class="chapter__img" src="${c.image}" alt="" ${i ? 'loading="lazy"' : ''}>
            <div class="chapter__body" data-reveal>
              <p class="chapter__n">Chapter ${ROMAN[i]}</p>
              <h2 class="chapter__h" id="ch-${i}-h"><span class="chapter__year">${esc(c.year)}</span><span class="chapter__title">${esc(c.title)}</span></h2>
              <p class="chapter__text">${esc(c.text)}</p>
            </div>
          </section>`
          )
          .join('')}
        <nav class="rrail rrail--years" aria-label="Chapters" data-rail><ol>${ch.map((c, i) => `<li><button type="button" class="rrail__btn" data-go="ch-${i}" aria-label="Chapter ${ROMAN[i]}: ${esc(c.year)}"><span class="rrail__n">${esc(c.year)}</span></button></li>`).join('')}</ol></nav>
      </div>
      <section class="rules" aria-labelledby="rules-h">
        <div class="rules__head"><p class="eyebrow">What we believe</p><h2 class="shead__title" id="rules-h">House rules</h2></div>
        <ol class="rules__list">${story.values.map((v, i) => `<li data-reveal><span class="rules__n" aria-hidden="true">${ROMAN[i]}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join('')}</ol>
      </section>
      <section class="hoodn" aria-labelledby="hood-h">
        <img class="hoodn__img" src="${images.neighborhood}" alt="Brick-paved street of red-brick houses in German Village" loading="lazy">
        <div class="hoodn__body">
          <p class="eyebrow">The neighbourhood</p>
          <h2 class="shead__title" id="hood-h">Columbus, within reach</h2>
          <ul class="hoodn__list">${neighborhood.map((x) => `<li><span class="hoodn__name">${esc(x.name)}<small>${esc(x.text)}</small></span><span class="hoodn__dist">${esc(x.distance)}</span></li>`).join('')}</ul>
        </div>
      </section>
      <section class="closing">
        <a class="closing__line" href="#/stay"><span class="closing__label">Stay</span><span class="closing__big">See the rooms</span>${icon('arrow', 36)}</a>
        <a class="closing__line" href="#/dine"><span class="closing__label">Dine</span><span class="closing__big">Read the carte</span>${icon('arrow', 36)}</a>
      </section>`,
    mount: (el) => bindChapters(el),
  };
};

/* ───────────────────────────── CONTACT: dark map + glass card ───────────────────────────── */
const contact = (r) => ({
  title: 'Contact',
  html: `
    <section class="cmap" aria-labelledby="contact-h">
      ${mapHTML('map--full')}
      <div class="cmap__card">
        <p class="eyebrow">Contact</p>
        <h1 class="cmap__title" id="contact-h">Find the house</h1>
        <address class="cmap__addr">${site.address.line1}<br>${site.address.line2}</address>
        <ul class="cmap__list">
          <li><span>Front desk · 24 h</span><a href="tel:${site.phone.replace(/\D/g, '')}">${site.phone}</a></li>
          <li><span>Write</span><a href="mailto:${site.email}">${site.email}</a></li>
          <li><span>Tonight</span><span class="cmap__status" data-status>${statusHTML()}</span></li>
        </ul>
        <a class="btn btn--secondary cmap__dir" href="${directionsUrl()}" target="_blank" rel="noopener">${icon('pin', 18)} Directions</a>
      </div>
    </section>
    <section class="cwrite" aria-labelledby="write-h">
      <div class="cwrite__inner">
        <p class="eyebrow">Write to us</p>
        <h2 class="cwrite__title" id="write-h">A real person replies within one business day.</h2>
        <div data-contact></div>
      </div>
    </section>
    <section class="nfaq" aria-labelledby="faq-h">
      <div class="nfaq__inner">
        <p class="eyebrow">Good to know</p>
        <h2 class="shead__title" id="faq-h">Before you arrive</h2>
        <div class="nfaq__list">${faqs.map((f) => `<details><summary><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</div>
      </div>
    </section>
    <section class="hours-band" aria-label="Hours">
      <ol class="programme__list programme__list--band">${hours.map((h, i) => `<li><span class="programme__n" aria-hidden="true">${ROMAN[i]}</span><span class="programme__what">${h.label}<small>${h.days}</small></span><span class="programme__time">${h.time}</span></li>`).join('')}</ol>
    </section>`,
  mount: (el) => {
    contactForm($('[data-contact]', el), r.query);
    mountMap($('[data-map]', el), { zoom: 15.2 });
    tickStatus(el);
  },
});

/* ───────────────────────────── FLOW PAGES ───────────────────────────── */
const flowPage = (title, head, fn, cls) => (r) => ({
  title,
  html: `<section class="flowpage ${cls}">
      <header class="flowpage__head">${head}</header>
      <div class="flowpage__body" data-flow></div>
    </section>`,
  mount: (el) => {
    const host = $('[data-flow]', el);
    enhanceFlow(host);
    fn(host, r.query);
  },
  onQuery: (r2) => fn($('[data-flow]'), r2.query),
});

const book = flowPage('Book a room', `<p class="eyebrow">Book direct · best rate, no fees</p><h1 class="flowpage__h">Reserve a room</h1>`, bookingWizard, 'flowpage--book');
const reserve = flowPage('Reserve a table', `<p class="eyebrow">The Kitchen · dinner Tuesday – Sunday</p><h1 class="flowpage__h">Book a table</h1>`, reservationFlow, 'flowpage--reserve');
const manage = flowPage(
  'Manage booking',
  `<p class="eyebrow">Your booking</p><h1 class="flowpage__h">Find your ticket</h1><p class="flowpage__lead">Look up a room booking or a table reservation to see the details or cancel.</p>`,
  manageFlow,
  'flowpage--manage'
);

/* ───────────────────────────── 404 ───────────────────────────── */
const notFound = (r, msg) => ({
  title: 'Page not found',
  html: `<section class="lost">
      <p class="eyebrow">404 · Wrong door</p>
      <h1 class="lost__title">The house lights<br><em>are up.</em></h1>
      <p class="lost__lead">${msg || 'We couldn’t find that page. It may have moved while we were renovating.'}</p>
      <div class="lost__cta"><a class="btn btn--primary" href="#/">Back to the lobby</a><a class="btn btn--secondary" href="#/stay">See the rooms</a></div>
    </section>`,
});

export const pages = { home, stay, room, dine, about, contact, book, reserve, manage, notFound };
export { roomCard };
