import { exportContent, importContent, resetSection, resetAll, lastSaved, isChanged, DEFAULT_CONTENT } from '../../core/cms.js';
import { checkBackup } from '../backup.js';
import { storageUsage, fmtSize, WARN_AT } from '../storage.js';
import { listRecords, listMessages, listSubscribers } from '../../core/store.js';
import { icon, esc, stamp, prefs, DESIGNS, download, columbus, plural, $, $$ } from '../lib.js';
import { pageHead, toast, confirmDialog, typedConfirm, callout } from '../ui.js';
import { session, signOut } from '../auth.js';
import { loadSampleData, clearRecords } from '../sample.js';

const LABELS = {
  site: ['Site info', 'Name, contact details, social links, promo codes', '#/site'],
  menu: ['Menu', 'Dishes, prices, photos, sold-out and featured', '#/menu'],
  rooms: ['Rooms & rates', 'Prices, descriptions, photos, maintenance', '#/rooms'],
  hours: ['Opening hours text', 'The hours guests read', '#/hours'],
  schedule: ['“Open now” schedule', 'Live kitchen status times', '#/hours'],
  reservations: ['Reservation rules & closures', 'Closed days, one-off closures, booking times', '#/hours'],
};
const CONTENT_KEY = 'sh:content:v1';
const EDIT = { '#/site': 'Edit site info', '#/menu': 'Edit menu', '#/rooms': 'Edit rooms', '#/hours': 'Edit hours' };
function meter() {
  const u = storageUsage();
  const pct = Math.round(u.pct * 100);
  const warn = u.pct >= WARN_AT;
  return `<div class="a-meter ${warn ? 'is-warn' : ''}" data-storage>
    <p class="a-meter__label"><strong>Storage used in this browser</strong><span>${pct}% · ${fmtSize(u.used)} of about 5 MB</span></p>
    <div class="a-meter__bar" role="meter" aria-label="Storage used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-valuetext="${pct}% used"><span style="width:${Math.max(2, pct)}%"></span></div>
    <p class="a-hint">${warn ? '<strong>Getting full.</strong> Uploaded photos take the most room — replace a few with smaller ones or pick library photos, so bookings from the website keep saving.' : `Your content and photos use ${fmtSize(u.content)}. Bookings and messages from the website share the same space.`}</p>
  </div>`;
}
const niceKey = (k) => LABELS[k] || [k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'), 'Imported from a backup file', ''];

export default function settings(el, ctx) {
  const paint = () => {
    const last = lastSaved();
    const changed = Object.keys(DEFAULT_CONTENT).filter((k) => isChanged(k));
    const listed = [...new Set([...Object.keys(LABELS), ...changed])];
    const pref = prefs.get().preview;
    const recs = listRecords().length + listMessages().length + listSubscribers().length;
    el.innerHTML = `
      ${pageHead({ title: 'Settings & backup', lede: 'How updates reach the website, backups, and starting over.' })}

      <section class="a-card a-card--how" aria-labelledby="how-h">
        <header class="a-card__head"><h2 class="a-card__title" id="how-h">${icon('help', 20)} How updates work</h2></header>
        <ol class="a-steps">
          <li><strong>Change something and press Save.</strong> Menu switches (sold out, featured) save the moment you flip them.</li>
          <li><strong>It’s live straight away.</strong> All five designs — Familiar, Fresh, Atelier, Noir and Terra — show your change the next time a page loads.</li>
          <li><strong>Where it’s kept (for now).</strong> In this demo, changes are stored in this web browser. When the site launches with the production CMS, the same screens save to the server, so every visitor on every device sees them.</li>
          <li><strong>Keep a backup.</strong> Download one before big changes. If anything goes wrong, import it and everything is back the way it was.</li>
        </ol>
      </section>

      <div class="a-grid-2">
        <section class="a-card" aria-labelledby="bk-h">
          <header class="a-card__head"><div><h2 class="a-card__title" id="bk-h">Backup</h2><p class="a-card__sub">Last saved change: <strong data-last>${last ? stamp(last) : 'none yet — the site shows its original content'}</strong></p></div></header>
          <p class="a-card__text">A backup is one small file with your menu, rooms, hours and site info. Photos you uploaded are included.</p>
          <div class="a-btnrow">
            <button class="a-btn a-btn--primary" type="button" data-export>${icon('download', 18)} Download backup</button>
            <label class="a-btn a-btn--secondary a-file">
              <input type="file" accept="application/json,.json" data-import>
              ${icon('upload', 18)} Import a backup…
            </label>
          </div>
          <p class="a-error" data-import-err role="alert"></p>
          ${meter()}
        </section>

        <section class="a-card" aria-labelledby="pv-h">
          <header class="a-card__head"><div><h2 class="a-card__title" id="pv-h">Preview design</h2><p class="a-card__sub">Which design the “View on site” links open.</p></div></header>
          <fieldset class="a-radiolist">
            <legend class="sr-only">Design to preview</legend>
            ${DESIGNS.map(
              (d) => `<label class="a-radio"><input type="radio" name="preview" value="${d.id}" ${pref === d.id ? 'checked' : ''}><span class="a-design__swatch a-design__swatch--${d.id}" aria-hidden="true"></span><span><strong>${esc(d.label)}</strong><small>${esc(d.note)}</small></span></label>`
            ).join('')}
          </fieldset>
        </section>
      </div>

      <section class="a-card" aria-labelledby="rs-h">
        <header class="a-card__head"><div><h2 class="a-card__title" id="rs-h">Start over</h2><p class="a-card__sub">Put a section back to the original content. Download a backup first if you might want your changes again.</p></div></header>
        <ul class="a-resets">
          ${listed
            .map((k) => {
              const [label, sub, href] = niceKey(k);
              const on = isChanged(k);
              return `<li class="a-reset">
                <span class="a-reset__text"><strong>${esc(label)}</strong><small>${esc(sub)}</small></span>
                ${on ? '<span class="a-chip a-chip--violet">Changed</span>' : '<span class="a-chip a-chip--grey">Original</span>'}
                <span class="a-reset__actions">
                  ${href ? `<a class="a-link a-reset__edit" href="${href}">${esc(EDIT[href] || 'Edit')}<span class="sr-only"> (${esc(label)})</span>${icon('right', 16)}</a>` : ''}
                  <button class="a-btn a-btn--secondary a-btn--sm" type="button" data-reset="${esc(k)}" ${on ? '' : 'disabled'}>${icon('undo', 16)} Restore<span class="a-reset__long"> original</span><span class="sr-only"> ${esc(label)}</span></button>
                </span>
              </li>`;
            })
            .join('')}
        </ul>
        <div class="a-danger-zone">
          <div><strong>Reset everything</strong><p>Every section goes back to the original content. Bookings and messages are not affected.</p></div>
          <button class="a-btn a-btn--danger" type="button" data-reset-all ${changed.length ? '' : 'disabled'}>${icon('refresh', 18)} Reset everything</button>
        </div>
      </section>

      <div class="a-grid-2">
        <section class="a-card" aria-labelledby="demo-h">
          <header class="a-card__head"><div><h2 class="a-card__title" id="demo-h">Demo data</h2><p class="a-card__sub">Try the dashboard with realistic bookings, tables and messages.</p></div></header>
          <p class="a-card__text">${recs ? `${plural(listRecords().length, 'booking')}, ${plural(listMessages().length, 'message')} and ${plural(listSubscribers().length, 'subscriber')} are stored in this browser.` : 'Nothing is stored in this browser yet.'}</p>
          <div class="a-btnrow">
            <button class="a-btn a-btn--secondary" type="button" data-sample>${icon('sparkle', 18)} Load sample bookings</button>
            <button class="a-btn a-btn--ghost a-btn--danger-text" type="button" data-clear ${recs ? '' : 'disabled'}>${icon('trash', 18)} Remove all bookings & messages</button>
          </div>
        </section>
        <section class="a-card" aria-labelledby="acc-h">
          <header class="a-card__head"><h2 class="a-card__title" id="acc-h">Account</h2></header>
          <p class="a-card__text">Signed in as <strong>${esc(session()?.email || '')}</strong>${session()?.at ? ` since ${stamp(session().at)}` : ''}.</p>
          ${callout('This is a <strong>demo sign-in</strong>. Real accounts — your own password, password reset and staff logins — come with the production CMS.', 'info')}
          <button class="a-btn a-btn--secondary" type="button" data-signout-2>${icon('logout', 18)} Sign out</button>
        </section>
      </div>`;
    bind();
  };

  const bind = () => {
    $('[data-export]', el).addEventListener('click', () => {
      download(`scioto-house-backup-${columbus().iso}.json`, exportContent());
      toast('Backup downloaded — keep it somewhere safe.', { kind: 'success' });
    });
    $('[data-import]', el).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      const err = $('[data-import-err]', el);
      err.textContent = '';
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) return (err.textContent = 'That file is too big to be a backup from this dashboard.');
      const text = await file.text();
      const ok = await confirmDialog({ title: 'Import this backup?', text: `<strong>${esc(file.name)}</strong> will replace the matching sections of your site content. Bookings and messages are not affected.`, confirmLabel: 'Import backup', cancelLabel: 'Cancel' });
      if (!ok) return;
      // 1) check every section first — a damaged file is refused as a whole
      const checked = checkBackup(text);
      if (!checked.ok) {
        err.textContent = checked.error;
        toast(checked.error, { kind: 'error', duration: 9000 });
        return;
      }
      // 2) save; if the browser runs out of room part-way, put everything back
      const before = localStorage.getItem(CONTENT_KEY);
      const r = importContent(JSON.stringify({ content: checked.content }));
      if (!r.ok) {
        if (before == null) localStorage.removeItem(CONTENT_KEY);
        else localStorage.setItem(CONTENT_KEY, before);
        const msg = `${r.error} Nothing was imported — your site is unchanged.`;
        err.textContent = msg;
        toast(msg, { kind: 'error', duration: 9000 });
        return;
      }
      paint();
      toast(`Backup imported — ${plural(r.sections.length, 'section')} restored and live on the site.`, { kind: 'success' });
      $('.a-h1', el)?.focus();
    });
    $$('input[name="preview"]', el).forEach((r) =>
      r.addEventListener('change', () => {
        prefs.set({ preview: r.value });
        ctx.refreshBadges();
        toast(`“View on site” now opens the ${DESIGNS.find((d) => d.id === r.value).label} design.`, { kind: 'success', duration: 3500 });
      })
    );
    $$('[data-reset]', el).forEach((b) =>
      b.addEventListener('click', async () => {
        const k = b.dataset.reset;
        const [label] = niceKey(k);
        if (!(await typedConfirm({ title: `Restore “${label}”?`, text: `Your changes to <strong>${esc(label)}</strong> will be replaced by the original content on every design.`, confirmLabel: 'Restore original' }))) return;
        resetSection(k);
        paint();
        toast(`${label} restored to the original.`, { kind: 'success' });
        $(`[data-reset="${k}"]`, el)?.closest('.a-reset')?.querySelector('a, button:not([disabled])')?.focus();
      })
    );
    $('[data-reset-all]', el).addEventListener('click', async () => {
      if (!(await typedConfirm({ title: 'Reset everything?', text: 'Every section — menu, rooms, hours and site info — goes back to the original content on every design. Bookings and messages stay.', confirmLabel: 'Reset everything' }))) return;
      resetAll();
      paint();
      toast('Everything is back to the original content.', { kind: 'success' });
      $('.a-h1', el)?.focus();
    });
    $('[data-sample]', el).addEventListener('click', () => {
      const r = loadSampleData();
      ctx.refreshBadges();
      paint();
      toast(`Sample data added — ${r.records} bookings, ${r.messages} messages.`, { kind: 'success' });
      $('[data-sample]', el).focus();
    });
    $('[data-clear]', el).addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Remove all bookings and messages?', text: 'This clears every room booking, table reservation, message and subscriber stored in this browser. Your site content isn’t touched.', confirmLabel: 'Remove everything', cancelLabel: 'Keep them', danger: true });
      if (!ok) return;
      clearRecords();
      ctx.refreshBadges();
      paint();
      toast('Bookings, reservations and messages removed.', { kind: 'success' });
      $('[data-sample]', el).focus();
    });
    $('[data-signout-2]', el).addEventListener('click', () => {
      signOut();
      location.hash = '#/login';
    });
  };

  paint();
  return {};
}
