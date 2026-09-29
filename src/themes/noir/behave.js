/* NOIR — interaction layer (progressive enhancement on top of the shared flows). */
import { $, $$, today, nightsBetween, money } from '../../core/util.js';
import { setError, rules } from '../../core/forms.js';
import { quote, roomGallery } from '../../core/flows.js';
import { UI } from '../../core/kit.js';
import { site, rooms } from '../../content.js';
import { roomFits } from './kit.js';
import { pad2, plural, shortDate, reduceMotion, statusHTML } from './shared.js';

/* ── Image preloading (lazy: only when a dish/photo is actually wanted) ── */
const cache = new Map();
export const preload = (src) => {
  if (!src) return Promise.resolve(src);
  if (!cache.has(src))
    cache.set(
      src,
      new Promise((res) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = im.onerror = () => res(src);
        im.src = src;
      })
    );
  return cache.get(src);
};

/* Two stacked layers ([data-layer]) that crossfade to a new background photo. */
export function crossfader(host) {
  const layers = $$('[data-layer]', host);
  let front = layers.findIndex((l) => l.classList.contains('is-on'));
  if (front < 0) front = 0;
  let want = layers[front]?.dataset.src || '';
  return async (src) => {
    if (!src || src === want) return;
    want = src;
    await preload(src);
    if (want !== src || !host.isConnected) return;
    const back = 1 - front;
    layers[back].style.backgroundImage = `url("${src}")`;
    layers[back].dataset.src = src;
    layers[back].classList.add('is-on');
    layers[front].classList.remove('is-on');
    front = back;
  };
}

/* Menu hover image. Hover (mouse/pen) or keyboard focus lights a dish and calls onShow(src, name);
 * tap / click / Enter toggles the wide photo strip under the row (the touch equivalent). */
export function bindPeek(list, { onShow, onReset }) {
  if (!list || list.dataset.peek) return;
  list.dataset.peek = '1';
  let lit = null;
  const light = (d) => {
    if (lit === d) return;
    lit && lit.classList.remove('is-lit');
    lit = d && list.contains(d) ? d : null;
    list.classList.toggle('is-peeking', !!lit);
    if (lit) {
      lit.classList.add('is-lit');
      onShow && onShow(lit.dataset.img, lit.dataset.name);
    } else onReset && onReset();
  };
  const focusedDish = () => {
    const a = document.activeElement;
    return a && a.matches && a.matches('.dish__btn:focus-visible') && list.contains(a) ? a.closest('.dish') : null;
  };
  list.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const d = e.target.closest('.dish');
    if (d) light(d);
  });
  list.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    light(focusedDish());
  });
  list.addEventListener('focusin', (e) => {
    if (e.target.matches('.dish__btn') && e.target.matches(':focus-visible')) light(e.target.closest('.dish'));
  });
  list.addEventListener('focusout', (e) => {
    if (!list.contains(e.relatedTarget) && !list.matches(':hover')) light(null);
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.dish__btn');
    if (!b || !list.contains(b)) return;
    const d = b.closest('.dish');
    const strip = $('.dish__strip', d);
    if (!strip) return;
    const img = $('img', strip);
    const open = b.getAttribute('aria-expanded') !== 'true';
    if (open && img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
    b.setAttribute('aria-expanded', String(open));
    strip.hidden = !open;
    d.classList.toggle('is-open', open);
  });
  // A re-render (tab/filter change) drops the lit row.
  new MutationObserver(() => {
    if (lit && !list.contains(lit)) {
      lit = null;
      list.classList.remove('is-peeking');
      onReset && onReset();
    }
  }).observe(list, { childList: true });
}

/* ── Horizontal film strip (home + "other rooms") ── */
export function bindStrip(root) {
  $$('.strip-section', root).forEach((sec) => {
    const strip = $('.strip', sec);
    const bar = $('.strip-progress span', sec);
    if (!strip || strip.dataset.bound) return;
    strip.dataset.bound = '1';
    const upd = () => bar && (bar.style.transform = `scaleX(${Math.max(0.08, Math.min(1, (strip.scrollLeft + strip.clientWidth) / strip.scrollWidth))})`);
    strip.addEventListener('scroll', upd, { passive: true });
    upd();
    $$('[data-strip]', sec).forEach((b) =>
      b.addEventListener('click', () => strip.scrollBy({ left: +b.dataset.strip * strip.clientWidth * 0.75, behavior: reduceMotion() ? 'auto' : 'smooth' }))
    );
  });
}

/* ── Live kitchen status ── */
export function tickStatus(el) {
  const t = setInterval(() => {
    if (!el.isConnected) return clearInterval(t);
    $$('[data-status]').forEach((s) => (s.innerHTML = statusHTML()));
  }, 60000);
}

