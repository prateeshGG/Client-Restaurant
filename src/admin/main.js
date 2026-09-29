/* Scioto House — Owner Dashboard (/admin/)
 * Hash routes: #/login #/dashboard #/bookings #/reservations #/menu #/rooms[/id] #/hours #/site #/messages[/id] #/settings */
import '@fontsource-variable/inter';
import './admin.css';
import { session, signOut, loginScreen } from './auth.js';
import { icon, esc, $, $$, siteUrl, prefs, DESIGNS } from './lib.js';
import { confirmDialog, openDialog, toast, closeAllDialogs } from './ui.js';
import { listMessages } from '../core/store.js';
import { enablePickers } from '../core/pickers.js';
enablePickers();

const SCREENS = {
  dashboard: () => import('./screens/dashboard.js'),
  bookings: () => import('./screens/bookings.js'),
  reservations: () => import('./screens/reservations.js'),
  messages: () => import('./screens/messages.js'),
  menu: () => import('./screens/menu.js'),
  rooms: () => import('./screens/rooms.js'),
  hours: () => import('./screens/hours.js'),
  site: () => import('./screens/siteinfo.js'),
  settings: () => import('./screens/settings.js'),
};

const NAV = [
  { group: 'Today', items: [{ id: 'dashboard', label: 'Dashboard', short: 'Home', icon: 'home' }] },
  {
    group: 'Guests',
    items: [
      { id: 'bookings', label: 'Room bookings', short: 'Stays', icon: 'calendar' },
      { id: 'reservations', label: 'Table reservations', short: 'Tables', icon: 'dining' },
      { id: 'messages', label: 'Messages', short: 'Inbox', icon: 'inbox', badge: true },
    ],
  },
  {
    group: 'Your website',
    items: [
      { id: 'menu', label: 'Menu', short: 'Menu', icon: 'menu' },
      { id: 'rooms', label: 'Rooms & rates', short: 'Rooms', icon: 'bed' },
      { id: 'hours', label: 'Hours & closures', short: 'Hours', icon: 'clock' },
      { id: 'site', label: 'Site info', short: 'Site', icon: 'globe' },
    ],
  },
];
const ALL = [...NAV.flatMap((g) => g.items), { id: 'settings', label: 'Settings & backup', short: 'Settings', icon: 'settings' }];
const TABS = ['dashboard', 'bookings', 'reservations', 'menu'];
const MORE = ['messages', 'rooms', 'hours', 'site', 'settings'];

const root = document.getElementById('admin');
document.documentElement.classList.add('a-root');

let current = null; // { name, api }
let lastHash = '';
let token = 0;
let skipNext = false;

const parse = () => {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || '', parts, query: Object.fromEntries(new URLSearchParams(qs || '')), hash: location.hash };
};

/* ── Unsaved-changes guard ── */
const isDirty = () => !!(current && current.api && current.api.isDirty && current.api.isDirty());
addEventListener('beforeunload', (e) => {
  if (isDirty()) {
    e.preventDefault();
    e.returnValue = '';
  }
});
const askLeave = () =>
  confirmDialog({
    title: 'Leave without saving?',
    text: 'You changed things on this page but haven’t saved them yet. If you leave now, those changes will be lost.',
    confirmLabel: 'Leave without saving',
    cancelLabel: 'Stay and keep editing',
    danger: true,
  });

export async function navigate(hash, { force = false } = {}) {
  if (!force && isDirty() && !(await askLeave())) return false;
  if (current?.api) current.api.isDirty = () => false;
  if (location.hash === hash) render();
  else location.hash = hash;
  return true;
}

// In-app links: ask before leaving a page with unsaved edits.
document.addEventListener(
  'click',
  async (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (!isDirty() || a.getAttribute('href') === location.hash) return;
    e.preventDefault();
    e.stopPropagation();
    if (await askLeave()) {
      current.api.isDirty = () => false;
      location.hash = a.getAttribute('href');
    }
  },
  true
);

