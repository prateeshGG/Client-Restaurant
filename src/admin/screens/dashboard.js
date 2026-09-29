/* Dashboard — today at a glance. */
import { listRecords, listMessages, listSubscribers } from '../../core/store.js';
import { getContent } from '../../core/cms.js';
import { icon, esc, columbus, addDays, parseISO, plural, timeLabel, ago, DESIGNS, siteUrl, $, kitchenStatus, columbusNow } from '../lib.js';
import { statusChip, toast } from '../ui.js';
import { loadSampleData } from '../sample.js';

const greet = (h) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

export default function dashboard(view, { refreshBadges, rerender }) {
  const now = columbus();
  const t = now.iso;
  const c = getContent();
  const recs = listRecords();
  const msgs = listMessages();
  const subs = listSubscribers();
  const week = addDays(t, 6);

  const stays = recs.filter((r) => r.type === 'stay');
  const arrivals = stays
    .filter((r) => r.status === 'confirmed' && r.checkIn >= t && r.checkIn <= week)
    .sort((a, b) => (a.checkIn + a.guest.last < b.checkIn + b.guest.last ? -1 : 1));
  const arrivingToday = arrivals.filter((r) => r.checkIn === t).length;
  const inHouse = stays.filter((r) => r.status === 'checked-in').length;
  const tables = recs
    .filter((r) => r.type === 'table' && r.date === t && r.status !== 'cancelled')
    .sort((a, b) => (a.time < b.time ? -1 : 1));
  const covers = tables.reduce((n, r) => n + (+r.party || 0), 0);
  const unread = msgs.filter((m) => !m.read);
  const soldOut = c.menu.items.filter((i) => i.available === false);
  const closedRooms = c.rooms.filter((r) => r.closed);
  const dow = parseISO(t).getDay();
  const resClosed = c.reservations.closedDays.includes(dow) || (c.reservations.closedDates || []).includes(t);
  const kitchen = kitchenStatus(c.schedule, columbusNow());
  const newSubs = subs.filter((s) => Date.now() - new Date(s.at).getTime() < 7 * 86400000).length;

  const kpi = ({ href, ic, label, value, sub, attention }) => `
    <a class="a-kpi ${attention ? 'is-attention' : ''}" href="${href}">
      <span class="a-kpi__icon">${icon(ic, 20)}</span>
      <span class="a-kpi__label">${label}</span>
      <span class="a-kpi__value" data-kpi>${value}</span>
      <span class="a-kpi__sub">${sub}</span>
      ${icon('right', 18, 'a-kpi__go')}
    </a>`;

  const datebox = (s) => {
    const d = parseISO(s);
    return `<span class="a-datebox ${s === t ? 'is-today' : ''}"><small>${d.toLocaleDateString('en-US', { weekday: 'short' })}</small><strong>${d.getDate()}</strong></span>`;
  };

  const arrivalsHTML = arrivals.length
    ? `<ul class="a-list">${arrivals
        .slice(0, 6)
        .map(
          (r) => `<li><a class="a-list__row" href="#/bookings?open=${esc(r.code)}">
            ${datebox(r.checkIn)}
            <span class="a-list__main"><strong>${esc(r.guest.first)} ${esc(r.guest.last)}</strong><small>${esc(r.roomName)} · ${plural(r.nights || 1, 'night')} · ${plural(+r.guests, 'guest')}</small></span>
            ${statusChip(r.status)}
          </a></li>`
        )
        .join('')}</ul>${arrivals.length > 6 ? `<p class="a-card__more">+ ${arrivals.length - 6} more this week</p>` : ''}`
    : `<p class="a-card__empty">${icon('calendar', 20)} No arrivals in the next 7 days.</p>`;

  const tablesHTML = resClosed
    ? `<p class="a-card__empty">${icon('ban', 20)} The dining room is closed for reservations today.</p>`
    : tables.length
      ? `<ul class="a-list">${tables
          .slice(0, 6)
          .map(
            (r) => `<li><a class="a-list__row" href="#/reservations?date=${t}">
              <span class="a-timebox">${timeLabel(r.time)}</span>
              <span class="a-list__main"><strong>${esc(r.guest.first)} ${esc(r.guest.last)}</strong><small>Party of ${r.party}${r.guest.occasion && r.guest.occasion !== 'None' ? ` · ${esc(r.guest.occasion)}` : ''}</small></span>
              ${statusChip(r.status)}
            </a></li>`
          )
          .join('')}</ul>${tables.length > 6 ? `<p class="a-card__more">+ ${tables.length - 6} more tonight</p>` : ''}`
      : `<p class="a-card__empty">${icon('dining', 20)} No tables booked for tonight yet.</p>`;

  const action = (href, ic, title, sub) => `<a class="a-action" href="${href}"><span class="a-action__icon">${icon(ic, 20)}</span><span><strong>${title}</strong><small>${sub}</small></span></a>`;

  view.innerHTML = `
    <header class="a-pagehead">
      <div class="a-pagehead__text">
        <h1 class="a-h1" tabindex="-1">${greet(now.hour)}</h1>
        <p class="a-lede">${parseISO(t).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · ${now.time} in Columbus</p>
      </div>
      <div class="a-pagehead__actions">
        <a class="a-btn a-btn--secondary" href="${siteUrl('/')}" target="_blank" rel="noopener">${icon('external', 18)} View live site<span class="sr-only"> (opens in a new tab)</span></a>
      </div>
    </header>

    <div class="a-strip">
      <span class="a-pill ${kitchen.open ? 'a-pill--green' : ''}"><span class="a-dot ${kitchen.open ? 'is-on' : ''}" aria-hidden="true"></span>${esc(kitchen.text)}</span>
      ${inHouse ? `<span class="a-pill">${icon('bed', 16)} ${plural(inHouse, 'party', 'parties')} in house</span>` : ''}
      ${resClosed ? `<a class="a-pill a-pill--amber" href="#/hours">${icon('ban', 16)} No dinner reservations today</a>` : ''}
      ${soldOut.length ? `<a class="a-pill a-pill--amber" href="#/menu">${icon('menu', 16)} ${plural(soldOut.length, 'dish', 'dishes')} marked sold out</a>` : ''}
      ${closedRooms.length ? `<a class="a-pill a-pill--amber" href="#/rooms">${icon('alert', 16)} ${plural(closedRooms.length, 'room type')} closed</a>` : ''}
    </div>

    ${
      recs.length
        ? ''
        : `<section class="a-welcome" aria-labelledby="welcome-h">
      <div><h2 id="welcome-h">Welcome to your dashboard</h2>
      <p>New bookings, table reservations and messages from the website appear here. Nothing has come in yet — load some realistic sample bookings to see how everything works. You can clear them any time in Settings.</p></div>
      <button class="a-btn a-btn--primary" type="button" data-sample>${icon('sparkle', 18)} Load sample bookings</button>
    </section>`
    }

    <section class="a-kpis" aria-label="Today at a glance">
      ${kpi({ href: '#/bookings', ic: 'calendar', label: 'Arrivals · next 7 days', value: arrivals.length, sub: arrivingToday ? `${arrivingToday} arriving today` : 'None arriving today' })}
      ${kpi({ href: `#/reservations?date=${t}`, ic: 'dining', label: 'Tonight’s tables', value: resClosed ? '—' : tables.length, sub: resClosed ? 'Closed for dinner' : `${plural(covers, 'guest')} expected` })}
      ${kpi({ href: '#/messages', ic: 'inbox', label: 'Unread messages', value: unread.length, sub: unread.length ? `Latest ${ago(unread[0].at)}` : 'You’re all caught up', attention: unread.length > 0 })}
      ${kpi({ href: '#/messages?tab=subscribers', ic: 'users', label: 'Newsletter subscribers', value: subs.length, sub: newSubs ? `+${newSubs} this week` : 'No new sign-ups this week' })}
    </section>

    <div class="a-grid-2">
      <section class="a-card" aria-labelledby="arr-h">
        <div class="a-card__head">
          <div><h2 class="a-card__title" id="arr-h">${icon('bed', 18)} Upcoming arrivals</h2><p class="a-card__sub">Room guests checking in over the next 7 days</p></div>
          <a class="a-link" href="#/bookings">All bookings ${icon('right', 16)}</a>
        </div>
        ${arrivalsHTML}
      </section>
      <section class="a-card" aria-labelledby="tab-h">
        <div class="a-card__head">
          <div><h2 class="a-card__title" id="tab-h">${icon('dining', 18)} Tonight’s tables</h2><p class="a-card__sub">${resClosed ? 'Reservations are paused today' : `${plural(tables.length, 'booking')} · ${plural(covers, 'cover')}`}</p></div>
          <a class="a-link" href="#/reservations?date=${t}">All reservations ${icon('right', 16)}</a>
        </div>
        ${tablesHTML}
      </section>
    </div>

    <section class="a-card" aria-labelledby="qa-h">
        <div><h2 class="a-card__title" id="qa-h">${icon('sparkle', 18)} Quick changes</h2><p class="a-card__sub">The things owners update most often</p></div>
        <div class="a-actions">
          ${action('#/menu', 'menu', 'Mark a dish sold out', 'Hide it from today’s menu')}
          ${action('#/rooms', 'tag', 'Change a room rate', 'Nightly prices & photos')}
          ${action('#/hours?focus=closures', 'ban', 'Close for a day', 'Pause table bookings')}
          ${action('#/site', 'phone', 'Update contact details', 'Phone, email & address on every design')}
          ${action('#/messages', 'reply', 'Reply to messages', unread.length ? `${unread.length} waiting` : 'Inbox is clear')}
          ${action('#/settings', 'download', 'Back up your website', 'Download a copy of your content')}
        </div>
      </section>
      <section class="a-card" aria-labelledby="live-h">
        <div><h2 class="a-card__title" id="live-h">${icon('globe', 18)} View live site</h2><p class="a-card__sub">Your changes appear in every design. Each opens in a new tab.</p></div>
        <ul class="a-designs a-designs--row">
          ${DESIGNS.map(
            (d) => `<li><a class="a-design" href="/${d.id}/" target="_blank" rel="noopener" data-design-link="${d.id}">
              <span class="a-design__swatch a-design__swatch--${d.id}" aria-hidden="true"></span>
              <span><strong>${esc(d.label)}</strong><small>${esc(d.note)}</small></span>
              ${icon('external', 16)}<span class="sr-only"> (opens in a new tab)</span></a></li>`
          ).join('')}
        </ul>
      </section>`;

  const btn = $('[data-sample]', view);
  btn &&
    btn.addEventListener('click', () => {
      const r = loadSampleData();
      refreshBadges();
      toast(`Sample data loaded — ${r.records} bookings & reservations, ${r.messages} messages.`, { kind: 'success' });
      rerender();
    });
  return {};
}