/* ── Booking / reservation enhancement: one question per screen, live total, evening stepper ── */
export function enhanceFlow(host) {
  if (!host || host.dataset.enhanced) return;
  host.dataset.enhanced = '1';
  const screens = (form) => $$('.q[data-screen]', form);

  /* Manage: after a cancel re-renders the ticket, focus would fall back to <body>
   * (the dialog's opener was replaced). Land keyboard/SR users on the voided ticket instead. */
  new MutationObserver((muts) => {
    const added = muts.flatMap((m) => [...m.addedNodes]).find((n) => n.nodeType === 1 && n.matches('.pass.is-void'));
    if (!added) return;
    const land = () => {
      const a = document.activeElement;
      if (added.isConnected && (!a || a === document.body || !a.isConnected)) $('.pass__code', added)?.focus();
    };
    setTimeout(land, 60);
    setTimeout(land, 450);
  }).observe(host, { childList: true, subtree: true });

  const progress = (i, n) => {
    const acts = $('.acts', host);
    const fill = acts && $('.acts__fill', acts);
    if (!fill) return;
    const step = +acts.dataset.step;
    const total = +acts.dataset.total;
    fill.style.setProperty('--p', total > 1 ? Math.min(1, (step - 1 + i / n) / (total - 1)) : 1);
  };

  const show = (form, i, focus = true) => {
    const list = screens(form);
    if (!list.length) return;
    i = Math.max(0, Math.min(list.length - 1, i));
    list.forEach((s, j) => {
      s.hidden = j !== i;
      s.classList.toggle('is-on', j === i);
    });
    form.dataset.at = i;
    progress(i, list.length);
    if (focus) {
      const h = $('.q__title', list[i]);
      if (h) {
        h.focus({ preventScroll: true });
        const top = host.getBoundingClientRect().top + scrollY - 120;
        if (scrollY > top) scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
    }
  };

  const checkScreen = (scr) => {
    let first = null;
    $$('input, select, textarea', scr).forEach((c) => {
      if (c.type === 'radio' || c.type === 'hidden' || c.closest('details:not([open])')) return;
      const v = c.type === 'checkbox' ? c.checked : c.value;
      let msg = '';
      if (c.required) msg = c.type === 'checkbox' ? rules.checked(v) : rules.required(v);
      if (!msg && v && c.type === 'email') msg = rules.email(v);
      if (!msg && v && c.type === 'tel') msg = rules.phone(v);
      if (!msg && v && (c.name === 'first' || c.name === 'last')) msg = rules.name(v);
      if (!msg && c.name === 'checkIn' && v < today()) msg = 'Check-in can’t be in the past.';
      if (!msg && c.name === 'checkOut') {
        const ci = c.form.elements.checkIn?.value;
        if (ci && v <= ci) msg = 'Check-out must be after check-in.';
        else if (ci && nightsBetween(ci, v) > 30) msg = 'For stays over 30 nights, please contact us.';
      }
      setError(c, msg);
      if (msg && !first) first = c;
    });
    first && first.focus();
    return !first;
  };

  /* Step I: nights + running total follow the inputs live. */
  const liveTotal = () => {
    const form = $('form[data-form=dates]', host);
    const bar = $('[data-total-bar]', host);
    if (!form || !bar) return;
    const ci = form.elements.checkIn?.value;
    const co = form.elements.checkOut?.value;
    const guests = +(form.elements.guests?.value || 2);
    const promo = String(form.elements.promo?.value || '').trim().toUpperCase();
    const n = ci && co ? nightsBetween(ci, co) : 0;
    const nights = $('[data-nights]', form);
    if (nights) nights.textContent = n > 0 ? plural(n, 'night') : '';
    const dates = $('[data-total-dates]', bar);
    if (dates) dates.textContent = n > 0 ? `${shortDate(ci)} – ${shortDate(co)} · ${plural(n, 'night')} · ${plural(guests, 'guest')}` : 'Choose your dates';
    const roomId = bar.dataset.room;
    if (!roomId) return;
    const room = rooms.find((r) => r.id === roomId);
    const d = { roomId, checkIn: ci, checkOut: co, guests, promo: site.promoCodes[promo] ? promo : '' };
    const valid = n > 0 && n <= 30;
    const ok = valid && roomFits(d, room);
    const q = ok ? quote(d) : null;
    const more = $('[data-total-more]', bar);
    const hint = $('[data-total-hint]', bar);
    const label = $('[data-total-room]', bar);
    bar.classList.toggle('is-unavail', valid && !ok);
    if (label) label.textContent = q ? room.name : 'Your stay';
    $('[data-total-sum]', bar).textContent = q ? money(q.total, true) : '—';
    if (hint) {
      hint.hidden = !!q;
      hint.textContent = valid && !ok ? 'Not available on these dates' : 'Pick a room to see it';
    }
    if (more) more.hidden = !q;
    if (!q) return;
    const box = $('[data-total-lines]', bar);
    const lines = $('.bill', box);
    if (lines) lines.outerHTML = UI.priceLines(d, q);
    else if (box) box.insertAdjacentHTML('afterbegin', UI.priceLines(d, q));
  };

  const syncDay = () => {
    const sel = $('form[data-form=table] select[name=date]', host);
    if (!sel) return;
    const [prev, next] = [$('[data-day="-1"]', host), $('[data-day="1"]', host)];
    if (prev) prev.disabled = sel.selectedIndex <= 0;
    if (next) next.disabled = sel.selectedIndex >= sel.options.length - 1;
  };

  const init = () => {
    const form = $('form[data-qform]', host);
    if (form) show(form, 0, false);
    else {
      const acts = $('.acts', host);
      acts && progress(0, 1);
    }
    liveTotal();
    syncDay();
  };
  new MutationObserver(init).observe(host, { childList: true });

  host.addEventListener('click', (e) => {
    const nx = e.target.closest('[data-next]');
    const pv = e.target.closest('[data-prev]');
    const day = e.target.closest('[data-day]');
    if (nx || pv) {
      const form = (nx || pv).closest('form');
      const i = +form.dataset.at || 0;
      if (nx && !checkScreen(screens(form)[i])) return;
      show(form, i + (nx ? 1 : -1));
    }
    if (day) {
      const sel = $('select[name=date]', day.closest('form'));
      const i = Math.max(0, Math.min(sel.options.length - 1, sel.selectedIndex + +day.dataset.day));
      if (i === sel.selectedIndex) return;
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      syncDay();
    }
  });
  host.addEventListener('change', (e) => {
    if (e.target.name === 'date') syncDay();
    liveTotal();
  });
  host.addEventListener('input', liveTotal);
  host.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || /TEXTAREA|BUTTON|A|SUMMARY/.test(e.target.tagName)) return;
    const form = e.target.closest('form[data-qform]');
    if (!form) return;
    const list = screens(form);
    const i = +form.dataset.at || 0;
    if (i < list.length - 1) {
      e.preventDefault();
      $('[data-next]', list[i])?.click();
    }
  });
  // After the shared validation ran: bring the first invalid answer back on screen.
  host.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-qform]');
    if (!form) return;
    const bad = $('[aria-invalid="true"]', form);
    if (!bad) return;
    const det = bad.closest('details');
    if (det) det.open = true;
    const scr = bad.closest('.q[data-screen]');
    if (scr) show(form, screens(form).indexOf(scr), false);
    bad.focus();
  });
  init();
}

