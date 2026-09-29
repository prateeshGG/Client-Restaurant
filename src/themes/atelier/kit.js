/* ATELIER — UI-kit overrides for the shared flows (see core/kit.js for the hooks each template must keep).
 * Language: typeset, hairline, numbered. Wizard = vertical numbered index + receipt ("folio");
 * reservation = sentence builder; confirmations = letterpress cards; filters = underlined text links. */
import { site, menu, rooms, reservations as resCfg } from '../../content.js';
import { esc, money, fmtDate, fmtTime, icon, parseISO } from '../../core/util.js';
import { UI } from '../../core/kit.js';

export const two = (n) => String(n).padStart(2, '0');
export const WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const SHORT = { weekday: 'short', month: 'short', day: 'numeric' };
const LONG = { weekday: 'long', month: 'long', day: 'numeric' };
const s = (n) => (n === 1 ? '' : 's');

/* Letterpress card — every confirmation / terminal state uses it. */
export const press = ({ kicker, title, lead = '', codeLabel = '', code = '', rows = [], actions = '', small = '', tag = 'h2', compact = false }) => `
  <section class="press${compact ? ' press--compact' : ''}">
    <div class="press__card">
      <p class="press__mast" aria-hidden="true"><span></span>${esc(site.name)}<span></span></p>
      <p class="press__kicker">${kicker}</p>
      <${tag} class="confirm__title press__title" tabindex="-1">${title}</${tag}>
      ${lead ? `<p class="press__lead">${lead}</p>` : ''}
      ${code ? `<p class="press__code"><span>${codeLabel}</span><strong data-code>${code}</strong></p>` : ''}
      ${rows.length ? `<dl class="press__rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''}
      ${actions ? `<div class="press__actions">${actions}</div>` : ''}
      ${small ? `<p class="press__small">${small}</p>` : ''}
    </div>
  </section>`;

const caret = '<span class="sel-caret" aria-hidden="true"></span>';

export const atelierUI = {
  /* ── Vertical numbered index (01 Dates … 04 Review) ── */
  stepper: (steps, current, base) => `
    <nav class="idx" aria-label="Progress">
      <p class="idx__count" aria-hidden="true">${two(current)}<span>/ ${two(steps.length)}</span></p>
      <ol class="idx__list">
        ${steps
          .map((st, i) => {
            const n = i + 1;
            const state = n < current ? 'done' : n === current ? 'current' : 'todo';
            const inner = `<span class="idx__n">${two(n)}</span><span class="idx__l">${st}</span>${state === 'done' ? '<span class="idx__edit" aria-hidden="true">Edit</span>' : ''}`;
            return `<li class="idx__item is-${state}">${
              state === 'done'
                ? `<a class="idx__btn" href="${base}?step=${n}" aria-label="Step ${n}: ${st} (completed, edit)">${inner}</a>`
                : `<span class="idx__btn" ${state === 'current' ? 'aria-current="step"' : ''}>${inner}</span>`
            }</li>`;
          })
          .join('')}
      </ol>
    </nav>`,

  wizardShell: ({ kind, stepperHTML, main, aside, d, q, room }) => {
    const folio = kind === 'book' ? aside || UI.summary(d, q, room) : aside;
    const peek = kind === 'book' && q ? `<button class="atw__peek" type="button" data-at-scroll="#folio"><span>Folio</span><strong>${money(q.total, true)}</strong>${icon('arrow', 16)}</button>` : '';
    return `
    <div class="atw atw--${kind}${folio ? ' atw--folio' : ''}">
      <div class="atw__index">${stepperHTML}</div>
      <div class="atw__main">${peek}${main}</div>
      ${folio ? `<div class="atw__aside">${folio}</div>` : ''}
    </div>`;
  },

  /* ── Receipt-style folio ── */
  summary: (d, q, room) => `
    <aside class="folio" id="folio" tabindex="-1" aria-label="Your stay">
      <header class="folio__head"><p class="folio__mast">${esc(site.name)}</p><p class="folio__sub">Folio</p></header>
      ${room ? `<img class="folio__img" src="${room.images[0]}" alt="" loading="lazy">` : ''}
      <dl class="folio__rows">
        <div><dt>Arrive</dt><dd>${d.checkIn ? fmtDate(d.checkIn, SHORT) : '—'}</dd></div>
        <div><dt>Depart</dt><dd>${d.checkOut ? fmtDate(d.checkOut, SHORT) : '—'}</dd></div>
        <div><dt>Guests</dt><dd>${d.guests || '—'}</dd></div>
        <div><dt>Room</dt><dd>${room ? esc(room.name) : 'To be chosen'}</dd></div>
      </dl>
      ${q ? UI.priceLines(d, q) : '<p class="folio__empty">Rates appear once a room is chosen.</p>'}
      <p class="folio__note">Nothing is charged online · free cancellation until 48 hours before arrival</p>
    </aside>`,

  priceLines: (d, q) => `
    <dl class="folio__lines">
      <div><dt>${money(q.room.rate)} × ${q.nights} night${s(q.nights)}</dt><dd>${money(q.subtotal, true)}</dd></div>
      ${q.discount ? `<div class="is-discount"><dt>${esc(d.promo)} · −${Math.round(q.pct * 100)}%</dt><dd>−${money(q.discount, true)}</dd></div>` : ''}
      <div><dt>Lodging tax ${(site.lodgingTaxRate * 100).toFixed(1)}%</dt><dd>${money(q.tax, true)}</dd></div>
      <div class="folio__total"><dt>Total</dt><dd>${money(q.total, true)}</dd></div>
    </dl>`,

  datesStep: ({ f }) => `
    <form class="form atf" novalidate data-form="dates">
      <h2 class="wizard__title" tabindex="-1">When will you <em>arrive</em>?</h2>
      <p class="wizard__lead">Direct rates are always our lowest — no resort fee, no booking fee.</p>
      <div class="form__grid">${f.checkIn}${f.checkOut}${f.guests}${f.promo}</div>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">See available rooms ${icon('arrow', 18)}</button></div>
    </form>`,

  roomsStep: ({ d, nights }) => `
    <h2 class="wizard__title" tabindex="-1">Choose a <em>room</em></h2>
    <p class="wizard__lead">${fmtDate(d.checkIn, SHORT)} — ${fmtDate(d.checkOut, SHORT)} · ${nights} night${s(nights)} · ${d.guests} guest${s(d.guests)} <a class="link" href="#/book?step=1">Change</a></p>
    <div class="opts" data-room-options aria-busy="true">${UI.roomsLoading()}</div>`,
  roomsLoading: () => `<p class="sr-only" role="status">Checking availability…</p>${'<div class="opt-skel" aria-hidden="true"><span></span><span></span><span></span></div>'.repeat(3)}`,

  roomOption: (r, { avail, total, nights, picked }) => `
    <article class="opt${avail ? '' : ' is-soldout'}${picked ? ' is-picked' : ''}">
      <img class="opt__img" src="${r.images[0]}" alt="" loading="lazy">
      <div class="opt__body">
        <p class="opt__no">${esc(r.bed)}${picked ? ' — <span>your choice</span>' : ''}</p>
        <h3 class="opt__name">${esc(r.name)}</h3>
        <p class="opt__meta">Sleeps ${r.sleeps} · ${r.size} sq ft</p>
        <p class="opt__desc">${esc(r.short)}</p>
      </div>
      <div class="opt__price">
        <p class="opt__rate"><strong>${money(r.rate)}</strong> / night</p>
        <p class="opt__total">${money(total)} for ${nights} night${s(nights)}, before tax</p>
        ${
          avail
            ? `<button class="btn ${picked ? 'btn--primary' : 'btn--secondary'}" type="button" data-pick="${r.id}" aria-label="Select ${esc(r.name)}">${picked ? 'Keep this room' : 'Select'}</button>`
            : `<p class="opt__sold">Taken on these dates</p><a class="link-arrow" href="#/book?step=1">Try other dates ${icon('arrow', 16)}</a>`
        }
      </div>
    </article>`,
  roomsHiddenNotice: (hidden, guests) => `<p class="at-note">${hidden} room type${hidden > 1 ? 's are' : ' is'} not listed — ${hidden > 1 ? 'they sleep' : 'it sleeps'} fewer than ${guests}.</p>`,
  roomsFull: () => `
    <div class="at-empty">
      <p class="label">Fully booked</p>
      <h3 class="at-empty__t">Every room is taken on those dates.</h3>
      <p>Availability moves quickly — try shifting your stay by a night or two.</p>
      <div class="at-empty__actions"><a class="btn btn--secondary" href="#/book?step=1">Change dates</a></div>
    </div>`,

  detailsStep: ({ f }) => `
    <form class="form atf" novalidate data-form="details">
      <h2 class="wizard__title" tabindex="-1">Who is <em>checking in</em>?</h2>
      <p class="wizard__lead">We use these details for your confirmation and an arrival-day text — nothing else.</p>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.arrival}${f.requests}${f.policy}</div>
      <div class="form__actions">
        <a class="btn btn--ghost" href="#/book?step=2">${icon('arrowLeft', 18)} Back</a>
        <button class="btn btn--primary btn--lg" type="submit">Review booking ${icon('arrow', 18)}</button>
      </div>
    </form>`,

  reviewStep: ({ d, q, g }) => `
    <h2 class="wizard__title" tabindex="-1">Read it <em>back</em></h2>
    <p class="wizard__lead">Check each line. Nothing is charged until you arrive.</p>
    <div class="proof">
      <section class="proof__row"><p class="proof__n">01</p><div><h3>Stay</h3><p>${fmtDate(d.checkIn, LONG)} — ${fmtDate(d.checkOut, LONG)}<br>${q.nights} night${s(q.nights)} · ${d.guests} guest${s(d.guests)}</p></div><a class="proof__edit" href="#/book?step=1" aria-label="Edit dates">Edit</a></section>
      <section class="proof__row"><p class="proof__n">02</p><div><h3>Room</h3><p>${esc(q.room.name)} · ${q.room.bed}<br>${money(q.room.rate)} per night</p></div><a class="proof__edit" href="#/book?step=2" aria-label="Edit room">Edit</a></section>
      <section class="proof__row"><p class="proof__n">03</p><div><h3>Guest</h3><p>${esc(g.first)} ${esc(g.last)}<br>${esc(g.email)} · ${esc(g.phone)}<br>Arriving ${g.arrival === 'late' ? 'after 10 pm' : fmtTime(g.arrival)}${g.requests ? `<br><em>“${esc(g.requests)}”</em>` : ''}</p></div><a class="proof__edit" href="#/book?step=3" aria-label="Edit guest details">Edit</a></section>
    </div>
    <p class="proof__small">No payment is taken online; your card is requested at check-in. By confirming you accept the booking policy.</p>
    <div class="form__actions">
      <a class="btn btn--ghost" href="#/book?step=3">${icon('arrowLeft', 18)} Back</a>
      <button class="btn btn--primary btn--lg" type="button" data-confirm>Confirm booking · ${money(q.total, true)}</button>
    </div>`,

  bookingDone: (rec, icsHref) =>
    press({
      kicker: 'Your room is confirmed',
      title: `See you soon, ${esc(rec.guest.first)}.`,
      lead: `A confirmation is on its way to <strong>${esc(rec.guest.email)}</strong>.`,
      codeLabel: 'Confirmation',
      code: rec.code,
      rows: [['Room', esc(rec.roomName)], ['Arrive', fmtDate(rec.checkIn, SHORT)], ['Depart', fmtDate(rec.checkOut, SHORT)], ['Guests', rec.guests], ['Total, paid at the hotel', money(rec.total, true)]],
      actions: `<a class="btn btn--secondary" href="${icsHref}" download="${rec.code}.ics">${icon('calendar', 18)} Add to calendar</a><a class="btn btn--primary" href="#/reserve">Reserve a table ${icon('arrow', 18)}</a>`,
      small: `Need to change something? <a class="link" href="#/manage?code=${rec.code}">Manage this booking</a>`,
    }),
  notFound: (title, text, cta) => press({ kicker: 'Not found', title, lead: text, actions: cta }),

  /* ── Sentence-builder reservation ── */
  tableStep: (ctx) => {
    const days = ctx.days.slice();
    if (!days.some((x) => x.iso === ctx.date)) {
      const dt = parseISO(ctx.date);
      days.unshift({ iso: ctx.date, closed: false, dow: fmtDate(ctx.date, { weekday: 'short' }), day: String(dt.getDate()), month: fmtDate(ctx.date, { month: 'short' }) });
    }
    const max = ctx.maxParty || resCfg.maxParty;
    return `
    <form class="form compose" novalidate data-form="table">
      <h2 class="wizard__title" tabindex="-1">Compose your <em>reservation</em></h2>
      <p class="wizard__lead">Dinner, Tuesday to Sunday from 5 pm. Change any underlined word.</p>
      <div class="compose__sentence" data-field>
        <span class="compose__w">A table for</span>
        <span class="compose__ctl"><label class="sr-only" for="r-party">Party size</label><select class="compose__sel" id="r-party" name="party">${Array.from({ length: max }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === ctx.party ? 'selected' : ''}>${WORDS[n] || n}</option>`).join('')}</select>${caret}</span>
        <span class="compose__w">on</span>
        <span class="compose__ctl"><label class="sr-only" for="r-date">Date</label><select class="compose__sel compose__sel--date" id="r-date" name="date" aria-describedby="r-date-err">${days
          .map((x) => `<option value="${x.iso}" ${x.iso === ctx.date ? 'selected' : ''} ${x.closed && x.iso !== ctx.date ? 'disabled' : ''}>${x.dow} ${x.day} ${x.month}${x.today ? ', tonight' : ''}${x.closed ? ' — closed' : ''}</option>`)
          .join('')}</select>${caret}</span>
        <span class="compose__w">at</span>
        <button type="button" class="compose__time${ctx.d && ctx.d.time ? '' : ' is-empty'}" data-at-time aria-controls="r-times" aria-label="Time: ${ctx.d && ctx.d.time ? fmtTime(ctx.d.time) : 'not chosen'} — go to the dinner seatings">${ctx.d && ctx.d.time ? fmtTime(ctx.d.time) : 'a time'}</button><span class="compose__stop" aria-hidden="true">.</span>
        <p class="field__error compose__err" id="r-date-err" role="alert"></p>
      </div>
      <div class="compose__times" id="r-times">
        <p class="compose__tl" id="r-time-l">Dinner seatings <span>— choose a time</span></p>
        <div class="times" role="radiogroup" aria-labelledby="r-time-l" data-slots></div>
      </div>
      <p class="field__error compose__err" id="slot-err" data-slot-error role="alert"></p>
      <p class="compose__hint">Parties over ${WORDS[max] || max}? <a class="link" href="#/contact?topic=event">Send an event enquiry</a>. Breakfast, lunch and the rooftop bar are walk-in.</p>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Continue ${icon('arrow', 18)}</button></div>
    </form>`;
  },
  partyLabel: (n) => `${WORDS[n] || n}`,
  tableSlot: (hm, { disabled, full, past, checked }) => {
    const [t, ap] = fmtTime(hm).split(' ');
    return `<label class="tm${disabled ? ' is-off' : ''}"><input type="radio" name="time" value="${hm}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="tm__t">${t}<small> ${ap}${full ? ' · full' : past ? ' · past' : ''}</small></span></label>`;
  },
  tableSlotGroups: () => null,
  tableClosed: (date) => `<span class="tm-note">— ${parseISO(date).getDay() === 1 ? 'no dinner on Mondays' : 'the Kitchen is closed that evening'}; please choose another date</span>`,
  tableNoSlots: () => `<span class="tm-note">— every table is taken; try another evening, or walk in to the bar</span>`,

  tableDetailsStep: ({ d, f }) => `
    <form class="form atf" novalidate data-form="rdetails">
      <h2 class="wizard__title" tabindex="-1">In whose <em>name</em>?</h2>
      <p class="compose__recap">A table for ${WORDS[d.party] || d.party} on ${fmtDate(d.date, LONG)} at ${fmtTime(d.time)}. <a class="link" href="#/reserve?step=1">Change</a></p>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.occasion}${f.notes}</div>
      <div class="form__actions">
        <a class="btn btn--ghost" href="#/reserve?step=1">${icon('arrowLeft', 18)} Back</a>
        <button class="btn btn--primary btn--lg" type="submit">Reserve the table</button>
      </div>
    </form>`,
  tableDone: (rec) =>
    press({
      kicker: 'Your table is reserved',
      title: `Until then, ${esc(rec.guest.first)}.`,
      lead: `A table for ${WORDS[rec.party] || rec.party} on ${fmtDate(rec.date, LONG)} at ${fmtTime(rec.time)}.`,
      codeLabel: 'Reservation',
      code: rec.code,
      rows: [['Party', `${rec.party} guest${s(rec.party)}`], ['Date', fmtDate(rec.date, SHORT)], ['Time', fmtTime(rec.time)], ...(rec.guest.occasion && rec.guest.occasion !== 'None' ? [['Occasion', esc(rec.guest.occasion)]] : [])],
      actions: `<a class="btn btn--secondary" href="#/dine">Read the menu</a><a class="btn btn--primary" href="#/stay">Stay the night ${icon('arrow', 18)}</a>`,
      small: `We hold tables for 15 minutes · running late? ${site.phone} · <a class="link" href="#/manage?code=${rec.code}">Change or cancel</a>`,
    }),

  /* ── Manage ── */
  manageForm: ({ f }) => `
    <div class="ledger">
      <form class="ledger__form" novalidate data-form="lookup">
        <div class="ledger__fields">${f.code}${f.last}</div>
        <button class="btn btn--primary btn--lg" type="submit">Find booking ${icon('arrow', 18)}</button>
      </form>
      <div class="ledger__result" data-manage-result aria-live="polite"></div>
    </div>`,
  bookingCard: (rec) => {
    const isStay = rec.type === 'stay';
    const off = rec.status === 'cancelled';
    const rows = [['Name', `${esc(rec.guest.first)} ${esc(rec.guest.last)}`]].concat(
      isStay
        ? [['Room', esc(rec.roomName)], ['Arrive', fmtDate(rec.checkIn, SHORT)], ['Depart', fmtDate(rec.checkOut, SHORT)], ['Total', money(rec.total, true)]]
        : [['Date', fmtDate(rec.date, SHORT)], ['Time', fmtTime(rec.time)], ['Party', rec.party]]
    );
    return `
    <article class="record${off ? ' is-cancelled' : ''}">
      <header class="record__head">
        <div><p class="label">${isStay ? 'Room booking' : 'Table reservation'}</p><h2 class="record__code">${rec.code}</h2></div>
        <p class="record__status record__status--${rec.status}" data-booking-status>${off ? 'Cancelled' : 'Confirmed'}</p>
      </header>
      <dl class="record__rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${
        off
          ? `<p class="at-note">This ${isStay ? 'booking' : 'reservation'} was cancelled. <a class="link" href="#/${isStay ? 'book' : 'reserve'}">Make a new one</a></p>`
          : `<div class="record__actions"><button class="btn btn--danger" type="button" data-cancel>Cancel ${isStay ? 'booking' : 'reservation'}</button><p>${isStay ? 'Free until 48 hours before arrival.' : 'Your table is released to other guests.'}</p></div>`
      }
    </article>`;
  },
  manageNotFound: () => `
    <div class="at-empty">
      <p class="label">No match</p>
      <h3 class="at-empty__t">We couldn’t find a booking with those details.</h3>
      <p>Check the code in your confirmation email and the last name used to book — or call ${site.phone}.</p>
    </div>`,

  /* ── Contact (underline "letter" form) ── */
  contactForm: ({ topic, f }) => `
    <form class="form letter" novalidate data-form="contact">
      <fieldset class="letter__topic">
        <legend class="field__label">Regarding</legend>
        <div class="letter__opts">${[['general', 'A general question'], ['event', 'An event or group'], ['press', 'Press']]
          .map(([v, l]) => `<label class="letter__opt"><input type="radio" name="topic" value="${v}" ${v === topic ? 'checked' : ''}><span>${l}</span></label>`)
          .join('')}</div>
      </fieldset>
      <div class="form__grid">
        ${f.name}${f.email}
        <div class="form__event field--full" data-event-fields ${topic === 'event' ? '' : 'hidden'}><div class="form__grid">${f.eventDate}${f.eventGuests}</div></div>
        ${f.message}
      </div>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Send message ${icon('arrow', 18)}</button></div>
    </form>`,
  contactDone: ({ first, isEvent }) =>
    press({
      compact: true,
      kicker: 'Message received',
      title: `Thank you, ${esc(first)}.`,
      lead: isEvent ? 'Our events lead will reply within one business day.' : 'A real person replies to every message within one business day.',
      actions: '<button class="btn btn--secondary" type="button" data-again>Write another message</button>',
    }),

  /* ── Rooms catalogue filters: underlined text links ── */
  roomFilters: ({ guests, bed }) => `
    <form class="catf" aria-label="Filter rooms" data-room-filters onsubmit="return false">
      <div class="catf__beds" role="group" aria-label="Bed type">
        ${[['all', 'All rooms'], ['king', 'King'], ['queen', 'Queens']].map(([v, l], i) => `${i ? '<span class="catf__dot" aria-hidden="true">·</span>' : ''}<button type="button" class="catf__link" data-bed="${v}" aria-pressed="${v === bed}">${l}</button>`).join('')}
      </div>
      <div class="catf__sels">
        <div class="catf__sel"><label for="rf-g">Sleeping</label><span class="catf__wrap"><select id="rf-g" name="guests">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === guests ? 'selected' : ''}>${n === 5 ? '5 or more' : `${n} guest${s(n)}`}</option>`).join('')}</select>${caret}</span></div>
        <div class="catf__sel"><label for="rf-s">Order by</label><span class="catf__wrap"><select id="rf-s" name="sort"><option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option><option value="size-desc">Most space</option></select>${caret}</span></div>
      </div>
    </form>
    <p class="catf__count" data-count aria-live="polite"></p>
    <div class="catalogue" data-rooms-grid></div>`,
  roomsEmpty: ({ guests, bed }) => `
    <div class="at-empty">
      <p class="label">Nothing in the catalogue</p>
      <h3 class="at-empty__t">No single room sleeps ${guests}${guests === 5 ? '+' : ''}${bed !== 'all' ? ` with ${bed === 'king' ? 'a king bed' : 'queen beds'}` : ''}.</h3>
      <p>Two connecting rooms usually solve it — or ask us about a group rate.</p>
      <div class="at-empty__actions"><button class="btn btn--secondary" type="button" data-reset>Clear filters</button><a class="link-arrow" href="#/contact?topic=event">Group enquiry ${icon('arrow', 16)}</a></div>
    </div>`,
  roomsCount: (n) => `Showing ${n} of ${rooms.length} room types`,

  /* ── Menu tools: numbered serif tabs, square-box diet toggles, underline search ── */
  menuTools: ({ period }) => `
    <div class="carte-tools">
      <div class="carte-tabs" role="tablist" aria-label="Menu">
        ${menu.periods.map((p, i) => `<button class="carte-tab" role="tab" type="button" id="tab-${p.id}" aria-controls="menu-panel" data-value="${p.id}" aria-selected="${p.id === period}" tabindex="${p.id === period ? 0 : -1}"><small>${two(i + 1)}</small><span>${p.label}</span></button>`).join('')}
      </div>
      <div class="carte-tools__row">
        <div class="carte-diets" role="group" aria-label="Dietary filters">
          ${menu.diets.map((d) => `<button type="button" class="carte-diet" data-diet="${d.id}" aria-pressed="false"><span class="carte-diet__box" aria-hidden="true"></span>${d.label}</button>`).join('')}
        </div>
        <div class="carte-search">
          <label for="menu-q">Search</label>
          <input id="menu-q" type="search" placeholder="walleye, maple, rye…" autocomplete="off" data-menu-search>
        </div>
      </div>
    </div>
    <p class="carte-note" data-menu-note aria-live="polite"></p>
    <div class="carte" id="menu-panel" role="tabpanel" tabindex="0" data-menu-list></div>`,
  menuNote: (p, n) => `${p.note} — ${n} dish${n === 1 ? '' : 'es'}`,
  menuEmpty: (q) => `
    <div class="at-empty carte__empty">
      <p class="label">Nothing on the carte</p>
      <h3 class="at-empty__t">No dish matches${q ? ` “${esc(q)}”` : ' those filters'}.</h3>
      <p>Remove a filter — or ask your server; the Kitchen can adapt most dishes.</p>
      <div class="at-empty__actions"><button class="btn btn--secondary" type="button" data-clear>Clear filters</button></div>
    </div>`,

  /* ── Newsletter (footer, on ink) ── */
  newsletterForm: (label = 'Get opening news') => `
    <form class="newsletter__form nl" data-newsletter novalidate>
      <div class="field">
        <label class="field__label" for="f-nlEmail">${label}</label>
        <div class="nl__row">
          <input class="field__input" id="f-nlEmail" name="nlEmail" type="email" autocomplete="email" placeholder="Your email address" aria-describedby="f-nlEmail-err">
          <button class="nl__go" type="submit">Subscribe ${icon('arrow', 16)}</button>
        </div>
        <p class="field__error" id="f-nlEmail-err" role="alert"></p>
      </div>
    </form>`,
  newsletterDone: () => `<p class="newsletter__done nl__done" role="status">${icon('check', 18)} Subscribed. The first letter arrives before opening night.</p>`,
};
