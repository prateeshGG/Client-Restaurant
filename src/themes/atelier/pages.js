/* ATELIER — inner pages. Everything reads from content.js, so owner edits in /admin flow straight through. */
import { site, rooms, amenities, hours, story, neighborhood, faqs, images, menu, testimonials } from '../../content.js';
import { esc, money, icon, fmtTime, $, $$ } from '../../core/util.js';
import { mapHTML, mountMap, directionsUrl } from '../../core/map.js';
import { bookingWizard, reservationFlow, manageFlow, contactForm, roomsBrowser, menuBrowser } from '../../core/flows.js';
import { lightbox } from '../../core/ui.js';
import { pageHead, sectionHead, gather } from './parts.js';
import { dish, mountCarte } from './carte.js';
import { two, WORDS } from './kit.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/* ─────────── Rooms: catalogue ─────────── */
export const catRow = (r, i) => `
  <article class="cat-row${i % 2 ? ' cat-row--flip' : ''}">
    <a class="cat-row__media" href="#/stay/${r.id}" tabindex="-1" aria-hidden="true"><img src="${r.images[0]}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}"></a>
    <div class="cat-row__text">
      <p class="cat-row__no"><span>No. ${two(i + 1)}</span><span>${esc(r.bed)}</span></p>
      <h2 class="cat-row__name"><a href="#/stay/${r.id}">${esc(r.name)}</a></h2>
      <p class="cat-row__short">${esc(r.short)}</p>
      <dl class="cat-row__spec">
        <div><dt>Sleeps</dt><dd>${r.sleeps}</dd></div>
        <div><dt>Size</dt><dd>${r.size} sq ft</dd></div>
        <div><dt>From</dt><dd>${money(r.rate)}<small> / night</small></dd></div>
      </dl>
      <div class="cat-row__links">
        <a class="link-arrow" href="#/stay/${r.id}" aria-label="Read about ${esc(r.name)}">Read more ${icon('arrow', 16)}</a>
        <a class="link-arrow" href="#/book?room=${r.id}&step=1" aria-label="Book ${esc(r.name)}">Book ${icon('arrow', 16)}</a>
      </div>
    </div>
  </article>`;

const stay = () => ({
  title: 'Rooms',
  html: `
    ${pageHead({ eyebrow: '01 — Stay', title: 'Twenty rooms, <em>five ways</em> to stay', lead: 'Every room has original brick or timber, a very good bed and our best rate — always lowest here.' })}
    <section class="section section--tight catalogue-sec"><div class="container" data-rooms></div></section>
    <section class="section includes"><div class="container">
      ${sectionHead('Every stay includes', 'The small things, <em>done properly</em>')}
      <ol class="includes__list">${amenities.map((a, i) => `<li><span class="includes__n">${two(i + 1)}</span>${icon(a.icon, 22)}<span class="includes__t">${esc(a.label)}</span></li>`).join('')}</ol>
    </div></section>`,
  mount: (el) => roomsBrowser($('[data-rooms]', el), catRow),
});