addEventListener('hashchange', async () => {
  if (skipNext) {
    skipNext = false;
    return;
  }
  // Back/forward while editing: put the address back, then ask.
  if (isDirty() && location.hash !== lastHash) {
    const target = location.hash;
    history.replaceState(null, '', lastHash);
    if (await askLeave()) {
      current.api.isDirty = () => false;
      location.hash = target;
    }
    return;
  }
  render();
});

/* ── Shell ── */
const navLink = (it) => `
  <a class="a-nav__link" href="#/${it.id}" data-nav="${it.id}">
    <span class="a-nav__icon">${icon(it.icon, 20)}</span>
    <span class="a-nav__label"><span class="a-nav__long">${it.label}</span><span class="a-nav__short" aria-hidden="true">${it.short}</span></span>
    ${it.badge ? `<span class="a-badge" data-badge="${it.id}" hidden></span>` : ''}
  </a>`;

function shell() {
  const s = session();
  const initials = (s?.email || 'O')[0].toUpperCase();
  root.innerHTML = `
  <a class="a-skip" href="#a-main" data-skip>Skip to content</a>
  <div class="a-app">
    <aside class="a-side" aria-label="Dashboard">
      <a class="a-brand" href="#/dashboard" aria-label="Scioto House owner dashboard — home">
        <span class="a-brand__mark" aria-hidden="true">SH</span>
        <span class="a-brand__text"><strong>Scioto House</strong><small>Owner dashboard</small></span>
      </a>
      <nav class="a-nav" aria-label="Main">
        ${NAV.map((g) => `<p class="a-nav__group">${g.group}</p>${g.items.map(navLink).join('')}`).join('')}
        <span class="a-nav__sep" aria-hidden="true"></span>
        ${navLink(ALL[ALL.length - 1])}
      </nav>
      <div class="a-side__foot">
        <a class="a-side__site" href="${siteUrl('/')}" target="_blank" rel="noopener" data-live-link>
          <span class="a-nav__icon">${icon('external', 18)}</span><span class="a-nav__label"><span class="a-nav__long">View live site</span><span class="a-nav__short" aria-hidden="true">Live site</span></span>
          <span class="sr-only"> (opens in a new tab)</span>
        </a>
        <div class="a-account">
          <span class="a-avatar" aria-hidden="true">${esc(initials)}</span>
          <span class="a-account__text"><small>Signed in as</small><span>${esc(s?.email || '')}</span></span>
          <button class="a-iconbtn a-account__out" type="button" data-signout aria-label="Sign out">${icon('logout', 20)}</button>
        </div>
      </div>
    </aside>

    <header class="a-top">
      <a class="a-brand a-brand--top" href="#/dashboard" aria-label="Scioto House owner dashboard — home">
        <span class="a-brand__mark" aria-hidden="true">SH</span>
        <span class="a-brand__text"><strong>Scioto House</strong><small>Owner dashboard</small></span>
      </a>
      <a class="a-iconbtn a-iconbtn--outline" href="${siteUrl('/')}" target="_blank" rel="noopener" data-live-link aria-label="View live site (opens in a new tab)">${icon('external', 20)}</a>
    </header>

    <main class="a-main" id="a-main" tabindex="-1">
      <div class="a-view" data-view></div>
    </main>

    <nav class="a-tabs" aria-label="Main">
      ${TABS.map((id) => ALL.find((x) => x.id === id))
        .map((it) => `<a class="a-tab" href="#/${it.id}" data-nav="${it.id}">${icon(it.icon, 22)}<span>${it.short}</span></a>`)
        .join('')}
      <button class="a-tab" type="button" data-more aria-haspopup="dialog">${icon('grid', 22)}<span>More</span><span class="a-badge a-badge--dot" data-badge="more" hidden></span></button>
    </nav>
  </div>`;
  $('[data-skip]', root).addEventListener('click', (e) => {
    e.preventDefault();
    $('#a-main').focus();
  });
  $('[data-signout]', root).addEventListener('click', doSignOut);
  $('[data-more]', root).addEventListener('click', openMore);
  refreshBadges();
}

