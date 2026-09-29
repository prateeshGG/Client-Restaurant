/* Shared, fully-working product flows. ALL markup comes from the UI kit (core/kit.js),
 * which each design option can override; the logic here only binds to data-* hooks and
 * form control names (see 04-architecture/UI-CONTRACT.md). */
import { site, rooms, menu, reservations as resCfg } from '../content.js';
import { esc, today, addDays, nightsBetween, fmtDate, fmtTime, code, sleep, icon, $, $$, debounce, columbusNow } from './util.js';
import { field, select, checkbox, validate, liveClear, setError } from './forms.js';
import { saveRecord, findRecord, cancelRecord, roomAvailable, slotFull, isClosed, getRecord, saveMessage, saveSubscriber, listRecords, ensureDemoRecord } from './store.js';
import { toast, confirmDialog, setupTabs, setBusy, lightbox } from './ui.js';
import { navigate } from './router.js';
import { UI } from './kit.js';

const DRAFT = 'sh:draft';
const RDRAFT = 'sh:rdraft';
const getDraft = (k) => {
  try {
    return JSON.parse(sessionStorage.getItem(k)) || {};
  } catch {
    return {};
  }
};
const setDraft = (k, d) => sessionStorage.setItem(k, JSON.stringify(d));
const ctl = (form, name) => {
  const c = form.elements[name];
  return c && typeof c.length === 'number' && !c.tagName ? c[0] : c; // RadioNodeList → first control
};

export const stepper = (...a) => UI.stepper(...a);

/* ───────────────────────────── ROOM PRICING ───────────────────────────── */
export function quote(d) {
  const room = rooms.find((r) => r.id === d.roomId);
  if (!room || !d.checkIn || !d.checkOut) return null;
  const nights = nightsBetween(d.checkIn, d.checkOut);
  const subtotal = room.rate * nights;
  const pct = d.promo ? site.promoCodes[d.promo] || 0 : 0;
  const discount = Math.round(subtotal * pct * 100) / 100;
  const tax = Math.round((subtotal - discount) * site.lodgingTaxRate * 100) / 100;
  return { room, nights, subtotal, discount, tax, total: subtotal - discount + tax, pct };
}

