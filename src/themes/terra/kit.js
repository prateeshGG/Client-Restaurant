/* TERRA — UI-kit overrides for every shared flow (see UI-CONTRACT §4).
 * Language: dashed journey paths with sun markers, perforated ticket stubs,
 * postcards with stamps + postmarks, hanging tags and die-cut stickers. */
import { site, images, hours } from '../../content.js';
import { esc, money, fmtDate, fmtTime, icon, nightsBetween, today } from '../../core/util.js';
import { sun, postmark, plate, WHO } from './art.js';

const short = (s) => fmtDate(s, { weekday: 'short', month: 'short', day: 'numeric' });
const long = (s) => fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric' });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* small time-of-day glyphs for the slot groups */
const tod = {
  early: `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="16" r="6" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/></g></svg>`,
  golden: `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M7 22a9 9 0 0 1 18 0z" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 26h26M16 6v4M6 12l2.6 2.6M26 12l-2.6 2.6"/></g></svg>`,
  late: `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M20 5a11 11 0 1 0 7 17A9 9 0 0 1 20 5z" fill="currentColor"/><circle cx="8" cy="7" r="1.4" fill="currentColor"/><circle cx="13" cy="4" r="1" fill="currentColor"/></svg>`,
};

const stamp = (big, small) => `<span class="stamp-w" aria-hidden="true"><span class="stamp"><span class="stamp__in">${sun()}<b>${big}</b><small>${small}</small></span></span></span>`;
const pmDate = () => fmtDate(today(), { month: 'short', day: 'numeric' }).toUpperCase();

/* Perforated ticket stub — the running summary of a stay. */
function ticket(d = {}, q, room) {
  const nights = d.checkIn && d.checkOut ? nightsBetween(d.checkIn, d.checkOut) : 0;
  return `
  <aside class="ticket" aria-label="Your stay so far">
    <div class="ticket__main">
      <p class="ticket__brand">${sun()}<span>Scioto House</span><em>Admit ${d.guests || '—'}</em></p>
      <dl class="ticket__grid">
        <div><dt>Arrive</dt><dd>${d.checkIn ? short(d.checkIn) : '—'}</dd></div>
        <div><dt>Depart</dt><dd>${d.checkOut ? short(d.checkOut) : '—'}</dd></div>
        <div><dt>Nights</dt><dd>${nights || '—'}</dd></div>
        <div><dt>Guests</dt><dd>${d.guests || '—'}</dd></div>
        <div class="ticket__wide"><dt>Room</dt><dd>${room ? esc(room.name) : 'Not chosen yet'}</dd></div>
      </dl>
    </div>
    <div class="ticket__tear" aria-hidden="true"></div>
    <div class="ticket__stub">
      ${q ? T.priceLines(d, q) : '<p class="ticket__empty">Your total appears here once you choose a room.</p>'}
      <p class="ticket__note">${icon('check', 14)} Free cancellation until 48 h before arrival</p>
      <p class="ticket__serial" aria-hidden="true">No. ${(d.checkIn || '').replace(/-/g, '') || '00000000'}-${d.guests || 0}</p>
    </div>
  </aside>`;
}