/* ─────────── Room: magazine spread ─────────── */
const room = (r) => {
  const rm = rooms.find((x) => x.id === r.parts[1]);
  if (!rm) return notFound(r, 'That room doesn’t exist — perhaps it was renamed.');
  const sentences = rm.description.match(/[^.!?]+[.!?]+/g) || [rm.description];
  const pull = sentences.length > 1 ? sentences[sentences.length - 1].trim() : '';
  const body = pull ? sentences.slice(0, -1).join('').trim() : rm.description;
  const bfast = hours.find((h) => /breakfast/i.test(h.label));
  const bar = hours.find((h) => /bar/i.test(h.label));
  const practical = `Up to ${WORDS[rm.sleeps] || rm.sleeps} guests, ${rm.size} square feet. Check in from ${site.checkIn}; check out by ${site.checkOut}.${bfast ? ` Breakfast is served downstairs in the Kitchen ${bfast.days.toLowerCase()}, ${bfast.time}` : ''}${bar ? `, and the rooftop bar opens at ${bar.time.split(' – ')[0]}.` : '.'}`;
  const others = rooms.filter((x) => x.id !== rm.id);
  const N = rm.images.length;
  return {
    title: rm.name,
    html: `
    <article class="mag">
      <header class="container mag__head">
        <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="#/stay">Rooms</a></li><li aria-current="page">${esc(rm.name)}</li></ol></nav>
        <div class="mag__titlebar">
          <p class="label">${esc(rm.bed)}<br>Sleeps ${rm.sleeps} — ${rm.size} sq ft</p>
          <h1 class="mag__title">${esc(rm.name)}</h1>
        </div>
      </header>
      <figure class="mag__lead">
        <button class="mag__leadbtn" type="button" data-plate="0" aria-label="Enlarge photo 1 of ${N} of ${esc(rm.name)}"><img src="${rm.images[0]}" alt="${esc(rm.name)} — photo 1 of ${N}"></button>
        <figcaption class="container">Plate I — ${esc(rm.name)}</figcaption>
      </figure>
      <div class="container mag__grid">
        <p class="mag__stand">${esc(rm.short)}</p>
        <p class="label mag__side">Notes on the room</p>
        <div class="mag__body">
          <p>${esc(body)}</p>
          ${pull ? `<blockquote class="mag__pull"><p>${esc(pull)}</p></blockquote>` : ''}
          <p>${esc(practical)}</p>
          <h2 class="mag__h">In the room</h2>
          <ul class="mag__amen">${rm.amenities.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        </div>
        <aside class="mag__aside" aria-label="Rates and booking">
          <dl class="spec">
            <div><dt>Bed</dt><dd>${esc(rm.bed)}</dd></div>
            <div><dt>Sleeps</dt><dd>${rm.sleeps}</dd></div>
            <div><dt>Size</dt><dd>${rm.size} sq ft</dd></div>
            <div><dt>Check-in</dt><dd>from ${site.checkIn}</dd></div>
            <div><dt>Check-out</dt><dd>by ${site.checkOut}</dd></div>
            <div class="spec__rate"><dt>From</dt><dd>${money(rm.rate)}<small> / night</small></dd></div>
          </dl>
          <a class="btn btn--primary btn--lg" href="#/book?room=${rm.id}&step=1">Book this room ${icon('arrow', 18)}</a>
          <p class="mag__note">Free cancellation until 48 hours before arrival · no booking fee</p>
        </aside>
      </div>
      ${N > 1 ? `<div class="container mag__plates">${rm.images
        .slice(1)
        .map((src, i) => `<figure class="mag__plate at-reveal" data-reveal><button type="button" data-plate="${i + 1}" aria-label="Enlarge photo ${i + 2} of ${N}"><img src="${src}" alt="${esc(rm.name)} — photo ${i + 2} of ${N}" loading="lazy"></button><figcaption>Plate ${ROMAN[i + 1] || i + 2}</figcaption></figure>`)
        .join('')}</div>` : ''}
    </article>
    <section class="section more"><div class="container">
      ${sectionHead('Continue reading', 'Other <em>rooms</em>')}
      <ol class="index-list">${others.map((o, i) => `
        <li><a class="index-list__row" href="#/stay/${o.id}">
          <span class="index-list__n">${two(i + 1)}</span>
          <img class="index-list__thumb" src="${o.images[0]}" alt="" loading="lazy">
          <span class="index-list__name">${esc(o.name)}</span>
          <span class="index-list__meta">${esc(o.bed)} · ${o.size} sq ft</span>
          <span class="index-list__rate">from ${money(o.rate)}</span>
          ${icon('arrow', 18, 'index-list__arrow')}
        </a></li>`).join('')}</ol>
    </div></section>`,
    mount: (el) => $$('[data-plate]', el).forEach((b) => b.addEventListener('click', () => lightbox(rm.images, +b.dataset.plate, rm.name, b))),
  };
};

/* ─────────── Dine: the carte ─────────── */
const hoursBand = () => `
  <section class="section hours-band"><div class="container hours-band__grid">
    <div><p class="label">Hours</p><h2 class="shead__title">When the <em>Kitchen</em> is open</h2></div>
    <div>
      <dl class="hours-t">${hours.map((h) => `<div><dt>${esc(h.label)}</dt><dd class="hours-t__d">${esc(h.days)}</dd><dd class="hours-t__t">${esc(h.time)}</dd></div>`).join('')}</dl>
      <p class="hours-band__note">Breakfast, lunch and the rooftop bar are walk-in. Dinner reservations open 60 days ahead. <a class="link" href="#/reserve">Reserve dinner</a></p>
      <p class="hours-band__legend">${menu.diets.map((d) => `<span><abbr title="${d.label}">${d.id.toUpperCase()}</abbr> ${d.label}</span>`).join('')}</p>
    </div>
  </div></section>`;

const dine = () => ({
  title: 'Dine',
  html: `
    ${pageHead({ eyebrow: '02 — The Kitchen', title: 'Modern Midwestern, <em>all day</em>', lead: 'Breakfast for guests and neighbours, a smash burger at lunch, and Lake Erie walleye by candlelight. Open to everyone — no room key required.', image: images.dining, alt: 'The Kitchen dining room: brick walls, oak tables and pendant lights', cta: `<a class="btn btn--primary btn--lg" href="#/reserve">Reserve a table</a>` })}
    <section class="section carte-sec"><div class="container">
      <div class="carte-sec__head">
        <p class="label">The carte</p>
        <p class="carte-sec__hint"><span class="hint-hover">Hover a dish to see the plate — or select it to keep the photo open.</span><span class="hint-touch">Tap a dish to see the plate.</span></p>
      </div>
      <div data-menu></div>
    </div></section>
    ${hoursBand()}
    ${gather('Gatherings')}`,
  mount: (el) => {
    const host = $('[data-menu]', el);
    let carte;
    menuBrowser(host, dish, { initial: 'dinner', onRender: () => carte && carte.hide() });
    carte = mountCarte($('[data-menu-list]', host), host);
  },
});

