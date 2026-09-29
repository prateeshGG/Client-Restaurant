/* FAMILIAR — behaviour for the site chrome and small enhancements:
 * live countdown ticker, “My booking (n)” pill, slide-down mobile panel placement/toggle,
 * polite newsletter slide-in, and the time dropdown on the reservation form. */
import { $, $$, esc, today } from '../../core/util.js';
import { listRecords } from '../../core/store.js';
import { newsletter } from '../../core/flows.js';
import { countdownHTML, nlForm, ic, PHOTO } from './parts.js';

const NLK = 'sh:familiar:nl';
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

function activeCount() {
  const t = today();
  return listRecords().filter((r) => r.status === 'confirmed' && ((r.type === 'stay' && r.checkOut >= t) || (r.type === 'table' && r.date >= t))).length;
}

export function setupChrome() {
  /* Countdown — minute precision (no distracting seconds), refreshed every 20 s. */
  const paintCd = () => $$('[data-countdown]').forEach((el) => {
    const html = countdownHTML();
    if (el.innerHTML !== html) el.innerHTML = html;
  });
  paintCd();
  setInterval(paintCd, 20000);
  document.addEventListener('visibilitychange', () => !document.hidden && paintCd());

  /* My booking (n) */
  const paintCount = () => {
    const n = activeCount();
    $$('[data-mybooking-n]').forEach((b) => ((b.textContent = n), (b.hidden = !n)));
    $$('[data-mybooking]').forEach((a) => a.setAttribute('aria-label', n ? `My booking, ${n} active` : 'My booking'));
  };
  paintCount();
  addEventListener('hashchange', () => setTimeout(paintCount, 60));
  addEventListener('storage', paintCount);
  document.addEventListener('click', () => setTimeout(paintCount, 900));

  /* Slide-down panel: sits directly under the header; the header button toggles it. */
  const btn = $('[data-drawer-open]');
  const drawer = $('[data-drawer]');
  const header = $('.site-header');
  if (btn && drawer && header) {
    const place = () => drawer.style.setProperty('--drop-top', Math.max(0, Math.round(header.getBoundingClientRect().bottom)) + 'px');
    btn.addEventListener('click', (e) => {
      if (btn.getAttribute('aria-expanded') === 'true') {
        e.stopImmediatePropagation();
        $('[data-drawer-close]', drawer)?.click();
        return;
      }
      place();
    }, true);
    addEventListener('resize', () => !drawer.hidden && place());
  }

  newsletterSlide();
}

/* ── Polite newsletter slide-in: after 45 s or 60 % scroll, email only, remembered, never on booking pages ── */
function newsletterSlide() {
  const blocked = () => ['book', 'reserve', 'manage'].includes(document.documentElement.dataset.route);
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-newsletter]');
    if (f) setTimeout(() => !f.isConnected && store.set(NLK, 'subscribed'), 0);
  });
  if (store.get(NLK)) return;
  let el = null;
  const onScroll = () => {
    const maxY = document.documentElement.scrollHeight - innerHeight;
    if (maxY > 600 && scrollY / maxY >= 0.6) show();
  };
  const timer = setTimeout(() => show(), 45000);
  addEventListener('scroll', onScroll, { passive: true });

  const hide = (remember) => {
    if (!el) return;
    if (remember) store.set(NLK, 'dismissed');
    const node = el;
    el = null;
    node.classList.remove('is-in');
    setTimeout(() => node.remove(), 450);
  };
  function show() {
    if (el || store.get(NLK) || blocked()) return;
    clearTimeout(timer);
    removeEventListener('scroll', onScroll);
    el = document.createElement('aside');
    el.className = 'nls';
    el.setAttribute('aria-labelledby', 'nls-t');
    el.innerHTML = `
      <button class="nls__x" type="button" data-nls-close aria-label="Close newsletter sign-up">${ic('x', 20)}</button>
      <div class="nls__in">
        <div class="nls__top"><img class="nls__img" src="${PHOTO.newsletter}" alt="" loading="lazy"><div><p class="nls__kicker">The Scioto letter</p><h2 class="nls__t" id="nls-t">Get opening news & founding-guest offers</h2></div></div>
        <p class="nls__p">About once a month: new menus, rooftop nights and first dibs on dates. Just your email — unsubscribe any time.</p>
        ${nlForm('nls', 'Email address', 'Sign me up')}
        <button class="nls__no" type="button" data-nls-close>No thanks</button>
      </div>`;
    document.body.append(el);
    newsletter(el);
    el.addEventListener('click', (e) => e.target.closest('[data-nls-close]') && hide(true));
    el.addEventListener('keydown', (e) => e.key === 'Escape' && hide(true));
    el.addEventListener('submit', () => setTimeout(() => !el?.querySelector('form') && setTimeout(() => hide(false), 3500), 0));
    requestAnimationFrame(() => requestAnimationFrame(() => el && el.classList.add('is-in')));
  }
  addEventListener('hashchange', () => el && blocked() && hide(false));
}

