/* Real interactive map (MapLibre GL + OpenFreeMap vector tiles, © OpenStreetMap).
 * Colours are read from the active design option's CSS tokens (--map-*), so each
 * option gets a map that matches its palette. Loaded lazily — only pages with a map pay for it. */
import { site } from '../content.js';
import { esc, icon } from './util.js';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

const tok = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function palette() {
  return {
    land: tok('--map-land', '#f2efe9'),
    water: tok('--map-water', '#b9d3e3'),
    park: tok('--map-park', '#d4e6c3'),
    building: tok('--map-building', '#e4e0d8'),
    road: tok('--map-road', '#ffffff'),
    roadMajor: tok('--map-road-major', '#ffffff'),
    casing: tok('--map-casing', 'rgba(0,0,0,.08)'),
    label: tok('--map-label', '#555555'),
    halo: tok('--map-halo', '#ffffff'),
  };
}

function recolor(map, c) {
  for (const l of map.getStyle().layers) {
    const id = l.id;
    const set = (prop, val) => {
      try { map.setPaintProperty(id, prop, val); } catch { /* property not on this layer */ }
    };
    if (l.type === 'background') set('background-color', c.land);
    else if (id === 'water') set('fill-color', c.water);
    else if (id === 'waterway') set('line-color', c.water);
    else if (id === 'park' || id === 'landcover_wood') set('fill-color', c.park);
    else if (id === 'landuse_residential' || id.startsWith('landcover')) set('fill-color', c.land);
    else if (id === 'building') { set('fill-color', c.building); set('fill-outline-color', c.building); }
    else if (id.startsWith('boundary')) map.setLayoutProperty(id, 'visibility', 'none');
    else if (l.type === 'line' && /casing/.test(id)) set('line-color', c.casing);
    else if (l.type === 'line' && /(major|motorway|railway)/.test(id)) set('line-color', c.roadMajor);
    else if (l.type === 'line') set('line-color', c.road);
    else if (l.type === 'fill' && /aeroway|road_area/.test(id)) set('fill-color', c.building);
    else if (l.type === 'symbol') { set('text-color', c.label); set('text-halo-color', c.halo); }
  }
}

function fallback(el) {
  el.classList.add('map--fallback');
  el.innerHTML = `
    <div class="map__fallback">
      ${icon('pin', 28)}
      <p><strong>${esc(site.address.line1)}</strong><br>${esc(site.address.line2)}</p>
      <a class="btn btn--secondary" href="${directionsUrl()}" target="_blank" rel="noopener">Open in Google Maps</a>
    </div>`;
}

export const directionsUrl = () =>
  `https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat},${site.geo.lng}`;

export const mapHTML = (cls = '') => `
  <div class="map ${cls}" data-map role="region" aria-label="Map showing ${esc(site.name)} in German Village, Columbus">
    <div class="map__loading" aria-hidden="true">Loading map…</div>
  </div>`;

export async function mountMap(el, { zoom = 14.6 } = {}) {
  if (!el || el.dataset.ready) return;
  el.dataset.ready = '1';
  let maplibregl;
  try {
    const [mod, worker] = await Promise.all([
      import('maplibre-gl'),
      // MapLibre derives its worker URL at runtime, which bundlers can't see — so ship the worker explicitly.
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]);
    maplibregl = mod.default || mod;
    maplibregl.setWorkerUrl(worker.default);
    const gl = document.createElement('canvas');
    if (!(gl.getContext('webgl2') || gl.getContext('webgl'))) throw new Error('no webgl');
  } catch {
    return fallback(el);
  }
  el.innerHTML = '';
  const center = [site.geo.lng, site.geo.lat];
  let map;
  try {
    map = new maplibregl.Map({
      container: el,
      style: STYLE_URL,
      center,
      zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true, // page scroll is never hijacked; ctrl/⌘ + scroll or two fingers to move the map
      dragRotate: false,
      pitchWithRotate: false,
    });
  } catch {
    return fallback(el);
  }
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  const timeout = setTimeout(() => !map.isStyleLoaded() && (map.remove(), fallback(el)), 12000);
  map.on('style.load', () => {
    clearTimeout(timeout);
    recolor(map, palette());
  });
  map.on('error', (e) => {
    if (!map.isStyleLoaded() && String(e?.error?.message || '').match(/fetch|network|style/i)) {
      clearTimeout(timeout);
      map.remove();
      fallback(el);
    }
  });

  const pin = document.createElement('div');
  pin.className = 'map-pin';
  pin.innerHTML = `<span class="map-pin__dot"></span><span class="map-pin__label">${esc(site.name)}</span>`;
  new maplibregl.Marker({ element: pin, anchor: 'bottom' }).setLngLat(center).addTo(map);

  if (import.meta.env.DEV) {
    window.__map = map;
    map.on('error', (e) => console.log('[map:error]', e?.error?.message || e?.error || e));
    map.on('sourcedata', (e) => e.tile && console.log('[map:tile]', e.tile.tileID?.canonical?.z, e.tile.state));
    map.on('idle', () => console.log('[map:idle] features', map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' }).length));
  }
  // Keep the map correct when the theme's layout resizes it.
  new ResizeObserver(() => map.resize()).observe(el);
  return map;
}
