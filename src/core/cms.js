/* Content API used by the Owner Dashboard (/admin).
 * Demo persistence = localStorage (per browser). To go live, replace load/save with
 * calls to the CMS/API — the dashboard UI only talks to these functions. */
import { CONTENT_KEY, DEFAULT_CONTENT, CONTENT_SECTIONS, applyContent } from '../content.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

/** Stored overrides only (what the owner has changed). */
export function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(CONTENT_KEY)) || {};
  } catch {
    return {};
  }
}

/** Full working copy = defaults + overrides (safe to mutate; call saveSection to persist). */
export function getContent() {
  const o = loadOverrides();
  const out = clone(DEFAULT_CONTENT);
  for (const [k, v] of Object.entries(o)) {
    if (!(k in out) || v == null) continue;
    out[k] = Array.isArray(out[k]) ? clone(v) : { ...out[k], ...clone(v) };
  }
  return out;
}

/** Persist one section (e.g. 'rooms', 'menu', 'site', 'hours', 'schedule', 'reservations'). Returns { ok, error }. */
export function saveSection(key, value) {
  if (!(key in DEFAULT_CONTENT)) return { ok: false, error: `Unknown section “${key}”.` };
  const o = loadOverrides();
  o[key] = clone(value);
  o.__updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(o));
  } catch (e) {
    return { ok: false, error: 'Storage is full — use smaller photos or remove unused ones.' };
  }
  applyContent({ [key]: value }); // keep this tab's live objects in sync
  window.dispatchEvent(new CustomEvent('sh:content-changed', { detail: { key } }));
  return { ok: true };
}

export function resetSection(key) {
  const o = loadOverrides();
  delete o[key];
  localStorage.setItem(CONTENT_KEY, JSON.stringify(o));
  applyContent({ [key]: clone(DEFAULT_CONTENT[key]) });
}
export function resetAll() {
  localStorage.removeItem(CONTENT_KEY);
  applyContent(clone(DEFAULT_CONTENT));
}
export const lastSaved = () => loadOverrides().__updatedAt || null;
export const isChanged = (key) => key in loadOverrides();

export function exportContent() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), content: getContent() }, null, 2)], { type: 'application/json' });
  return URL.createObjectURL(blob);
}
/** Import a backup produced by exportContent(). Returns { ok, error }. */
export function importContent(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file isn’t a valid backup (JSON).' };
  }
  const c = data.content || data;
  const keys = Object.keys(c).filter((k) => k in DEFAULT_CONTENT);
  if (!keys.length) return { ok: false, error: 'No site content found in that file.' };
  const bad = keys.filter((k) => c[k] == null || typeof c[k] !== 'object' || Array.isArray(DEFAULT_CONTENT[k]) !== Array.isArray(c[k]));
  if (bad.length) return { ok: false, error: `These sections look damaged: ${bad.join(', ')}. Nothing was changed.` };
  const o = loadOverrides(); // one atomic write: never a half-imported site
  for (const k of keys) o[k] = clone(c[k]);
  o.__updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(o));
  } catch {
    return { ok: false, error: 'Storage is full: the backup is too large for this browser.' };
  }
  applyContent(Object.fromEntries(keys.map((k) => [k, c[k]])));
  window.dispatchEvent(new CustomEvent('sh:content-changed', { detail: { key: '*' } }));
  return { ok: true, sections: keys };
}

/** Read an image file, downscale to maxW and return a compact data URL (keeps storage small). */
export function imageToDataURL(file, { maxW = 1400, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('Please choose an image file (JPG, PNG or WebP).'));
    if (file.size > 15 * 1024 * 1024) return reject(new Error('That image is larger than 15 MB.'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('That image couldn’t be read.'));
    img.src = url;
  });
}

export { CONTENT_SECTIONS, DEFAULT_CONTENT };
