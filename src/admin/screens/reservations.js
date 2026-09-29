import { listRecords, updateRecord, cancelRecord } from '../../core/store.js';
import { getContent } from '../../core/cms.js';
import { icon, esc, columbus, longDate, addDays, fmtTime, plural, parseISO, WEEKDAYS_LONG, $, $$ } from '../lib.js';
import { pageHead, empty, statusChip, toast, confirmDialog, callout } from '../ui.js';
import { loadSampleData } from '../sample.js';

export default function reservations(el, ctx) {
  const t = columbus().iso;
  let date = /^\d{4}-\d{2}-\d{2}$/.test(ctx.route.query.date || '') ? ctx.route.query.date : t;

  el.innerHTML = `
    ${pageHead({
      title: 'Table reservations',
      lede: 'Dinner bookings from the website, one day at a time. Mark tables as seated or no-show as the evening goes on.',
    })}
    <div class="a-datebar" role="group" aria-label="Choose a date">
      <button class="a-iconbtn a-iconbtn--outline" type="button" data-day="-1" aria-label="Previous day">${icon('chevL', 20)}</button>
      <div class="a-datebar__field">
        <label class="sr-only" for="res-date">Date</label>
        <input class="a-input" id="res-date" type="date" value="${date}" data-date>
      </div>
      <button class="a-iconbtn a-iconbtn--outline" type="button" data-day="1" aria-label="Next day">${icon('chevR', 20)}</button>
      <button class="a-btn a-btn--secondary" type="button" data-today>Today</button>
      <p class="a-datebar__label" aria-live="polite" data-label></p>
    </div>
    <div data-body></div>`;

  const body = $('[data-body]', el);
  const input = $('[data-date]', el);
  const setDate = (d) => {
    date = d;
    input.value = d;
    history.replaceState(null, '', `#/reservations?date=${d}`);
    paint();
  };
  $$('[data-day]', el).forEach((b) => b.addEventListener('click', () => setDate(addDays(date, +b.dataset.day))));
  $('[data-today]', el).addEventListener('click', () => setDate(t));
  input.addEventListener('change', () => /^\d{4}-\d{2}-\d{2}$/.test(input.value) && setDate(input.value));

  const act = async (r, status) => {
    const prev = r.status;
    if (status === 'cancelled') {
      const ok = await confirmDialog({
        title: 'Cancel this reservation?',
        text: `<strong>${esc(r.guest.first)} ${esc(r.guest.last)}</strong> · ${plural(+r.party, 'guest')} · ${fmtTime(r.time)}, ${longDate(r.date)}.<br>The table becomes available to book again. Remember to let the guest know.`,
        confirmLabel: 'Cancel reservation',
        cancelLabel: 'Keep it',
        danger: true,
      });
      if (!ok) return;
      cancelRecord(r.code);
    } else updateRecord(r.code, { status });
    const verb = { seated: 'marked as seated', 'no-show': 'marked as no-show', cancelled: 'reservation cancelled', confirmed: 'back to booked' }[status];
    paint(r.code);
    toast(`${r.guest.first} ${r.guest.last} — ${verb}.`, {
      kind: status === 'confirmed' ? 'info' : 'success',
      action:
        status === 'confirmed'
          ? null
          : {
              label: 'Undo',
              onClick: () => {
                updateRecord(r.code, { status: prev });
                paint(r.code);
              },
            },
    });
  };

  const paint = (focusCode) => {
    const c = getContent();
    const res = c.reservations;
    const closed = res.closedDays.includes(parseISO(date).getDay()) || (res.closedDates || []).includes(date);
    const why = (res.closedDates || []).includes(date) ? 'this date is marked as a one-off closure' : `the Kitchen is closed for dinner on ${WEEKDAYS_LONG[parseISO(date).getDay()]}s`;
    $('[data-label]', el).innerHTML = `<strong>${longDate(date)}</strong>${date === t ? ' <span class="a-chip a-chip--blue">Today</span>' : ''}`;
    const all = listRecords().filter((r) => r.type === 'table');
    const day = all.filter((r) => r.date === date).sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : a.guest.last < b.guest.last ? -1 : 1));
    const live = day.filter((r) => ['confirmed', 'seated'].includes(r.status));
    const covers = live.reduce((n, r) => n + (+r.party || 0), 0);
    const seated = day.filter((r) => r.status === 'seated').length;

    let html = closed ? callout(`<strong>Closed for dinner.</strong> Online booking is switched off because ${why}. <a class="a-link" href="#/hours">Change in Hours & closures</a>`, 'warn') : '';
    if (!all.length) {
      body.innerHTML =
        html +
        empty({
          icon: 'dining',
          title: 'No table reservations yet',
          text: 'Dinner reservations made on the website appear here by date and time, with party size, occasion and notes for the Kitchen.',
          actions: `<button class="a-btn a-btn--primary" type="button" data-action="load-sample">${icon('sparkle', 18)} Load sample bookings</button>`,
        });
      $('[data-action="load-sample"]', body).addEventListener('click', () => {
        loadSampleData();
        ctx.refreshBadges();
        toast('Sample bookings added.', { kind: 'success' });
        paint();
      });
      return;
    }
    html += `<div class="a-summary" aria-live="polite">
        <div><span class="a-summary__n">${live.length}</span><span class="a-summary__l">${live.length === 1 ? 'table' : 'tables'}</span></div>
        <div><span class="a-summary__n">${covers}</span><span class="a-summary__l">guests expected</span></div>
        <div><span class="a-summary__n">${seated}</span><span class="a-summary__l">seated so far</span></div>
      </div>`;
    if (!day.length) {
      html += empty({ icon: 'calendar', title: 'No tables booked for this date', text: closed ? 'We’re closed for dinner that day.' : 'Try another day with the arrows above.' });
      body.innerHTML = html;
      return;
    }
    const groups = [];
    for (const r of day) {
      const g = groups.find((x) => x.time === r.time);
      g ? g.items.push(r) : groups.push({ time: r.time, items: [r] });
    }
    html += `<ol class="a-timeline">${groups
      .map(
        (g) => `<li class="a-timeline__group">
          <h2 class="a-timeline__time">${fmtTime(g.time)}</h2>
          <ul class="a-timeline__items">${g.items
            .map(
              (r) => `<li class="a-res ${['cancelled', 'no-show'].includes(r.status) ? 'is-muted' : ''}" data-res="${esc(r.code)}">
              <div class="a-res__main">
                <p class="a-res__name"><strong>${esc(r.guest.first)} ${esc(r.guest.last)}</strong> ${statusChip(r.status)}</p>
                <p class="a-res__meta">
                  <span>${icon('users', 16)} ${plural(+r.party, 'guest')}</span>
                  ${r.guest.occasion && r.guest.occasion !== 'None' ? `<span>${icon('sparkle', 16)} ${esc(r.guest.occasion)}</span>` : ''}
                  <a class="a-link" href="tel:${esc(String(r.guest.phone).replace(/[^\d+]/g, ''))}">${icon('phone', 16)} ${esc(r.guest.phone)}</a>
                  <span class="a-mono">${esc(r.code)}</span>
                </p>
                ${r.guest.notes ? `<p class="a-res__notes">${icon('info', 16)} ${esc(r.guest.notes)}</p>` : ''}
              </div>
              <div class="a-res__actions">
                ${
                  r.status === 'confirmed'
                    ? `<button class="a-btn a-btn--primary-soft" type="button" data-st="seated">${icon('check', 18)} Seated</button>
                       <button class="a-btn a-btn--secondary" type="button" data-st="no-show">${icon('userX', 18)} No-show</button>
                       <button class="a-btn a-btn--ghost a-btn--danger-text" type="button" data-st="cancelled">Cancel<span class="sr-only"> reservation for ${esc(r.guest.first)} ${esc(r.guest.last)}</span></button>`
                    : `<button class="a-btn a-btn--ghost" type="button" data-st="confirmed">${icon('undo', 18)} Mark as booked<span class="sr-only"> — ${esc(r.guest.first)} ${esc(r.guest.last)}</span></button>`
                }
              </div>
            </li>`
            )
            .join('')}</ul>
        </li>`
      )
      .join('')}</ol>`;
    body.innerHTML = html;
    $$('[data-res]', body).forEach((row) =>
      $$('[data-st]', row).forEach((b) =>
        b.addEventListener('click', () => {
          const r = listRecords().find((x) => x.code === row.dataset.res);
          r && act(r, b.dataset.st);
        })
      )
    );
    if (focusCode) $(`[data-res="${focusCode}"] [data-st]`, body)?.focus();
  };
  paint();
  return { onExternalChange: () => paint() };
}