/* ── Reservation time dropdown ───────────────────────────────────────────
 * The shared flow requires radio inputs name="time" inside [data-slots]; here they
 * live in a select-style popup (button + radiogroup). Mouse picks close it,
 * arrow keys move through times like a native select, Enter/Esc close. */
export function timeSelect(host) {
  let pointer = false, lastErr = '';
  const parts = () => {
    const box = $('.tsel', host);
    return box ? { box, btn: $('.tsel__btn', box), val: $('[data-tsel-val]', box), pop: $('[data-slots]', box) } : null;
  };
  const isOpen = () => parts()?.pop.hidden === false;
  const open = () => {
    const p = parts();
    if (!p) return;
    p.pop.hidden = false;
    p.btn.setAttribute('aria-expanded', 'true');
    ($('input[name=time]:checked', p.pop) || $('input[name=time]:not([disabled])', p.pop))?.focus();
  };
  const close = (refocus) => {
    const p = parts();
    if (!p || p.pop.hidden) return;
    p.pop.hidden = true;
    p.btn.setAttribute('aria-expanded', 'false');
    refocus && p.btn.focus();
  };
  const sync = () => {
    const p = parts();
    if (!p) return;
    const checked = $('input[name=time]:checked', p.pop);
    const any = $('input[name=time]:not([disabled])', p.pop);
    const notice = $('.notice', p.pop);
    const text = checked ? checked.closest('label').querySelector('.tsel__t').textContent : notice && !any ? 'No tables this day' : 'Select a time';
    if (p.val.textContent !== text) p.val.textContent = text;
    p.box.classList.toggle('is-placeholder', !checked);
    /* No bookable times (closed day / fully booked): the note below the form explains why, so the
     * dropdown is disabled rather than opening onto a copy of that notice. */
    const none = !any && !checked;
    if (p.btn.getAttribute('aria-disabled') !== String(none)) p.btn.setAttribute('aria-disabled', String(none));
    if (none && !p.pop.hidden) close(false);
    const note = $('[data-time-note]', host);
    if (note) {
      const html = notice ? notice.innerHTML : '';
      if (note.innerHTML !== html) note.innerHTML = html;
      if (note.hidden !== !notice) note.hidden = !notice;
    }
    const err = $('[data-slot-error]', host);
    const msg = err ? err.textContent.trim() : '';
    if (msg !== lastErr) {
      p.btn.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg && !p.box.contains(document.activeElement)) p.btn.focus();
      lastErr = msg;
    }
  };
  host.addEventListener('click', (e) => {
    const b = e.target.closest('.tsel__btn');
    if (b) return b.getAttribute('aria-disabled') === 'true' ? null : isOpen() ? close(false) : open();
  });
  host.addEventListener('pointerdown', (e) => (pointer = !!e.target.closest('.tsel__pop')));
  host.addEventListener('keydown', (e) => {
    const tb = e.target.closest('.tsel__btn');
    if (tb && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) return e.preventDefault(), tb.getAttribute('aria-disabled') !== 'true' && open();
    if (!e.target.closest('.tsel__pop')) return;
    pointer = false;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const r = e.target;
      if (r.matches('input[name=time]:not([disabled])') && !r.checked) {
        r.checked = true;
        r.dispatchEvent(new Event('change', { bubbles: true }));
      }
      close(true);
    }
  });
  host.addEventListener('change', (e) => {
    if (e.target.name === 'time') {
      sync();
      if (pointer) close(true);
      pointer = false;
    }
  });
  host.addEventListener('focusout', (e) => {
    const box = e.target.closest('.tsel');
    if (box && !box.contains(e.relatedTarget)) close(false);
  });
  const outside = (e) => {
    if (!host.isConnected) return document.removeEventListener('click', outside);
    const p = parts();
    if (p && !p.box.contains(e.target)) close(false);
  };
  document.addEventListener('click', outside);
  new MutationObserver(sync).observe(host, { childList: true, subtree: true, characterData: true });
  sync();
}

export const escAttr = esc;
