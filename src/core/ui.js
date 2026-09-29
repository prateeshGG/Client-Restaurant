import { icon, $$ } from './util.js';

/* ── Toasts ─────────────────────────────────────────── */
let toastHost;
export function toast(message, kind = 'info') {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toasts';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.append(toastHost);
  }
  const t = document.createElement('div');
  t.className = `toast toast--${kind}`;
  t.innerHTML = `${icon(kind === 'error' ? 'alert' : kind === 'success' ? 'check' : 'info', 18)}<span>${message}</span>
    <button class="toast__close" type="button" aria-label="Dismiss">${icon('x', 16)}</button>`;
  toastHost.append(t);
  void t.offsetWidth;
  t.classList.add('is-in');
  let timer;
  const close = () => {
    t.classList.remove('is-in');
    setTimeout(() => t.remove(), 300);
  };
  const arm = () => (timer = setTimeout(close, 4500));
  t.addEventListener('mouseenter', () => clearTimeout(timer));
  t.addEventListener('mouseleave', arm);
  t.querySelector('button').addEventListener('click', close);
  arm();
}

/* ── Focus trap + scroll lock ───────────────────────── */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export function trapFocus(container, e) {
  if (e.key !== 'Tab') return;
  const f = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0],
    last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
let locks = 0;
export const lockScroll = (on) => {
  locks = Math.max(0, locks + (on ? 1 : -1));
  document.documentElement.classList.toggle('is-locked', locks > 0);
};

/* ── Dialog (native <dialog>; bottom sheet on small screens via CSS) ── */
export function openDialog({ title, body, actions = [], className = '', onClose, labelledBy, opener: openerEl } = {}) {
  const d = document.createElement('dialog');
  d.className = `dialog ${className}`;
  const titleId = 'dlg-' + Math.random().toString(36).slice(2, 8);
  d.setAttribute('aria-labelledby', labelledBy || titleId);
  d.innerHTML = `
    <div class="dialog__panel">
      <div class="dialog__head">
        ${title ? `<h2 class="dialog__title" id="${titleId}">${title}</h2>` : ''}
        <button class="dialog__close" type="button" aria-label="Close">${icon('x', 20)}</button>
      </div>
      <div class="dialog__body">${body}</div>
      ${actions.length ? `<div class="dialog__actions">${actions.map((a, i) => `<button type="button" class="btn ${a.variant || 'btn--secondary'}" data-i="${i}">${a.label}</button>`).join('')}</div>` : ''}
    </div>`;
  document.body.append(d);
  const opener = openerEl || document.activeElement;
  const onRoute = () => close();
  addEventListener('hashchange', onRoute);
  const close = (val) => {
    removeEventListener('hashchange', onRoute);
    if (!d.isConnected || d.classList.contains('is-closing')) return;
    d.classList.add('is-closing');
    setTimeout(() => {
      d.close();
      d.remove();
      lockScroll(false);
      opener && opener.focus && opener.focus();
      onClose && onClose(val);
    }, 180);
  };
  d.querySelector('.dialog__close').addEventListener('click', () => close());
  d.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  d.addEventListener('click', (e) => {
    if (e.target === d) close();
  });
  $$('[data-i]', d).forEach((b) => b.addEventListener('click', () => {
    const a = actions[+b.dataset.i];
    a.onClick ? a.onClick(close, b) : close(a.value);
  }));
  lockScroll(true);
  d.showModal();
  return { el: d, close };
}

export function confirmDialog({ title, text, confirmLabel = 'Confirm', cancelLabel = 'Keep it', danger = false, opener }) {
  return new Promise((resolve) => {
    openDialog({
      opener,
      title,
      body: `<p>${text}</p>`,
      actions: [
        { label: cancelLabel, variant: 'btn--secondary', value: false },
        { label: confirmLabel, variant: danger ? 'btn--danger' : 'btn--primary', value: true },
      ],
      onClose: (v) => resolve(!!v),
    });
  });
}

