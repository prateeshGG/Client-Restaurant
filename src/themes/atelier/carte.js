/* ATELIER — the typeset carte.
 * Hover (mouse/pen): the dish photo FOLLOWS THE CURSOR with a soft lag and develops from greyscale to colour.
 * Keyboard focus: the photo is PINNED beside the focused dish (no cursor needed).
 * Touch / click: each dish name is a disclosure button — tap to open the plate inline (accordion), tap again to close.
 * The follower is decorative (aria-hidden, pointer-events:none); the accessible photo is the inline plate. */
import { menu } from '../../content.js';
import { esc, money, $$ } from '../../core/util.js';

const periodNote = (id) => menu.periods.find((p) => p.id === id)?.note || '';
const dietLabel = (id) => menu.diets.find((d) => d.id === id)?.label || id;

/* Until every dish has its own photograph, several share a stand-in (content.js). A photo is treated as the dish's own
 * when only that dish uses it, when the dish is featured, or when the file is named after the dish; any other dish that
 * reuses it is captioned honestly as a representative plate instead of claiming to be that dish. */
const stem = (src) => String(src || '').split('/').pop().replace(/\.[a-z]+$/i, '').toLowerCase();
const isOwnPhoto = (i) => {
  const users = menu.items.filter((x) => x.image === i.image);
  return users.length < 2 || !!i.featured || stem(i.image).split(/[-_]/).includes(String(i.id).toLowerCase());
};
const photoCap = (i) => (isOwnPhoto(i) ? i.name : `${i.name} — representative plate`);
const photoAlt = (i) => (isOwnPhoto(i) ? i.name : `A plate from the Kitchen (representative photo; ${i.name} photograph to come)`);

export const dish = (i) => `
  <article class="dish" data-menu-item="${i.id}" data-img="${esc(i.image)}" data-name="${esc(i.name)}" data-cap="${esc(photoCap(i))}">
    <h3 class="dish__h">
      <button class="dish__btn" type="button" aria-expanded="false" aria-controls="plate-${i.id}">
        <span class="dish__name">${esc(i.name)}</span>
        <span class="dish__price">${money(i.price)}</span>
        <span class="dish__mark" aria-hidden="true"></span>
        <span class="sr-only"> — show photo</span>
      </button>
    </h3>
    ${i.desc ? `<p class="dish__desc">${esc(i.desc)}</p>` : ''}
    ${i.diet.length ? `<p class="dish__diet">${i.diet.map((d) => `<abbr title="${dietLabel(d)}">${d.toUpperCase()}</abbr>`).join('<span aria-hidden="true"> · </span>')}</p>` : ''}
    <figure class="dish__plate" id="plate-${i.id}" hidden>
      <img data-src="${esc(i.image)}" alt="${esc(photoAlt(i))}" width="800" height="600" decoding="async">
      <figcaption>${esc(photoCap(i))}${isOwnPhoto(i) ? ` — ${esc(periodNote(i.period))}` : ''}</figcaption>
    </figure>
  </article>`;