/* ───────────────────────────── BOOKING WIZARD ─────────────────────────── */
export const BSTEPS = ['Dates', 'Room', 'Details', 'Review'];
const ARRIVALS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export function bookingWizard(host, query) {
  const d = getDraft(DRAFT);
  if (query.in) d.checkIn = query.in;
  if (query.out) d.checkOut = query.out;
  if (query.guests) d.guests = +query.guests;
  if (query.room && rooms.some((r) => r.id === query.room)) d.roomId = query.room;
  if (query.in || query.room) setDraft(DRAFT, d);

  if (query.done) return renderDone(host, query.done);

  let step = Math.min(4, Math.max(1, +query.step || 1));
  const datesOk = d.checkIn && d.checkOut && d.guests;
  const roomOk = datesOk && d.roomId && roomAvailable(d.roomId, d.checkIn, d.checkOut) && rooms.find((r) => r.id === d.roomId)?.sleeps >= d.guests;
  const detailsOk = roomOk && d.guest && d.guest.email;
  if (step > 1 && !datesOk) step = 1;
  else if (step > 2 && !roomOk) step = 2;
  else if (step > 3 && !detailsOk) step = 3;
  if (step !== (+query.step || 1)) return navigate(`/book?step=${step}`, { replace: true });

  const room = rooms.find((r) => r.id === d.roomId);
  const shell = (main, withSummary = true) =>
    UI.wizardShell({
      kind: 'book',
      step,
      steps: BSTEPS,
      stepperHTML: UI.stepper(BSTEPS, step, '#/book'),
      main,
      aside: withSummary ? UI.summary(d, quote(d), room) : '',
      d,
      q: quote(d),
      room,
    });

  if (step === 1) {
    const t = today();
    const f = {
      checkIn: field({ name: 'checkIn', label: 'Check-in', type: 'date', value: d.checkIn || t, required: true, attrs: `min="${t}"` }),
      checkOut: field({ name: 'checkOut', label: 'Check-out', type: 'date', value: d.checkOut || addDays(d.checkIn || t, 1), required: true, attrs: `min="${addDays(t, 1)}"` }),
      guests: select({ name: 'guests', label: 'Guests', value: d.guests || 2, required: true, options: [1, 2, 3, 4].map((n) => ({ value: n, label: `${n} guest${n > 1 ? 's' : ''}` })), hint: 'Travelling with 5+? Book two rooms or contact us.' }),
      promo: field({ name: 'promo', label: 'Promo code', value: d.promo || '', hint: 'Try FOUNDING for 15% off.', attrs: 'autocapitalize="characters" spellcheck="false"' }),
    };
    host.innerHTML = shell(UI.datesStep({ d, t, f, values: { checkIn: d.checkIn || t, checkOut: d.checkOut || addDays(d.checkIn || t, 1), guests: d.guests || 2, promo: d.promo || '' } }), !!d.roomId);
    const form = $('[data-form=dates]', host);
    liveClear(form);
    const ci = ctl(form, 'checkIn');
    const co = ctl(form, 'checkOut');
    ci.addEventListener('change', () => {
      co.min = addDays(ci.value, 1);
      if (!co.value || co.value <= ci.value) co.value = addDays(ci.value, 1);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { ok, values } = validate(form, {
        checkIn: ['required', (v) => (v < today() ? 'Check-in can’t be in the past.' : '')],
        checkOut: ['required', (v, all) => (v <= all.checkIn ? 'Check-out must be after check-in.' : nightsBetween(all.checkIn, v) > 30 ? 'For stays over 30 nights, please contact us.' : '')],
        promo: [(v) => (!v || site.promoCodes[String(v).trim().toUpperCase()] ? '' : 'That code isn’t valid. Check spelling or leave it blank.')],
      });
      if (!ok) return;
      Object.assign(d, { checkIn: values.checkIn, checkOut: values.checkOut, guests: +values.guests || 2, promo: String(values.promo || '').trim().toUpperCase() || '' });
      setDraft(DRAFT, d);
      navigate('/book?step=2');
    });
    return;
  }

  if (step === 2) {
    const nights = nightsBetween(d.checkIn, d.checkOut);
    host.innerHTML = shell(UI.roomsStep({ d, nights }));
    const list = $('[data-room-options]', host);
    sleep(650).then(() => {
      if (!host.isConnected) return;
      const fits = rooms.filter((r) => r.sleeps >= d.guests);
      const hidden = rooms.length - fits.length;
      list.removeAttribute('aria-busy');
      list.innerHTML =
        fits.map((r) => UI.roomOption(r, { avail: roomAvailable(r.id, d.checkIn, d.checkOut), total: r.rate * nights, nights, picked: d.roomId === r.id, d })).join('') +
        (hidden ? UI.roomsHiddenNotice(hidden, d.guests) : '') +
        (!fits.some((r) => roomAvailable(r.id, d.checkIn, d.checkOut)) ? UI.roomsFull() : '');
      $$('[data-pick]', list).forEach((b) =>
        b.addEventListener('click', () => {
          d.roomId = b.dataset.pick;
          setDraft(DRAFT, d);
          navigate('/book?step=3');
        })
      );
    });
    return;
  }

  if (step === 3) {
    const g = d.guest || {};
    const f = {
      first: field({ name: 'first', label: 'First name', value: g.first, required: true, autocomplete: 'given-name' }),
      last: field({ name: 'last', label: 'Last name', value: g.last, required: true, autocomplete: 'family-name' }),
      email: field({ name: 'email', label: 'Email', type: 'email', value: g.email, required: true, autocomplete: 'email', hint: 'We’ll send your confirmation here.' }),
      phone: field({ name: 'phone', label: 'Mobile phone', type: 'tel', value: g.phone, required: true, autocomplete: 'tel', hint: 'For arrival-day texts only.' }),
      arrival: select({ name: 'arrival', label: 'Estimated arrival', value: g.arrival || '15:00', options: ARRIVALS.map((t) => ({ value: t, label: fmtTime(t) })).concat([{ value: 'late', label: 'After 10 pm' }]) }),
      requests: field({ name: 'requests', label: 'Special requests', type: 'textarea', value: g.requests, full: true, hint: 'Allergies, celebrations, dog in tow, early check-in…' }),
      policy: checkbox({ name: 'policy', label: `I agree to the booking policy: free cancellation until 48 hours before arrival; after that one night is charged. Payment is taken at the hotel.`, checked: !!g.policy, required: true }),
    };
    host.innerHTML = shell(UI.detailsStep({ d, g, f, arrivals: ARRIVALS }));
    const form = $('[data-form=details]', host);
    liveClear(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { ok, values } = validate(form, {
        first: ['required', 'name'],
        last: ['required', 'name'],
        email: ['required', 'email'],
        phone: ['required', 'phone'],
        policy: ['checked'],
      });
      if (!ok) return;
      d.guest = { first: values.first.trim(), last: values.last.trim(), email: values.email.trim(), phone: values.phone.trim(), arrival: values.arrival || '15:00', requests: values.requests || '', policy: true };
      setDraft(DRAFT, d);
      navigate('/book?step=4');
    });
    return;
  }

  const q = quote(d);
  const g = d.guest;
  host.innerHTML = shell(UI.reviewStep({ d, q, g, room }));
  const btn = $('[data-confirm]', host);
  btn.addEventListener('click', async () => {
    setBusy(btn, true, 'Confirming your room…');
    await sleep(1100);
    if (!roomAvailable(d.roomId, d.checkIn, d.checkOut)) {
      setBusy(btn, false);
      toast('Sorry — that room just sold out. Please pick another.', 'error');
      return navigate('/book?step=2');
    }
    const rec = saveRecord({ code: code('SH'), type: 'stay', roomId: d.roomId, roomName: q.room.name, checkIn: d.checkIn, checkOut: d.checkOut, guests: d.guests, promo: d.promo, guest: g, total: q.total, nights: q.nights });
    sessionStorage.removeItem(DRAFT);
    navigate(`/book?done=${rec.code}`, { replace: true });
  });
}