/* ─────────── About: long-form article ─────────── */
const about = () => {
  const words = [story.intro, ...story.paragraphs, ...story.values.map((v) => v.text), ...neighborhood.map((n) => n.text)].join(' ').split(/\s+/).length;
  const pull = (t) => (t ? `<blockquote class="essay__pull"><p>“${esc(t.quote)}”</p><footer>${esc(t.name)} — ${esc(t.where)}</footer></blockquote>` : '');
  return {
    title: 'About',
    html: `
    <article class="essay">
      <header class="container essay__head">
        <p class="label">The house — since ${esc(site.since)}</p>
        <h1 class="essay__title">${esc(story.headline)}</h1>
        <p class="essay__stand">${esc(story.intro)}</p>
        <p class="essay__by"><span>Words by the ${esc(site.name)} team</span><span>${Math.max(2, Math.round(words / 180))} minute read</span></p>
      </header>
      <figure class="essay__hero"><img src="${images.hero}" alt="The restored red-brick ${esc(site.name)} building at dusk, its arched windows lit"><figcaption class="container">The corner building, ${esc(site.city)}. Every arched window restored; every brick we could, kept.</figcaption></figure>
      <div class="essay__body">
        ${story.paragraphs.map((p, i) => `<p${i === 0 ? ' class="essay__drop"' : ''}>${esc(p)}</p>`).join('')}
        ${pull(testimonials[1])}
        <h2 class="essay__h">House rules <em>(the good kind)</em></h2>
        ${story.values.map((v, i) => `<section class="essay__rule"><h3><span>${two(i + 1)}</span>${esc(v.title)}</h3><p>${esc(v.text)}</p></section>`).join('')}
        <figure class="essay__fig essay__fig--wide at-reveal" data-reveal><img src="${images.chef}" alt="Chef’s hands plating a dish at the kitchen pass" loading="lazy"><figcaption>At the pass — the Kitchen cooks from farms within a couple of hours of the city.</figcaption></figure>
        ${pull(testimonials[0])}
        <h2 class="essay__h">On foot, <em>and a short drive</em></h2>
        <dl class="walks">${neighborhood.map((n) => `<div><dt>${esc(n.name)}</dt><dd class="walks__t">${esc(n.text)}</dd><dd class="walks__d">${esc(n.distance)}</dd></div>`).join('')}</dl>
        <figure class="essay__fig at-reveal" data-reveal><img src="${images.neighborhood}" alt="Brick-paved street of red-brick houses in German Village" loading="lazy"><figcaption>German Village, five minutes’ walk.</figcaption></figure>
        <p class="essay__end">Twenty rooms, one kitchen, one rooftop — and a front desk that learns your name. Come and see it.<span class="essay__mark" aria-hidden="true"></span></p>
        <div class="essay__cta"><a class="btn btn--primary" href="#/book">Book a room</a><a class="btn btn--secondary" href="#/reserve">Reserve a table</a></div>
      </div>
    </article>`,
  };
};