const T = {
  /* ── Journey path stepper: dashed route with sun markers ── */
  stepper: (steps, current, base) => `
  <nav class="journey" aria-label="Progress" style="--n:${steps.length};--at:${current - 1}">
    <ol class="journey__list">
      ${steps
        .map((s, i) => {
          const n = i + 1;
          const st = n < current ? 'done' : n === current ? 'current' : 'todo';
          const mark = st === 'done' ? icon('check', 16) : st === 'current' ? sun('journey__sun') : `<span>${n}</span>`;
          const inner = `<span class="journey__mark" aria-hidden="true">${mark}</span><span class="journey__label"><small>Stop ${n}</small> ${s}</span>`;
          return `<li class="journey__stop is-${st}">${
            st === 'done'
              ? `<a class="journey__btn" href="${base}?step=${n}" aria-label="Step ${n}: ${s} (completed, edit)">${inner}</a>`
              : `<span class="journey__btn" ${st === 'current' ? 'aria-current="step"' : ''}>${inner}</span>`
          }</li>`;
        })
        .join('')}
    </ol>
  </nav>`,

  wizardShell: ({ kind, stepperHTML, main, d = {}, q, room }) =>
    kind === 'book'
      ? `
    ${stepperHTML}
    <div class="trip">
      <div class="trip__main">${main}</div>
      <div class="trip__side">
        <figure class="trip__photo">
          <div class="arch trip__arch"><img src="${room ? room.images[0] : images.lobby}" alt="${room ? esc(room.name) : 'The brick-walled lobby at Scioto House'}"></div>
          <figcaption class="hand">${room ? `your room — ${esc(room.name)}` : 'your room will appear here'}</figcaption>
        </figure>
        ${ticket(d, q, room)}
      </div>
    </div>`
      : `${stepperHTML}<div class="res">${main}</div>`,

  summary: (d, q, room) => ticket(d, q, room),

  priceLines: (d, q) => `
    <dl class="ticket__lines">
      <div><dt>${money(q.room.rate)} × ${plural(q.nights, 'night')}</dt><dd>${money(q.subtotal, true)}</dd></div>
      ${q.discount ? `<div class="is-discount"><dt>Code ${esc(d.promo)} (−${Math.round(q.pct * 100)}%)</dt><dd>−${money(q.discount, true)}</dd></div>` : ''}
      <div><dt>Lodging tax ${(site.lodgingTaxRate * 100).toFixed(1)}%</dt><dd>${money(q.tax, true)}</dd></div>
      <div class="ticket__total"><dt>Total</dt><dd>${money(q.total, true)}</dd></div>
    </dl>`,

  /* ── Booking steps ── */
  datesStep: ({ f }) => `
    <form class="form tform" novalidate data-form="dates">
      <h2 class="wizard__title" tabindex="-1">When are you coming?</h2>
      <p class="tform__lead">First stop — your dates. Rooms and prices appear on the next stop.</p>
      <div class="form__grid tform__dates">${f.checkIn}${f.checkOut}</div>
      <div class="form__grid tform__more">${f.guests}${f.promo}</div>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">See rooms for these dates ${icon('arrow', 18)}</button></div>
    </form>`,

  roomsStep: ({ d, nights }) => `
    <h2 class="wizard__title" tabindex="-1">Choose your room</h2>
    <p class="wizard__lead tlead">${icon('calendar', 16)} ${short(d.checkIn)} → ${short(d.checkOut)} · ${plural(nights, 'night')} · ${plural(d.guests, 'guest')} <a class="link" href="#/book?step=1">Change</a></p>
    <div class="opts" data-room-options aria-busy="true">${T.roomsLoading()}</div>`,
  roomsLoading: () =>
    Array.from({ length: 3 }, () => `<div class="opt opt--ghost" aria-hidden="true"><span class="opt__arch skeleton"></span><span class="opt__lines"><span class="skeleton"></span><span class="skeleton"></span></span></div>`).join(''),

  roomOption: (r, { avail, total, nights, picked }) => `
    <article class="opt ${avail ? '' : 'is-soldout'} ${picked ? 'is-picked' : ''}">
      <div class="arch opt__arch"><img src="${r.images[0]}" alt="${esc(r.name)}" loading="lazy"></div>
      <div class="opt__body">
        <p class="opt__tags"><span>${esc(r.bed)}</span><span>Sleeps ${r.sleeps}</span><span>${r.size} ft²</span></p>
        <h3 class="opt__name">${esc(r.name)}</h3>
        ${picked ? `<p class="opt__pick hand">your last pick</p>` : ''}
        <p class="opt__desc">${esc(r.short)}</p>
      </div>
      <div class="opt__price">
        <p class="opt__rate"><strong>${money(r.rate)}</strong> / night</p>
        <p class="opt__total">${money(total)} for ${plural(nights, 'night')} + tax</p>
        ${
          avail
            ? `<button class="btn btn--primary" type="button" data-pick="${r.id}" aria-label="Choose ${esc(r.name)}">Choose</button>`
            : `<p class="opt__sold">Sold out</p><a class="link" href="#/book?step=1">Try other dates</a>`
        }
      </div>
    </article>`,
  roomsHiddenNotice: (hidden, guests) =>
    `<p class="note-strip">${icon('info', 16)} <span>${plural(hidden, 'room type')} ${hidden > 1 ? 'are' : 'is'} tucked away — ${hidden > 1 ? 'they sleep' : 'it sleeps'} fewer than ${guests}.</span></p>`,
  roomsFull: () =>
    `<div class="note-card">${sun()}<h3>We’re full on those dates</h3><p>Try shifting your stay by a day or two — rooms free up quickly.</p><a class="btn btn--secondary" href="#/book?step=1">Change dates</a></div>`,

  detailsStep: ({ f }) => `
    <form class="form tform" novalidate data-form="details">
      <h2 class="wizard__title" tabindex="-1">Who’s travelling?</h2>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}</div>
      <p class="tform__sub">${sun()} Arrival</p>
      <div class="form__grid">${f.arrival}${f.requests}${f.policy}</div>
      <div class="form__actions">
        <a class="btn btn--ghost" href="#/book?step=2">${icon('arrowLeft', 18)} Back</a>
        <button class="btn btn--primary btn--lg" type="submit">Review your trip ${icon('arrow', 18)}</button>
      </div>
    </form>`,

  reviewStep: ({ d, q, g }) => `
    <h2 class="wizard__title" tabindex="-1">Check your itinerary</h2>
    <ol class="itin">
      <li class="itin__leg"><span class="itin__dot" aria-hidden="true">${sun()}</span><div class="itin__body">
        <div class="itin__head"><h3>The stay</h3><a class="link" href="#/book?step=1">Edit<span class="sr-only"> dates</span></a></div>
        <p>${fmtDate(d.checkIn)} → ${fmtDate(d.checkOut)}<br>${plural(q.nights, 'night')} · ${plural(d.guests, 'guest')}</p></div></li>
      <li class="itin__leg"><span class="itin__dot" aria-hidden="true">${sun()}</span><div class="itin__body">
        <div class="itin__head"><h3>The room</h3><a class="link" href="#/book?step=2">Edit<span class="sr-only"> room</span></a></div>
        <p>${esc(q.room.name)} · ${esc(q.room.bed)}<br>${money(q.room.rate)} per night</p></div></li>
      <li class="itin__leg"><span class="itin__dot" aria-hidden="true">${sun()}</span><div class="itin__body">
        <div class="itin__head"><h3>The traveller</h3><a class="link" href="#/book?step=3">Edit<span class="sr-only"> guest details</span></a></div>
        <p>${esc(g.first)} ${esc(g.last)}<br>${esc(g.email)} · ${esc(g.phone)}<br>Arriving ${g.arrival === 'late' ? 'after 10 pm' : fmtTime(g.arrival)}${g.requests ? `<br><span class="hand">“${esc(g.requests)}”</span>` : ''}</p></div></li>
    </ol>
    <p class="itin__small">No payment is taken online — your card is requested at check-in. By confirming you accept our booking policy.</p>
    <div class="form__actions">
      <a class="btn btn--ghost" href="#/book?step=3">${icon('arrowLeft', 18)} Back</a>
      <button class="btn btn--primary btn--lg" type="button" data-confirm>Confirm booking · ${money(q.total, true)}</button>
    </div>`,

  /* ── Postcard confirmations ── */
  bookingDone: (rec, icsHref) => `
    <section class="sent">
      <article class="postcard postcard--sent">
        <div class="postcard__msg">
          <p class="eyebrow">Booking confirmed</p>
          <h2 class="confirm__title" tabindex="-1">See you soon, ${esc(rec.guest.first)}.</h2>
          <p class="hand postcard__script">${/^the\s/i.test(rec.roomName) ? '' : 'The '}${esc(rec.roomName)} is yours from ${long(rec.checkIn)}. We’ll have a glass of something local and your key ready from ${site.checkIn}.</p>
          <p class="postcard__small">A confirmation is on its way to <strong>${esc(rec.guest.email)}</strong>.</p>
          <p class="hand postcard__sign">— the front desk</p>
        </div>
        <div class="postcard__back">
          <div class="postcard__corner">${postmark(pmDate(), 'postcard__pm')}${stamp('Stay', `Est. ${site.since}`)}</div>
          <dl class="postcard__lines">
            <div><dt>Code</dt><dd class="postcard__code" data-code>${rec.code}</dd></div>
            <div><dt>Room</dt><dd>${esc(rec.roomName)}</dd></div>
            <div><dt>Dates</dt><dd>${short(rec.checkIn)} → ${short(rec.checkOut)}</dd></div>
            <div><dt>Guests</dt><dd>${rec.guests}</dd></div>
            <div><dt>Pay at hotel</dt><dd>${money(rec.total, true)}</dd></div>
          </dl>
        </div>
      </article>
      <div class="sent__actions">
        <a class="btn btn--secondary" href="${icsHref}" download="${rec.code}.ics">${icon('calendar', 18)} Add to calendar</a>
        <a class="btn btn--primary" href="#/reserve">Reserve a table for your stay ${icon('arrow', 18)}</a>
      </div>
      <p class="sent__small">Need to change something? <a class="link" href="#/manage?code=${rec.code}">Manage this booking</a></p>
    </section>`,
  notFound: (title, text, cta) => `<div class="note-card">${icon('info', 26)}<h2 class="confirm__title" tabindex="-1">${title}</h2><p>${text}</p>${cta}</div>`,

  /* ── Table reservation: place-setting party picker, hanging day tags, sticker time slots ── */
  tableStep: (ctx) => `
    <form class="form tres" novalidate data-form="table">
      <h2 class="wizard__title" tabindex="-1">A table in the Kitchen</h2>
      <fieldset class="tres__block">
        <legend class="tres__legend"><span>How many at the table?</span><output class="tres__out" data-party-out aria-live="polite"></output></legend>
        <div class="ruler">
          <label class="sr-only" for="party-range">Number of guests</label>
          <input class="ruler__range" id="party-range" type="range" name="party" min="1" max="${ctx.maxParty}" step="1" value="${ctx.party}"
            style="--p:${((ctx.party - 1) / (ctx.maxParty - 1)) * 100}%"
            oninput="this.style.setProperty('--p', ((this.value - 1) / (this.max - 1)) * 100 + '%'); this.form.querySelector('[data-party-out]').textContent = 'Table for ' + this.value; this.setAttribute('aria-valuetext', this.value + ' guests')"
            aria-valuetext="${ctx.party} guests">
          <ol class="ruler__ticks" aria-hidden="true">${Array.from({ length: ctx.maxParty }, (_, i) => `<li>${i + 1}</li>`).join('')}</ol>
        </div>
        <p class="field__hint">More than ${ctx.maxParty}? <a class="link" href="#/contact?topic=event">Send an event enquiry</a>.</p>
      </fieldset>
      <fieldset class="tres__block" data-field>
        <legend class="tres__legend"><span>Which day?</span><small class="tres__legend-note">Next three weeks</small></legend>
        <div class="daytags">
          <button type="button" class="daytags__nav" data-days-scroll="-1" aria-label="Show earlier dates">${icon('arrowLeft', 18)}</button>
          <div class="daytags__scroll" data-days>
            ${ctx.days
              .map(
                (d) => `<label class="daytag ${d.closed ? 'is-closed' : ''}"><input type="radio" name="date" value="${d.iso}" ${d.iso === ctx.date ? 'checked' : ''} aria-label="${d.label}${d.today ? ', today' : ''}${d.closed ? ', closed for dinner' : ''}"><span class="daytag__face" aria-hidden="true"><small>${d.today ? 'Today' : d.dow}</small><b>${d.day}</b><small>${d.closed ? 'Closed' : d.month}</small></span></label>`
              )
              .join('')}
          </div>
          <button type="button" class="daytags__nav" data-days-scroll="1" aria-label="Show later dates">${icon('arrow', 18)}</button>
        </div>
        <p class="field__error" role="alert"></p>
      </fieldset>
      <fieldset class="tres__block">
        <legend class="tres__legend"><span>What time?</span></legend>
        <div class="slotgroups" data-slots></div>
        <p class="field__error" id="slot-err" data-slot-error role="alert"></p>
      </fieldset>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Continue ${icon('arrow', 18)}</button></div>
    </form>`,
  partyLabel: (n) => `Table for ${n}`,
  tableSlot: (s, { disabled, full, past, checked }) => {
    const [h, m] = s.split(':');
    const hh = ((+h + 11) % 12) + 1;
    return `<label class="sticker ${disabled ? 'is-off' : ''}"><input type="radio" name="time" value="${s}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="sticker__face" aria-hidden="true"><b>${hh}:${m}</b><small>${full ? 'Full' : past ? 'Gone' : +h >= 12 ? 'pm' : 'am'}</small></span><span class="sr-only">${fmtTime(s)}${full ? ', fully booked' : past ? ', already passed' : ''}</span></label>`;
  },
  tableSlotGroups: (state) =>
    [
      { key: 'early', label: 'Early', test: (s) => s < '18:00' },
      { key: 'golden', label: 'Golden hour', test: (s) => s >= '18:00' && s < '20:00' },
      { key: 'late', label: 'Late', test: (s) => s >= '20:00' },
    ]
      .map((g) => {
        const items = state.filter((x) => g.test(x.s));
        const range = items.length ? `${fmtTime(items[0].s)} – ${fmtTime(items[items.length - 1].s)}` : '';
        return {
          items,
          render: (inner) => `
          <div class="slotgroup slotgroup--${g.key}" role="group" aria-labelledby="sg-${g.key}">
            <p class="slotgroup__h" id="sg-${g.key}"><span class="slotgroup__icon">${tod[g.key]}</span><span>${g.label}</span><small>${range}</small></p>
            <div class="slotgroup__row">${inner}</div>
          </div>`,
        };
      })
      .filter((g) => g.items.length),
  tableClosed: (date) => {
    const bf = hours.find((h) => /breakfast/i.test(h.label));
    return `<p class="note-strip">${icon('info', 16)} <span>The Kitchen is closed for dinner on ${long(date)}.${bf ? ` Breakfast is still served ${bf.time} — no booking needed.` : ''} Try another day tag above.</span></p>`;
  },
  tableNoSlots: () => `<p class="note-strip">${icon('info', 16)} <span>No tables left on this day. Pick another tag — or walk in, the bar is first-come.</span></p>`,
  tableDetailsStep: ({ d, f }) => `
    <form class="form tres" novalidate data-form="rdetails">
      <h2 class="wizard__title" tabindex="-1">Almost there</h2>
      <ul class="chosen" aria-label="Your table">
        <li>${icon('users', 16)} Table for ${d.party}</li>
        <li>${icon('calendar', 16)} ${long(d.date)}</li>
        <li>${icon('clock', 16)} ${fmtTime(d.time)}</li>
        <li><a class="link" href="#/reserve?step=1">Change</a></li>
      </ul>
      <div class="form__grid">${f.first}${f.last}${f.email}${f.phone}${f.occasion}${f.notes}</div>
      <div class="form__actions">
        <a class="btn btn--ghost" href="#/reserve?step=1">${icon('arrowLeft', 18)} Back</a>
        <button class="btn btn--primary btn--lg" type="submit">Reserve the table</button>
      </div>
    </form>`,
  tableDone: (rec) => `
    <section class="sent">
      <article class="postcard postcard--sent">
        <div class="postcard__msg">
          <p class="eyebrow">Table reserved</p>
          <h2 class="confirm__title" tabindex="-1">Your table is set, ${esc(rec.guest.first)}.</h2>
          <p class="hand postcard__script">${long(rec.date)} at ${fmtTime(rec.time)} — candles lit, bread warm, a table for ${rec.party}.</p>
          <p class="postcard__small">We hold tables for 15 minutes. Running late? Call <a class="link" href="tel:${site.phone.replace(/\D/g, '')}">${site.phone}</a>.</p>
          <p class="hand postcard__sign">— the Kitchen</p>
        </div>
        <div class="postcard__back">
          <div class="postcard__corner">${postmark(pmDate(), 'postcard__pm')}${stamp('Supper', 'The Kitchen')}</div>
          <dl class="postcard__lines">
            <div><dt>Code</dt><dd class="postcard__code" data-code>${rec.code}</dd></div>
            <div><dt>Party</dt><dd>${plural(rec.party, 'guest')}</dd></div>
            <div><dt>Day</dt><dd>${short(rec.date)}</dd></div>
            <div><dt>Time</dt><dd>${fmtTime(rec.time)}</dd></div>
          </dl>
        </div>
      </article>
      <div class="sent__actions">
        <a class="btn btn--secondary" href="#/dine">See the menu</a>
        <a class="btn btn--primary" href="#/stay">Make it a night — see rooms ${icon('arrow', 18)}</a>
      </div>
      <p class="sent__small"><a class="link" href="#/manage?code=${rec.code}">Change or cancel</a></p>
    </section>`,

  /* ── Manage: luggage-tag lookup, ticket result with rubber-stamp status ── */
  manageForm: ({ f }) => `
    <div class="lookup">
      <form class="lookup__tag" novalidate data-form="lookup">
        <span class="lookup__hole" aria-hidden="true"></span>
        <p class="lookup__title">${sun()} Luggage tag</p>
        <p class="lookup__lead">Your code is on your confirmation postcard (email), e.g. SH-AB12CD.</p>
        <div class="form__grid">${f.code}${f.last}</div>
        <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Find my booking</button></div>
      </form>
      <div class="lookup__result" data-manage-result aria-live="polite"></div>
    </div>`,
  bookingCard: (rec) => {
    const isStay = rec.type === 'stay';
    const off = rec.status === 'cancelled';
    return `
    <article class="ticket ticket--card ${off ? 'is-cancelled' : ''}">
      <div class="ticket__main">
        <p class="ticket__brand">${sun()}<span>${isStay ? 'Room booking' : 'Table reservation'}</span></p>
        <h3 class="ticket__code">${rec.code}</h3>
        <span class="rubber rubber--${rec.status}" data-booking-status>${off ? 'Cancelled' : 'Confirmed'}</span>
        <dl class="ticket__grid">
          <div class="ticket__wide"><dt>Name</dt><dd>${esc(rec.guest.first)} ${esc(rec.guest.last)}</dd></div>
          ${
            isStay
              ? `<div class="ticket__wide"><dt>Room</dt><dd>${esc(rec.roomName)}</dd></div><div><dt>Arrive</dt><dd>${short(rec.checkIn)}</dd></div><div><dt>Depart</dt><dd>${short(rec.checkOut)}</dd></div>`
              : `<div><dt>Day</dt><dd>${short(rec.date)}</dd></div><div><dt>Time</dt><dd>${fmtTime(rec.time)}</dd></div><div><dt>Party</dt><dd>${rec.party}</dd></div>`
          }
        </dl>
      </div>
      <div class="ticket__tear" aria-hidden="true"></div>
      <div class="ticket__stub">
        ${isStay ? `<p class="ticket__sum"><span>Total, pay at hotel</span><strong>${money(rec.total, true)}</strong></p>` : ''}
        ${
          off
            ? `<p class="note-strip">${icon('info', 16)} <span>This ${isStay ? 'booking' : 'reservation'} was cancelled. <a class="link" href="#/${isStay ? 'book' : 'reserve'}">Make a new one</a></span></p>`
            : `<div class="ticket__actions"><button class="btn btn--danger" type="button" data-cancel>Cancel ${isStay ? 'booking' : 'reservation'}</button></div>`
        }
      </div>
    </article>`;
  },
  manageNotFound: () =>
    `<div class="note-card note-card--inline">${icon('search', 24)}<h3>No booking matches those details</h3><p>Check the code on your confirmation and the last name used to book. Still stuck? Call ${site.phone}.</p></div>`,

  /* ── Contact: letter-style form on the back of a postcard ── */
  contactForm: ({ topic, f }) => `
    <form class="letter" novalidate data-form="contact">
      <p class="letter__date hand">${fmtDate(today(), { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p class="letter__dear">Dear Scioto House,</p>
      <fieldset class="letter__topic">
        <legend class="field__label">I’m writing about</legend>
        <div class="letter__stamps">
          ${[['general', 'A question', 'general'], ['event', 'An event or group', 'event'], ['press', 'Press', 'press']]
            .map(([v, l]) => `<label class="topic-stamp"><input type="radio" name="topic" value="${v}" ${v === topic ? 'checked' : ''}><span>${l}</span></label>`)
            .join('')}
        </div>
      </fieldset>
      <div class="letter__event" data-event-fields ${topic === 'event' ? '' : 'hidden'}>
        <div class="form__grid">${f.eventDate}${f.eventGuests}</div>
      </div>
      <div class="letter__body">${f.message}</div>
      <div class="letter__from">
        <p class="letter__yours hand">Yours,</p>
        <div class="form__grid">${f.name}${f.email}</div>
      </div>
      <div class="form__actions"><button class="btn btn--primary btn--lg" type="submit">Post the letter ${icon('arrow', 18)}</button></div>
    </form>`,
  contactDone: ({ first, isEvent }) => `
    <div class="letter-sent">
      <h3 class="confirm__title" tabindex="-1">Posted — thank you, ${esc(first)}.</h3>
      <p class="hand">${isEvent ? 'Our events lead will write back within one business day.' : 'A real person writes back within one business day.'}</p>
      <button class="btn btn--secondary" type="button" data-again>Write another letter</button>
    </div>`,

  /* ── Rooms browser: "Who's coming?" quiz + bed tags ── */
  roomFilters: () => `
    <form class="quiz" data-room-filters onsubmit="return false" aria-label="Find your room">
      <fieldset class="quiz__who">
        <legend class="quiz__q"><span class="quiz__n">1</span> Who’s coming?</legend>
        <div class="quiz__cards">
          ${WHO.map((w) => `<label class="who who--${w.key}"><input type="radio" name="guests" value="${w.v}"><span class="who__card">${w.art}<strong>${w.title}</strong><small>${w.sub}</small></span></label>`).join('')}
        </div>
        <p class="quiz__more">Five or more? <a class="link" href="#/contact?topic=event">Plan a group stay</a>.</p>
      </fieldset>
      <div class="quiz__row">
        <fieldset class="quiz__beds">
          <legend class="quiz__q"><span class="quiz__n">2</span> Which bed?</legend>
          <div class="bedtags">
            ${[['all', 'Any bed'], ['king', 'King'], ['queen', 'Two queens']].map(([v, l]) => `<label class="bedtag"><input type="radio" name="bed" value="${v}" ${v === 'all' ? 'checked' : ''}><span>${l}</span></label>`).join('')}
          </div>
        </fieldset>
        <div class="quiz__sort">
          <label class="quiz__q" for="rf-s"><span class="quiz__n">3</span> Sort by</label>
          <div class="field__select"><select class="field__input" id="rf-s" name="sort">
            <option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option><option value="size-desc">Most space</option>
          </select></div>
        </div>
      </div>
    </form>
    <p class="quiz__count hand" data-count aria-live="polite"></p>
    <div class="arch-grid" data-rooms-grid></div>`,
  roomsEmpty: ({ guests, bed }) =>
    `<div class="note-card">${sun()}<h3>No single room sleeps ${guests}${bed !== 'all' ? ` with ${bed === 'queen' ? 'queen beds' : 'a king bed'}` : ''}</h3><p>Book two neighbouring rooms, or ask us about a group rate.</p><div class="note-card__actions"><button class="btn btn--secondary" type="button" data-reset>Start the quiz again</button><a class="btn btn--ghost" href="#/contact?topic=event">Group enquiry</a></div></div>`,
  roomsCount: (n) => (n ? `${n} room${n === 1 ? '' : 's'} to fall for ↓` : 'Nothing fits — yet'),

  /* ── Menu: kraft market board ── */
  menuTools: ({ period, periods, diets }) => `
    <div class="board__head">
      <p class="board__title"><span>Market board</span><em class="hand">chalked up daily</em></p>
      <div class="board__tabs" role="tablist" aria-label="Menu">
        ${periods.map((p) => `<button class="board__tab" role="tab" type="button" id="tab-${p.id}" aria-controls="menu-panel" data-value="${p.id}" aria-selected="${p.id === period}" tabindex="${p.id === period ? 0 : -1}">${p.label}</button>`).join('')}
      </div>
    </div>
    <div class="board__tools">
      <div class="board__diets" role="group" aria-label="Dietary filters">
        ${diets.map((d) => `<button type="button" class="diet-stamp" data-diet="${d.id}" aria-pressed="false"><b aria-hidden="true">${d.id.toUpperCase()}</b>${d.label}</button>`).join('')}
      </div>
      <div class="board__search">
        ${icon('search', 18)}
        <label class="sr-only" for="menu-q">Search the menu</label>
        <input id="menu-q" type="search" placeholder="Search the board…" autocomplete="off" data-menu-search>
      </div>
    </div>
    <p class="board__note hand" data-menu-note aria-live="polite"></p>
    <div class="board__body">
      <div class="board__list" id="menu-panel" role="tabpanel" tabindex="0" data-menu-list></div>
      <div class="board__shelf" aria-hidden="true"><p class="hand">hover or tab to a dish — its photo slides out here</p></div>
    </div>`,
  menuNote: (p, n) => `${p.label} · ${p.note} · ${n} dish${n === 1 ? '' : 'es'}`,
  menuEmpty: (q) =>
    `<div class="note-card note-card--board">${icon('plate', 26)}<h3>Nothing on the board${q ? ` for “${esc(q)}”` : ''}</h3><p>Try removing a filter — or ask your server, the Kitchen can adapt most dishes.</p><button class="btn btn--secondary" type="button" data-clear>Wipe the filters</button></div>`,
};

export default T;
export { ticket, stamp, pmDate };
