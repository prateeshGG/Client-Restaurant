/* ─────────────────────────────────────────────────────────────────────────
 * Themed calendar for every <input type="date"> (site designs + Owner Dashboard).
 * The browser's own date popup cannot be styled, so on mouse/trackpad devices we
 * open this calendar instead. It inherits each design's tokens (--surface, --ink,
 * --primary, --radius-card, --font-body, --font-display …). Phones/tablets keep the
 * native date wheel, which they open on tap and which users expect there.
 * The <input> stays the source of truth: we set .value and fire input + change.
 * ───────────────────────────────────────────────────────────────────────── */
import { reservations } from '../content.js';
import './datepicker.css';

const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => {
  const [y, m, d] = String(s || '').split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const todayIso = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`; // the hotel's date in Columbus
};
const MONTH = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const LONG = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

let pop, input, view, focusIso, bound = false;

/* Partner field for range shading: check-out ↔ check-in in the same form. */
const partner = (el) => {
  const f = el.form;
  if (!f) return null;
  const n = el.name;
  if (n === 'checkOut' || n === 'out') return { start: f.elements.checkIn || f.elements.in, role: 'end' };
  if (n === 'checkIn' || n === 'in') return { end: f.elements.checkOut || f.elements.out, role: 'start' };
  return null;
};

function iconFor(el) {
  const c = getComputedStyle(el).color || '#555';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='${c}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><rect x='3.5' y='5' width='17' height='15' rx='1.5'/><path d='M3.5 10h17M8 3v4M16 3v4'/></svg>`;
  el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
function enhance(el) {
  if (el.dataset.dp) return;
  el.dataset.dp = '1';
  el.classList.add('dp-input');
  iconFor(el);
}

function build() {
  pop = document.createElement('div');
  pop.className = 'dp';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'false');
  pop.setAttribute('aria-label', 'Choose a date');
  if ('popover' in HTMLElement.prototype) pop.setAttribute('popover', 'manual'); // top layer: above headers and dialogs
  pop.hidden = true;
  document.body.append(pop);
  pop.addEventListener('click', onPopClick);
  pop.addEventListener('keydown', onPopKey);
}

function render() {
  const min = input.min || '';
  const max = input.max || '';
  const t = todayIso();
  const sel = input.value;
  const p = partner(input);
  const other = p?.start?.value || p?.end?.value || '';
  const [rs, re] = p?.role === 'end' ? [other, sel] : p?.role === 'start' ? [sel, other] : ['', ''];
  const closedWeekdays = input.closest('[data-form="table"]') ? reservations.closedDays || [] : [];
  const closedDates = input.closest('[data-form="table"]') ? reservations.closedDates || [] : [];
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const prevEnd = isoOf(new Date(view.getFullYear(), view.getMonth(), 0));
  const nextStart = isoOf(new Date(view.getFullYear(), view.getMonth() + 1, 1));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = isoOf(d);
    const out = d.getMonth() !== view.getMonth();
    const closed = closedWeekdays.includes(d.getDay()) || closedDates.includes(iso);
    const dis = (min && iso < min) || (max && iso > max) || closed;
    const inRange = rs && re && iso > rs && iso < re;
    const cls = ['dp__day', out && 'is-out', iso === t && 'is-today', iso === sel && 'is-selected', dis && 'is-disabled', closed && 'is-closed', inRange && 'is-range', iso === rs && rs && re && 'is-rs', iso === re && rs && re && 'is-re'].filter(Boolean).join(' ');
    cells.push(
      `<button type="button" class="${cls}" data-iso="${iso}" tabindex="${iso === focusIso ? 0 : -1}" aria-label="${LONG(d)}${iso === t ? ', today' : ''}${closed ? ', closed' : ''}${dis && !closed ? ', unavailable' : ''}" ${iso === sel ? 'aria-pressed="true"' : 'aria-pressed="false"'} ${dis ? 'aria-disabled="true"' : ''}>${d.getDate()}</button>`
    );
  }
  const canPrev = !min || prevEnd >= min;
  const canNext = !max || nextStart <= max;
  const todayOk = (!min || t >= min) && (!max || t <= max);
  pop.innerHTML = `
    <div class="dp__head">
      <button type="button" class="dp__nav" data-nav="-1" aria-label="Previous month" ${canPrev ? '' : 'disabled'}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
      <p class="dp__title" aria-live="polite">${MONTH(view)}</p>
      <button type="button" class="dp__nav" data-nav="1" aria-label="Next month" ${canNext ? '' : 'disabled'}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    </div>
    <div class="dp__wd" aria-hidden="true">${WD.map((w) => `<span>${w}</span>`).join('')}</div>
    <div class="dp__grid" role="group" aria-label="${MONTH(view)}">${cells.join('')}</div>
    <div class="dp__foot">
      <button type="button" class="dp__link" data-today ${todayOk ? '' : 'disabled'}>Today</button>
      ${closedWeekdays.length ? '<span class="dp__legend"><i></i>Closed</span>' : ''}
      <button type="button" class="dp__link" data-close>Close</button>
    </div>`;
}

