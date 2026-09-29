/* FAMILIAR — markup overrides for the shared flows (see UI-CONTRACT §4).
 * Booking = e-commerce checkout (numbered-circle breadcrumb + cart box),
 * reservation = classic three-field form with a time dropdown,
 * confirmations = itemised receipts (“Order #”), rooms = sidebar facets, menu = “Online Menu”. */
import { site, rooms, menu, reservations as resCfg } from '../../content.js';
import { esc, money, fmtDate, fmtTime, icon } from '../../core/util.js';
import { select } from '../../core/forms.js';
import { quote } from '../../core/flows.js';
import { ic, hoursTable, nlForm, tel } from './parts.js';

const short = (s) => fmtDate(s, { weekday: 'short', month: 'short', day: 'numeric' });
const long = (s) => fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const isDesktop = () => typeof matchMedia === 'function' && !matchMedia('(max-width: 960px)').matches;
const PERIOD_IC = { breakfast: 'cup', lunch: 'sun', dinner: 'moon', drinks: 'glass' };

/* ── Checkout breadcrumb of numbered circles ── */
const stepper = (steps, current, base) => `
  <nav class="co-steps" aria-label="Checkout progress">
    <ol>
      ${steps.map((s, i) => {
        const n = i + 1;
        const st = n < current ? 'done' : n === current ? 'current' : 'todo';
        const inner = `<span class="co-steps__n" aria-hidden="true">${st === 'done' ? icon('check', 16) : n}</span><span class="co-steps__l">${s}</span>`;
        return `<li class="is-${st}">${st === 'done'
          ? `<a class="co-steps__btn" href="${base}?step=${n}" aria-label="Step ${n}: ${s} (completed, edit)">${inner}</a>`
          : `<span class="co-steps__btn" ${st === 'current' ? 'aria-current="step"' : ''}>${st === 'todo' ? `<span class="sr-only">Step ${n}: </span>` : ''}${inner}</span>`}</li>`;
      }).join('')}
    </ol>
  </nav>`;

const rsvAside = () => `
  <aside class="rsv__aside" aria-label="Reservation information">
    <div class="rsv__box">
      <h2 class="rsv__h">${ic('clock', 20)} Kitchen hours</h2>
      ${hoursTable()}
    </div>
    <div class="rsv__box">
      <h2 class="rsv__h">${icon('info', 20)} Good to know</h2>
      <ul class="rsv__list">
        <li>Dinner reservations open ${resCfg.daysAhead} days ahead; breakfast and lunch are walk-in.</li>
        <li>We hold tables for 15 minutes.</li>
        <li>Parties over ${resCfg.maxParty}? <a class="link" href="#/contact?topic=event">Send an event enquiry</a>.</li>
        <li>Questions? Call <a class="link" href="tel:${tel}">${site.phone}</a>.</li>
      </ul>
    </div>
  </aside>`;

const wizardShell = ({ kind, step, steps, stepperHTML, main, aside }) =>
  kind === 'reserve'
    ? `<div class="rsv">
        <div class="rsv__main">
          <p class="rsv__step">Step ${step} of ${steps.length} · ${step === 1 ? 'Find a table' : 'Your details'}</p>
          <div class="rsv__card">${main}</div>
        </div>
        ${rsvAside()}
      </div>`
    : `<div class="co">
        ${stepperHTML}
        <div class="co__grid ${aside ? 'co__grid--split' : ''}">
          <div class="co__main"><div class="co-card">${main}</div></div>
          ${aside}
        </div>
      </div>`;

const priceLines = (d, q) => `
  <dl class="cart__lines">
    <div><dt>Subtotal</dt><dd>${money(q.subtotal, true)}</dd></div>
    ${q.discount ? `<div class="is-disc"><dt>Discount <span class="cart__code">${esc(d.promo)}</span></dt><dd>−${money(q.discount, true)}</dd></div>` : ''}
    <div><dt>Lodging tax (${(site.lodgingTaxRate * 100).toFixed(1)}%)</dt><dd>${money(q.tax, true)}</dd></div>
    <div class="cart__total"><dt>Total</dt><dd><small>USD</small>${money(q.total, true)}</dd></div>
  </dl>
  <p class="cart__due">Due today <strong>$0.00</strong> — you pay at the hotel.</p>`;

