/* Tiny hash router: '#/stay/brick-king?x=1' → { path:'/stay/brick-king', parts, query } */
export function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  const clean = '/' + path.split('/').filter(Boolean).join('/');
  return { path: clean, parts: clean.split('/').filter(Boolean), query };
}

export function navigate(to, { replace = false } = {}) {
  const url = '#' + to;
  if (replace) {
    history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (location.hash === url) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = to;
  }
}