function icsFor(rec) {
  const dt = (s) => s.replace(/-/g, '');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Scioto House//Booking//EN', 'BEGIN:VEVENT',
    `UID:${rec.code}@sciotohouse`, `DTSTART;VALUE=DATE:${dt(rec.checkIn)}`, `DTEND;VALUE=DATE:${dt(rec.checkOut)}`,
    `SUMMARY:Stay at ${site.name} (${rec.code})`, `LOCATION:${site.address.line1}\\, ${site.address.line2}`,
    `DESCRIPTION:${rec.roomName} · check-in ${site.checkIn}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
}

function renderDone(host, c) {
  const rec = getRecord(c);
  host.innerHTML = rec
    ? UI.bookingDone(rec, icsFor(rec))
    : UI.notFound('We couldn’t find that confirmation', 'It may have been made on another device. Look it up with your last name instead.', '<a class="btn btn--primary" href="#/manage">Manage booking</a>');
}

/* ───────────────────────────── TABLE RESERVATION ──────────────────────── */
export const RSTEPS = ['Table', 'Details'];

export function reservationFlow(host, query) {
  const d = getDraft(RDRAFT);
  if (query.done) return renderResDone(host, query.done);
  let step = +query.step === 2 && d.date && d.time && d.party ? 2 : 1;
  if ((+query.step || 1) !== step) return navigate(`/reserve?step=${step}`, { replace: true });
  const shell = (main) => UI.wizardShell({ kind: 'reserve', step, steps: RSTEPS, stepperHTML: UI.stepper(RSTEPS, step, '#/reserve'), main, aside: '', d });

  if (step === 1) {
    const t = today();
    const max = addDays(t, resCfg.daysAhead);
    let party = d.party || 2;
    let date = d.date && d.date >= t ? d.date : t;
    let time = d.time || '';
    const days = Array.from({ length: 21 }, (_, i) => {
      const s = addDays(t, i);
      return { iso: s, closed: isClosed(s), label: fmtDate(s, { weekday: 'short', month: 'short', day: 'numeric' }), dow: fmtDate(s, { weekday: 'short' }), day: fmtDate(s, { day: 'numeric' }), month: fmtDate(s, { month: 'short' }), today: i === 0 };
    });
    const f = { date: field({ name: 'date', label: 'Date', type: 'date', value: date, required: true, attrs: `min="${t}" max="${max}"` }) };
    host.innerHTML = shell(UI.tableStep({ d, party, date, t, max, days, f, maxParty: resCfg.maxParty, slots: resCfg.slots }));
    const form = $('[data-form=table]', host);
    const slotsEl = $('[data-slots]', form);
    const slotErr = $('[data-slot-error]', form);
    const partyCtl = form.elements.party;
    const out = $('[data-party-out]', form);
    const dateCtl = form.elements.date;
    const setCtlValue = (c, v) => {
      if (!c) return;
      if (typeof c.length === 'number' && !c.tagName) [...c].forEach((r) => (r.checked = r.value === String(v)));
      else c.value = v;
    };
    const paintQty = () => {
      if (out) out.textContent = UI.partyLabel(party);
      const dec = $('[data-q="-1"]', form), inc = $('[data-q="1"]', form);
      if (dec) dec.disabled = party <= 1;
      if (inc) inc.disabled = party >= resCfg.maxParty;
      if (partyCtl) setCtlValue(partyCtl, party);
    };
    const paintSlots = () => {
      if (isClosed(date)) {
        time = '';
        slotsEl.innerHTML = UI.tableClosed(date);
        return;
      }
      const nowHM = columbusNow().hhmm; // slots pass in Columbus time, not the visitor's clock
      const state = resCfg.slots.map((s) => {
        const past = date === today() && s <= nowHM;
        const full = !past && slotFull(date, s, party);
        const disabled = past || full;
        if (disabled && time === s) time = '';
        return { s, disabled, full, past };
      });
      const one = (x) => UI.tableSlot(x.s, { disabled: x.disabled, full: x.full, past: x.past, checked: time === x.s });
      const groups = UI.tableSlotGroups(state);
      slotsEl.innerHTML = groups ? groups.map((gr) => gr.render(gr.items.map(one).join(''))).join('') : state.map(one).join('');
      if (!state.some((x) => !x.disabled)) slotsEl.insertAdjacentHTML('beforeend', UI.tableNoSlots(date));
    };
    paintQty();
    paintSlots();
    $$('[data-q]', form).forEach((b) =>
      b.addEventListener('click', () => {
        party = Math.min(resCfg.maxParty, Math.max(1, party + +b.dataset.q));
        paintQty();
        paintSlots();
      })
    );
    form.addEventListener('change', (e) => {
      const n = e.target.name;
      if (n === 'party') {
        party = Math.min(resCfg.maxParty, Math.max(1, +e.target.value || 1));
        paintQty();
        paintSlots();
      } else if (n === 'date') {
        date = e.target.value || t;
        setError(ctl(form, 'date'), '');
        paintSlots();
      } else if (n === 'time') {
        time = e.target.value;
        if (slotErr) slotErr.textContent = '';
      }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = typeof dateCtl?.length === 'number' && !dateCtl.tagName ? dateCtl.value : dateCtl?.value;
      date = v || date;
      const msg = !date ? 'Choose a date.' : date < t ? 'Choose today or a future date.' : date > max ? `We take bookings up to ${resCfg.daysAhead} days ahead.` : isClosed(date) ? 'We’re closed for dinner that day.' : '';
      setError(ctl(form, 'date'), msg);
      if (msg) return ctl(form, 'date').focus();
      if (!time) {
        if (slotErr) slotErr.textContent = 'Please choose a time.';
        ($('input[name=time]:not([disabled])', form) || ctl(form, 'date')).focus();
        return;
      }
      Object.assign(d, { party, date, time });
      setDraft(RDRAFT, d);
      navigate('/reserve?step=2');
    });
    return;
  }

  const g = d.guest || {};
  const f = {
    first: field({ name: 'first', label: 'First name', value: g.first, required: true, autocomplete: 'given-name' }),
    last: field({ name: 'last', label: 'Last name', value: g.last, required: true, autocomplete: 'family-name' }),
    email: field({ name: 'email', label: 'Email', type: 'email', value: g.email, required: true, autocomplete: 'email' }),
    phone: field({ name: 'phone', label: 'Phone', type: 'tel', value: g.phone, required: true, autocomplete: 'tel' }),
    occasion: select({ name: 'occasion', label: 'Occasion', value: g.occasion || 'None', options: resCfg.occasions, full: true }),
    notes: field({ name: 'notes', label: 'Notes for the Kitchen', type: 'textarea', value: g.notes, full: true, hint: 'Allergies, high chair, accessible seating…' }),
  };
  host.innerHTML = shell(UI.tableDetailsStep({ d, g, f, occasions: resCfg.occasions }));
  const form = $('[data-form=rdetails]', host);
  liveClear(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { ok, values } = validate(form, { first: ['required', 'name'], last: ['required', 'name'], email: ['required', 'email'], phone: ['required', 'phone'] });
    if (!ok) return;
    const btn = $('button[type=submit]', form);
    setBusy(btn, true, 'Holding your table…');
    await sleep(1000);
    if (slotFull(d.date, d.time, d.party)) {
      setBusy(btn, false);
      toast('That time was just taken — please pick another.', 'error');
      return navigate('/reserve?step=1');
    }
    const rec = saveRecord({ code: code('ST'), type: 'table', date: d.date, time: d.time, party: d.party, guest: { first: values.first.trim(), last: values.last.trim(), email: values.email.trim(), phone: values.phone.trim(), occasion: values.occasion || 'None', notes: values.notes || '' } });
    sessionStorage.removeItem(RDRAFT);
    navigate(`/reserve?done=${rec.code}`, { replace: true });
  });
}

function renderResDone(host, c) {
  const rec = getRecord(c);
  host.innerHTML = rec ? UI.tableDone(rec) : UI.notFound('Reservation not found', 'It may have been made on another device.', '<a class="btn btn--primary" href="#/manage">Look it up</a>');
}

/* ───────────────────────────── MANAGE BOOKING ─────────────────────────── */
export function manageFlow(host, query) {
  const f = {
    code: field({ name: 'code', label: 'Confirmation code', value: query.code || '', required: true, hint: 'Starts with SH- (rooms) or ST- (tables).', attrs: 'autocapitalize="characters" spellcheck="false"' }),
    last: field({ name: 'last', label: 'Last name', required: true, autocomplete: 'family-name' }),
  };
  if (site.demoMode) ensureDemoRecord(addDays(today(), 14), addDays(today(), 16));
  host.innerHTML = UI.manageForm({ f, code: query.code || '' });
  const form = $('[data-form=lookup]', host);
  const out = $('[data-manage-result]', host);
  liveClear(form);
  // Bookings made on this device (plus the demo booking): one click fills the form and looks it up.
  const mine = listRecords().filter((r) => r.guest?.last).slice(0, 5);
  if (mine.length) {
    out.insertAdjacentHTML(
      'beforebegin',
      `<section class="lookup-help" aria-labelledby="lookup-help-h">
        <h3 class="lookup-help__h" id="lookup-help-h">${icon('key', 16)} Bookings on this device</h3>
        <p class="lookup-help__p">Tap one to open it${site.demoMode ? ' — or type the demo code <strong>SH-DEMO01</strong> with last name <strong>Guest</strong>' : ''}.</p>
        <ul class="lookup-help__list">${mine
          .map((r) => `<li><button type="button" class="lookup-help__btn" data-fill-code="${r.code}" data-fill-last="${esc(r.guest.last)}"><strong>${r.code}</strong><span>${esc(r.guest.first)} ${esc(r.guest.last)} · ${r.type === 'stay' ? esc(r.roomName || 'Room') + ' · ' + fmtDate(r.checkIn, { month: 'short', day: 'numeric' }) : 'Table · ' + fmtDate(r.date, { month: 'short', day: 'numeric' }) + ' ' + fmtTime(r.time)}${r.demo ? ' · demo' : ''}${r.status === 'cancelled' ? ' · cancelled' : ''}</span></button></li>`)
          .join('')}</ul>
      </section>`
    );
    $$('[data-fill-code]', host).forEach((b) =>
      b.addEventListener('click', () => {
        ctl(form, 'code').value = b.dataset.fillCode;
        ctl(form, 'last').value = b.dataset.fillLast;
        form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
      })
    );
  }
  const show = (rec) => {
    out.innerHTML = UI.bookingCard(rec);
    const cb = $('[data-cancel]', out);
    cb &&
      cb.addEventListener('click', async () => {
        const isStay = rec.type === 'stay';
        const yes = await confirmDialog({
          title: `Cancel ${rec.code}?`,
          text: isStay ? 'Cancellations more than 48 hours before arrival are free. This can’t be undone.' : 'Your table will be released to other guests. This can’t be undone.',
          confirmLabel: 'Yes, cancel it',
          danger: true,
          opener: cb,
        });
        if (!yes) return;
        show(cancelRecord(rec.code));
        const st = $('[data-booking-status]', out);
        if (st) {
          st.tabIndex = -1;
          st.focus();
        }
        toast(`${rec.code} has been cancelled.`, 'success');
      });
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { ok, values } = validate(form, { code: ['required', (v) => (/^S[HT]-[A-Z0-9]{6}$/i.test(String(v).trim()) ? '' : 'Codes look like SH-AB12CD.')], last: ['required'] });
    if (!ok) return;
    const btn = $('button[type=submit]', form);
    setBusy(btn, true, 'Searching…');
    await sleep(600);
    setBusy(btn, false);
    const rec = findRecord(values.code, values.last);
    if (!rec) return (out.innerHTML = UI.manageNotFound());
    show(rec);
  });
}

/* ───────────────────────────── CONTACT ────────────────────────────────── */
export function contactForm(host, query) {
  const topic = ['general', 'event', 'press'].includes(query.topic) ? query.topic : 'general';
  const f = {
    name: field({ name: 'name', label: 'Your name', required: true, autocomplete: 'name' }),
    email: field({ name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' }),
    eventDate: field({ name: 'eventDate', label: 'Event date', type: 'date', attrs: `min="${today()}"` }),
    eventGuests: field({ name: 'eventGuests', label: 'Number of guests', type: 'number', attrs: 'min="1" max="500" inputmode="numeric"' }),
    message: field({ name: 'message', label: 'Message', type: 'textarea', required: true, full: true }),
  };
  host.innerHTML = UI.contactForm({ topic, f });
  const form = $('[data-form=contact]', host);
  liveClear(form);
  const ev = $('[data-event-fields]', form);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'topic' && ev) ev.hidden = e.target.value !== 'event';
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEvent = form.elements.topic?.value === 'event';
    const { ok, values } = validate(form, {
      name: ['required'],
      email: ['required', 'email'],
      ...(isEvent ? { eventDate: ['required'], eventGuests: ['required', (v) => (+v >= 1 ? '' : 'Enter a number of guests.')] } : {}),
      message: ['required', (v) => (String(v).trim().length >= 10 ? '' : 'Tell us a little more (10+ characters).')],
    });
    if (!ok) return;
    const btn = $('button[type=submit]', form);
    setBusy(btn, true, 'Sending…');
    await sleep(900);
    saveMessage({ ...values, topic: values.topic || 'general' });
    host.innerHTML = UI.contactDone({ first: String(values.name).trim().split(' ')[0], isEvent });
    $('.confirm__title', host)?.focus();
    $('[data-again]', host)?.addEventListener('click', () => contactForm(host, {}));
  });
}

/* ───────────────────────────── NEWSLETTER ─────────────────────────────── */
export function newsletter(root) {
  $$('form[data-newsletter], .newsletter__form', root).forEach((form) => {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    liveClear(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { ok, values } = validate(form, { nlEmail: ['required', 'email'] });
      if (!ok) return;
      saveSubscriber(values.nlEmail);
      form.outerHTML = UI.newsletterDone();
    });
  });
}
export const newsletterForm = (label) => UI.newsletterForm(label);

/* ───────────────────────────── BOOKING BAR ────────────────────────────── */
export const bookingBarHTML = (cls = '', p = 'bb') => {
  const t = today();
  return `
  <form class="bookbar ${cls}" novalidate data-bookbar aria-label="Check room availability">
    <div class="bookbar__field"><label for="${p}-in">Check-in</label><input id="${p}-in" name="in" type="date" min="${t}" value="${t}" required></div>
    <div class="bookbar__field"><label for="${p}-out">Check-out</label><input id="${p}-out" name="out" type="date" min="${addDays(t, 1)}" value="${addDays(t, 2)}" required></div>
    <div class="bookbar__field"><label for="${p}-g">Guests</label><select id="${p}-g" name="guests">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} guest${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
    <button class="btn btn--primary bookbar__go" type="submit">Check availability</button>
    <p class="bookbar__err" role="alert"></p>
  </form>`;
};
/* Binds every form[data-bookbar] (controls: in, out, guests; error element .bookbar__err or [data-bookbar-err]). */
export function bookingBar(root) {
  $$('[data-bookbar]', root).forEach((f) => {
    if (f.dataset.bound) return;
    f.dataset.bound = '1';
    const err = $('.bookbar__err, [data-bookbar-err]', f);
    const say = (m) => err && (err.textContent = m);
    f.elements.in.addEventListener('change', () => {
      f.elements.out.min = addDays(f.elements.in.value, 1);
      if (f.elements.out.value <= f.elements.in.value) f.elements.out.value = addDays(f.elements.in.value, 1);
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      say('');
      const i = f.elements.in, o = f.elements.out;
      if (!i.value || i.value < today()) return say('Choose a check-in date from today.'), i.focus();
      if (!o.value || o.value <= i.value) return say('Check-out must be after check-in.'), o.focus();
      const d = getDraft(DRAFT);
      Object.assign(d, { checkIn: i.value, checkOut: o.value, guests: +(f.elements.guests?.value || 2) });
      setDraft(DRAFT, d);
      navigate('/book?step=2');
    });
  });
}

/* ───────────────────────────── ROOMS BROWSER ──────────────────────────── */
export function roomsBrowser(host, cardTpl, { onRender } = {}) {
  let guests = 1, bed = 'all', sort = 'price-asc';
  host.innerHTML = UI.roomFilters({ guests, bed, sort });
  const grid = $('[data-rooms-grid]', host);
  const count = $('[data-count]', host);
  const setCtl = (name, v) =>
    $$(`[name="${name}"]`, host).forEach((el) => (el.type === 'radio' || el.type === 'checkbox' ? (el.checked = el.value === String(v)) : (el.value = v)));
  const syncBed = () => $$('[data-bed]', host).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.bed === bed)));
  const paint = () => {
    let list = rooms.filter((r) => r.sleeps >= guests && (bed === 'all' || r.bedType === bed));
    list = list.sort((a, b) => (sort === 'price-asc' ? a.rate - b.rate : sort === 'price-desc' ? b.rate - a.rate : b.size - a.size));
    if (count) count.textContent = UI.roomsCount(list.length);
    grid.innerHTML = list.length ? list.map((r, i) => cardTpl(r, i)).join('') : UI.roomsEmpty({ guests, bed });
    $('[data-reset]', grid)?.addEventListener('click', () => {
      guests = 1;
      bed = 'all';
      setCtl('guests', 1);
      setCtl('bed', 'all');
      syncBed();
      paint();
    });
    onRender && onRender(grid, list);
  };
  host.addEventListener('change', (e) => {
    const n = e.target.name;
    if (n === 'guests') guests = +e.target.value || 1;
    else if (n === 'sort') sort = e.target.value;
    else if (n === 'bed') (bed = e.target.value), syncBed();
    else return;
    paint();
  });
  host.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-bed]');
    if (!b || !host.contains(b)) return;
    bed = b.dataset.bed;
    syncBed();
    paint();
  });
  paint();
}

/* ───────────────────────────── ROOM GALLERY ───────────────────────────── */
/* Hooks: [data-gallery-main] (contains an <img>) and [data-thumb] buttons (aria-pressed). */
export function roomGallery(root, room, { onChange } = {}) {
  const main = $('[data-gallery-main]', root);
  if (!main) return;
  let idx = 0;
  const thumbs = $$('[data-thumb]', root);
  const set = (i) => {
    idx = (i + room.images.length) % room.images.length;
    const img = main.querySelector('img');
    img.src = room.images[idx];
    img.alt = `${room.name} — photo ${idx + 1} of ${room.images.length}`;
    thumbs.forEach((t, j) => t.setAttribute('aria-pressed', String(j === idx)));
    onChange && onChange(idx);
  };
  thumbs.forEach((t, j) => t.addEventListener('click', () => set(j)));
  $$('[data-gallery-step]', root).forEach((b) => b.addEventListener('click', () => set(idx + +b.dataset.galleryStep)));
  main.addEventListener('click', () => lightbox(room.images, idx, room.name, main));
  return { set, get index() { return idx; } };
}

/* ───────────────────────────── MENU BROWSER ───────────────────────────── */
export function menuBrowser(host, itemTpl, { initial = 'dinner', onRender } = {}) {
  let period = initial;
  const diets = new Set();
  let q = '';
  host.innerHTML = UI.menuTools({ period, periods: menu.periods, diets: menu.diets });
  const list = $('[data-menu-list]', host);
  const note = $('[data-menu-note]', host);
  const search = $('[data-menu-search]', host);
  const paint = () => {
    const p = menu.periods.find((x) => x.id === period);
    list.setAttribute('aria-labelledby', `tab-${period}`);
    const items = menu.items.filter(
      (i) => i.period === period && i.available !== false && [...diets].every((d) => i.diet.includes(d)) && (!q || (i.name + ' ' + i.desc).toLowerCase().includes(q))
    );
    if (note) note.textContent = UI.menuNote(p, items.length);
    list.innerHTML = items.length ? items.map(itemTpl).join('') : UI.menuEmpty(q);
    $('[data-clear]', list)?.addEventListener('click', () => {
      diets.clear();
      q = '';
      if (search) search.value = '';
      $$('[data-diet]', host).forEach((c) => c.setAttribute('aria-pressed', 'false'));
      paint();
    });
    onRender && onRender(list, items, period);
  };
  const tablist = $('[role=tablist]', host);
  tablist && setupTabs(tablist, (v) => ((period = v), paint()));
  $$('[data-diet]', host).forEach((c) =>
    c.addEventListener('click', () => {
      const on = c.getAttribute('aria-pressed') !== 'true';
      c.setAttribute('aria-pressed', String(on));
      on ? diets.add(c.dataset.diet) : diets.delete(c.dataset.diet);
      paint();
    })
  );
  search && search.addEventListener('input', debounce((e) => ((q = e.target.value.trim().toLowerCase()), paint()), 150));
  paint();
}

export const dietBadges = (item) =>
  item.diet.map((d) => `<abbr class="diet diet--${d}" title="${menu.diets.find((x) => x.id === d).label}">${d.toUpperCase()}</abbr>`).join('');
