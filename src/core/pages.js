/* Default page compositions. A design option passes hooks (pageHead, roomCard,
 * menuItem …) and may override any page entirely for a signature layout. */
import { site, rooms, amenities, hours, story, neighborhood, faqs, events, images, menu } from '../content.js';
import { esc, money, icon, $ } from './util.js';
import { mapHTML, mountMap, directionsUrl } from './map.js';
import { bookingWizard, reservationFlow, manageFlow, contactForm, roomsBrowser, roomGallery, menuBrowser, dietBadges } from './flows.js';


export const hoursList = (cls = 'hours') => `
  <dl class="${cls}">
    ${hours.map((h) => `<div><dt>${h.label} <span>${h.days}</span></dt><dd>${h.time}</dd></div>`).join('')}
  </dl>`;

export const amenityList = (cls = 'amenities') => `
  <ul class="${cls}">${amenities.map((a) => `<li>${icon(a.icon, 22)}<span>${a.label}</span></li>`).join('')}</ul>`;

export function defaultPages(h) {
  const { pageHead, roomCard, menuItem, sectionHead = (e, t, l = '') => `<p class="eyebrow">${e}</p><h2 class="section__title">${t}</h2>${l ? `<p class="lead">${l}</p>` : ''}` } = h;

  const stay = () => ({
    title: 'Rooms',
    html: `
      ${pageHead({ eyebrow: 'Stay', title: 'Twenty rooms, five ways to stay', lead: 'Every room has original brick or timber, a very good bed and our best rate — always lowest here.', image: images.lobby })}
      <section class="section section--tight"><div class="container" data-rooms></div></section>
      <section class="section section--tint"><div class="container">
        ${sectionHead('Every stay includes', 'The small things, done properly')}
        ${amenityList()}
      </div></section>`,
    mount: (el) => roomsBrowser($('[data-rooms]', el), roomCard),
  });

  const room = (r) => {
    const rm = rooms.find((x) => x.id === r.parts[1]);
    if (!rm) return notFound(r, 'That room doesn’t exist — maybe it was renamed.');
    const others = rooms.filter((x) => x.id !== rm.id).slice(0, 3);
    return {
      title: rm.name,
      html: `
        <div class="container room-page">
          <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#/">Home</a></li><li><a href="#/stay">Rooms</a></li><li aria-current="page">${esc(rm.name)}</li></ol></nav>
          <div class="room-page__grid">
            <div class="gallery">
              <button class="gallery__main" type="button" data-gallery-main aria-label="Open photo gallery for ${esc(rm.name)}">
                <img src="${rm.images[0]}" alt="${esc(rm.name)} — photo 1 of ${rm.images.length}">
                <span class="gallery__hint">${icon('plus', 16)} View photos</span>
              </button>
              <div class="gallery__thumbs" role="group" aria-label="Choose photo">
                ${rm.images.map((src, i) => `<button type="button" class="gallery__thumb" data-thumb aria-pressed="${i === 0}" aria-label="Show photo ${i + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join('')}
              </div>
            </div>
            <div class="room-page__info">
              <p class="eyebrow">Room · Sleeps ${rm.sleeps}</p>
              <h1 class="room-page__title">${esc(rm.name)}</h1>
              <ul class="room-page__facts">
                <li>${icon('bed', 20)} ${rm.bed}</li><li>${icon('users', 20)} Up to ${rm.sleeps}</li><li>${icon('size', 20)} ${rm.size} sq ft</li>
              </ul>
              <p class="room-page__desc">${esc(rm.description)}</p>
              <h2 class="room-page__h">In the room</h2>
              <ul class="room-page__amenities">${rm.amenities.map((a) => `<li>${icon('check', 16)} ${a}</li>`).join('')}</ul>
              <div class="room-page__book">
                <p class="room-page__rate"><span>From</span> <strong>${money(rm.rate)}</strong> <span>/ night</span></p>
                <a class="btn btn--primary btn--lg" href="#/book?room=${rm.id}&step=1">Book this room ${icon('arrow', 18)}</a>
                <p class="room-page__note">${icon('check', 14)} Free cancellation up to 48 hours before arrival</p>
              </div>
            </div>
          </div>
        </div>
        <section class="section section--tint"><div class="container">
          ${sectionHead('Also consider', 'Other rooms')}
          <div class="rooms-grid">${others.map((o, i) => roomCard(o, i)).join('')}</div>
        </div></section>`,
      mount: (el) => roomGallery(el, rm),
    };
  };

  const dine = () => ({
    title: 'Dine',
    html: `
      ${pageHead({ eyebrow: 'The Kitchen', title: 'Modern Midwestern, all day', lead: 'Breakfast for guests and neighbours, a smash burger at lunch, and Lake Erie walleye by candlelight. Open to everyone — no room key required.', image: images.dining, cta: `<a class="btn btn--primary btn--lg" href="#/reserve">Reserve a table</a>` })}
      <section class="section section--tight"><div class="container dine-layout">
        <div data-menu></div>
        <aside class="dine-aside">
          <h2 class="dine-aside__title">Hours</h2>
          ${hoursList()}
          <a class="btn btn--primary" href="#/reserve">Reserve dinner</a>
          <p class="dine-aside__note">Breakfast, lunch and the rooftop bar are walk-in. Dinner reservations open ${60} days ahead.</p>
          <div class="dine-aside__legend">${menu.diets.map((d) => `<span><abbr class="diet diet--${d.id}">${d.id.toUpperCase()}</abbr> ${d.label}</span>`).join('')}</div>
        </aside>
      </div></section>
      ${eventsBlock()}`,
    mount: (el) => menuBrowser($('[data-menu]', el), menuItem, { initial: 'dinner' }),
  });

  const eventsBlock = () => `
    <section class="section events-block"><div class="container events-block__grid">
      <img class="events-block__img" src="${images.events}" alt="Long candle-lit table set in the brick-walled private dining room" loading="lazy">
      <div class="events-block__body">
        ${sectionHead('Gatherings', esc(events.title), esc(events.text))}
        <dl class="events-block__cap">${events.capacity.map((c) => `<div><dt>${c.label}</dt><dd>${c.value}</dd></div>`).join('')}</dl>
        <a class="btn btn--secondary" href="#/contact?topic=event">Plan an event</a>
      </div>
    </div></section>`;

  const about = () => ({
    title: 'About',
    html: `
      ${pageHead({ eyebrow: `Since ${site.since}`, title: esc(story.headline), lead: esc(story.intro), image: images.hero })}
      <section class="section"><div class="container about-grid">
        <div class="about-grid__text">${story.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        <img class="about-grid__img" src="${images.chef}" alt="Chef’s hands plating a dish at the kitchen pass" loading="lazy">
      </div></section>
      <section class="section section--tint"><div class="container">
        ${sectionHead('What we believe', 'House rules (the good kind)')}
        <div class="values">${story.values.map((v, i) => `<article class="value" data-reveal><span class="value__n">0${i + 1}</span><h3>${v.title}</h3><p>${v.text}</p></article>`).join('')}</div>
      </div></section>
      <section class="section"><div class="container">
        ${sectionHead('The neighbourhood', 'Columbus, on foot and nearby')}
        <div class="hood">
          <img class="hood__img" src="${images.neighborhood}" alt="Brick-paved street of red-brick houses in German Village" loading="lazy">
          <ul class="hood__list">${neighborhood.map((n) => `<li><div><h3>${n.name}</h3><p>${n.text}</p></div><span>${n.distance}</span></li>`).join('')}</ul>
        </div>
      </div></section>`,
  });

  const contact = (r) => ({
    title: 'Contact',
    html: `
      ${pageHead({ eyebrow: 'Contact', title: 'Say hello', lead: 'Questions about a stay, a big table or a wedding weekend — a real person answers within one business day.' })}
      <section class="section section--tight"><div class="container contact-grid">
        <div class="contact-info">
          ${mapHTML()}
          <ul class="contact-list">
            <li>${icon('pin', 20)}<div><strong>${site.address.line1}</strong><br>${site.address.line2}<br><a class="link" href="${directionsUrl()}" target="_blank" rel="noopener">Get directions</a></div></li>
            <li>${icon('phone', 20)}<div><a class="link" href="tel:${site.phone.replace(/\D/g, '')}">${site.phone}</a><br><span class="muted">Front desk, 24 hours</span></div></li>
            <li>${icon('mail', 20)}<div><a class="link" href="mailto:${site.email}">${site.email}</a></div></li>
          </ul>
          <h2 class="contact-info__h">Hours</h2>
          ${hoursList()}
        </div>
        <div class="contact-form"><h2 class="contact-form__h">Send a message</h2><div data-contact></div></div>
      </div></section>
      <section class="section section--tint"><div class="container faq-wrap">
        ${sectionHead('Good to know', 'Frequently asked questions')}
        <div class="faq">${faqs.map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}</div>
      </div></section>`,
    mount: (el) => {
      contactForm($('[data-contact]', el), r.query);
      mountMap($('[data-map]', el));
    },
  });

  const flowPage = (title, head, fn) => (r) => ({
    title,
    html: `${head}<section class="section section--tight flow-section"><div class="container" data-flow></div></section>`,
    mount: (el) => fn($('[data-flow]', el), r.query),
    onQuery: (r2) => fn($('[data-flow]'), r2.query),
  });

  const book = flowPage('Book a room', pageHead({ eyebrow: 'Book direct · best rate', title: 'Book your stay', compact: true }), bookingWizard);
  const reserve = flowPage('Reserve a table', pageHead({ eyebrow: 'The Kitchen', title: 'Reserve a table', compact: true }), reservationFlow);
  const manage = flowPage('Manage booking', pageHead({ eyebrow: 'Your booking', title: 'Find your booking', lead: 'Look up a room booking or table reservation to see details or cancel.', compact: true }), manageFlow);

  const notFound = (r, msg) => ({
    title: 'Page not found',
    html: `<section class="section"><div class="container not-found">
      <p class="eyebrow">404</p><h1>This door is locked.</h1>
      <p class="lead">${msg || 'We couldn’t find that page. It may have moved while we were renovating.'}</p>
      <div class="not-found__actions"><a class="btn btn--primary" href="#/">Back to home</a><a class="btn btn--secondary" href="#/stay">See rooms</a></div>
    </div></section>`,
  });

  return { stay, room, dine, about, contact, book, reserve, manage, notFound, eventsBlock };
}

export const menuItemDefault = (i) => `
  <article class="menu-item" data-menu-item="${i.id}">
    <div class="menu-item__top"><h3 class="menu-item__name">${esc(i.name)}</h3><span class="menu-item__dots" aria-hidden="true"></span><span class="menu-item__price">${money(i.price)}</span></div>
    <p class="menu-item__desc">${esc(i.desc)}</p>
    ${i.diet.length ? `<div class="menu-item__diet">${dietBadges(i)}</div>` : ''}
  </article>`;
