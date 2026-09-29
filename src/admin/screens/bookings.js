import { listRecords, updateRecord, cancelRecord } from '../../core/store.js';
import { getContent } from '../../core/cms.js';
import { icon, esc, siteUrl, columbus, shortDate, dayMonth, longDate, money, plural, stamp, fmtTime, $, $$ } from '../lib.js';
import { pageHead, empty, statusChip, toast, openDialog, confirmDialog } from '../ui.js';
import { loadSampleData } from '../sample.js';

const FILTERS = [
  { id: 'active', label: 'Upcoming & in house' },
  { id: 'today', label: 'Arriving today' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

export default function bookings(el, ctx) {
  const t = columbus().iso;
  let q = '';
  let filter = 'active';
  let sheet = null;

  const stays = () => listRecords().filter((r) => r.type === 'stay');
  const shown = (r) => (r.status === 'confirmed' && r.checkOut <= t ? 'past' : r.status);
  const match = {
    active: (r) => r.status === 'checked-in' || (r.status === 'confirmed' && r.checkOut > t),
    today: (r) => r.status === 'confirmed' && r.checkIn === t,
    past: (r) => r.status === 'checked-out' || (r.status === 'confirmed' && r.checkOut <= t),
    cancelled: (r) => r.status === 'cancelled',
    all: () => true,
  };
  const rank = (r) => ({ 'checked-in': 0, confirmed: r.checkOut > t ? 1 : 2, 'checked-out': 3, cancelled: 4 }[r.status] ?? 5);

  el.innerHTML = `
    ${pageHead({
      title: 'Room bookings',
      lede: 'Every room booked on the website. Open a booking to check the guest in or out, or to cancel it.',
    })}
    <div data-body></div>`;
  const body = $('[data-body]', el);

  const renderAll = () => {
    const all = stays();
    if (!all.length) {
      body.innerHTML = empty({
        icon: 'calendar',
        title: 'No room bookings yet',
        text: 'When a guest books a room on the website, it appears here with their dates, room and contact details. You’ll be able to check them in and out from this page.',
        actions: `<button class="a-btn a-btn--primary" type="button" data-action="load-sample">${icon('sparkle', 18)} Load sample bookings</button>
                  <a class="a-btn a-btn--secondary" href="${siteUrl('/book')}" target="_blank" rel="noopener">See the booking page<span class="sr-only"> (opens in a new tab)</span></a>`,
      });
      $('[data-action="load-sample"]', body).addEventListener('click', () => {
        loadSampleData();
        ctx.refreshBadges();
        toast('Sample bookings added.', { kind: 'success' });
        renderAll();
      });
      return;
    }
    const counts = Object.fromEntries(FILTERS.map((f) => [f.id, all.filter(match[f.id]).length]));
    body.innerHTML = `
      <div class="a-toolbar">
        <div class="a-search">
          ${icon('search', 18)}
          <label class="sr-only" for="bk-q">Search bookings</label>
          <input class="a-input" id="bk-q" type="search" placeholder="Search name, email, room or code" value="${esc(q)}" autocomplete="off" data-search>
        </div>
        <div class="a-seg" role="radiogroup" aria-label="Show">
          ${FILTERS.map(
            (f) => `<label class="a-seg__opt"><input type="radio" name="bk-filter" value="${f.id}" ${filter === f.id ? 'checked' : ''}><span>${f.label}<span class="a-seg__n">${counts[f.id]}</span></span></label>`
          ).join('')}
        </div>
      </div>
      <div data-results></div>`;
    $('[data-search]', body).addEventListener('input', (e) => {
      q = e.target.value.trim().toLowerCase();
      renderRows();
    });
    renderRows();
  };
  body.addEventListener('change', (e) => {
    if (e.target.name === 'bk-filter') {
      filter = e.target.value;
      renderRows();
    }
  });

  const renderRows = () => {
    const host = $('[data-results]', body);
    if (!host) return;
    const list = stays()
      .filter(match[filter])
      .filter((r) => !q || `${r.guest.first} ${r.guest.last} ${r.guest.email} ${r.code} ${r.roomName}`.toLowerCase().includes(q))
      .sort((a, b) => rank(a) - rank(b) || (rank(a) >= 2 ? (a.checkIn < b.checkIn ? 1 : -1) : a.checkIn < b.checkIn ? -1 : 1));
    if (!list.length) {
      host.innerHTML = empty({
        icon: 'search',
        title: q ? `No bookings match “${esc(q)}”` : `No bookings in “${FILTERS.find((f) => f.id === filter).label}”`,
        text: 'Try a different search or show all bookings.',
        actions: `<button class="a-btn a-btn--secondary" type="button" data-clear>Show all bookings</button>`,
      });
      $('[data-clear]', host).addEventListener('click', () => {
        q = '';
        filter = 'all';
        renderAll();
      });
      return;
    }
    host.innerHTML = `
      <p class="a-count" aria-live="polite">${plural(list.length, 'booking')}</p>
      <div class="a-tablewrap">
        <table class="a-table a-table--click">
          <caption class="sr-only">Room bookings</caption>
          <thead><tr><th scope="col">Guest</th><th scope="col">Room</th><th scope="col">Stay</th><th scope="col">Guests</th><th scope="col" class="a-num">Total</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            ${list
              .map(
                (r) => `<tr data-row="${esc(r.code)}">
                <td data-label="Guest" class="a-td-primary"><span class="a-cellstack"><strong>${esc(r.guest.first)} ${esc(r.guest.last)}</strong><small class="a-mono">${esc(r.code)}</small></span></td>
                <td data-label="Room">${esc(r.roomName)}</td>
                <td data-label="Stay"><span class="a-cellstack"><span>${dayMonth(r.checkIn)} → ${dayMonth(r.checkOut)}</span><small>${plural(r.nights, 'night')}${r.checkIn === t && r.status === 'confirmed' ? ' · <strong class="a-today">arrives today</strong>' : ''}</small></span></td>
                <td data-label="Guests">${+r.guests}</td>
                <td data-label="Total" class="a-num">${money(r.total, true)}</td>
                <td data-label="Status" class="a-td-status">${statusChip(shown(r))}</td>
                <td class="a-td-action"><button class="a-btn a-btn--secondary a-btn--sm" type="button" data-open="${esc(r.code)}">Open<span class="sr-only"> booking for ${esc(r.guest.first)} ${esc(r.guest.last)}</span></button></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
    $$('[data-open]', host).forEach((b) => b.addEventListener('click', () => openSheet(b.dataset.open)));
    $$('tr[data-row]', host).forEach((tr) =>
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button,a')) return;
        $('[data-open]', tr).click();
      })
    );
  };

  const detailHTML = (r) => {
    const c = getContent();
    const s = shown(r);
    return `
      <div class="a-detail">
        <div class="a-detail__status">${statusChip(s)} <span class="a-mono">${esc(r.code)}</span></div>
        <section class="a-detail__sec" aria-label="Stay">
          <h3 class="a-detail__h">Stay</h3>
          <dl class="a-dl">
            <div><dt>Room</dt><dd>${esc(r.roomName)}</dd></div>
            <div><dt>Check-in</dt><dd>${longDate(r.checkIn)}<small>from ${esc(c.site.checkIn)}</small></dd></div>
            <div><dt>Check-out</dt><dd>${longDate(r.checkOut)}<small>by ${esc(c.site.checkOut)}</small></dd></div>
            <div><dt>Length</dt><dd>${plural(r.nights, 'night')} · ${plural(+r.guests, 'guest')}</dd></div>
            <div><dt>Total</dt><dd>${money(r.total, true)}${r.promo ? `<small>Promo code ${esc(r.promo)}</small>` : ''}<small>Paid at the hotel</small></dd></div>
          </dl>
        </section>
        <section class="a-detail__sec" aria-label="Guest">
          <h3 class="a-detail__h">Guest</h3>
          <dl class="a-dl">
            <div><dt>Name</dt><dd>${esc(r.guest.first)} ${esc(r.guest.last)}</dd></div>
            <div><dt>Email</dt><dd><a class="a-link" href="mailto:${esc(r.guest.email)}">${esc(r.guest.email)}</a></dd></div>
            <div><dt>Phone</dt><dd><a class="a-link" href="tel:${esc(String(r.guest.phone).replace(/[^\d+]/g, ''))}">${esc(r.guest.phone)}</a></dd></div>
            <div><dt>Arriving</dt><dd>${r.guest.arrival === 'late' ? 'After 10 pm' : r.guest.arrival ? 'Around ' + fmtTime(r.guest.arrival) : '—'}</dd></div>
          </dl>
          ${r.guest.requests ? `<div class="a-note"><p class="a-note__h">Special requests</p><p>${esc(r.guest.requests)}</p></div>` : ''}
        </section>
        <p class="a-detail__meta">Booked ${stamp(r.createdAt)}${r.updatedAt ? ` · updated ${stamp(r.updatedAt)}` : ''}</p>
      </div>`;
  };
  const footHTML = (r) => {
    const acts = [];
    if (r.status === 'confirmed') {
      acts.push(`<button class="a-btn a-btn--danger-soft" type="button" data-act="cancel">${icon('ban', 18)} Cancel booking</button>`);
      acts.push(`<button class="a-btn a-btn--primary" type="button" data-act="checkin">${icon('door', 18)} Check in</button>`);
    } else if (r.status === 'checked-in') {
      acts.push(`<button class="a-btn a-btn--primary" type="button" data-act="checkout">${icon('check', 18)} Check out</button>`);
    } else {
      acts.push(`<p class="a-foot-note">${r.status === 'cancelled' ? 'This booking was cancelled.' : 'This stay is finished.'}</p>`);
    }
    acts.unshift(`<a class="a-btn a-btn--ghost" href="mailto:${esc(r.guest.email)}?subject=${encodeURIComponent('Your stay at ' + getContent().site.name)}">${icon('mail', 18)} Email guest</a>`);
    return acts.join('');
  };

  const setStatus = (codeStr, status, verb) => {
    const before = listRecords().find((x) => x.code === codeStr);
    const prev = { status: before.status };
    if (status === 'cancelled') cancelRecord(codeStr);
    else updateRecord(codeStr, { status, [status === 'checked-in' ? 'checkedInAt' : 'checkedOutAt']: new Date().toISOString() });
    const r = listRecords().find((x) => x.code === codeStr);
    toast(`${r.guest.first} ${r.guest.last} — ${verb}.`, {
      kind: 'success',
      action: {
        label: 'Undo',
        onClick: () => {
          updateRecord(codeStr, prev);
          renderAll();
          if (sheet) paintSheet(codeStr);
          toast('Change undone.', { kind: 'info', duration: 3000 });
        },
      },
    });
    renderAll();
    if (sheet) paintSheet(codeStr);
  };

  const paintSheet = (codeStr) => {
    const r = listRecords().find((x) => x.code === codeStr);
    if (!r || !sheet) return;
    sheet.setTitle(`${esc(r.guest.first)} ${esc(r.guest.last)}`);
    sheet.body.innerHTML = detailHTML(r);
    sheet.foot.innerHTML = footHTML(r);
    $$('[data-act]', sheet.foot).forEach((b) =>
      b.addEventListener('click', async () => {
        const a = b.dataset.act;
        if (a === 'checkin') {
          if (r.checkIn > t && !(await confirmDialog({ title: 'Check in early?', text: `${esc(r.guest.first)} isn’t due until <strong>${longDate(r.checkIn)}</strong>. Check them in now anyway?`, confirmLabel: 'Check in now', cancelLabel: 'Not yet' }))) return;
          setStatus(r.code, 'checked-in', 'checked in');
        }
        if (a === 'checkout') setStatus(r.code, 'checked-out', 'checked out');
        if (a === 'cancel') {
          const ok = await confirmDialog({
            title: 'Cancel this booking?',
            text: `<strong>${esc(r.guest.first)} ${esc(r.guest.last)}</strong> · ${esc(r.roomName)} · ${shortDate(r.checkIn)} → ${shortDate(r.checkOut)}.<br>The room goes back on sale straight away. Remember to let the guest know.`,
            confirmLabel: 'Cancel booking',
            cancelLabel: 'Keep booking',
            danger: true,
          });
          if (ok) setStatus(r.code, 'cancelled', 'booking cancelled');
        }
      })
    );
  };
  const openSheet = (codeStr) => {
    sheet = openDialog({ title: '', variant: 'side', body: '', footer: ' ', className: 'a-sheet-booking', onClose: () => (sheet = null) });
    paintSheet(codeStr);
    sheet.el.querySelector('.a-dialog__title').focus();
  };

  renderAll();
  if (ctx.route.query.open && stays().some((r) => r.code === ctx.route.query.open)) {
    filter = 'all';
    renderAll();
    setTimeout(() => openSheet(ctx.route.query.open), 50);
  }
  return { onExternalChange: () => (!sheet ? renderAll() : null) };
}
