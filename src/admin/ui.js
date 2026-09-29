/* Owner Dashboard — UI kit (own look; does not use the site's option skins). */
import { esc, icon, $, $$, getPath, setPath } from './lib.js';

/* ── Toasts ─────────────────────────────────────────────────────────────
 * toast('Saved — live on the site', { kind:'success', action:{ label:'View on site', href } })
 * action.onClick → button (e.g. Undo). Returns { close }. */
let host;
const tagged = new Map(); // tag → Set of close fns (e.g. Undo toasts owned by one screen)
export function closeToasts(tag) {
  (tagged.get(tag) || []).forEach((c) => c());
  tagged.delete(tag);
}
export function toast(message, { kind = 'success', action, duration = 6000, tag } = {}) {
  if (!host) {
    host = document.createElement('div');
    host.className = 'a-toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const t = document.createElement('div');
  t.className = `a-toast a-toast--${kind}`;
  t.dataset.toast = kind;
  const ic = kind === 'error' ? 'alert' : kind === 'info' ? 'info' : 'check';
  let act = '';
  if (action) {
    act = action.href
      ? `<a class="a-toast__action" href="${esc(action.href)}" ${action.newTab === false ? '' : 'target="_blank" rel="noopener"'} data-toast-action>${esc(action.label)}${action.newTab === false ? '' : `<span class="sr-only"> (opens in a new tab)</span>`}</a>`
      : `<button class="a-toast__action" type="button" data-toast-action>${esc(action.label)}</button>`;
  }
  t.innerHTML = `<span class="a-toast__icon">${icon(ic, 18)}</span><span class="a-toast__msg">${esc(message)}</span>${act}
    <button class="a-toast__close" type="button" aria-label="Dismiss message">${icon('x', 16)}</button>`;
  host.append(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  let timer;
  const close = () => {
    clearTimeout(timer);
    if (tag) tagged.get(tag)?.delete(close);
    t.classList.remove('is-in');
    setTimeout(() => t.remove(), 250);
  };
  const arm = () => (timer = setTimeout(close, duration));
  t.addEventListener('mouseenter', () => clearTimeout(timer));
  t.addEventListener('mouseleave', arm);
  t.addEventListener('focusin', () => clearTimeout(timer));
  t.querySelector('.a-toast__close').addEventListener('click', close);
  const a = t.querySelector('[data-toast-action]');
  if (a && action.onClick)
    a.addEventListener('click', () => {
      action.onClick();
      close();
    });
  else if (a) a.addEventListener('click', () => setTimeout(close, 100));
  // keep at most 3 on screen
  while (host.children.length > 3) host.firstElementChild.remove();
  if (tag) (tagged.get(tag) || tagged.set(tag, new Set()).get(tag)).add(close);
  arm();
  return { close };
}

/* ── Scroll lock ── */
let locks = 0;
const lock = (on) => {
  locks = Math.max(0, locks + (on ? 1 : -1));
  document.documentElement.classList.toggle('a-locked', locks > 0);
};

const openDialogs = new Set();
/** Close every open dialog without asking (used when the page changes underneath). */
export function closeAllDialogs() {
  [...openDialogs].forEach((d) => d.close(null, { force: true }));
}

/* ── Dialog / sheet (native <dialog> = focus trap + inert background) ──
 * variant: 'dialog' (centred; bottom sheet on phones) | 'side' (right panel; bottom sheet on phones) */
export function openDialog({ title, body = '', footer = '', variant = 'dialog', size = '', onClose, onOpen, className = '', labelId } = {}) {
  const d = document.createElement('dialog');
  const id = labelId || 'dlg-' + Math.random().toString(36).slice(2, 8);
  d.className = `a-dialog a-dialog--${variant} ${size ? 'a-dialog--' + size : ''} ${className}`;
  d.setAttribute('aria-labelledby', id);
  d.innerHTML = `
    <div class="a-dialog__panel">
      <header class="a-dialog__head">
        <h2 class="a-dialog__title" id="${id}">${title}</h2>
        <button class="a-iconbtn" type="button" data-dialog-close aria-label="Close">${icon('x', 20)}</button>
      </header>
      <div class="a-dialog__body">${body}</div>
      ${footer ? `<footer class="a-dialog__foot">${footer}</footer>` : ''}
    </div>`;
  document.body.append(d);
  const opener = document.activeElement;
  let closed = false;
  let guard = null;
  const close = async (val, { force = false } = {}) => {
    if (closed) return;
    if (!force && guard && !(await guard())) return;
    if (closed) return;
    closed = true;
    openDialogs.delete(api);
    d.classList.add('is-closing');
    setTimeout(() => {
      if (d.open) d.close();
      d.remove();
      lock(false);
      if (opener && opener.isConnected && opener.focus) opener.focus();
      onClose && onClose(val);
    }, 170);
  };
  d.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  d.addEventListener('mousedown', (e) => {
    if (e.target === d) d.dataset.downOnBackdrop = '1';
  });
  d.addEventListener('click', (e) => {
    if (e.target === d && d.dataset.downOnBackdrop) close();
    delete d.dataset.downOnBackdrop;
    if (e.target.closest('[data-dialog-close]')) close();
  });
  lock(true);
  d.showModal();
  const api = {
    el: d,
    close,
    body: $('.a-dialog__body', d),
    foot: $('.a-dialog__foot', d),
    setGuard: (fn) => (guard = fn),
    setTitle: (t) => ($('.a-dialog__title', d).innerHTML = t),
  };
  openDialogs.add(api);
  onOpen && onOpen(api);
  const first = $('[autofocus]', d) || $('.a-dialog__body input, .a-dialog__body select, .a-dialog__body textarea', d);
  if (first && variant === 'dialog') first.focus();
  else $('.a-dialog__title', d).setAttribute('tabindex', '-1'), $('.a-dialog__title', d).focus();
  return api;
}

export function confirmDialog({ title, text, confirmLabel = 'Confirm', cancelLabel = 'Keep it', danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    const dlg = openDialog({
      title: esc(title),
      body: `<p class="a-dialog__text">${text}</p>`,
      footer: `<button class="a-btn a-btn--secondary" type="button" data-no>${esc(cancelLabel)}</button>
               <button class="a-btn ${danger ? 'a-btn--danger' : 'a-btn--primary'}" type="button" data-yes>${esc(confirmLabel)}</button>`,
      className: 'a-dialog--confirm',
      onClose: () => resolve(result),
    });
    $('[data-no]', dlg.el).addEventListener('click', () => dlg.close());
    $('[data-yes]', dlg.el).addEventListener('click', () => {
      result = true;
      dlg.close(true, { force: true });
    });
    $('[data-no]', dlg.el).focus();
  });
}

/** Discard confirm shared by every save bar. */
export const confirmDiscard = () =>
  confirmDialog({
    title: 'Discard your changes?',
    text: 'Everything you changed on this page since the last save will be put back the way it was.',
    confirmLabel: 'Discard changes',
    cancelLabel: 'Keep editing',
    danger: true,
  });

/** Asks the owner to type a word (e.g. RESET) before a destructive action. */
export function typedConfirm({ title, text, word = 'RESET', confirmLabel = 'Reset' }) {
  return new Promise((resolve) => {
    let result = false;
    const dlg = openDialog({
      title: esc(title),
      body: `<p class="a-dialog__text">${text}</p>
        <div class="a-field">
          <label class="a-label" for="typed-confirm">Type <strong>${esc(word)}</strong> to confirm</label>
          <input class="a-input" id="typed-confirm" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="typed-hint">
          <p class="a-hint" id="typed-hint">This can’t be undone, but you can re-import a backup file afterwards.</p>
        </div>`,
      footer: `<button class="a-btn a-btn--secondary" type="button" data-no>Cancel</button>
               <button class="a-btn a-btn--danger" type="button" data-yes disabled>${esc(confirmLabel)}</button>`,
      className: 'a-dialog--confirm',
      onClose: () => resolve(result),
    });
    const input = $('#typed-confirm', dlg.el);
    const yes = $('[data-yes]', dlg.el);
    input.addEventListener('input', () => (yes.disabled = input.value.trim().toUpperCase() !== word));
    input.addEventListener('keydown', (e) => e.key === 'Enter' && !yes.disabled && yes.click());
    $('[data-no]', dlg.el).addEventListener('click', () => dlg.close());
    yes.addEventListener('click', () => {
      result = true;
      dlg.close(true, { force: true });
    });
    input.focus();
  });
}

/* ── Form fields ────────────────────────────────────────────────────────
 * All inputs carry data-bind="<path>" (value is read/written on the draft object). */
let fid = 0;
export function field({ label, bind, value = '', type = 'text', hint = '', required = false, attrs = '', full = false, prefix = '', suffix = '', as = 'input', options = [], rows = 4, id, cls = '' }) {
  const i = id || `f${++fid}`;
  const desc = `${hint ? `${i}-h ` : ''}${i}-e`;
  let control;
  if (as === 'textarea') control = `<textarea class="a-input a-textarea" id="${i}" data-bind="${bind}" rows="${rows}" aria-describedby="${desc}" ${required ? 'aria-required="true"' : ''} ${attrs}>${esc(value)}</textarea>`;
  else if (as === 'select')
    control = `<div class="a-select"><select class="a-input" id="${i}" data-bind="${bind}" aria-describedby="${desc}" ${attrs}>${options
      .map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`;
      })
      .join('')}</select>${icon('chevD', 18)}</div>`;
  else control = `<input class="a-input" id="${i}" type="${type}" data-bind="${bind}" value="${esc(value)}" aria-describedby="${desc}" ${required ? 'aria-required="true"' : ''} ${attrs}>`;
  if (prefix || suffix) control = `<div class="a-affix">${prefix ? `<span class="a-affix__pre" aria-hidden="true">${prefix}</span>` : ''}${control}${suffix ? `<span class="a-affix__suf" aria-hidden="true">${suffix}</span>` : ''}</div>`;
  return `<div class="a-field ${full ? 'a-field--full' : ''} ${cls}" data-field="${bind}">
    <label class="a-label" for="${i}">${label}${required ? '' : ' <span class="a-optional">optional</span>'}</label>
    ${control}
    ${hint ? `<p class="a-hint" id="${i}-h">${hint}</p>` : ''}
    <p class="a-error" id="${i}-e" role="alert"></p>
  </div>`;
}

/** On/off switch (a real checkbox with role=switch). */
export function toggle({ label, bind, checked = false, hint = '', attrs = '', id, compact = false }) {
  const i = id || `f${++fid}`;
  return `<label class="a-switch ${compact ? 'a-switch--compact' : ''}" for="${i}">
    <input type="checkbox" role="switch" id="${i}" ${bind ? `data-bind="${bind}" data-type="bool"` : ''} ${checked ? 'checked' : ''} ${attrs}>
    <span class="a-switch__track" aria-hidden="true"><span class="a-switch__thumb"></span></span>
    <span class="a-switch__text"><span class="a-switch__label">${label}</span>${hint ? `<span class="a-switch__hint">${hint}</span>` : ''}</span>
  </label>`;
}

/** Paint / clear inline errors. errors = { bindPath: 'message' } */
export function showErrors(root, errors) {
  $$('[data-field]', root).forEach((f) => {
    const msg = errors[f.dataset.field] || '';
    f.classList.toggle('is-invalid', !!msg);
    const e = $('.a-error', f);
    if (e) e.textContent = msg;
    const c = $('[data-bind]', f);
    if (c) c.setAttribute('aria-invalid', msg ? 'true' : 'false');
  });
  const firstKey = Object.keys(errors).find((k) => errors[k]);
  if (firstKey) {
    const el = $(`[data-field="${CSS.escape(firstKey)}"] [data-bind]`, root) || $(`[data-bind="${CSS.escape(firstKey)}"]`, root);
    el && el.focus();
    return false;
  }
  return true;
}
export function clearError(input) {
  const f = input.closest('[data-field]');
  if (!f || !f.classList.contains('is-invalid')) return;
  f.classList.remove('is-invalid');
  const e = $('.a-error', f);
  if (e) e.textContent = '';
  input.setAttribute('aria-invalid', 'false');
}

/** Two-way bind [data-bind] controls inside root to a draft object. onChange(path, value, el). */
export function bindForm(root, draft, onChange) {
  const read = (el) => {
    const t = el.dataset.type;
    if (t === 'bool' || el.type === 'checkbox') return el.checked;
    if (t === 'number') return el.value === '' ? '' : Number(el.value);
    if (t === 'percent') return el.value === '' ? '' : Math.round(Number(el.value) * 10) / 1000;
    if (t === 'int') return el.value === '' ? '' : parseInt(el.value, 10);
    if (t === 'close') return el.value === '00:00' ? '24:00' : el.value;
    return el.value;
  };
  const handler = (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.bind || el.dataset.bindSkip != null) return;
    const v = read(el);
    setPath(draft(), el.dataset.bind, v);
    clearError(el);
    onChange && onChange(el.dataset.bind, v, el);
  };
  root.addEventListener('input', handler);
  root.addEventListener('change', handler);
}
export const readBound = (draft, path) => getPath(draft, path);

/* ── Save bar (sticky) — Save stays disabled until something changed ── */
export function saveBar({ label = 'Save changes', note = 'Changes go live on every design as soon as you save.' } = {}) {
  return `<div class="a-savebar" data-savebar>
      <p class="a-savebar__status" aria-live="polite"><span class="a-savebar__dot" aria-hidden="true"></span><span data-savebar-text>No unsaved changes</span></p>
      <p class="a-savebar__note">${note}</p>
      <div class="a-savebar__actions">
        <button class="a-btn a-btn--ghost" type="button" data-discard disabled>Discard</button>
        <button class="a-btn a-btn--primary" type="button" data-save disabled>${icon('check', 18)} ${label}</button>
      </div>
    </div>`;
}
export function paintSaveBar(root, dirty) {
  const bar = $('[data-savebar]', root);
  if (!bar) return;
  bar.classList.toggle('is-dirty', dirty);
  $('[data-save]', bar).disabled = !dirty;
  $('[data-discard]', bar).disabled = !dirty;
  $('[data-savebar-text]', bar).textContent = dirty ? 'You have unsaved changes' : 'All changes saved';
}

/* ── Misc building blocks ── */
export const pageHead = ({ title, lede = '', actions = '' }) => `
  <header class="a-pagehead">
    <div class="a-pagehead__text">
      <h1 class="a-h1" tabindex="-1">${title}</h1>
      ${lede ? `<p class="a-lede">${lede}</p>` : ''}
    </div>
    ${actions ? `<div class="a-pagehead__actions">${actions}</div>` : ''}
  </header>`;

export const empty = ({ icon: ic = 'inbox', title, text = '', actions = '' }) => `
  <div class="a-empty">
    <span class="a-empty__icon">${icon(ic, 26)}</span>
    <h3 class="a-empty__title">${title}</h3>
    ${text ? `<p class="a-empty__text">${text}</p>` : ''}
    ${actions ? `<div class="a-empty__actions">${actions}</div>` : ''}
  </div>`;

export const callout = (html, kind = 'info') => `<div class="a-callout a-callout--${kind}">${icon(kind === 'warn' ? 'alert' : kind === 'tip' ? 'sparkle' : 'info', 18)}<div>${html}</div></div>`;

const STATUS = {
  confirmed: ['Confirmed', 'blue'],
  'checked-in': ['In house', 'green'],
  'checked-out': ['Checked out', 'grey'],
  cancelled: ['Cancelled', 'red'],
  seated: ['Seated', 'green'],
  'no-show': ['No-show', 'amber'],
  past: ['Not checked in', 'amber'],
};
export const statusChip = (s) => {
  const [l, c] = STATUS[s] || [s, 'grey'];
  return `<span class="a-chip a-chip--${c}" data-status="${esc(s)}">${l}</span>`;
};

export function setBusy(btn, busy, label = 'Saving…') {
  if (!btn) return;
  if (busy) {
    btn.dataset.label = btn.innerHTML;
    btn.innerHTML = `<span class="a-spinner" aria-hidden="true"></span>${esc(label)}`;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
  } else {
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    btn.removeAttribute('aria-busy');
  }
}

/* Roving tablist helper (arrow keys). */
export function tabs(list, onSelect) {
  const items = $$('[role="tab"]', list);
  items.forEach((t, i) => {
    t.addEventListener('click', () => onSelect(t.dataset.value, t));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1, Home: -99, End: 99 }[e.key];
      if (!k) return;
      e.preventDefault();
      const n = k === -99 ? 0 : k === 99 ? items.length - 1 : (i + k + items.length) % items.length;
      items[n].focus();
      onSelect(items[n].dataset.value, items[n]);
    });
  });
}
