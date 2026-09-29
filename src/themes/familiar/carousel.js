/* FAMILIAR — accessible scroll-snap carousel.
 * Arrows + page dots + keyboard (←/→ on the focused track) + native swipe.
 * Optional autoplay (testimonials) that pauses on hover/focus, has a visible Pause
 * control and never runs under prefers-reduced-motion. */
import { $, $$ } from '../../core/util.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function carousel(root, { autoplay = 0, loop = false, noun = 'slides' } = {}) {
  if (!root) return null;
  const track = $('[data-car-track]', root);
  const prev = $('[data-car-prev]', root);
  const next = $('[data-car-next]', root);
  const dots = $('[data-car-dots]', root);
  const pauseBtn = $('[data-car-pause]', root);
  let pages = 1, step = 1, drawn = -1;

  const measure = () => {
    const s = [...track.children];
    if (!s.length) return (pages = 1);
    const gap = s.length > 1 ? s[1].offsetLeft - s[0].offsetLeft - s[0].offsetWidth : 0;
    const w = s[0].offsetWidth + gap;
    const per = Math.max(1, Math.floor((track.clientWidth + gap + 2) / w));
    step = per * w;
    const max = track.scrollWidth - track.clientWidth;
    pages = max <= 2 ? 1 : Math.ceil((s.length - per) / per) + 1;
    return pages;
  };
  const max = () => track.scrollWidth - track.clientWidth;
  const current = () => (track.scrollLeft >= max() - 4 ? pages - 1 : Math.round(track.scrollLeft / step));
  const go = (i, smooth = true) => {
    if (loop || autoplay) i = (i + pages) % pages;
    i = Math.max(0, Math.min(pages - 1, i));
    track.scrollTo({ left: Math.min(i * step, max()), behavior: smooth && !reduce() ? 'smooth' : 'auto' });
  };
  const buildDots = () => {
    if (!dots || drawn === pages) return;
    drawn = pages;
    dots.innerHTML = Array.from({ length: pages }, (_, i) => `<button class="car__dot" type="button" data-dot="${i}" aria-label="Show ${noun} page ${i + 1} of ${pages}"><span></span></button>`).join('');
  };
  const paint = () => {
    const c = current();
    root.classList.toggle('is-static', pages <= 1);
    if (!(loop || autoplay)) {
      if (prev) prev.disabled = c <= 0;
      if (next) next.disabled = c >= pages - 1;
    }
    $$('[data-dot]', root).forEach((d) => (+d.dataset.dot === c ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
  };
  const refresh = (reset = false) => {
    measure();
    buildDots();
    if (reset) track.scrollLeft = 0;
    paint();
  };

  prev && prev.addEventListener('click', () => go(current() - 1));
  next && next.addEventListener('click', () => go(current() + 1));
  dots && dots.addEventListener('click', (e) => {
    const d = e.target.closest('[data-dot]');
    d && go(+d.dataset.dot);
  });
  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') (e.preventDefault(), go(current() + 1));
    if (e.key === 'ArrowLeft') (e.preventDefault(), go(current() - 1));
  });
  let raf = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(paint);
  }, { passive: true });
  new ResizeObserver(() => refresh()).observe(track);

  /* Autoplay */
  if (autoplay) {
    let paused = reduce(), hold = false;
    const label = () => {
      if (!pauseBtn) return;
      pauseBtn.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${noun}`);
      pauseBtn.classList.toggle('is-paused', paused);
    };
    label();
    const timer = setInterval(() => {
      if (!root.isConnected) return clearInterval(timer);
      if (!paused && !hold && !document.hidden) go(current() + 1);
    }, autoplay);
    root.addEventListener('pointerenter', () => (hold = true));
    root.addEventListener('pointerleave', () => (hold = false));
    root.addEventListener('focusin', () => (hold = true));
    root.addEventListener('focusout', (e) => !root.contains(e.relatedTarget) && (hold = false));
    pauseBtn && pauseBtn.addEventListener('click', () => ((paused = !paused), label()));
  }

  refresh();
  return { refresh, go };
}
