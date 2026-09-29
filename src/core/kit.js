/* ─────────────────────────────────────────────────────────────────────────
 * UI KIT — overridable markup for every shared flow.
 * Flows (booking, reservation, manage, contact, rooms, menu) keep ALL logic
 * and only bind to the data-* hooks / field names documented next to each
 * template. A design option passes `ui` overrides from its views.js; anything
 * it doesn't override falls back to these defaults.
 * Full contract: clone-workspace/scioto-house/04-architecture/UI-CONTRACT.md
 * ───────────────────────────────────────────────────────────────────────── */
import { site, menu, reservations as resCfg } from '../content.js';
import { esc, money, fmtDate, fmtTime, icon } from './util.js';

const defaults = {
  /* Progress indicator. Completed steps link to `${base}?step=n`. */
  stepper: (steps, current, base) => `
  <nav class="stepper" aria-label="Progress">
    <ol class="stepper__list">
      ${steps
        .map((s, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'current' : 'todo';
          const inner = `<span class="stepper__num">${state === 'done' ? icon('check', 14) : n}</span><span class="stepper__label">${s}</span>`;
          return `<li class="stepper__item is-${state}">${
            state === 'done'
              ? `<a class="stepper__btn" href="${base}?step=${n}" aria-label="Step ${n}: ${s} (completed, edit)">${inner}</a>`
              : `<span class="stepper__btn" ${state === 'current' ? 'aria-current="step"' : ''}>${inner}</span>`
          }</li>`;
        })
        .join('')}
    </ol>
  </nav>`,

  /* Wraps every step. kind: 'book' | 'reserve'. `aside` is the summary (may be ''). */
  wizardShell: ({ stepperHTML, main, aside }) => `
    ${stepperHTML}
    <div class="wizard ${aside ? 'wizard--split' : ''}">
      <div class="wizard__main">${main}</div>
      ${aside}
    </div>`,

  /* Running summary of the stay. q = quote or null. */
  summary: (d, q, room) => `
  <aside class="summary" aria-label="Your stay">
    <details class="summary__details" open>
      <summary class="summary__head"><span>Your stay</span>${q ? `<strong>${money(q.total, true)}</strong>` : ''}</summary>
      <div class="summary__body">
        ${room ? `<img class="summary__img" src="${room.images[0]}" alt="" loading="lazy">` : ''}
        <dl class="summary__list">
          <div><dt>Check-in</dt><dd>${d.checkIn ? fmtDate(d.checkIn) : '—'}</dd></div>
          <div><dt>Check-out</dt><dd>${d.checkOut ? fmtDate(d.checkOut) : '—'}</dd></div>
          <div><dt>Guests</dt><dd>${d.guests || '—'}</dd></div>
          <div><dt>Room</dt><dd>${room ? esc(room.name) : 'Not chosen yet'}</dd></div>
        </dl>
        ${q ? UI.priceLines(d, q) : ''}
        <p class="summary__note">${icon('check', 14)} Free cancellation up to 48 hours before arrival</p>
      </div>
    </details>
  </aside>`,

  priceLines: (d, q) => `
    <dl class="summary__lines">
      <div><dt>${money(q.room.rate)} × ${q.nights} night${q.nights > 1 ? 's' : ''}</dt><dd>${money(q.subtotal, true)}</dd></div>
      ${q.discount ? `<div class="is-discount"><dt>Code ${esc(d.promo)} (−${Math.round(q.pct * 100)}%)</dt><dd>−${money(q.discount, true)}</dd></div>` : ''}
      <div><dt>Lodging tax (${(site.lodgingTaxRate * 100).toFixed(1)}%)</dt><dd>${money(q.tax, true)}</dd></div>
      <div class="summary__total"><dt>Total</dt><dd>${money(q.total, true)}</dd></div>
    </dl>`,

  /* STEP 1. Must render <form data-form="dates"> containing controls named
   * checkIn, checkOut (date), guests (select/radio 1–4), promo (text) and a submit button.
   * `f` = prebuilt default field HTML { checkIn, checkOut, guests, promo } you may reuse. */
  datesStep: ({ f }) => `
      <form class="form" novalidate data-form="dates">
        <h2 class="wizard__title" tabindex="-1">When are you staying?</h2>
        <div class="form__grid">${f.checkIn}${f.checkOut}${f.guests}${f.promo}</div>
        <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">See available rooms ${icon('arrow', 18)}</button></div>
      </form>`,

  /* STEP 2 frame. Must contain an element with [data-room-options] (filled after loading). */
  roomsStep: ({ d, nights }) => `
      <h2 class="wizard__title" tabindex="-1">Choose your room</h2>
      <p class="wizard__lead">${fmtDate(d.checkIn)} → ${fmtDate(d.checkOut)} · ${nights} night${nights > 1 ? 's' : ''} · ${d.guests} guest${d.guests > 1 ? 's' : ''} <a class="link" href="#/book?step=1">Change</a></p>
      <div class="room-options" data-room-options aria-busy="true">${UI.roomsLoading()}</div>`,
  roomsLoading: () => '<div class="skeleton skeleton--row"></div>'.repeat(3),

  /* One room choice. When available it MUST include a button [data-pick="<room.id>"]. */
  roomOption: (r, { avail, total, nights, picked }) => `
          <article class="room-option ${avail ? '' : 'is-soldout'} ${picked ? 'is-picked' : ''}">
            <img class="room-option__img" src="${r.images[0]}" alt="${esc(r.name)}" loading="lazy">
            <div class="room-option__body">
              <h3 class="room-option__name">${esc(r.name)} ${picked ? '<span class="badge">Your pick</span>' : ''}</h3>
              <p class="room-option__meta">${icon('bed', 16)} ${r.bed} · ${icon('users', 16)} Sleeps ${r.sleeps} · ${icon('size', 16)} ${r.size} sq ft</p>
              <p class="room-option__desc">${esc(r.short)}</p>
            </div>
            <div class="room-option__price">
              <p><strong>${money(r.rate)}</strong> <span>/ night</span></p>
              <p class="room-option__total">${money(total)} for ${nights} night${nights > 1 ? 's' : ''} + tax</p>
              ${
                avail
                  ? `<button class="btn btn--primary" type="button" data-pick="${r.id}" aria-label="Select ${esc(r.name)}">Select</button>`
                  : `<p class="room-option__sold">${icon('info', 16)} Sold out for these dates</p><a class="link" href="#/book?step=1">Try other dates</a>`
              }
            </div>
          </article>`,
  roomsHiddenNotice: (hidden, guests) =>
    `<p class="notice">${icon('info', 16)} ${hidden} room type${hidden > 1 ? 's are' : ' is'} hidden because ${hidden > 1 ? 'they sleep' : 'it sleeps'} fewer than ${guests} guests.</p>`,
  roomsFull: () =>
    `<div class="empty">${icon('calendar', 28)}<h3>We’re full on those dates</h3><p>Try moving your stay by a day or two — availability changes quickly.</p><a class="btn btn--secondary" href="#/book?step=1">Change dates</a></div>`,

  /* STEP 3. <form data-form="details"> with controls first, last, email, phone, arrival, requests, policy (checkbox). */
  detailsStep: ({ f }) => `
      <form class="form" novalidate data-form="details">
        <h2 class="wizard__title" tabindex="-1">Who’s checking in?</h2>
        <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.arrival}${f.requests}${f.policy}</div>
        <div class="form__actions">
          <a class="btn btn--ghost" href="#/book?step=2">${icon('arrowLeft', 18)} Back</a>
          <button class="btn btn--primary btn--lg" type="submit">Review booking ${icon('arrow', 18)}</button>
        </div>
      </form>`,

  /* STEP 4. MUST include a button [data-confirm]. */
  reviewStep: ({ d, q, g }) => `
    <h2 class="wizard__title" tabindex="-1">Review & confirm</h2>
    <div class="review">
      <section class="review__block">
        <div class="review__head"><h3>Stay</h3><a class="link" href="#/book?step=1">Edit</a></div>
        <p>${fmtDate(d.checkIn)} → ${fmtDate(d.checkOut)}<br>${q.nights} night${q.nights > 1 ? 's' : ''} · ${d.guests} guest${d.guests > 1 ? 's' : ''}</p>
      </section>
      <section class="review__block">
        <div class="review__head"><h3>Room</h3><a class="link" href="#/book?step=2">Edit</a></div>
        <p>${esc(q.room.name)} · ${q.room.bed}<br>${money(q.room.rate)} per night</p>
      </section>
      <section class="review__block">
        <div class="review__head"><h3>Guest</h3><a class="link" href="#/book?step=3">Edit</a></div>
        <p>${esc(g.first)} ${esc(g.last)}<br>${esc(g.email)} · ${esc(g.phone)}<br>Arriving ${g.arrival === 'late' ? 'after 10 pm' : fmtTime(g.arrival)}${g.requests ? `<br><em>“${esc(g.requests)}”</em>` : ''}</p>
      </section>
      <p class="review__small">No payment is taken online. Your card is requested at check-in. By confirming you accept our booking policy.</p>
      <div class="form__actions">
        <a class="btn btn--ghost" href="#/book?step=3">${icon('arrowLeft', 18)} Back</a>
        <button class="btn btn--primary btn--lg" type="button" data-confirm>Confirm booking · ${money(q.total, true)}</button>
      </div>
    </div>`,

  /* Confirmation. Heading must carry class "confirm__title" + tabindex=-1 (focus target) and show rec.code. */
  bookingDone: (rec, icsHref) => `
    <section class="confirm">
      <div class="confirm__badge" aria-hidden="true">${icon('check', 34)}</div>
      <p class="eyebrow">Booking confirmed</p>
      <h2 class="confirm__title" tabindex="-1">See you soon, ${esc(rec.guest.first)}.</h2>
      <p class="confirm__lead">A confirmation is on its way to <strong>${esc(rec.guest.email)}</strong>.</p>
      <div class="confirm__code"><span>Confirmation code</span><strong data-code>${rec.code}</strong></div>
      <dl class="confirm__list">
        <div><dt>Room</dt><dd>${esc(rec.roomName)}</dd></div>
        <div><dt>Dates</dt><dd>${fmtDate(rec.checkIn)} → ${fmtDate(rec.checkOut)}</dd></div>
        <div><dt>Guests</dt><dd>${rec.guests}</dd></div>
        <div><dt>Total (pay at hotel)</dt><dd>${money(rec.total, true)}</dd></div>
      </dl>
      <div class="confirm__actions">
        <a class="btn btn--secondary" href="${icsHref}" download="${rec.code}.ics">${icon('calendar', 18)} Add to calendar</a>
        <a class="btn btn--primary" href="#/reserve">Reserve a table for your stay ${icon('arrow', 18)}</a>
      </div>
      <p class="confirm__small">Need to change something? <a class="link" href="#/manage?code=${rec.code}">Manage this booking</a></p>
    </section>`,
  notFound: (title, text, cta) =>
    `<div class="empty">${icon('info', 28)}<h2 class="confirm__title" tabindex="-1">${title}</h2><p>${text}</p>${cta}</div>`,

  /* ── TABLE RESERVATION ───────────────────────────────────────────────
   * <form data-form="table"> containing:
   *   party:  EITHER buttons [data-q="-1"] / [data-q="1"] + an element [data-party-out]
   *           OR a control named "party" (select / radio group 1–10)
   *   date:   a control named "date" (input[type=date] / select / radio group of YYYY-MM-DD)
   *   [data-slots] container (filled via tableSlot) and [data-slot-error] element
   *   a submit button.
   * `ctx` = { party, date, t, max, days: [{ iso, label, closed }] next 21 days }
   */
  tableStep: (ctx) => `
      <form class="form form--narrow" novalidate data-form="table">
        <h2 class="wizard__title" tabindex="-1">Book a table for dinner</h2>
        <div class="form__grid">
          <div class="field">
            <span class="field__label" id="party-l">Party size</span>
            <div class="qty" role="group" aria-labelledby="party-l">
              <button class="qty__btn" type="button" data-q="-1" aria-label="Fewer guests">${icon('minus', 18)}</button>
              <output class="qty__val" data-party-out aria-live="polite"></output>
              <button class="qty__btn" type="button" data-q="1" aria-label="More guests">${icon('plus', 18)}</button>
            </div>
            <p class="field__hint">Parties over ${resCfg.maxParty}? <a class="link" href="#/contact?topic=event">Send an event enquiry</a>.</p>
          </div>
          ${ctx.f.date}
        </div>
        <fieldset class="slots-wrap">
          <legend class="field__label">Time</legend>
          <div class="slots" data-slots></div>
          <p class="field__error" id="slot-err" data-slot-error role="alert"></p>
        </fieldset>
        <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Continue ${icon('arrow', 18)}</button></div>
      </form>`,
  partyLabel: (n) => `${n} ${n === 1 ? 'guest' : 'guests'}`,
  /* One time slot — MUST contain input[type=radio][name=time][value=<HH:MM>]. */
  tableSlot: (s, { disabled, full, checked }) => `<label class="slot ${disabled ? 'is-disabled' : ''}">
            <input type="radio" name="time" value="${s}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
            <span>${fmtTime(s)}${full ? '<small>Full</small>' : ''}</span></label>`,
  /* Optional grouping of slots (e.g. early / prime / late). Return null to render flat. */
  tableSlotGroups: () => null,
  tableClosed: () =>
    `<p class="notice">${icon('info', 16)} The Kitchen is closed for dinner on Mondays. Breakfast is served 7–10:30 am without a booking.</p>`,
  tableNoSlots: () => `<p class="notice">${icon('info', 16)} No tables left for this date. Try another day, or walk in — the bar is first-come.</p>`,
  /* <form data-form="rdetails"> with first, last, email, phone, occasion, notes. */
  tableDetailsStep: ({ d, f }) => `
    <form class="form form--narrow" novalidate data-form="rdetails">
      <h2 class="wizard__title" tabindex="-1">Almost there</h2>
      <p class="wizard__lead">${icon('users', 16)} ${d.party} · ${icon('calendar', 16)} ${fmtDate(d.date, { weekday: 'long', month: 'long', day: 'numeric' })} · ${icon('clock', 16)} ${fmtTime(d.time)} <a class="link" href="#/reserve?step=1">Change</a></p>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.occasion}${f.notes}</div>
      <div class="form__actions">
        <a class="btn btn--ghost" href="#/reserve?step=1">${icon('arrowLeft', 18)} Back</a>
        <button class="btn btn--primary btn--lg" type="submit">Reserve table</button>
      </div>
    </form>`,
  tableDone: (rec) => `
    <section class="confirm">
      <div class="confirm__badge" aria-hidden="true">${icon('check', 34)}</div>
      <p class="eyebrow">Table reserved</p>
      <h2 class="confirm__title" tabindex="-1">Your table is set, ${esc(rec.guest.first)}.</h2>
      <p class="confirm__lead">${rec.party} ${rec.party === 1 ? 'guest' : 'guests'} · ${fmtDate(rec.date, { weekday: 'long', month: 'long', day: 'numeric' })} at ${fmtTime(rec.time)}</p>
      <div class="confirm__code"><span>Reservation code</span><strong data-code>${rec.code}</strong></div>
      <p class="confirm__small">We hold tables for 15 minutes. Running late? Call ${site.phone}.</p>
      <div class="confirm__actions">
        <a class="btn btn--secondary" href="#/dine">See the menu</a>
        <a class="btn btn--primary" href="#/stay">Make it a night — see rooms ${icon('arrow', 18)}</a>
      </div>
      <p class="confirm__small"><a class="link" href="#/manage?code=${rec.code}">Change or cancel</a></p>
    </section>`,

  /* ── MANAGE ──────────────────────────────────────────────────────────
   * <form data-form="lookup"> with controls code, last + submit; and a [data-manage-result] live region. */
  manageForm: ({ f }) => `
    <form class="form form--narrow" novalidate data-form="lookup">
      <div class="form__grid">${f.code}${f.last}</div>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Find my booking</button></div>
    </form>
    <div class="manage-result" data-manage-result aria-live="polite"></div>`,
  /* Active bookings MUST include a button [data-cancel]. Show the status text ("Confirmed"/"Cancelled") in [data-booking-status]. */
  bookingCard: (rec) => {
    const isStay = rec.type === 'stay';
    return `
      <article class="booking-card ${rec.status === 'cancelled' ? 'is-cancelled' : ''}">
        <header class="booking-card__head">
          <div><p class="eyebrow">${isStay ? 'Room booking' : 'Table reservation'}</p><h3>${rec.code}</h3></div>
          <span class="status status--${rec.status}" data-booking-status>${rec.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}</span>
        </header>
        <dl class="confirm__list">
          <div><dt>Name</dt><dd>${esc(rec.guest.first)} ${esc(rec.guest.last)}</dd></div>
          ${
            isStay
              ? `<div><dt>Room</dt><dd>${esc(rec.roomName)}</dd></div><div><dt>Dates</dt><dd>${fmtDate(rec.checkIn)} → ${fmtDate(rec.checkOut)}</dd></div><div><dt>Total</dt><dd>${money(rec.total, true)}</dd></div>`
              : `<div><dt>When</dt><dd>${fmtDate(rec.date)} · ${fmtTime(rec.time)}</dd></div><div><dt>Party</dt><dd>${rec.party}</dd></div>`
          }
        </dl>
        ${rec.status === 'cancelled' ? `<p class="notice">${icon('info', 16)} This ${isStay ? 'booking' : 'reservation'} was cancelled. <a class="link" href="#/${isStay ? 'book' : 'reserve'}">Make a new one</a></p>` : `<div class="form__actions"><button class="btn btn--danger" type="button" data-cancel>Cancel ${isStay ? 'booking' : 'reservation'}</button></div>`}
      </article>`;
  },
  manageNotFound: () =>
    `<div class="empty empty--inline">${icon('search', 26)}<h3>No booking matches those details</h3><p>Check the code in your confirmation email and the last name used to book. Still stuck? Call ${site.phone}.</p></div>`,

  /* ── CONTACT ─────────────────────────────────────────────────────────
   * <form data-form="contact"> with radio group "topic" (general|event|press), a container
   * [data-event-fields] (hidden unless topic=event) holding eventDate + eventGuests, name, email, message. */
  contactForm: ({ topic, f }) => `
    <form class="form" novalidate data-form="contact">
      <fieldset class="segmented">
        <legend class="field__label">What’s it about?</legend>
        ${[['general', 'General'], ['event', 'Event or group'], ['press', 'Press']].map(([v, l]) => `<label class="segmented__opt"><input type="radio" name="topic" value="${v}" ${v === topic ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </fieldset>
      <div class="form__grid">
        ${f.name}${f.email}
        <div class="form__event field--full" data-event-fields ${topic === 'event' ? '' : 'hidden'}>
          <div class="form__grid">${f.eventDate}${f.eventGuests}</div>
        </div>
        ${f.message}
      </div>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Send message</button></div>
    </form>`,
  /* MUST include a button [data-again] and a heading .confirm__title[tabindex=-1]. */
  contactDone: ({ first, isEvent }) => `<div class="confirm confirm--compact">
      <div class="confirm__badge" aria-hidden="true">${icon('check', 30)}</div>
      <h3 class="confirm__title" tabindex="-1">Thanks, ${esc(first)} — message received.</h3>
      <p class="confirm__lead">${isEvent ? 'Our events lead will reply within one business day.' : 'We reply to every message within one business day.'}</p>
      <button class="btn btn--secondary" type="button" data-again>Send another message</button></div>`,

  /* ── ROOMS BROWSER ───────────────────────────────────────────────────
   * Must contain: a guests control named "guests" (select or radio 1–5),
   * bed filter as [data-bed="all|king|queen"] buttons (aria-pressed) OR radios name="bed",
   * sort control named "sort" (price-asc | price-desc | size-desc),
   * [data-count] live text and a [data-rooms-grid] container. */
  roomFilters: () => `
    <form class="filters" role="group" aria-label="Filter rooms" data-room-filters onsubmit="return false">
      <div class="field field--inline">
        <label class="field__label" for="rf-g">Guests</label>
        <div class="field__select"><select class="field__input" id="rf-g" name="guests">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}${n === 5 ? '+' : ''}</option>`).join('')}</select></div>
      </div>
      <div class="chips" role="group" aria-label="Bed type">
        ${[['all', 'All beds'], ['king', 'King'], ['queen', 'Queens']].map(([v, l]) => `<button type="button" class="chip" data-bed="${v}" aria-pressed="${v === 'all'}">${l}</button>`).join('')}
      </div>
      <div class="field field--inline filters__sort">
        <label class="field__label" for="rf-s">Sort</label>
        <div class="field__select"><select class="field__input" id="rf-s" name="sort">
          <option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="size-desc">Most space</option>
        </select></div>
      </div>
    </form>
    <p class="filters__count" data-count aria-live="polite"></p>
    <div class="rooms-grid" data-rooms-grid></div>`,
  /* MUST include a button [data-reset]. */
  roomsEmpty: ({ guests, bed }) =>
    `<div class="empty">${icon('bed', 28)}<h3>No single room sleeps ${guests}${guests === 5 ? '+' : ''}${bed !== 'all' ? ` with ${bed} beds` : ''}</h3><p>Book two connecting rooms or ask us about a group rate.</p><div class="empty__actions"><button class="btn btn--secondary" type="button" data-reset>Clear filters</button><a class="btn btn--ghost" href="#/contact?topic=event">Group enquiry</a></div></div>`,
  roomsCount: (n) => `${n} room type${n === 1 ? '' : 's'}`,

  /* ── MENU BROWSER ────────────────────────────────────────────────────
   * Must contain: a [role=tablist] of [role=tab][data-value=<period id>] (ids "tab-<period>"),
   * diet toggles [data-diet=<id>] with aria-pressed, a search input [data-menu-search],
   * a [data-menu-note] live text and the list [data-menu-list] (role=tabpanel, id="menu-panel").
   * Each rendered item (from the theme's item template) MUST carry data-menu-item="<item id>". */
  menuTools: ({ period }) => `
    <div class="menu-tools">
      <div class="tabs" role="tablist" aria-label="Menu">
        ${menu.periods.map((p) => `<button class="tab" role="tab" type="button" id="tab-${p.id}" aria-controls="menu-panel" data-value="${p.id}" aria-selected="${p.id === period}" tabindex="${p.id === period ? 0 : -1}">${p.label}</button>`).join('')}
      </div>
      <div class="menu-tools__row">
        <div class="chips" role="group" aria-label="Dietary filters">
          ${menu.diets.map((d) => `<button type="button" class="chip" data-diet="${d.id}" aria-pressed="false">${d.label}</button>`).join('')}
        </div>
        <div class="search">
          ${icon('search', 18)}
          <label class="sr-only" for="menu-q">Search the menu</label>
          <input id="menu-q" class="search__input" type="search" placeholder="Search dishes…" autocomplete="off" data-menu-search>
        </div>
      </div>
    </div>
    <p class="menu-note" data-menu-note aria-live="polite"></p>
    <div class="menu-list" id="menu-panel" role="tabpanel" tabindex="0" data-menu-list></div>`,
  menuNote: (p, n) => `${p.note} · ${n} dish${n === 1 ? '' : 'es'}`,
  /* MUST include a button [data-clear]. */
  menuEmpty: (q) =>
    `<div class="empty">${icon('plate', 28)}<h3>Nothing matches${q ? ` “${esc(q)}”` : ''}</h3><p>Try removing a filter — or tell your server, the Kitchen can adapt most dishes.</p><button class="btn btn--secondary" type="button" data-clear>Clear filters</button></div>`,

  /* ── NEWSLETTER ── a <form data-newsletter> with an email control named nlEmail. */
  newsletterForm: (label = 'Get opening news') => `
  <form class="newsletter__form" data-newsletter novalidate>
    <div class="field">
      <label class="field__label" for="f-nlEmail">${label}</label>
      <div class="newsletter__row">
        <input class="field__input" id="f-nlEmail" name="nlEmail" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="f-nlEmail-err">
        <button class="btn btn--primary" type="submit">Sign up</button>
      </div>
      <p class="field__error" id="f-nlEmail-err" role="alert"></p>
    </div>
  </form>`,
  newsletterDone: () => `<p class="newsletter__done" role="status">${icon('check', 18)} You’re on the list. First letter lands before opening night.</p>`,
};

export const UI = { ...defaults };
export const UI_DEFAULTS = defaults;

/** Called by the app with a design option's `ui` overrides (reset first so options never leak into each other). */
export function configureUI(overrides = {}) {
  for (const k of Object.keys(UI)) delete UI[k];
  Object.assign(UI, defaults, overrides);
}