/* Cart-style order summary (collapsible “Show order summary” bar on small screens). */
const summary = (d, q, room) => `
  <aside class="cart" aria-label="Order summary">
    <details class="cart__d" ${isDesktop() ? 'open' : ''}>
      <summary class="cart__toggle">
        <span class="cart__tl">${ic('bag', 18)} <span><span class="cart__show">Show</span><span class="cart__hide">Hide</span> order summary</span> ${ic('chevDown', 16, 'cart__chev')}</span>
        ${q ? `<strong>${money(q.total, true)}</strong>` : ''}
      </summary>
      <div class="cart__body">
        <h2 class="cart__h">Your booking</h2>
        ${room ? `
        <div class="cart__item">
          <div class="cart__thumb"><img src="${room.images[0]}" alt="" loading="lazy">${q ? `<span class="cart__qty" aria-hidden="true">${q.nights}</span>` : ''}</div>
          <div class="cart__what">
            <p class="cart__name">${esc(room.name)}</p>
            <p class="cart__meta">${d.checkIn && d.checkOut ? `${short(d.checkIn)} → ${short(d.checkOut)}` : 'Dates not chosen'} · ${plural(+d.guests || 1, 'guest')}</p>
            ${q ? `<p class="cart__meta">${plural(q.nights, 'night')} × ${money(room.rate)}</p>` : ''}
          </div>
          <p class="cart__amt">${q ? money(q.subtotal, true) : `${money(room.rate)}<small>/night</small>`}</p>
        </div>` : '<p class="cart__empty">No room selected yet.</p>'}
        ${q ? priceLines(d, q) : ''}
        <p class="cart__note">${icon('check', 16)} Free cancellation until 48 hours before arrival</p>
      </div>
    </details>
  </aside>`;

const coActions = (back, submit) => `<div class="co-actions">${back || '<span></span>'}${submit}</div>`;
const backLink = (href, label) => `<a class="co-back" href="${href}">${icon('arrowLeft', 18)} ${label}</a>`;

