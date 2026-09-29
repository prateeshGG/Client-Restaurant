/* NOIR — `ui` overrides for every shared flow (see UI-CONTRACT §4).
 * Language: a theatre programme after dark. Roman-numeral acts, one question per screen,
 * a running total in a fixed bottom bar, a vertical schedule of seatings, champagne ticket stubs. */
import { site, menu, reservations as resCfg } from '../../content.js';
import { esc, money, fmtDate, fmtTime, icon, addDays, nightsBetween } from '../../core/util.js';
import { isClosed, roomAvailable } from '../../core/store.js';
import { ROMAN, WORDS, pad2, plural, shortDate, longDate, fitDate, ticket } from './shared.js';

const priceLines = (d, q) => `
  <dl class="bill">
    <div><dt>${money(q.room.rate)} × ${plural(q.nights, 'night')}</dt><dd>${money(q.subtotal, true)}</dd></div>
    ${q.discount ? `<div class="bill__disc"><dt>Code ${esc(d.promo)} (−${Math.round(q.pct * 100)}%)</dt><dd>−${money(q.discount, true)}</dd></div>` : ''}
    <div><dt>Lodging tax (${(site.lodgingTaxRate * 100).toFixed(1)}%)</dt><dd>${money(q.tax, true)}</dd></div>
    <div class="bill__total"><dt>Total</dt><dd>${money(q.total, true)}</dd></div>
  </dl>`;

const stayLine = (d) => {
  if (!d.checkIn || !d.checkOut) return 'Choose your dates';
  const n = nightsBetween(d.checkIn, d.checkOut);
  return `${shortDate(d.checkIn)} – ${shortDate(d.checkOut)} · ${plural(n, 'night')} · ${plural(+d.guests || 2, 'guest')}`;
};

/* Is the drafted room free (and big enough) for the drafted dates? */
export const roomFits = (d, room) =>
  !!(room && d.checkIn && d.checkOut && nightsBetween(d.checkIn, d.checkOut) > 0 && roomAvailable(room.id, d.checkIn, d.checkOut) && room.sleeps >= (+d.guests || 1));

/* Fixed bottom bar with the running total (booking only). Live-updated on step I by behave.js.
 * A drafted room that is sold out (or too small) for the chosen dates is never priced. */
export const totalBar = (d, q, room) => {
  const ok = roomFits(d, room);
  const sold = room && !ok && d.checkIn && d.checkOut;
  q = ok ? q : null;
  return `
  <div class="bw-total ${sold ? 'is-unavail' : ''}" data-total-bar data-room="${room ? room.id : ''}">
    <div class="bw-total__inner">
      <div class="bw-total__what">
        <p class="bw-total__k" data-total-room>${ok ? esc(room.name) : 'Your stay'}</p>
        <p class="bw-total__v" data-total-dates>${stayLine(d)}</p>
      </div>
      <details class="bw-total__more" ${q ? '' : 'hidden'} data-total-more>
        <summary>Breakdown</summary>
        <div class="bw-total__pop" data-total-lines>${q ? priceLines(d, q) : ''}<p class="bw-total__note">${icon('check', 14)} Free cancellation up to 48 h before arrival · pay at the hotel</p></div>
      </details>
      <p class="bw-total__sum"><span class="bw-total__k">Total</span><strong data-total-sum>${q ? money(q.total, true) : '—'}</strong><span class="bw-total__hint" ${q ? 'hidden' : ''} data-total-hint>${sold ? 'Not available on these dates' : 'Pick a room to see it'}</span></p>
    </div>
  </div>`;
};

const nav = (back, next) => `<div class="q__nav">${back || '<span></span>'}${next}</div>`;
const backLink = (href) => `<a class="btn btn--ghost" href="${href}">${icon('arrowLeft', 18)} Back</a>`;
const backBtn = `<button class="btn btn--ghost" type="button" data-prev>${icon('arrowLeft', 18)} Back</button>`;
const nextBtn = (label = 'Continue') => `<button class="btn btn--primary btn--lg" type="button" data-next>${label} ${icon('arrow', 18)}</button>`;
const screenNo = (act, i, n) => `<p class="q__n" aria-hidden="true">${act}${n > 1 ? `<span>${i} / ${n}</span>` : ''}</p>`;