function place() {
  if (!pop || pop.hidden) return;
  const r = input.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let top = r.bottom + 6;
  if (top + h > innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
  const left = Math.min(Math.max(8, r.left), innerWidth - w - 8);
  pop.style.top = `${Math.max(8, top)}px`;
  pop.style.left = `${left}px`;
}

function open(el) {
  if (!pop) build();
  input = el;
  // Theme the calendar from the field's own design context (tokens resolve on <html>).
  const cs = getComputedStyle(el);
  pop.style.setProperty('--dp-field-font', cs.fontFamily);
  const base = parse(el.value) || parse(el.min && el.min > todayIso() ? el.min : todayIso());
  view = new Date(base.getFullYear(), base.getMonth(), 1);
  focusIso = el.value || (el.min && el.min > todayIso() ? el.min : todayIso());
  render();
  pop.hidden = false;
  try {
    pop.showPopover?.();
  } catch {}
  place();
  el.setAttribute('aria-expanded', 'true');
  pop.querySelector('.dp__day[tabindex="0"]')?.focus({ preventScroll: true });
  addEventListener('scroll', place, true);
  addEventListener('resize', place);
  document.addEventListener('pointerdown', outside, true);
}

function close(returnFocus = true) {
  if (!pop || pop.hidden) return;
  try {
    pop.hidePopover?.();
  } catch {}
  pop.hidden = true;
  input?.setAttribute('aria-expanded', 'false');
  removeEventListener('scroll', place, true);
  removeEventListener('resize', place);
  document.removeEventListener('pointerdown', outside, true);
  if (returnFocus) input?.focus({ preventScroll: true });
}
const outside = (e) => {
  if (!pop.contains(e.target) && e.target !== input) close(false);
};

function choose(iso) {
  input.value = iso;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  close();
}

function moveFocus(iso) {
  const d = parse(iso);
  if (input.min && iso < input.min) return;
  if (input.max && iso > input.max) return;
  focusIso = iso;
  if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) view = new Date(d.getFullYear(), d.getMonth(), 1);
  render();
  pop.querySelector(`[data-iso="${iso}"]`)?.focus({ preventScroll: true });
}

function onPopClick(e) {
  const day = e.target.closest('.dp__day');
  if (day) {
    if (day.getAttribute('aria-disabled') === 'true') return;
    return choose(day.dataset.iso);
  }
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    view = new Date(view.getFullYear(), view.getMonth() + +nav.dataset.nav, 1);
    const f = parse(focusIso);
    const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    focusIso = isoOf(new Date(view.getFullYear(), view.getMonth(), Math.min(f.getDate(), dim)));
    render();
    pop.querySelector(`[data-nav="${nav.dataset.nav}"]`)?.focus();
    return;
  }
  if (e.target.closest('[data-today]')) return moveFocus(todayIso()), choose(todayIso());
  if (e.target.closest('[data-close]')) return close();
}

function onPopKey(e) {
  if (e.key === 'Escape') return e.preventDefault(), close();
  const day = e.target.closest('.dp__day');
  if (!day) return;
  const d = parse(day.dataset.iso);
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
  let next = null;
  if (step) next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + step);
  else if (e.key === 'PageUp') next = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
  else if (e.key === 'PageDown') next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
  else if (e.key === 'Home') next = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  else if (e.key === 'End') next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - d.getDay()));
  if (next) {
    e.preventDefault();
    moveFocus(isoOf(next));
  }
}

export function enableDatePicker() {
  if (bound) return;
  bound = true;
  const scan = (root) => root.querySelectorAll?.('input[type="date"]').forEach(enhance);
  scan(document);
  new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches?.('input[type="date"]') ? enhance(n) : scan(n))))).observe(document.body, { childList: true, subtree: true });
  // Mouse/trackpad: our calendar. Touch: the native wheel (opened by the OS on tap).
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest?.('input[type="date"]');
      if (!el || el.disabled || el.readOnly || !finePointer()) return;
      e.preventDefault();
      if (pop && !pop.hidden && input === el) return close(false);
      open(el);
    },
    true
  );
  document.addEventListener('keydown', (e) => {
    const el = e.target.closest?.('input[type="date"]');
    if (!el || !finePointer()) return;
    if ((e.altKey && e.key === 'ArrowDown') || e.key === 'F4') {
      e.preventDefault();
      open(el);
    }
  });
  addEventListener('hashchange', () => close(false));
}