export function mountCarte(list, host = list.parentElement) {
  if (!list) return { hide() {} };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fol = document.createElement('div');
  fol.className = 'follow';
  fol.setAttribute('aria-hidden', 'true');
  fol.innerHTML = '<div class="follow__frame"><img alt="" decoding="async"></div><p class="follow__cap"></p>';
  host.append(fol);
  const img = fol.querySelector('img');
  const cap = fol.querySelector('.follow__cap');
  const warmed = new Set();
  let cur = null, mode = null, x = 0, y = 0, tx = 0, ty = 0, raf = 0, px = 0, py = 0;

  const draw = () => (fol.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`);
  const tick = () => {
    const k = reduce.matches ? 1 : 0.13;
    x += (tx - x) * k;
    y += (ty - y) * k;
    draw();
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
  };
  const glide = () => raf || (raf = requestAnimationFrame(tick));
  const box = () => ({ w: fol.offsetWidth || 240, h: fol.offsetHeight || 320 });
  // keep the photo clear of the sticky header (it sits above the follower in the stacking order)
  const topEdge = () => Math.max(0, document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0) + 12;
  const clampY = (v, h) => Math.max(topEdge(), Math.min(v, innerHeight - h - 12));

  const aimCursor = () => {
    const { w, h } = box();
    let nx = px + 32;
    if (nx + w > innerWidth - 12) nx = px - w - 32;
    tx = Math.max(12, nx);
    ty = clampY(py - h * 0.6, h);
  };
  /* Pin beside the focused dish, in free space only: the photo may not cover any other dish.
   * Returns false when there is no clear gutter (single column / tablet) — the inline plate (Enter) is used instead. */
  const aimBeside = (item) => {
    const r = item.getBoundingClientRect();
    const { w, h } = box();
    const gap = 28;
    const L = list.getBoundingClientRect();
    // centre on the dish, but keep inside the list's own band so it never drifts over the filters or the next section
    let y = r.top + r.height / 2 - h / 2;
    if (L.height >= h) y = Math.min(Math.max(y, L.top), L.bottom - h);
    y = Math.max(topEdge(), y); // may run past the bottom of the viewport; it re-aims on scroll
    const obstacles = [
      ...[...list.querySelectorAll('[data-menu-item]')].filter((o) => o !== item),
      ...[...host.querySelectorAll('input, button, select, a, label')].filter((c) => !list.contains(c)),
    ];
    const clear = (left) => {
      const right = left + w;
      return !obstacles.some((o) => {
        const q = o.getBoundingClientRect();
        return q.width > 0 && q.right > left && q.left < right && q.bottom > y && q.top < y + h;
      });
    };
    for (const left of [r.right + gap, r.left - gap - w, L.right + gap, L.left - gap - w]) {
      if (left >= 12 && left + w <= innerWidth - 12 && clear(left)) return (tx = left), (ty = y), true;
    }
    return false;
  };

  const develop = (item) => {
    // restart the greyscale → colour development for every newly shown dish
    fol.classList.add('is-reset');
    fol.classList.remove('is-colour');
    void fol.offsetWidth;
    fol.classList.remove('is-reset');
    const on = () => requestAnimationFrame(() => cur === item && fol.classList.add('is-colour'));
    if (img.complete && img.naturalWidth) on();
    else img.addEventListener('load', on, { once: true });
  };
  const setItem = (item) => {
    if (item === cur) return;
    cur = item;
    const src = item.dataset.img;
    if (img.getAttribute('src') !== src) img.src = src;
    cap.textContent = item.dataset.cap || item.dataset.name;
    develop(item);
  };
  const show = (item, how) => {
    if (item.classList.contains('is-open')) return hide(); // photo already open inline
    const was = fol.classList.contains('is-on');
    setItem(item);
    if (how === 'pin' && !aimBeside(item)) return hide();
    mode = how;
    if (how !== 'pin') aimCursor();
    fol.classList.toggle('is-pinned', how === 'pin');
    fol.classList.add('is-on');
    if (!was) (x = tx), (y = ty), draw();
    else glide();
  };
  const hide = () => {
    fol.classList.remove('is-on', 'is-pinned');
    cur = null;
    mode = null;
  };
  const warm = () =>
    $$('[data-menu-item]', list).forEach((it) => {
      const src = it.dataset.img;
      if (src && !warmed.has(src)) warmed.add(src), (new Image().src = src);
    });

  list.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && warm());
  list.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    px = e.clientX;
    py = e.clientY;
    const item = e.target.closest('[data-menu-item]');
    if (item && list.contains(item)) show(item, 'cursor');
    else if (mode === 'cursor') aimCursor(), glide();
  });
  list.addEventListener('pointerleave', (e) => e.pointerType !== 'touch' && mode === 'cursor' && hide());

  list.addEventListener('focusin', (e) => {
    const btn = e.target.closest('.dish__btn');
    if (!btn) return;
    let keyboard = true;
    try {
      keyboard = btn.matches(':focus-visible');
    } catch { /* older engines: treat as keyboard */ }
    if (keyboard) show(btn.closest('[data-menu-item]'), 'pin');
  });
  list.addEventListener('focusout', (e) => mode === 'pin' && !list.contains(e.relatedTarget) && hide());
  list.addEventListener('keydown', (e) => e.key === 'Escape' && mode && hide());

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.dish__btn');
    if (!btn || !list.contains(btn)) return;
    const item = btn.closest('[data-menu-item]');
    const open = btn.getAttribute('aria-expanded') !== 'true';
    const plate = item.querySelector('.dish__plate');
    btn.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
    if (plate) {
      const im = plate.querySelector('img[data-src]');
      if (open && im) (im.src = im.dataset.src), im.removeAttribute('data-src');
      plate.hidden = !open;
    }
    if (open) hide();
    else if (e.detail === 0 && btn.matches(':focus-visible')) show(item, 'pin'); // keyboard close → pin again
  });

  const onScroll = () => {
    if (!host.isConnected) return removeEventListener('scroll', onScroll);
    if (mode === 'cursor') {
      const el = document.elementFromPoint(px, py);
      const item = el && el.closest('[data-menu-item]');
      item && list.contains(item) ? show(item, 'cursor') : hide();
    } else if (mode === 'pin' && cur) aimBeside(cur) ? glide() : hide();
  };
  addEventListener('scroll', onScroll, { passive: true });

  return { hide };
}