async function doSignOut() {
  if (isDirty() && !(await askLeave())) return;
  if (current?.api) current.api.isDirty = () => false;
  signOut();
  toast('You’re signed out.', { kind: 'info', duration: 3500 });
  location.hash = '#/login';
}

function openMore() {
  const unread = listMessages().filter((m) => !m.read).length;
  const dlg = openDialog({
    title: 'More',
    variant: 'side',
    className: 'a-more',
    body: `<nav aria-label="More pages"><ul class="a-more__list">
      ${MORE.map((id) => ALL.find((x) => x.id === id))
        .map(
          (it) => `<li><a class="a-more__link" href="#/${it.id}" ${parse().name === it.id ? 'aria-current="page"' : ''}>
            <span class="a-more__icon">${icon(it.icon, 22)}</span><span>${it.label}</span>
            ${it.id === 'messages' && unread ? `<span class="a-badge">${unread}</span>` : ''}${icon('chevR', 18, 'a-more__chev')}</a></li>`
        )
        .join('')}
      </ul></nav>
      <p class="a-more__heading">View the live website</p>
      <ul class="a-more__designs">
        ${DESIGNS.map((d) => `<li><a href="/${d.id}/" target="_blank" rel="noopener">${esc(d.label)}<small>${esc(d.note)}</small>${icon('external', 16)}<span class="sr-only"> (opens in a new tab)</span></a></li>`).join('')}
      </ul>
      <div class="a-more__account">
        <span class="a-avatar" aria-hidden="true">${esc((session()?.email || 'O')[0].toUpperCase())}</span>
        <span class="a-account__text"><small>Signed in as</small><span>${esc(session()?.email || '')}</span></span>
        <button class="a-btn a-btn--secondary" type="button" data-more-signout>${icon('logout', 18)} Sign out</button>
      </div>`,
  });
  dlg.el.addEventListener('click', (e) => {
    const a = e.target.closest('.a-more__link');
    if (a) dlg.close(null, { force: true });
  });
  $('[data-more-signout]', dlg.el).addEventListener('click', () => {
    dlg.close(null, { force: true });
    doSignOut();
  });
}

export function refreshBadges() {
  const unread = listMessages().filter((m) => !m.read).length;
  $$('[data-badge="messages"]', root).forEach((b) => {
    b.hidden = !unread;
    b.textContent = unread;
    b.setAttribute('aria-label', `${unread} unread`);
  });
  $$('[data-badge="more"]', root).forEach((b) => {
    b.hidden = !unread;
    b.setAttribute('aria-label', `${unread} unread messages`);
  });
  $$('[data-live-link]', root).forEach((a) => (a.href = siteUrl('/')));
}