/* ── Lightbox gallery ──────────────────────────────── */
export function lightbox(images, start = 0, alt = '', opener) {
  let i = start;
  const render = () => `
    <figure class="lightbox__fig"><img src="${images[i]}" alt="${alt} — photo ${i + 1} of ${images.length}"></figure>
    <div class="lightbox__nav">
      <button type="button" class="btn btn--icon" data-dir="-1" aria-label="Previous photo">${icon('arrowLeft')}</button>
      <span class="lightbox__count" aria-live="polite">${i + 1} / ${images.length}</span>
      <button type="button" class="btn btn--icon" data-dir="1" aria-label="Next photo">${icon('arrow')}</button>
    </div>`;
  const dlg = openDialog({ opener, title: alt, body: `<div class="lightbox">${render()}</div>`, className: 'dialog--wide' });
  const host = dlg.el.querySelector('.lightbox');
  const go = (dir) => {
    i = (i + dir + images.length) % images.length;
    host.innerHTML = render();
    bind();
  };
  const bind = () => $$('[data-dir]', host).forEach((b) => b.addEventListener('click', () => go(+b.dataset.dir)));
  bind();
  dlg.el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
}

/* ── Drawer (mobile nav) ───────────────────────────── */
export function setupDrawer(root = document) {
  const btn = root.querySelector('[data-drawer-open]');
  const drawer = root.querySelector('[data-drawer]');
  if (!btn || !drawer) return () => {};
  const closeBtn = drawer.querySelector('[data-drawer-close]');
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    trapFocus(drawer, e);
  };
  const open = () => {
    drawer.hidden = false;
    void drawer.offsetWidth; // commit display before transitioning
    drawer.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    lockScroll(true);
    document.addEventListener('keydown', onKey);
    (drawer.querySelector('a,button') || drawer).focus();
  };
  const close = (restore = true) => {
    if (drawer.hidden) return;
    drawer.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    lockScroll(false);
    document.removeEventListener('keydown', onKey);
    setTimeout(() => (drawer.hidden = true), 280);
    restore && btn.focus();
  };
  btn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', () => close());
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) close();
    if (e.target.closest('a')) close(false);
  });
  return () => close(false);
}

/* ── Tabs with roving tabindex ─────────────────────── */
export function setupTabs(list, onChange) {
  const tabs = $$('[role="tab"]', list);
  const select = (t, focus = true) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
    });
    focus && t.focus();
    onChange && onChange(t.dataset.value);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t, false));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) {
        e.preventDefault();
        select(n);
      }
    });
  });
}

/* ── Scroll reveal ─────────────────────────────────── */
let io;
export function reveal(root = document) {
  const els = $$('[data-reveal]', root);
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((e) => e.classList.add('is-visible'));
    return;
  }
  io ||= new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  els.forEach((e) => {
    if (e.classList.contains('is-visible')) return;
    // Elements already on screen (e.g. re-rendered after a filter change) appear immediately.
    const r = e.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0 && r.width) e.classList.add('is-visible');
    else io.observe(e);
  });
}

/* Any [data-reveal] element added later (filtered lists, re-rendered cards, admin previews)
 * is picked up automatically — otherwise it would stay at opacity 0. */
let mo;
export function autoReveal(root = document.body) {
  if (mo) return;
  mo = new MutationObserver((muts) => {
    for (const m of muts)
      for (const n of m.addedNodes)
        if (n.nodeType === 1 && (n.hasAttribute('data-reveal') || n.querySelector('[data-reveal]'))) {
          reveal(n.parentElement || root);
        }
  });
  mo.observe(root, { childList: true, subtree: true });
}

/* ── Button loading state ─────────────────────────── */
export function setBusy(btn, busy, label) {
  if (!btn) return;
  if (busy) {
    btn.dataset.label = btn.innerHTML;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${label || 'Please wait…'}</span>`;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
  } else {
    btn.innerHTML = btn.dataset.label || btn.innerHTML;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }
}