/* ── Rooms: full-screen slides, right-hand rail, refine toggle ── */
export function bindSlides(host) {
  let rail;
  let io;
  let railIO;
  let first = true;
  const go = (el) => el && el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });

  // The filter bar markup is written by roomsBrowser, so wire it on the first render.
  const bindOnce = () => {
    rail = $('[data-rail]', host);
    const refine = $('[data-refine]', host);
    const more = $('#rbar-more', host);
    const setOpen = (open) => {
      refine.setAttribute('aria-expanded', String(open));
      more.classList.toggle('is-open', open);
    };
    refine && refine.addEventListener('click', () => setOpen(refine.getAttribute('aria-expanded') !== 'true'));
    more && more.addEventListener('change', () => matchMedia('(max-width: 760px)').matches && setOpen(false));
    host.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && more?.classList.contains('is-open')) {
        setOpen(false);
        refine.focus();
      }
    });
    rail &&
      rail.addEventListener('click', (e) => {
        const b = e.target.closest('[data-go]');
        if (b) go($(`#room-${b.dataset.go}`, host));
      });
  };

  const onRender = (grid, list) => {
    if (first) bindOnce();
    const slides = $$('.rslide:not(.rslide--empty)', grid);
    slides.forEach((s, i) => {
      const tot = $('[data-of]', s);
      if (tot) tot.textContent = pad2(slides.length);
      const n = $('[data-at]', s);
      if (n) n.textContent = pad2(i + 1);
    });
    // Rail
    const ol = rail && $('ol', rail);
    if (ol)
      ol.innerHTML = list
        .map((r, i) => `<li><button type="button" class="rrail__btn" data-go="${r.id}" aria-label="${r.name}"><span class="rrail__n">${pad2(i + 1)}</span><span class="rrail__name" aria-hidden="true">${r.name}</span></button></li>`)
        .join('');
    rail && (rail.hidden = list.length < 2);
    // Active slide tracking
    io && io.disconnect();
    io = new IntersectionObserver(
      (en) =>
        en.forEach((x) => {
          if (!x.isIntersecting) return x.target.classList.remove('is-active');
          x.target.classList.add('is-active');
          const id = x.target.dataset.room;
          $$('[data-go]', rail || host).forEach((b) => (b.dataset.go === id ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
        }),
      { threshold: 0.55 }
    );
    slides.forEach((s) => io.observe(s));
    // Rail only while the slides are on screen
    railIO && railIO.disconnect();
    railIO = new IntersectionObserver((en) => en.forEach((x) => rail && rail.classList.toggle('is-on', x.isIntersecting)), { threshold: 0 });
    railIO.observe(grid);
    // After a filter change, bring the first result into view so nothing "disappears" off-screen.
    if (!first && grid.getBoundingClientRect().top < 0) go(grid.firstElementChild);
    first = false;
  };
  return onRender;
}

/* ── Room detail: cinematic crossfade slideshow with progress segments ── */
export function bindCine(root, room) {
  const imgs = room.images;
  imgs.forEach(preload);
  const main = $('[data-gallery-main]', root);
  const cur = $('.cine__img', root);
  const prev = $('.cine__prev', root);
  const count = $('[data-now]', root);
  const segs = $$('[data-thumb]', root);
  const playBtn = $('[data-play]', root);
  const DUR = 6500;
  let at = 0;
  let elapsed = 0;
  let last = performance.now();
  let userPaused = reduceMotion();
  let hold = false; // hover/focus in the panel or controls
  let onScreen = true;

  const paintPlay = () => {
    if (!playBtn) return;
    playBtn.setAttribute('aria-pressed', String(userPaused));
    playBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    $('span', playBtn).textContent = userPaused ? 'Play' : 'Pause';
    root.classList.toggle('is-paused', userPaused);
  };
  const paintSegs = (p) =>
    segs.forEach((s, j) => $('.cine__fill', s).style.setProperty('--f', j < at ? 1 : j > at ? 0 : p));

  const g = roomGallery(root, room, {
    onChange: (i) => {
      if (i !== at) {
        prev.src = imgs[at];
        prev.classList.remove('is-out');
        void prev.offsetWidth;
        prev.classList.add('is-out');
        cur.classList.remove('is-kb');
        void cur.offsetWidth;
        cur.classList.add('is-kb');
      }
      at = i;
      elapsed = 0;
      count.textContent = pad2(i + 1);
      paintSegs(0);
    },
  });
  main.addEventListener('click', () => {
    userPaused = true;
    paintPlay();
  });
  playBtn &&
    playBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      paintPlay();
    });
  const holdOn = () => (hold = true);
  const holdOff = () => (hold = false);
  $$('.cine__panel, .cine__chrome', root).forEach((el) => {
    el.addEventListener('pointerenter', holdOn);
    el.addEventListener('pointerleave', holdOff);
  });
  root.addEventListener('focusin', (e) => e.target.matches(':focus-visible') && holdOn());
  root.addEventListener('focusout', (e) => !root.contains(e.relatedTarget) && holdOff());
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('.cine__panel')) return;
    if (e.key === 'ArrowRight') (e.preventDefault(), g.set(at + 1));
    if (e.key === 'ArrowLeft') (e.preventDefault(), g.set(at - 1));
  });
  new IntersectionObserver((en) => (onScreen = en[0].isIntersecting), { threshold: 0.35 }).observe(root);

  const tick = (now) => {
    if (!root.isConnected) return;
    const dt = now - last;
    last = now;
    if (!userPaused && !hold && onScreen && !document.hidden && !document.querySelector('dialog[open]')) {
      elapsed += dt;
      if (elapsed >= DUR) g.set(at + 1);
      else paintSegs(elapsed / DUR);
    }
    requestAnimationFrame(tick);
  };
  paintPlay();
  paintSegs(0);
  cur.classList.add('is-kb');
  requestAnimationFrame(tick);
}

/* ── About: chapter rail + active chapter ── */
export function bindChapters(root) {
  const rail = $('[data-rail]', root);
  const chapters = $$('.chapter', root);
  const io = new IntersectionObserver(
    (en) =>
      en.forEach((x) => {
        x.target.classList.toggle('is-in', x.isIntersecting);
        if (x.isIntersecting && x.intersectionRatio > 0.5)
          $$('[data-go]', rail).forEach((b) => (b.dataset.go === x.target.id ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      }),
    { threshold: [0, 0.55] }
  );
  chapters.forEach((c) => io.observe(c));
  const wrap = $('.chapters', root);
  new IntersectionObserver((en) => rail.classList.toggle('is-on', en[0].isIntersecting), { threshold: 0 }).observe(wrap);
  rail.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) $('#' + b.dataset.go, root)?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  });
}
