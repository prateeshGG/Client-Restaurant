/* DEV-ONLY QA helpers (tree-shaken from production builds). */
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const ROUTES = ['/', '/stay', '/stay/brick-king', '/dine', '/book?step=1', '/book?step=2', '/reserve', '/manage', '/about', '/contact', '/nope'];

/* Visits every route and lists elements that overflow the viewport horizontally. */
window.__qaOverflow = async () => {
  sessionStorage.setItem('sh:draft', JSON.stringify({ checkIn: new Date(Date.now() + 864e5 * 20).toISOString().slice(0, 10), checkOut: new Date(Date.now() + 864e5 * 22).toISOString().slice(0, 10), guests: 2 }));
  const vw = document.documentElement.clientWidth;
  const out = {};
  const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).overflowX !== 'visible') return true; return false; };
  for (const r of ROUTES) {
    location.hash = '#' + r;
    await w(1000);
    document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-visible'));
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.closest('.switcher, .drawer, dialog, .marquee')) return;
      const b = el.getBoundingClientRect();
      if (!b.width) return;
      if ((b.right > vw + 1 || b.left < -1) && !clipped(el) && getComputedStyle(el).position !== 'fixed')
        bad.push((typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : el.tagName) + ':' + Math.round(b.left) + '→' + Math.round(b.right));
    });
    const small = [...document.querySelectorAll('a.btn, button, .chip, .tab, .nav-links a, .slot span')]
      .filter((e) => e.offsetWidth && e.getBoundingClientRect().height < 43.5 && !e.closest('.switcher, .toast'))
      .map((e) => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height));
    if (bad.length || small.length) out[r] = { overflow: [...new Set(bad)].slice(0, 6), smallTargets: [...new Set(small)].slice(0, 4) };
  }
  location.hash = '#/';
  return JSON.stringify({ theme: document.documentElement.dataset.theme, vw, issues: out });
};

/* Reads computed styles for assertion selectors → clone-styles.json shape. */
window.__qaStyles = (assertions) => {
  const out = {};
  for (const a of assertions) {
    const el = document.querySelector(a.selector);
    out[a.selector] ||= {};
    out[a.selector][a.prop] = el ? getComputedStyle(el)[a.prop] : null;
  }
  return out;
};
