/* Owner Dashboard — check a backup file BEFORE anything is saved.
 * The shape of every section is compared with the original content (content.js),
 * plus a few rules the website relies on (menu prices, room rates, times…).
 * One bad section rejects the whole file, so a backup is never half-imported. */
import { DEFAULT_CONTENT } from '../core/cms.js';

const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
const isObj = (v) => kind(v) === 'object';
const MAPS = new Set(['site.promoCodes']); // objects whose keys are chosen by the owner
const OPTIONAL = { 'rooms[]': { closed: 'boolean' }, 'menu.items[]': { available: 'boolean' } };
const HHMM = /^([01]\d|2[0-4]):[0-5]\d$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Compare value with the default template. Returns the first problem as text, or ''. */
function shape(value, def, path, depth) {
  const dk = kind(def);
  if (def === null || def === undefined) return '';
  if (kind(value) !== dk) return `${path} should be ${dk === 'array' ? 'a list' : dk === 'object' ? 'a group of fields' : `a ${dk}`}`;
  if (dk === 'array') {
    if (!def.length) return '';
    const objs = def.every(isObj);
    if (!objs) {
      const types = new Set(def.map(kind));
      const bad = value.findIndex((x) => !types.has(kind(x)));
      return bad >= 0 ? `${path}[${bad}] has the wrong type` : '';
    }
    const types = {};
    const tmpl = {};
    for (const d of def) for (const [k, v] of Object.entries(d)) ((types[k] ||= new Set()).add(kind(v)), k in tmpl || (tmpl[k] = v));
    const required = Object.keys(types).filter((k) => def.every((d) => k in d));
    const optional = OPTIONAL[`${path.replace(/\[\d+\]/g, '')}[]`] || {};
    for (let i = 0; i < value.length; i++) {
      const it = value[i];
      const p = `${path}[${i}]`;
      if (!isObj(it)) return `${p} should be a group of fields`;
      for (const k of required) if (!(k in it)) return `${p} is missing “${k}”`;
      for (const [k, v] of Object.entries(it)) {
        if (optional[k] && kind(v) !== optional[k]) return `${p}.${k} has the wrong type`;
        if (!types[k]) continue;
        if (!types[k].has(kind(v))) return `${p}.${k} has the wrong type`;
        const inner = shape(v, tmpl[k], `${p}.${k}`, depth + 1);
        if (inner) return inner;
      }
    }
    return '';
  }
  if (dk === 'object') {
    if (MAPS.has(path)) {
      const t = kind(Object.values(def)[0]);
      const bad = Object.entries(value).find(([, v]) => kind(v) !== t);
      return bad ? `${path}.${bad[0]} has the wrong type` : '';
    }
    for (const k of Object.keys(def)) {
      if (!(k in value)) {
        if (depth === 0) continue; // top level is merged with the original, so gaps are fine
        return `${path} is missing “${k}”`;
      }
      const inner = shape(value[k], def[k], `${path}.${k}`, depth + 1);
      if (inner) return inner;
    }
  }
  return '';
}

/** Extra rules the website depends on. */
function rules(k, v) {
  if (k === 'menu') {
    const periods = v.periods || DEFAULT_CONTENT.menu.periods;
    if (v.periods && !v.periods.length) return 'menu has no sections';
    if (v.items) {
      const ids = new Set();
      for (const it of v.items) {
        if (!String(it.id).trim() || ids.has(it.id)) return `menu item “${it.name}” has a missing or repeated id`;
        ids.add(it.id);
        if (!String(it.name).trim()) return 'a menu item has no name';
        if (!(Number.isFinite(it.price) && it.price > 0)) return `menu item “${it.name}” has no valid price`;
        if (!periods.some((p) => p.id === it.period)) return `menu item “${it.name}” is in a section that doesn’t exist`;
      }
    }
  }
  if (k === 'rooms') {
    if (!v.length) return 'there are no rooms';
    const ids = new Set();
    for (const r of v) {
      if (!String(r.id).trim() || ids.has(r.id)) return `room “${r.name}” has a missing or repeated id`;
      ids.add(r.id);
      if (!(Number.isFinite(r.rate) && r.rate > 0)) return `room “${r.name}” has no valid rate`;
      if (!(Number.isInteger(r.inventory) && r.inventory >= 1)) return `room “${r.name}” has no valid room count`;
      if (!r.images.length || r.images.some((s) => typeof s !== 'string' || !s)) return `room “${r.name}” needs at least one photo`;
    }
  }
  if (k === 'schedule')
    for (const s of v) {
      if (!HHMM.test(s.open) || !HHMM.test(s.close)) return `“${s.label}” has an invalid opening time`;
      if (s.d.some((x) => !Number.isInteger(x) || x < 0 || x > 6)) return `“${s.label}” has an invalid weekday`;
    }
  if (k === 'reservations') {
    if (v.slots && (!v.slots.length || v.slots.some((x) => !HHMM.test(x)))) return 'reservation times are invalid';
    if (v.closedDays && v.closedDays.some((x) => !Number.isInteger(x) || x < 0 || x > 6)) return 'closed weekdays are invalid';
    if (v.closedDates && v.closedDates.some((x) => typeof x !== 'string' || !ISO.test(x))) return 'closure dates are invalid';
    if ('maxParty' in v && !(v.maxParty >= 1)) return 'the largest party size is invalid';
  }
  if (k === 'site' && v.geo && !(Math.abs(v.geo.lat) <= 90 && Math.abs(v.geo.lng) <= 180)) return 'the map pin is invalid';
  return '';
}

/** Parse + check a backup. Returns { ok, content, sections } or { ok:false, error }. */
export function checkBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file isn’t a backup from this dashboard (it can’t be read). Nothing was changed.' };
  }
  const c = isObj(data) && isObj(data.content) ? data.content : data;
  if (!isObj(c)) return { ok: false, error: 'That file doesn’t contain any site content. Nothing was changed.' };
  const sections = Object.keys(c).filter((k) => k in DEFAULT_CONTENT);
  if (!sections.length) return { ok: false, error: 'That file doesn’t contain any site content. Nothing was changed.' };
  for (const k of sections) {
    const problem = shape(c[k], DEFAULT_CONTENT[k], k, 0) || rules(k, c[k]);
    if (problem) return { ok: false, error: `This backup looks damaged (${problem}), so nothing was imported. Your site is unchanged.` };
  }
  const content = Object.fromEntries(sections.map((k) => [k, c[k]]));
  return { ok: true, content, sections };
}