/* ─────────── Contact: typographic ─────────── */
const contact = (r) => {
  const parking = amenities.find((a) => a.icon === 'car');
  return {
    title: 'Contact',
    html: `
    <section class="ct"><div class="container">
      <div class="ct__intro"><p class="label">04 — Contact</p></div>
      <h1 class="ct__addr"><span class="sr-only">Contact us at </span>${esc(site.address.line1)},<br><em>${esc(site.address.line2)}</em></h1>
      <p class="ct__lede">Questions about a stay, a long table or a wedding weekend — a real person answers within one business day.</p>
      <ul class="ct__lines">
        <li><span class="label">Telephone</span><a href="tel:${site.phone.replace(/\D/g, '')}">${esc(site.phone)}</a><small>Front desk, 24 hours</small></li>
        <li><span class="label">Email</span><a href="mailto:${site.email}">${esc(site.email)}</a><small>Replies within one business day</small></li>
        <li><span class="label">Directions</span><a href="${directionsUrl()}" target="_blank" rel="noopener">Open in Maps ${icon('arrow', 18)}<span class="sr-only"> (opens in a new tab)</span></a><small>${parking ? esc(parking.label) : 'Street parking nearby'}</small></li>
      </ul>
      <div class="ct__map">${mapHTML('map--atelier')}</div>
    </div></section>
    <section class="section ct-write"><div class="container ct-write__grid">
      <div class="ct-write__form"><p class="label">Write to us</p><h2 class="shead__title">A letter to <em>the house</em></h2><div data-contact></div></div>
      <aside class="ct-write__aside">
        <h2 class="label">Hours</h2>
        <dl class="hours-t hours-t--compact">${hours.map((h) => `<div><dt>${esc(h.label)}</dt><dd class="hours-t__d">${esc(h.days)}</dd><dd class="hours-t__t">${esc(h.time)}</dd></div>`).join('')}</dl>
        <h2 class="label">Events &amp; press</h2>
        <p>Choose “An event or group” in the form for private dining, buy-outs and wedding weekends. Press enquiries reach the general manager directly.</p>
      </aside>
    </div></section>
    <section class="section faqs"><div class="container">
      ${sectionHead('Good to know', 'Questions, <em>answered</em>')}
      <ol class="faqn">${faqs.map((f, i) => `<li><details><summary><span class="faqn__n">${two(i + 1)}</span><span class="faqn__q">${esc(f.q)}</span><span class="faqn__m" aria-hidden="true"></span></summary><div class="faqn__a"><p>${esc(f.a)}</p></div></details></li>`).join('')}</ol>
    </div></section>`,
    mount: (el) => {
      contactForm($('[data-contact]', el), r.query);
      mountMap($('[data-map]', el));
      if (r.query.topic) setTimeout(() => {
        const t = $('.ct-write', el);
        const head = $('.site-header');
        t && scrollTo({ top: t.getBoundingClientRect().top + scrollY - (head ? head.offsetHeight : 0), behavior: 'smooth' });
      }, 150);
    },
  };
};

/* ─────────── Flow pages (booking, reservation, manage) ─────────── */
const flowPage = (title, head, fn) => (r) => ({
  title,
  html: `${head}<section class="section section--tight flow-section"><div class="container" data-flow></div></section>`,
  mount: (el) => fn($('[data-flow]', el), r.query),
  onQuery: (r2) => fn($('[data-flow]'), r2.query),
});
const book = flowPage('Book a room', pageHead({ eyebrow: 'Reservations — Rooms', title: 'Book your <em>stay</em>', compact: true }), bookingWizard);
/* Sentence builder: keep the "at [time]" word in step with the checked time radio (the flow re-renders the slots). */
const composeSync = (host) => {
  const upd = () => {
    const w = $('[data-at-time]', host);
    if (!w) return;
    const c = $('input[name=time]:checked', host);
    const t = c ? fmtTime(c.value) : 'a time';
    if (w.textContent !== t) w.textContent = t;
    w.setAttribute('aria-label', `Time: ${c ? t : 'not chosen'} — go to the dinner seatings`);
    w.classList.toggle('is-empty', !c);
  };
  new MutationObserver(upd).observe(host, { childList: true, subtree: true });
  host.addEventListener('change', () => setTimeout(upd));
  host.addEventListener('click', (e) => {
    if (!e.target.closest('[data-at-time]')) return;
    const r = $('input[name=time]:checked', host) || $('input[name=time]:not(:disabled)', host);
    const g = $('.compose__times', host);
    if (g) {
      g.classList.remove('is-cued');
      void g.offsetWidth;
      g.classList.add('is-cued');
      g.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    r && r.focus({ preventScroll: true });
  });
  upd();
};
const reserveFlow = (host, q) => {
  reservationFlow(host, q);
  if (!host.__atCompose) (host.__atCompose = true), composeSync(host);
};
const reserve = flowPage('Reserve a table', pageHead({ eyebrow: 'Reservations — The Kitchen', title: 'Reserve a <em>table</em>', compact: true }), reserveFlow);
const manage = flowPage('Manage booking', pageHead({ eyebrow: 'Your booking', title: 'Find your <em>booking</em>', lead: 'Look up a room booking or a table reservation to see the details or cancel.', compact: true }), manageFlow);

/* ─────────── 404 ─────────── */
const notFound = (r, msg) => ({
  title: 'Page not found',
  html: `<section class="section lost"><div class="container lost__grid">
    <p class="lost__n" aria-hidden="true">404</p>
    <div>
      <p class="label">Page not found</p>
      <h1 class="lost__title">This door is <em>locked</em>.</h1>
      <p class="lead">${msg || 'We couldn’t find that page. It may have moved while we were renovating.'}</p>
      <ol class="lost__links">${[['/', 'Home'], ['/stay', 'Rooms'], ['/dine', 'The Kitchen'], ['/contact', 'Contact']].map(([p, l], i) => `<li><a href="#${p}"><span>${two(i + 1)}</span>${l}${icon('arrow', 18)}</a></li>`).join('')}</ol>
    </div>
  </div></section>`,
});

export const pages = { stay, room, dine, about, contact, book, reserve, manage, notFound };