export const ui = {
  stepper,
  wizardShell,
  summary,
  priceLines,

  datesStep: ({ f }) => `
    <form class="co-form" novalidate data-form="dates">
      <h2 class="wizard__title" tabindex="-1">When are you staying?</h2>
      <h3 class="co-sec">Dates &amp; guests</h3>
      <div class="form__grid">${f.checkIn}${f.checkOut}</div>
      <div class="form__grid co-gap">${f.guests}</div>
      <h3 class="co-sec">Discount code</h3>
      <div class="form__grid">${f.promo}</div>
      ${coActions(backLink('#/stay', 'Browse rooms'), `<button class="btn btn--primary btn--lg" type="submit">Continue to rooms</button>`)}
    </form>`,

  roomsStep: ({ d, nights }) => `
    <h2 class="wizard__title" tabindex="-1">Choose your room</h2>
    <p class="co-lead"><span class="co-lead__i">${ic('calendar', 16)} ${short(d.checkIn)} → ${short(d.checkOut)}</span><span>${plural(nights, 'night')} · ${plural(+d.guests, 'guest')}</span><a class="link" href="#/book?step=1">Change<span class="sr-only"> dates</span></a></p>
    <div class="ropts" data-room-options aria-busy="true">${'<div class="ropt-skel" aria-hidden="true"><span></span><span></span></div>'.repeat(3)}</div>`,
  roomsLoading: () => '<div class="ropt-skel" aria-hidden="true"><span></span><span></span></div>'.repeat(3),

  roomOption: (r, { avail, total, nights, picked }) => `
    <article class="ropt ${avail ? '' : 'is-soldout'} ${picked ? 'is-picked' : ''}">
      <img class="ropt__img" src="${r.images[0]}" alt="${esc(r.name)}" loading="lazy">
      <div class="ropt__info">
        <h3 class="ropt__name">${esc(r.name)} ${picked ? '<span class="tag-lime">In your cart</span>' : ''}</h3>
        <p class="ropt__meta">${esc(r.bed)} · Sleeps ${r.sleeps} · ${r.size} sq ft</p>
        <p class="ropt__desc">${esc(r.short)}</p>
      </div>
      <div class="ropt__buy">
        <p class="ropt__price"><strong>${money(r.rate)}</strong> / night</p>
        <p class="ropt__total">${money(total)} for ${plural(nights, 'night')} + tax</p>
        ${avail
          ? `<button class="btn btn--primary" type="button" data-pick="${r.id}" aria-label="Select ${esc(r.name)}">${picked ? 'Keep this room' : 'Select room'}</button>`
          : `<p class="ropt__sold">${icon('info', 16)} Sold out for these dates</p><a class="link" href="#/book?step=1">Try other dates</a>`}
      </div>
    </article>`,
  roomsHiddenNotice: (hidden, guests) =>
    `<p class="notice">${icon('info', 16)} <span>${plural(hidden, 'room type')} ${hidden > 1 ? 'are' : 'is'} hidden because ${hidden > 1 ? 'they sleep' : 'it sleeps'} fewer than ${guests} guests.</span></p>`,
  roomsFull: () =>
    `<div class="empty">${ic('calendar', 30)}<h3>We’re full on those dates</h3><p>Try moving your stay by a day or two — availability changes quickly.</p><a class="btn btn--secondary" href="#/book?step=1">Change dates</a></div>`,

  detailsStep: ({ f }) => `
    <form class="co-form" novalidate data-form="details">
      <h2 class="wizard__title" tabindex="-1">Guest details</h2>
      <h3 class="co-sec">Contact information</h3>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}</div>
      <h3 class="co-sec">Arrival</h3>
      <div class="form__grid">${f.arrival}${f.requests}</div>
      <div class="co-policy">${f.policy}</div>
      ${coActions(backLink('#/book?step=2', 'Back to rooms'), `<button class="btn btn--primary btn--lg" type="submit">Review booking</button>`)}
    </form>`,

  reviewStep: ({ d, q, g }) => `
    <h2 class="wizard__title" tabindex="-1">Review &amp; place booking</h2>
    <div class="co-review">
      <div class="co-review__row"><span class="co-review__k">Stay</span><span class="co-review__v">${short(d.checkIn)} → ${short(d.checkOut)} · ${plural(q.nights, 'night')} · ${plural(+d.guests, 'guest')}</span><a class="link" href="#/book?step=1">Change<span class="sr-only"> dates</span></a></div>
      <div class="co-review__row"><span class="co-review__k">Room</span><span class="co-review__v">${esc(q.room.name)} · ${esc(q.room.bed)} · ${money(q.room.rate)} per night</span><a class="link" href="#/book?step=2">Change<span class="sr-only"> room</span></a></div>
      <div class="co-review__row"><span class="co-review__k">Guest</span><span class="co-review__v">${esc(g.first)} ${esc(g.last)} · ${esc(g.email)} · ${esc(g.phone)}</span><a class="link" href="#/book?step=3">Change<span class="sr-only"> guest details</span></a></div>
      <div class="co-review__row"><span class="co-review__k">Arrival</span><span class="co-review__v">${g.arrival === 'late' ? 'After 10 pm' : `Around ${fmtTime(g.arrival)}`}${g.requests ? ` · “${esc(g.requests)}”` : ''}</span><a class="link" href="#/book?step=3">Change<span class="sr-only"> arrival</span></a></div>
    </div>
    <p class="co-pay">${ic('lock', 20)} <span><strong>No payment is taken online.</strong> Your card is requested at check-in. Free cancellation until 48 hours before arrival.</span></p>
    <button class="btn btn--primary btn--xl" type="button" data-confirm>Place booking · ${money(q.total, true)}</button>
    <div class="co-actions co-actions--solo">${backLink('#/book?step=3', 'Back to details')}</div>`,

  bookingDone: (rec, icsHref) => {
    const q = quote({ roomId: rec.roomId, checkIn: rec.checkIn, checkOut: rec.checkOut, promo: rec.promo });
    const nights = rec.nights || (q ? q.nights : 1);
    return `
    <section class="receipt">
      <div class="receipt__head">
        <span class="receipt__check" aria-hidden="true">${icon('check', 30)}</span>
        <div>
          <p class="receipt__order">Order #<strong data-code>${rec.code}</strong></p>
          <h2 class="confirm__title" tabindex="-1">Thank you, ${esc(rec.guest.first)}!</h2>
        </div>
      </div>
      <div class="receipt__grid">
        <div class="paper-wrap"><div class="paper">
          <p class="paper__status">${icon('check', 16)} Booking confirmed</p>
          <p class="paper__lead">A confirmation is on its way to <strong>${esc(rec.guest.email)}</strong>.</p>
          <table class="paper__table">
            <caption class="sr-only">Itemised booking</caption>
            <thead><tr><th scope="col">Item</th><th scope="col">Amount</th></tr></thead>
            <tbody>
              <tr><td>${esc(rec.roomName)}<small>${plural(nights, 'night')} × ${q ? money(q.room.rate) : ''} · ${short(rec.checkIn)} → ${short(rec.checkOut)}</small></td><td>${q ? money(q.subtotal, true) : '—'}</td></tr>
              ${q && q.discount ? `<tr class="is-disc"><td>Discount · ${esc(rec.promo)}</td><td>−${money(q.discount, true)}</td></tr>` : ''}
              ${q ? `<tr><td>Lodging tax (${(site.lodgingTaxRate * 100).toFixed(1)}%)</td><td>${money(q.tax, true)}</td></tr>` : ''}
            </tbody>
            <tfoot>
              <tr class="paper__total"><th scope="row">Total · pay at the hotel</th><td>${money(rec.total, true)}</td></tr>
              <tr class="paper__paid"><th scope="row">Charged today</th><td>$0.00</td></tr>
            </tfoot>
          </table>
        </div></div>
        <dl class="receipt__meta">
          <div><dt>Check-in</dt><dd>${long(rec.checkIn)}<span>from ${site.checkIn}</span></dd></div>
          <div><dt>Check-out</dt><dd>${long(rec.checkOut)}<span>by ${site.checkOut}</span></dd></div>
          <div><dt>Guests</dt><dd>${rec.guests}</dd></div>
          <div><dt>Name on booking</dt><dd>${esc(rec.guest.first)} ${esc(rec.guest.last)}</dd></div>
        </dl>
      </div>
      <div class="receipt__actions">
        <a class="btn btn--secondary" href="${icsHref}" download="${rec.code}.ics">${icon('calendar', 18)} Add to calendar</a>
        <a class="btn btn--primary" href="#/reserve">Reserve a table for your stay</a>
      </div>
      <p class="receipt__small">Need to change something? <a class="link" href="#/manage?code=${rec.code}">Manage this booking</a></p>
    </section>`;
  },
  notFound: (title, text, cta) =>
    `<div class="empty empty--page">${ic('receipt', 30)}<h2 class="confirm__title" tabindex="-1">${title}</h2><p>${text}</p>${cta}</div>`,

  /* ── Classic reservation form: party <select>, date input, time dropdown ── */
  tableStep: (ctx) => `
    <form class="rsv-form" novalidate data-form="table">
      <h2 class="wizard__title" tabindex="-1">Find a table</h2>
      <p class="rsv-form__lead">Dinner, Tuesday to Sunday. Choose your party, date and time.</p>
      <div class="rsv-form__row">
        ${select({ name: 'party', label: 'Party size', value: ctx.party, options: Array.from({ length: ctx.maxParty }, (_, i) => ({ value: i + 1, label: plural(i + 1, 'guest') })) })}
        ${ctx.f.date}
        <div class="field tsel-field">
          <span class="field__label" id="tsel-l">Time</span>
          <div class="tsel is-placeholder">
            <button class="field__input tsel__btn" type="button" aria-expanded="false" aria-controls="tsel-pop" aria-labelledby="tsel-l tsel-v" aria-describedby="slot-err"><span id="tsel-v" data-tsel-val>Select a time</span>${ic('chevDown', 18, 'tsel__chev')}</button>
            <div class="tsel__pop" id="tsel-pop" role="radiogroup" aria-labelledby="tsel-l" data-slots hidden></div>
          </div>
          <p class="field__error" id="slot-err" data-slot-error role="alert"></p>
        </div>
      </div>
      <p class="rsv-form__note" data-time-note hidden></p>
      <p class="rsv-form__hint">Parties over ${ctx.maxParty}? <a class="link" href="#/contact?topic=event">Send an event enquiry</a>.</p>
      <div class="co-actions co-actions--end"><button class="btn btn--primary btn--lg" type="submit">Continue</button></div>
    </form>`,
  partyLabel: (n) => plural(n, 'guest'),
  tableSlot: (s, { disabled, full, past, checked }) => `
    <label class="tsel__opt ${disabled ? 'is-disabled' : ''}">
      <input type="radio" name="time" value="${s}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
      <span class="tsel__t">${fmtTime(s)}</span>
      <span class="tsel__s ${disabled ? '' : 'is-ok'}">${full ? 'Fully booked' : past ? 'Passed' : 'Available'}</span>
    </label>`,
  tableSlotGroups: () => null,
  tableClosed: (date) => `<p class="notice">${icon('info', 16)} <span>We’re closed for dinner on ${fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}. Please choose another date — breakfast is walk-in every day.</span></p>`,
  tableNoSlots: () => `<p class="notice">${icon('info', 16)} <span>No tables left on this date. Try another day, or walk in — the bar is first-come.</span></p>`,
  tableDetailsStep: ({ d, f }) => `
    <form class="rsv-form" novalidate data-form="rdetails">
      <h2 class="wizard__title" tabindex="-1">Your details</h2>
      <p class="rsv-sum"><span>${icon('users', 16)} ${plural(d.party, 'guest')}</span><span>${ic('calendar', 16)} ${fmtDate(d.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span><span>${icon('clock', 16)} ${fmtTime(d.time)}</span><a class="link" href="#/reserve?step=1">Change<span class="sr-only"> table details</span></a></p>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.occasion}${f.notes}</div>
      ${coActions(backLink('#/reserve?step=1', 'Back'), `<button class="btn btn--primary btn--lg" type="submit">Reserve table</button>`)}
    </form>`,
  tableDone: (rec) => `
    <section class="receipt">
      <div class="receipt__head">
        <span class="receipt__check" aria-hidden="true">${icon('check', 30)}</span>
        <div>
          <p class="receipt__order">Reservation #<strong data-code>${rec.code}</strong></p>
          <h2 class="confirm__title" tabindex="-1">Your table is booked, ${esc(rec.guest.first)}!</h2>
        </div>
      </div>
      <div class="receipt__grid">
        <div class="paper-wrap"><div class="paper">
          <p class="paper__status">${icon('check', 16)} Reservation confirmed</p>
          <p class="paper__lead">Details are on their way to <strong>${esc(rec.guest.email)}</strong>.</p>
          <table class="paper__table">
            <caption class="sr-only">Reservation details</caption>
            <tbody>
              <tr><td>Party</td><td>${plural(rec.party, 'guest')}</td></tr>
              <tr><td>Date</td><td>${fmtDate(rec.date, { weekday: 'short', month: 'short', day: 'numeric' })}</td></tr>
              <tr><td>Time</td><td>${fmtTime(rec.time)}</td></tr>
              ${rec.guest.occasion && rec.guest.occasion !== 'None' ? `<tr><td>Occasion</td><td>${esc(rec.guest.occasion)}</td></tr>` : ''}
            </tbody>
            <tfoot><tr class="paper__free"><th scope="row">Deposit</th><td>None, free to reserve</td></tr></tfoot>
          </table>
        </div></div>
        <dl class="receipt__meta">
          <div><dt>Where</dt><dd>${esc(site.address.line1)}<span>${esc(site.address.line2)}</span></dd></div>
          <div><dt>Name</dt><dd>${esc(rec.guest.first)} ${esc(rec.guest.last)}</dd></div>
          <div><dt>Running late?</dt><dd>We hold tables 15 minutes<span>Call ${site.phone}</span></dd></div>
        </dl>
      </div>
      <div class="receipt__actions">
        <a class="btn btn--secondary" href="#/dine">See the menu</a>
        <a class="btn btn--primary" href="#/stay">Make it a night — see rooms</a>
      </div>
      <p class="receipt__small"><a class="link" href="#/manage?code=${rec.code}">Change or cancel this reservation</a></p>
    </section>`,

  /* ── Manage (order lookup) ── */
  manageForm: ({ f }) => `
    <div class="lookup">
      <div class="lookup__main">
        <div class="lookup__card">
          <h2 class="lookup__h">${ic('receipt', 22)} Order lookup</h2>
          <p class="lookup__lead">Enter the confirmation code from your email and the last name on the booking.</p>
          <form class="form" novalidate data-form="lookup">
            <div class="form__grid">${f.code}${f.last}</div>
            <div class="co-actions co-actions--end"><button class="btn btn--primary btn--lg" type="submit">Find my booking</button></div>
          </form>
        </div>
        <div class="manage-result" data-manage-result aria-live="polite"></div>
      </div>
      <aside class="lookup__help" aria-label="Help">
        <h2 class="lookup__hh">Need help?</h2>
        <dl>
          <div><dt>Where’s my code?</dt><dd>It’s in your confirmation email and starts with <strong>SH-</strong> for rooms or <strong>ST-</strong> for tables.</dd></div>
          <div><dt>Changing dates?</dt><dd>Cancel and rebook, or call us on <a class="link" href="tel:${tel}">${site.phone}</a> — the front desk is open 24 hours.</dd></div>
          <div><dt>Cancellation policy</dt><dd>Free until 48 hours before arrival; after that one night is charged.</dd></div>
        </dl>
      </aside>
    </div>`,
  bookingCard: (rec) => {
    const isStay = rec.type === 'stay';
    const room = isStay ? rooms.find((r) => r.id === rec.roomId) : null;
    const label = { confirmed: 'Confirmed', cancelled: 'Cancelled' }[rec.status] || String(rec.status || '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
    const active = rec.status !== 'cancelled' && rec.status !== 'checked-out';
    return `
      <article class="order ${rec.status === 'cancelled' ? 'is-cancelled' : ''}">
        <header class="order__head">
          <div><p class="order__type">${isStay ? 'Room booking' : 'Table reservation'}</p><h3 class="order__no">${isStay ? "Order" : "Reservation"} #<span>${rec.code}</span></h3></div>
          <span class="status status--${rec.status}" data-booking-status>${label}</span>
        </header>
        <div class="order__body">
          ${room ? `<img class="order__img" src="${room.images[0]}" alt="" loading="lazy">` : ''}
          <dl class="order__grid">
            <div><dt>Name</dt><dd>${esc(rec.guest.first)} ${esc(rec.guest.last)}</dd></div>
            ${isStay
              ? `<div><dt>Room</dt><dd>${esc(rec.roomName)}</dd></div><div><dt>Dates</dt><dd>${short(rec.checkIn)} → ${short(rec.checkOut)}</dd></div><div><dt>Total</dt><dd>${money(rec.total, true)}</dd></div>`
              : `<div><dt>When</dt><dd>${short(rec.date)} · ${fmtTime(rec.time)}</dd></div><div><dt>Party</dt><dd>${plural(rec.party, 'guest')}</dd></div>`}
          </dl>
        </div>
        ${rec.status === 'cancelled'
          ? `<p class="notice order__note">${icon('info', 16)} <span>This ${isStay ? 'booking' : 'reservation'} was cancelled. <a class="link" href="#/${isStay ? 'book' : 'reserve'}">Make a new one</a></span></p>`
          : active ? `<div class="order__actions"><button class="btn btn--danger-o" type="button" data-cancel>Cancel ${isStay ? 'booking' : 'reservation'}</button><p>${isStay ? 'Free until 48 hours before arrival.' : 'Your table is released to other guests.'}</p></div>` : ''}
      </article>`;
  },
  manageNotFound: () =>
    `<div class="empty empty--inline">${icon('search', 28)}<h3>No booking matches those details</h3><p>Check the code in your confirmation email and the last name used to book. Still stuck? Call ${site.phone}.</p></div>`,

  /* ── Contact ── */
  contactForm: ({ topic, f }) => `
    <form class="form cform" novalidate data-form="contact">
      <fieldset class="cform__topic">
        <legend class="field__label">What can we help with?</legend>
        <div class="cform__radios">
          ${[['general', 'General question'], ['event', 'Event or group'], ['press', 'Press']].map(([v, l]) => `<label class="opt"><input type="radio" name="topic" value="${v}" ${v === topic ? 'checked' : ''}><span class="opt__box" aria-hidden="true"></span><span>${l}</span></label>`).join('')}
        </div>
      </fieldset>
      <div class="form__grid">
        ${f.name}${f.email}
        <div class="form__event field--full" data-event-fields ${topic === 'event' ? '' : 'hidden'}><div class="form__grid">${f.eventDate}${f.eventGuests}</div></div>
        ${f.message}
      </div>
      <div class="co-actions"><p class="cform__note">${icon('clock', 16)} We reply within one business day.</p><button class="btn btn--primary btn--lg" type="submit">Send message</button></div>
    </form>`,
  contactDone: ({ first, isEvent }) => `
    <div class="sent">
      <span class="receipt__check" aria-hidden="true">${icon('check', 28)}</span>
      <h3 class="confirm__title" tabindex="-1">Thanks, ${esc(first)} — message received.</h3>
      <p>${isEvent ? 'Our events lead will reply within one business day with dates and a proposal.' : 'A real person will reply within one business day.'}</p>
      <button class="btn btn--secondary" type="button" data-again>Send another message</button>
    </div>`,

  /* ── Rooms browser: e-commerce sidebar facets + sort dropdown ── */
  roomFilters: () => {
    const fits = (n) => rooms.filter((r) => r.sleeps >= n).length;
    const beds = (b) => rooms.filter((r) => b === 'all' || r.bedType === b).length;
    const optR = (name, v, label, n, checked) =>
      `<label class="opt"><input type="radio" name="${name}" value="${v}" ${checked ? 'checked' : ''}><span class="opt__box" aria-hidden="true"></span><span class="opt__l">${label}</span><span class="opt__n" aria-hidden="true">${n}</span></label>`;
    return `
    <div class="shop">
      <aside class="shop__side" aria-label="Filter rooms">
        <details class="shop__filters" ${isDesktop() ? 'open' : ''}>
          <summary class="shop__fsum">${ic('filter', 18)} Filters <span class="shop__fcount" data-fcount></span>${ic('chevDown', 18, 'shop__chev')}</summary>
          <form class="facets" data-room-filters onsubmit="return false">
            <fieldset class="facet">
              <legend class="facet__h">Guests</legend>
              ${[1, 2, 3, 4, 5].map((n) => optR('guests', n, n === 5 ? '5 or more' : n === 1 ? '1 guest' : `${n} guests`, fits(n), n === 1)).join('')}
            </fieldset>
            <fieldset class="facet">
              <legend class="facet__h">Bed type</legend>
              ${[['all', 'All beds'], ['king', 'King'], ['queen', 'Two queens']].map(([v, l]) => optR('bed', v, l, beds(v), v === 'all')).join('')}
            </fieldset>
            <div class="facet facet--note">
              <p>${ic('users', 18)} Travelling with a group? <a class="link" href="#/contact?topic=event">Ask about group rates</a></p>
            </div>
          </form>
        </details>
      </aside>
      <div class="shop__main">
        <div class="shop__bar">
          <p class="shop__count" data-count aria-live="polite"></p>
          <div class="sortby">
            <label for="rf-s">Sort by</label>
            <div class="field__select"><select class="field__input" id="rf-s" name="sort">
              <option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="size-desc">Most space</option>
            </select></div>
          </div>
        </div>
        <div class="shop__grid" data-rooms-grid></div>
      </div>
    </div>`;
  },
  roomsEmpty: ({ guests, bed }) =>
    `<div class="empty">${icon('bed', 30)}<h3>No rooms match these filters</h3><p>No single room sleeps ${guests}${guests === 5 ? '+' : ''} guests${bed !== 'all' ? ` with ${bed === 'queen' ? 'two queens' : 'a king bed'}` : ''}. Book two rooms or ask about a group rate.</p><div class="empty__actions"><button class="btn btn--primary" type="button" data-reset>Clear all filters</button><a class="btn btn--secondary" href="#/contact?topic=event">Group enquiry</a></div></div>`,
  roomsCount: (n) => `Showing ${n} of ${rooms.length} room types`,

  /* ── Online Menu: category sidebar (tabs) + dietary facets + search + product grid ── */
  menuTools: ({ period, periods }) => {
    const count = (id) => menu.items.filter((i) => i.period === id && i.available !== false).length;
    return `
    <div class="om">
      <aside class="om__side">
        <div class="om__block">
          <h2 class="om__h" id="om-cats">Categories</h2>
          <div class="om__cats" role="tablist" aria-labelledby="om-cats">
            ${periods.map((p) => `<button class="om__cat" role="tab" type="button" id="tab-${p.id}" data-value="${p.id}" aria-controls="menu-panel" aria-selected="${p.id === period}" tabindex="${p.id === period ? 0 : -1}">${ic(PERIOD_IC[p.id] || 'plate', 20)}<span class="om__cat-l">${esc(p.label)}</span><span class="om__cat-n" aria-hidden="true">${count(p.id)}</span></button>`).join('')}
          </div>
        </div>
        <div class="om__block">
          <h2 class="om__h" id="om-diet">Dietary</h2>
          <div class="om__diets" role="group" aria-labelledby="om-diet">
            ${menu.diets.map((d) => `<button type="button" class="om__diet" data-diet="${d.id}" aria-pressed="false"><span class="om__box" aria-hidden="true">${icon('check', 14)}</span><span>${esc(d.label)}</span><abbr class="diet diet--${d.id}" title="${esc(d.label)}" aria-hidden="true">${d.id.toUpperCase()}</abbr></button>`).join('')}
          </div>
        </div>
        <div class="om__block om__hours hide-md">
          <h2 class="om__h">Kitchen hours</h2>
          ${hoursTable()}
          <a class="btn btn--primary om__reserve" href="#/reserve">Reserve a table</a>
        </div>
      </aside>
      <div class="om__main">
        <div class="om__bar">
          <p class="om__note" data-menu-note aria-live="polite"></p>
          <div class="om__search">${icon('search', 18)}<label class="sr-only" for="menu-q">Search the menu</label><input id="menu-q" class="om__q" type="search" placeholder="Search dishes…" autocomplete="off" data-menu-search></div>
        </div>
        <div class="om__grid" id="menu-panel" role="tabpanel" tabindex="0" data-menu-list></div>
      </div>
    </div>`;
  },
  menuNote: (p, n) => `Showing ${n} dish${n === 1 ? '' : 'es'} · ${p.label}, ${p.note}`,
  menuEmpty: (q) =>
    `<div class="empty">${icon('plate', 30)}<h3>Nothing matches${q ? ` “${esc(q)}”` : ''}</h3><p>Try removing a filter — or tell your server; the Kitchen can adapt most dishes.</p><button class="btn btn--primary" type="button" data-clear>Clear filters</button></div>`,

  newsletterForm: (label = 'Email address') => nlForm('nlk', label),
  newsletterDone: () => `<p class="nl-done" role="status">${icon('check', 18)} Thanks — you’re on the list. Watch your inbox for opening news.</p>`,
};