function markNav(name) {
  $$('[data-nav]', root).forEach((a) => (a.dataset.nav === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const more = $('[data-more]', root);
  more && more.classList.toggle('is-current', MORE.includes(name));
}

const skeleton = () => `
  <div class="a-skel" aria-hidden="true">
    <div class="a-skel__line a-skel__line--title"></div><div class="a-skel__line a-skel__line--lede"></div>
    <div class="a-skel__grid"><div></div><div></div><div></div><div></div></div>
    <div class="a-skel__block"></div>
  </div>`;

/* ── Render the current route ── */
async function render() {
  const r = parse();
  lastHash = location.hash;
  const my = ++token;

  if (!session()) {
    if (r.name !== 'login') {
      if (r.name) sessionStorage.setItem('sh:admin:next', location.hash);
      history.replaceState(null, '', '#/login');
      lastHash = '#/login';
    }
    closeAllDialogs();
    current?.api?.destroy?.();
    current = { name: 'login', api: { destroy: loginScreen(root, { onSuccess }) } };
    document.documentElement.classList.add('a-is-login');
    $('#login-email', root)?.focus();
    return;
  }
  if (!r.name || r.name === 'login' || !SCREENS[r.name]) {
    history.replaceState(null, '', '#/dashboard');
    return render();
  }
  document.documentElement.classList.remove('a-is-login');
  if (!$('.a-app', root)) shell();

  const view = $('[data-view]', root);
  const main = $('#a-main', root);
  markNav(r.name);
  const meta = ALL.find((x) => x.id === r.name);
  document.title = `${meta.label} — Owner Dashboard · Scioto House`;

  const sameScreen = current && current.name === r.name;
  closeAllDialogs(); // a dialog never outlives the page it belongs to
  current?.api?.destroy?.();
  current = { name: r.name, api: null };
  main.setAttribute('aria-busy', 'true');
  const slow = setTimeout(() => my === token && (view.innerHTML = skeleton()), 120);
  try {
    const mod = await SCREENS[r.name]();
    if (my !== token) return;
    clearTimeout(slow);
    view.innerHTML = '';
    view.className = `a-view a-view--${r.name}`;
    const api = (await mod.default(view, { route: r, navigate, refreshBadges, rerender: () => render() })) || {};
    if (my !== token) return;
    current.api = api;
    main.removeAttribute('aria-busy');
    if (!sameScreen) scrollTo({ top: 0, behavior: 'instant' });
    const h = $('.a-h1', view);
    if (!r.query.nofocus) h ? h.focus({ preventScroll: sameScreen }) : main.focus({ preventScroll: true });
  } catch (err) {
    clearTimeout(slow);
    console.error(err);
    main.removeAttribute('aria-busy');
    view.innerHTML = `
      <div class="a-error-state" role="alert">
        <span class="a-empty__icon a-empty__icon--danger">${icon('alert', 26)}</span>
        <h1 class="a-h1" tabindex="-1">This page didn’t load</h1>
        <p>Something went wrong while opening <strong>${esc(meta.label)}</strong>. Try again first. If it keeps happening, the saved content for this page may be damaged — go to <a class="a-link" href="#/settings">Settings &amp; backup</a> to import a recent backup or restore the original content.</p>
        <p class="a-error-state__detail"><code>${esc(String(err && err.message ? err.message : err).slice(0, 200))}</code></p>
        <div class="a-empty__actions">
          <button class="a-btn a-btn--primary" type="button" data-retry>${icon('refresh', 18)} Try again</button>
          <a class="a-btn a-btn--secondary" href="#/dashboard">Go to dashboard</a>
        </div>
      </div>`;
    $('[data-retry]', view).addEventListener('click', () => render());
    $('.a-h1', view).focus();
  }
}

function onSuccess() {
  const next = sessionStorage.getItem('sh:admin:next');
  sessionStorage.removeItem('sh:admin:next');
  root.innerHTML = '';
  location.hash = next && next !== '#/login' ? next : '#/dashboard';
  if (location.hash === lastHash) render();
}

// Ctrl/Cmd+S saves the page (or the open dish dialog) instead of opening the browser's "Save page as".
addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 's' || !session()) return;
  e.preventDefault();
  const dlg = [...document.querySelectorAll('dialog[open]')].pop();
  const btn = dlg ? dlg.querySelector('[data-dialog-save]') : document.querySelector('[data-view] [data-save]');
  if (!btn) return;
  if (btn.disabled) {
    toast('Nothing to save — you haven’t changed anything yet.', { kind: 'info', duration: 2500 });
    return;
  }
  btn.click();
});

// Bookings/messages arriving from the website in another tab.
addEventListener('storage', (e) => {
  if (!session() || !['sh:records:v1', 'sh:messages', 'sh:subscribers', 'sh:content:v1'].includes(e.key)) return;
  refreshBadges();
  if (current && current.api && current.api.onExternalChange) current.api.onExternalChange(e.key);
  else if (current && ['dashboard', 'bookings', 'reservations', 'messages'].includes(current.name) && !isDirty() && !document.querySelector('dialog[open]')) render();
});

// keep the preferred design in sync if changed in Settings
addEventListener('sh:admin-prefs', () => refreshBadges());
void prefs;

render();
