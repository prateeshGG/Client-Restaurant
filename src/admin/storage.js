/* Owner Dashboard — how much of this browser's storage the site is using.
 * Browsers give each website roughly 5 MB of localStorage. Photos, bookings and
 * messages all share it, so we keep an eye on it and warn early. */
import { toast } from './ui.js';

export const QUOTA_CHARS = 5 * 1024 * 1024; // ~5 MB (Chrome/Firefox/Safari count characters)
export const WARN_AT = 0.6;

export function storageUsage() {
  let used = 0;
  let content = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const n = k.length + (localStorage.getItem(k) || '').length;
      used += n;
      if (k === 'sh:content:v1') content = n;
    }
  } catch {
    /* storage blocked */
  }
  return { used, content, pct: Math.min(1, used / QUOTA_CHARS) };
}

export const fmtSize = (chars) => (chars < 1024 * 1024 ? `${Math.max(1, Math.round(chars / 1024))} KB` : `${(chars / 1024 / 1024).toFixed(1)} MB`);

/** After saving photos: warn when storage is getting full (bookings made on the site need room too). */
export function storageWarning() {
  const { pct } = storageUsage();
  if (pct < WARN_AT) return;
  toast(`Storage is ${Math.round(pct * 100)}% full. Use fewer or smaller photos so bookings from the website keep saving.`, {
    kind: 'error',
    duration: 9000,
    action: { label: 'See storage', href: '#/settings', newTab: false },
  });
}