const dayOptions = (t, max, current) => {
  const out = [];
  for (let s = t, i = 0; s <= max; s = addDays(s, 1), i++) {
    const label = fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric' });
    out.push(`<option value="${s}" ${s === current ? 'selected' : ''}>${i === 0 ? 'Tonight · ' : i === 1 ? 'Tomorrow · ' : ''}${label}${isClosed(s) ? ' — dark' : ''}</option>`);
  }
  return out.join('');
};

const seating = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const mins = h * 60 + m;
  return mins < 18 * 60 ? 'Early seating' : mins <= 20 * 60 ? 'Main seating' : 'Late seating';
};

export const noirUI = {
  /* Thin gold line with roman numerals. data-step/total let behave.js move the fill between sub-screens. */
  stepper: (steps, current, base) => `
  <nav class="acts" aria-label="Progress" data-step="${current}" data-total="${steps.length}" style="--n:${steps.length}">
    <div class="acts__rail" aria-hidden="true"><span class="acts__fill" style="--p:${steps.length > 1 ? (current - 1) / (steps.length - 1) : 1}"></span></div>
    <ol class="acts__list">
      ${steps
        .map((s, i) => {
          const n = i + 1;
          const st = n < current ? 'done' : n === current ? 'current' : 'todo';
          const inner = `<span class="acts__n">${ROMAN[i]}</span><span class="acts__l">${s}</span>`;
          return `<li class="acts__item is-${st}">${
            st === 'done'
              ? `<a class="acts__btn" href="${base}?step=${n}" aria-label="Step ${n}: ${s} (completed, edit)">${inner}</a>`
              : `<span class="acts__btn" ${st === 'current' ? 'aria-current="step"' : ''}>${inner}<span class="sr-only">${st === 'current' ? ' (current step)' : ''}</span></span>`
          }</li>`;
        })
        .join('')}
    </ol>
  </nav>`,

  wizardShell: ({ kind, step, stepperHTML, main, d, q, room }) => `
    <div class="bw bw--${kind} bw--s${step}">
      ${stepperHTML}
      <div class="bw__screen">${main}</div>
    </div>
    ${kind === 'book' ? totalBar(d, q, room) : ''}`,

  summary: () => '',
  priceLines,

  /* I — two screens: dates, then guests (+ optional code). */
  datesStep: ({ f, values }) => {
    const g = +values.guests || 2;
    const n = nightsBetween(values.checkIn, values.checkOut);
    return `
    <form class="qform" novalidate data-form="dates" data-qform>
      <fieldset class="q is-on" data-screen="0" aria-labelledby="qa0">
        ${screenNo('I', 1, 2)}
        <h2 class="wizard__title q__title" id="qa0" tabindex="-1">When are you staying?</h2>
        <div class="q__pair">${f.checkIn}${f.checkOut}</div>
        <p class="q__aside" data-nights aria-live="polite">${n > 0 ? plural(n, 'night') : ''}</p>
        ${nav('', nextBtn())}
      </fieldset>
      <fieldset class="q" data-screen="1" aria-labelledby="qa1" hidden>
        ${screenNo('I', 2, 2)}
        <h2 class="q__title" id="qa1" tabindex="-1">How many guests?</h2>
        <div class="qnums">
          ${[1, 2, 3, 4].map((x) => `<label class="qnum"><input type="radio" name="guests" value="${x}" ${x === g ? 'checked' : ''}><span class="qnum__face"><span class="qnum__n">${x}</span><span class="qnum__w">${x === 1 ? 'guest' : 'guests'}</span></span></label>`).join('')}
        </div>
        <p class="q__hint">Five or more? Book two rooms, or <a class="link" href="#/contact?topic=event">ask about a group rate</a>.</p>
        <details class="q__code" ${values.promo ? 'open' : ''}><summary>Have a promo code?</summary><div class="q__code-body">${f.promo}</div></details>
        ${nav(backBtn, `<button class="btn btn--primary btn--lg" type="submit">See the rooms ${icon('arrow', 18)}</button>`)}
      </fieldset>
    </form>`;
  },

  /* II — one screen: choose a room (cinematic frames). */
  roomsStep: ({ d, nights }) => `
    <div class="q q--wide is-on">
      ${screenNo('II', 1, 1)}
      <h2 class="wizard__title q__title" tabindex="-1">Which room would you like?</h2>
      <p class="q__sub">${shortDate(d.checkIn)} – ${shortDate(d.checkOut)} · ${plural(nights, 'night')} · ${plural(d.guests, 'guest')} <a class="link" href="#/book?step=1">Change</a></p>
      <div class="frames" data-room-options aria-busy="true">${noirUI.roomsLoading()}</div>
      ${nav(backLink('#/book?step=1'), '')}
    </div>`,
  roomsLoading: () => '<div class="frame frame--ghost" aria-hidden="true"></div>'.repeat(3),
  roomOption: (r, { avail, total, nights, picked }) => (picked = picked && avail, `
    <article class="frame ${avail ? '' : 'is-soldout'} ${picked ? 'is-picked' : ''}">
      <img class="frame__img" src="${r.images[0]}" alt="" loading="lazy">
      <div class="frame__body">
        <p class="frame__meta">${r.bed} · Sleeps ${r.sleeps} · ${r.size} sq ft</p>
        <h3 class="frame__name">${esc(r.name)}</h3>
        <p class="frame__desc">${esc(r.short)}</p>
      </div>
      <div class="frame__deal">
        <p class="frame__rate"><strong>${money(r.rate)}</strong> / night</p>
        <p class="frame__total">${money(total)} for ${plural(nights, 'night')} + tax</p>
        ${
          avail
            ? `<button class="btn ${picked ? 'btn--primary' : 'btn--secondary'}" type="button" data-pick="${r.id}" aria-label="Choose ${esc(r.name)}">${picked ? 'Keep this room' : 'Choose'}</button>`
            : `<p class="frame__sold">Sold out these nights</p><a class="link" href="#/book?step=1">Try other dates</a>`
        }
      </div>
      ${picked ? '<span class="frame__tag">Your pick</span>' : ''}
    </article>`),
  roomsHiddenNotice: (hidden, guests) =>
    `<p class="nnote">${icon('info', 16)} ${hidden} room type${hidden > 1 ? 's are' : ' is'} hidden — ${hidden > 1 ? 'they sleep' : 'it sleeps'} fewer than ${guests} guests.</p>`,
  roomsFull: () => `
    <div class="nempty">
      <p class="nempty__k">House full</p>
      <h3 class="nempty__t">Every room is taken on those nights</h3>
      <p>Move your stay by a day or two — availability changes quickly.</p>
      <a class="btn btn--secondary" href="#/book?step=1">Change dates</a>
    </div>`,

  /* III — three screens: name, contact, arrival + policy. */
  detailsStep: ({ f }) => `
    <form class="qform" novalidate data-form="details" data-qform>
      <fieldset class="q is-on" data-screen="0" aria-labelledby="qd0">
        ${screenNo('III', 1, 3)}
        <h2 class="wizard__title q__title" id="qd0" tabindex="-1">Who’s checking in?</h2>
        <div class="q__pair">${f.first}${f.last}</div>
        ${nav(backLink('#/book?step=2'), nextBtn())}
      </fieldset>
      <fieldset class="q" data-screen="1" aria-labelledby="qd1" hidden>
        ${screenNo('III', 2, 3)}
        <h2 class="q__title" id="qd1" tabindex="-1">How can we reach you?</h2>
        <div class="q__pair">${f.email}${f.phone}</div>
        ${nav(backBtn, nextBtn())}
      </fieldset>
      <fieldset class="q" data-screen="2" aria-labelledby="qd2" hidden>
        ${screenNo('III', 3, 3)}
        <h2 class="q__title" id="qd2" tabindex="-1">Anything we should know?</h2>
        <div class="q__stack">${f.arrival}${f.requests}${f.policy}</div>
        ${nav(backBtn, `<button class="btn btn--primary btn--lg" type="submit">Review booking ${icon('arrow', 18)}</button>`)}
      </fieldset>
    </form>`,

  /* IV — review. */
  reviewStep: ({ d, q, g }) => `
    <div class="q q--review is-on">
      ${screenNo('IV', 1, 1)}
      <h2 class="wizard__title q__title" tabindex="-1">Shall we hold it for you?</h2>
      <dl class="playbill">
        <div><dt>The stay</dt><dd>${longDate(d.checkIn)} – ${longDate(d.checkOut)}<br><span>${plural(q.nights, 'night')} · ${plural(d.guests, 'guest')}</span></dd><dd class="playbill__edit"><a class="link" href="#/book?step=1">Edit<span class="sr-only"> dates</span></a></dd></div>
        <div><dt>The room</dt><dd>${esc(q.room.name)}<br><span>${q.room.bed} · ${money(q.room.rate)} a night</span></dd><dd class="playbill__edit"><a class="link" href="#/book?step=2">Edit<span class="sr-only"> room</span></a></dd></div>
        <div><dt>The guest</dt><dd>${esc(g.first)} ${esc(g.last)}<br><span>${esc(g.email)} · ${esc(g.phone)}<br>Arriving ${g.arrival === 'late' ? 'after 10 pm' : fmtTime(g.arrival)}${g.requests ? `<br>“${esc(g.requests)}”` : ''}</span></dd><dd class="playbill__edit"><a class="link" href="#/book?step=3">Edit<span class="sr-only"> guest details</span></a></dd></div>
      </dl>
      ${priceLines(d, q)}
      <p class="q__small">No payment is taken online — your card is requested at check-in. By confirming you accept our booking policy.</p>
      ${nav(backLink('#/book?step=3'), `<button class="btn btn--primary btn--lg" type="button" data-confirm>Confirm · ${money(q.total, true)}</button>`)}
    </div>`,

  bookingDone: (rec, icsHref) => `
    <section class="stub-wrap">
      <p class="eyebrow">Booking confirmed</p>
      <h2 class="confirm__title" tabindex="-1">See you soon, ${esc(rec.guest.first)}.</h2>
      <p class="stub-lead">Your confirmation is on its way to <strong>${esc(rec.guest.email)}</strong>.</p>
      ${ticket({
        kind: 'Hotel',
        admit: rec.guests,
        what: rec.roomName,
        rows: [
          ['Arrive', `${fitDate(rec.checkIn)}<small>from ${site.checkIn}</small>`],
          ['Depart', `${fitDate(rec.checkOut)}<small>by ${site.checkOut}</small>`],
          ['Nights', rec.nights || nightsBetween(rec.checkIn, rec.checkOut)],
          ['Total · pay at the hotel', money(rec.total, true)],
        ],
        code: rec.code,
      })}
      <div class="stub-actions">
        <a class="btn btn--secondary" href="${icsHref}" download="${rec.code}.ics">${icon('calendar', 18)} Add to calendar</a>
        <a class="btn btn--primary" href="#/reserve">Reserve a table ${icon('arrow', 18)}</a>
      </div>
      <p class="stub-small">Need to change something? <a class="link" href="#/manage?code=${rec.code}">Manage this booking</a></p>
    </section>`,

  notFound: (title, text, cta) => `
    <div class="nempty">
      <p class="nempty__k">House lights up</p>
      <h2 class="confirm__title nempty__t" tabindex="-1">${title}</h2>
      <p>${text}</p>${cta}
    </div>`,

  /* ── TABLE: theatre schedule ─────────────────────────────────────── */
  tableStep: (ctx) => `
    <form class="theatre" novalidate data-form="table">
      <h2 class="wizard__title theatre__title" tabindex="-1">Choose your seating</h2>
      <div class="theatre__grid">
        <div class="theatre__left">
          <div class="party">
            <span class="theatre__k" id="party-l">A table for</span>
            <div class="party__row" role="group" aria-labelledby="party-l">
              <button class="party__btn" type="button" data-q="-1" aria-label="Fewer guests">${icon('minus', 22)}</button>
              <output class="party__out" data-party-out aria-live="polite"></output>
              <button class="party__btn" type="button" data-q="1" aria-label="More guests">${icon('plus', 22)}</button>
            </div>
            <p class="theatre__hint">More than ${WORDS[ctx.maxParty] || ctx.maxParty}? <a class="link" href="#/contact?topic=event">Send an event enquiry</a></p>
          </div>
          <div class="field theatre__date">
            <label class="theatre__k" for="f-date">On</label>
            <div class="datepick">
              <button class="datepick__btn" type="button" data-day="-1" aria-label="Previous evening">${icon('arrowLeft', 18)}</button>
              <div class="datepick__sel"><select class="datepick__select" id="f-date" name="date" aria-describedby="f-date-err">${dayOptions(ctx.t, ctx.max, ctx.date)}</select></div>
              <button class="datepick__btn" type="button" data-day="1" aria-label="Next evening">${icon('arrow', 18)}</button>
            </div>
            <p class="field__error" id="f-date-err" role="alert"></p>
          </div>
        </div>
        <fieldset class="theatre__times">
          <legend class="theatre__k">At</legend>
          <div class="schedule" data-slots></div>
          <p class="field__error" id="slot-err" data-slot-error role="alert"></p>
        </fieldset>
      </div>
      <div class="theatre__go"><button class="btn btn--primary btn--lg" type="submit">Continue ${icon('arrow', 18)}</button></div>
    </form>`,
  partyLabel: (n) => WORDS[n] || String(n),
  tableSlot: (s, { disabled, full, past, checked }) => {
    const [clock, ap] = fmtTime(s).split(' ');
    return `<label class="show ${disabled ? 'is-off' : ''}"><input type="radio" name="time" value="${s}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="show__row"><span class="show__t">${clock}<small>${ap}</small></span><span class="show__act">${seating(s)}</span><span class="show__state">${past ? 'Seating passed' : full ? 'Fully booked' : 'Seats available'}</span></span></label>`;
  },
  tableSlotGroups: () => null,
  tableClosed: (date) => `
    <div class="dark-night">
      <p class="dark-night__k">Dark tonight</p>
      <p>The Kitchen doesn’t serve dinner on ${fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}. Breakfast is walk-in, 7–10:30 am.</p>
      <p class="dark-night__hint">Use the arrows to move to the next evening.</p>
    </div>`,
  tableNoSlots: () => `<p class="nnote">${icon('info', 16)} Every seating is taken this evening. Try another night — or walk in, the bar is first-come.</p>`,
  tableDetailsStep: ({ d, f }) => `
    <form class="qform qform--single" novalidate data-form="rdetails">
      <p class="res-line">${icon('users', 16)} A table for ${WORDS[d.party] || d.party} · ${longDate(d.date)} · ${fmtTime(d.time)} <a class="link" href="#/reserve?step=1">Change</a></p>
      <h2 class="wizard__title q__title" tabindex="-1">Whose name is on the table?</h2>
      <div class="q__pair">${f.first}${f.last}${f.email}${f.phone}</div>
      <div class="q__stack">${f.occasion}${f.notes}</div>
      ${nav(backLink('#/reserve?step=1'), `<button class="btn btn--primary btn--lg" type="submit">Reserve the table</button>`)}
    </form>`,
  tableDone: (rec) => `
    <section class="stub-wrap">
      <p class="eyebrow">Table reserved</p>
      <h2 class="confirm__title" tabindex="-1">Your table is set, ${esc(rec.guest.first)}.</h2>
      <p class="stub-lead">We hold tables for 15 minutes. Running late? Call <a class="link" href="tel:${site.phone.replace(/\D/g, '')}">${site.phone}</a>.</p>
      ${ticket({
        kind: 'The Kitchen',
        admit: rec.party,
        what: 'Dinner in the Kitchen',
        rows: [
          ['Evening', fitDate(rec.date)],
          ['Seating', `${fmtTime(rec.time)}<small>${seating(rec.time)}</small>`],
          ['Party', `${rec.party} ${rec.party === 1 ? 'guest' : 'guests'}`],
          ['Occasion', esc(rec.guest.occasion && rec.guest.occasion !== 'None' ? rec.guest.occasion : '—')],
        ],
        code: rec.code,
        codeLabel: 'Reservation',
      })}
      <div class="stub-actions">
        <a class="btn btn--secondary" href="#/dine">See the carte</a>
        <a class="btn btn--primary" href="#/stay">Make a night of it ${icon('arrow', 18)}</a>
      </div>
      <p class="stub-small"><a class="link" href="#/manage?code=${rec.code}">Change or cancel</a></p>
    </section>`,

  /* ── MANAGE ─────────────────────────────────────────────────────── */
  manageForm: ({ f }) => `
    <form class="qform qform--single lookup" novalidate data-form="lookup">
      <div class="q__pair">${f.code}${f.last}</div>
      ${nav('', `<button class="btn btn--primary btn--lg" type="submit">Find my booking</button>`)}
    </form>
    <div class="manage-result" data-manage-result aria-live="polite"></div>`,
  bookingCard: (rec) => {
    const isStay = rec.type === 'stay';
    const off = rec.status === 'cancelled';
    return `
    <article class="pass ${off ? 'is-void' : ''}">
      <div class="pass__main">
        <p class="pass__k">${isStay ? 'Room booking' : 'Table reservation'} · <span class="pass__status" data-booking-status>${off ? 'Cancelled' : 'Confirmed'}</span></p>
        <h3 class="pass__code" tabindex="-1">${rec.code}${off ? '<span class="sr-only"> — cancelled</span>' : ''}</h3>
        <dl class="pass__rows">
          <div><dt>Name</dt><dd>${esc(rec.guest.first)} ${esc(rec.guest.last)}</dd></div>
          ${
            isStay
              ? `<div><dt>Room</dt><dd>${esc(rec.roomName)}</dd></div><div><dt>Dates</dt><dd>${shortDate(rec.checkIn)} – ${shortDate(rec.checkOut)}</dd></div><div><dt>Total</dt><dd>${money(rec.total, true)}</dd></div>`
              : `<div><dt>Evening</dt><dd>${shortDate(rec.date)} · ${fmtTime(rec.time)}</dd></div><div><dt>Party</dt><dd>${rec.party}</dd></div>`
          }
        </dl>
        ${off ? `<span class="pass__void" aria-hidden="true">Void</span>` : ''}
      </div>
      <div class="pass__foot">
        ${
          off
            ? `<p class="pass__note">This ${isStay ? 'booking' : 'reservation'} was cancelled. <a class="link" href="#/${isStay ? 'book' : 'reserve'}">Make a new one</a></p>`
            : `<p class="pass__note">${isStay ? 'Free cancellation until 48 hours before arrival.' : 'Tables are released to other guests when cancelled.'}</p><button class="btn btn--secondary pass__cancel" type="button" data-cancel>Cancel ${isStay ? 'booking' : 'reservation'}</button>`
        }
      </div>
    </article>`;
  },
  manageNotFound: () => `
    <div class="nempty nempty--inline">
      <p class="nempty__k">No match</p>
      <h3 class="nempty__t">We couldn’t find that booking</h3>
      <p>Check the code in your confirmation email and the last name used to book. Still stuck? Call ${site.phone}.</p>
    </div>`,

  /* ── CONTACT ────────────────────────────────────────────────────── */
  contactForm: ({ topic, f }) => `
    <form class="cform" novalidate data-form="contact">
      <fieldset class="topics">
        <legend class="topics__k">It’s about</legend>
        <div class="topics__row">
          ${[['general', 'A question'], ['event', 'An event'], ['press', 'The press']].map(([v, l]) => `<label class="topic"><input type="radio" name="topic" value="${v}" ${v === topic ? 'checked' : ''}><span>${l}</span></label>`).join('')}
        </div>
      </fieldset>
      <div class="q__stack">
        ${f.name}${f.email}
        <div class="cform__event" data-event-fields ${topic === 'event' ? '' : 'hidden'}><div class="q__pair">${f.eventDate}${f.eventGuests}</div></div>
        ${f.message}
      </div>
      <div class="q__nav q__nav--center"><button class="btn btn--primary btn--lg" type="submit">Send the note</button></div>
    </form>`,
  contactDone: ({ first, isEvent }) => `
    <div class="note-stub">
      <p class="note-stub__k">Message received</p>
      <h3 class="confirm__title" tabindex="-1">Thank you, ${esc(first)}.</h3>
      <p>${isEvent ? 'Our events lead will reply within one business day.' : 'A real person replies to every note within one business day.'}</p>
      <button class="btn btn--secondary" type="button" data-again>Write another</button>
    </div>`,

  /* ── ROOMS: minimal top filter bar over full-screen slides ──────── */
  roomFilters: () => `
    <div class="rbar">
      <div class="rbar__inner">
        <div class="rbar__title"><h1 class="rbar__h">The Rooms</h1><p class="rbar__count" data-count aria-live="polite"></p></div>
        <form class="rbar__form" role="group" aria-label="Filter rooms" data-room-filters onsubmit="return false">
          <div class="rbar__beds" role="group" aria-label="Bed type">
            ${[['all', 'All'], ['king', 'King'], ['queen', 'Queens']].map(([v, l]) => `<button type="button" class="rbar__bed" data-bed="${v}" aria-pressed="${v === 'all'}">${l}</button>`).join('')}
          </div>
          <button class="rbar__refine" type="button" aria-expanded="false" aria-controls="rbar-more" data-refine><svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg><span>Refine</span></button>
          <div class="rbar__more" id="rbar-more">
            <label class="rbar__sel"><span>Guests</span><select name="guests">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}${n === 5 ? '+' : ''}</option>`).join('')}</select></label>
            <label class="rbar__sel"><span>Order</span><select name="sort"><option value="price-asc">Price, low first</option><option value="price-desc">Price, high first</option><option value="size-desc">Most space</option></select></label>
          </div>
        </form>
      </div>
    </div>
    <div class="rslides" data-rooms-grid></div>
    <nav class="rrail" aria-label="Jump to a room" data-rail><ol></ol></nav>`,
  roomsEmpty: ({ guests, bed }) => `
    <div class="rslide rslide--empty empty">
      <div class="rslide__body">
        <p class="rslide__idx">Intermission</p>
        <h2 class="rslide__name">No single room sleeps ${guests}${guests === 5 ? '+' : ''}${bed !== 'all' ? ` with ${bed === 'queen' ? 'queen beds' : 'a king bed'}` : ''}</h2>
        <p class="rslide__short">Book two connecting rooms, or ask us about a group rate for the whole floor.</p>
        <div class="rslide__cta"><button class="btn btn--primary" type="button" data-reset>Clear filters</button><a class="btn btn--secondary" href="#/contact?topic=event">Group enquiry</a></div>
      </div>
    </div>`,
  roomsCount: (n) => `${pad2(n)} ${n === 1 ? 'room' : 'rooms'}`,

  /* ── MENU: dark carte, roman-numeral acts ───────────────────────── */
  menuTools: ({ period }) => `
    <div class="mtools">
      <div class="mtabs" role="tablist" aria-label="Menu">
        ${menu.periods.map((p, i) => `<button class="mtab" role="tab" type="button" id="tab-${p.id}" aria-controls="menu-panel" data-value="${p.id}" aria-selected="${p.id === period}" tabindex="${p.id === period ? 0 : -1}"><span class="mtab__n" aria-hidden="true">${ROMAN[i]}</span><span class="mtab__l">${p.label}</span></button>`).join('')}
      </div>
      <div class="mtools__row">
        <div class="mdiets" role="group" aria-label="Dietary filters">
          ${menu.diets.map((d) => `<button type="button" class="mdiet" data-diet="${d.id}" aria-pressed="false"><span class="mdiet__box" aria-hidden="true"></span>${d.label}</button>`).join('')}
        </div>
        <div class="msearch">
          ${icon('search', 16)}
          <label class="sr-only" for="menu-q">Search the carte</label>
          <input id="menu-q" class="msearch__input" type="search" placeholder="Search the carte" autocomplete="off" data-menu-search>
        </div>
      </div>
    </div>
    <p class="mnote" data-menu-note aria-live="polite"></p>
    <div class="dishes" id="menu-panel" role="tabpanel" tabindex="0" data-menu-list></div>`,
  menuNote: (p, n) => `${p.note} · ${n} dish${n === 1 ? '' : 'es'}`,
  menuEmpty: (q) => `
    <div class="nempty nempty--inline">
      <p class="nempty__k">Nothing on the carte</p>
      <h3 class="nempty__t">No dish matches${q ? ` “${esc(q)}”` : ''}</h3>
      <p>Remove a filter — or tell your server; the Kitchen can adapt most dishes.</p>
      <button class="btn btn--secondary" type="button" data-clear>Clear filters</button>
    </div>`,

  /* ── NEWSLETTER ─────────────────────────────────────────────────── */
  newsletterForm: (label = 'The late list') => `
    <form class="nl" data-newsletter novalidate>
      <div class="field">
        <label class="nl__label" for="f-nlEmail">${label}</label>
        <div class="nl__row">
          <input class="field__input" id="f-nlEmail" name="nlEmail" type="email" autocomplete="email" placeholder="Your email" aria-describedby="f-nlEmail-err">
          <button class="btn btn--secondary" type="submit">Join</button>
        </div>
        <p class="field__error" id="f-nlEmail-err" role="alert"></p>
      </div>
    </form>`,
  newsletterDone: () => `<p class="nl__done" role="status">${icon('check', 18)} You’re on the late list.</p>`,
};

export { pad2 };
