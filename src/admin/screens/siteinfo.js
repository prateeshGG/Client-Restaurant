import { getContent, saveSection } from '../../core/cms.js';
import { icon, esc, clone, same, siteUrl, $ } from '../lib.js';
import { pageHead, toast, field, bindForm, showErrors, saveBar, paintSaveBar, confirmDiscard } from '../ui.js';

/* Draft keeps promo codes as editable rows; converted back to { CODE: fraction } on save. */
const toDraft = (site) => {
  const d = clone(site);
  d.promoRows = Object.entries(site.promoCodes || {}).map(([code, f]) => ({ code, pct: Math.round(f * 1000) / 10 }));
  d.taxPct = Math.round((site.lodgingTaxRate || 0) * 10000) / 100;
  d.geo = { lat: site.geo?.lat ?? '', lng: site.geo?.lng ?? '' };
  d.social = { instagram: '', facebook: '', tiktok: '', ...(site.social || {}) };
  for (const k of Object.keys(d.social)) if (d.social[k] === '#') d.social[k] = '';
  d.address = { line1: '', line2: '', mapsQuery: '', ...(site.address || {}) };
  delete d.promoCodes;
  delete d.lodgingTaxRate;
  return d;
};
const fromDraft = (d) => {
  const s = clone(d);
  s.promoCodes = Object.fromEntries(d.promoRows.filter((r) => String(r.code).trim()).map((r) => [String(r.code).trim().toUpperCase(), Math.round(Number(r.pct) * 10) / 1000]));
  s.lodgingTaxRate = Math.round(Number(d.taxPct) * 100) / 10000;
  s.geo = { lat: Number(d.geo.lat), lng: Number(d.geo.lng) };
  for (const k of Object.keys(s.social)) s.social[k] = String(s.social[k] || '').trim() || '#';
  delete s.promoRows;
  delete s.taxPct;
  for (const k of ['name', 'shortName', 'tagline', 'city', 'since', 'announcement', 'phone', 'email', 'checkIn', 'checkOut']) if (typeof s[k] === 'string') s[k] = s[k].trim();
  return s;
};

export default function siteScreen(el) {
  const original = getContent().site;
  let savedSite = clone(original);
  let draft = toDraft(original);
  const isDirty = () => !same(fromDraft(draft), savedSite);

  el.innerHTML = `
    ${pageHead({
      title: 'Site info',
      lede: 'Your name, contact details and booking basics. These appear in the header, footer, contact page and booking steps of every design.',
      actions: `<a class="a-btn a-btn--secondary" href="${siteUrl('/contact')}" target="_blank" rel="noopener">${icon('external', 18)} Contact page<span class="sr-only"> (opens in a new tab)</span></a>`,
    })}
    <form class="a-form" novalidate data-site-form></form>
    ${saveBar({})}`;
  const form = $('[data-site-form]', el);
  const sync = () => paintSaveBar(el, isDirty());

  const paint = (focusSel) => {
    const d = draft;
    form.innerHTML = `
      <section class="a-card" aria-labelledby="s-name">
        <header class="a-card__head"><h2 class="a-card__title" id="s-name">Name & tagline</h2></header>
        <div class="a-form__row a-form__row--2">
          ${field({ label: 'Business name', bind: 'name', value: d.name, required: true, attrs: 'maxlength="40"' })}
          ${field({ label: 'Tagline', bind: 'tagline', value: d.tagline, attrs: 'maxlength="40"', hint: 'Shown with your name in the browser tab and in some designs’ logos, e.g. “Hotel & Kitchen”.' })}
        </div>
      </section>

      <section class="a-card" aria-labelledby="s-contact">
        <header class="a-card__head"><h2 class="a-card__title" id="s-contact">Contact details</h2></header>
        <div class="a-form__row a-form__row--2">
          ${field({ label: 'Phone', bind: 'phone', value: d.phone, type: 'tel', required: true, attrs: 'autocomplete="off"' })}
          ${field({ label: 'Email', bind: 'email', value: d.email, type: 'email', required: true, attrs: 'autocomplete="off" spellcheck="false"' })}
          ${field({ label: 'Street address', bind: 'address.line1', value: d.address.line1, required: true })}
          ${field({ label: 'City, state & ZIP', bind: 'address.line2', value: d.address.line2, required: true })}
        </div>
        <fieldset class="a-fieldset">
          <legend class="a-label">Map pin</legend>
          <p class="a-hint">Where the pin sits on the site’s map — the “Get directions” buttons use it too. Tip: in Google Maps, right-click your building and click the numbers to copy them.</p>
          <div class="a-form__row a-form__row--geo">
            ${field({ label: 'Latitude', bind: 'geo.lat', value: d.geo.lat, type: 'number', required: true, attrs: 'step="any" min="-90" max="90" inputmode="decimal" data-type="number"' })}
            ${field({ label: 'Longitude', bind: 'geo.lng', value: d.geo.lng, type: 'number', required: true, attrs: 'step="any" min="-180" max="180" inputmode="decimal" data-type="number"' })}
            <a class="a-btn a-btn--ghost a-geo-check" data-geo-link href="https://www.openstreetmap.org/?mlat=${d.geo.lat}&mlon=${d.geo.lng}#map=18/${d.geo.lat}/${d.geo.lng}" target="_blank" rel="noopener">${icon('pin', 18)} Check on a map<span class="sr-only"> (opens in a new tab)</span></a>
          </div>
        </fieldset>
      </section>

      <section class="a-card" aria-labelledby="s-social">
        <header class="a-card__head"><div><h2 class="a-card__title" id="s-social">Social links</h2><p class="a-card__sub">Paste the full address of each profile. Leave empty if you don’t use it.</p></div></header>
        <div class="a-form__row a-form__row--3">
          ${field({ label: 'Instagram', bind: 'social.instagram', value: d.social.instagram === '#' ? '' : d.social.instagram, type: 'url', attrs: 'placeholder="https://instagram.com/…" spellcheck="false"' })}
          ${field({ label: 'Facebook', bind: 'social.facebook', value: d.social.facebook === '#' ? '' : d.social.facebook, type: 'url', attrs: 'placeholder="https://facebook.com/…" spellcheck="false"' })}
          ${field({ label: 'TikTok', bind: 'social.tiktok', value: d.social.tiktok === '#' ? '' : d.social.tiktok, type: 'url', attrs: 'placeholder="https://tiktok.com/@…" spellcheck="false"' })}
        </div>
      </section>

      <section class="a-card" aria-labelledby="s-stay">
        <header class="a-card__head"><h2 class="a-card__title" id="s-stay">Stays & pricing</h2></header>
        <div class="a-form__row a-form__row--3">
          ${field({ label: 'Check-in from', bind: 'checkIn', value: d.checkIn, required: true, attrs: 'maxlength="12" placeholder="3:00 pm"' })}
          ${field({ label: 'Check-out by', bind: 'checkOut', value: d.checkOut, required: true, attrs: 'maxlength="12" placeholder="11:00 am"' })}
          ${field({ label: 'Lodging tax', bind: 'taxPct', value: d.taxPct, type: 'number', required: true, suffix: '%', attrs: 'min="0" max="40" step="0.01" inputmode="decimal" data-type="number"', hint: 'Added to room prices at checkout.' })}
        </div>
        <div class="a-sub" data-field="promoRows">
          <h3 class="a-sub__h">Promo codes</h3>
          <p class="a-hint">Guests type these in the booking steps to get money off the room rate.</p>
          ${
            d.promoRows.length
              ? `<table class="a-table a-table--form">
                  <caption class="sr-only">Promo codes</caption>
                  <thead><tr><th scope="col">Code</th><th scope="col">Discount</th><th scope="col"><span class="sr-only">Remove</span></th></tr></thead>
                  <tbody>${d.promoRows
                    .map(
                      (r, i) => `<tr>
                      <td data-label="Code">${field({ label: `<span class="sr-only">Code ${i + 1}</span>`, bind: `promoRows.${i}.code`, value: r.code, required: true, attrs: 'maxlength="20" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase"', cls: 'a-field--bare' })}</td>
                      <td data-label="Discount">${field({ label: `<span class="sr-only">Discount for code ${i + 1}</span>`, bind: `promoRows.${i}.pct`, value: r.pct, type: 'number', required: true, suffix: '% off', attrs: 'min="1" max="90" step="1" inputmode="numeric" data-type="number"', cls: 'a-field--bare' })}</td>
                      <td class="a-td-action"><button class="a-iconbtn a-iconbtn--danger" type="button" data-remove-promo="${i}" aria-label="Remove code ${esc(r.code || i + 1)}">${icon('trash', 18)}</button></td>
                    </tr>`
                    )
                    .join('')}</tbody>
                </table>`
              : '<p class="a-muted a-sub__empty">No promo codes. Add one for a launch offer or a partner discount.</p>'
          }
          <button class="a-btn a-btn--secondary" type="button" data-add-promo>${icon('plus', 18)} Add a promo code</button>
        </div>
      </section>`;
    if (focusSel) $(focusSel, form)?.focus();
  };

  bindForm(form, () => draft, (path) => {
    if (path.startsWith('geo.')) $('[data-geo-link]', form).href = `https://www.openstreetmap.org/?mlat=${draft.geo.lat}&mlon=${draft.geo.lng}#map=18/${draft.geo.lat}/${draft.geo.lng}`;
    sync();
  });
  form.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.addPromo != null) {
      draft.promoRows.push({ code: '', pct: 10 });
      paint(`[data-bind="promoRows.${draft.promoRows.length - 1}.code"]`);
      sync();
    }
    if (b.dataset.removePromo != null) {
      draft.promoRows.splice(+b.dataset.removePromo, 1);
      paint('[data-add-promo]');
      sync();
    }
  });

  const url = (v) => !v || v === '#' || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(String(v).trim());
  const validate = () => {
    const d = draft;
    const e = {};
    if (!String(d.name).trim()) e.name = 'Enter your business name.';
    if (String(d.phone).replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit phone number, e.g. (614) 555-0142.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(d.email).trim())) e.email = 'Enter a valid email, like hello@yourhotel.com.';
    if (!String(d.address.line1).trim()) e['address.line1'] = 'Enter the street address.';
    if (!String(d.address.line2).trim()) e['address.line2'] = 'Enter the city, state and ZIP.';
    if (d.geo.lat === '' || !(Math.abs(d.geo.lat) <= 90)) e['geo.lat'] = 'Latitude is a number between -90 and 90 (Columbus ≈ 39.96).';
    if (d.geo.lng === '' || !(Math.abs(d.geo.lng) <= 180)) e['geo.lng'] = 'Longitude is a number between -180 and 180 (Columbus ≈ -83.00).';
    for (const k of ['instagram', 'facebook', 'tiktok']) if (!url(d.social[k])) e[`social.${k}`] = 'Paste a full link starting with https://';
    if (!String(d.checkIn).trim()) e.checkIn = 'Enter a check-in time.';
    if (!String(d.checkOut).trim()) e.checkOut = 'Enter a check-out time.';
    if (d.taxPct === '' || !(d.taxPct >= 0 && d.taxPct <= 40)) e.taxPct = 'Enter a percentage from 0 to 40.';
    const seen = new Set();
    d.promoRows.forEach((r, i) => {
      const c = String(r.code).trim().toUpperCase();
      if (!/^[A-Z0-9]{3,20}$/.test(c)) e[`promoRows.${i}.code`] = 'Use 3–20 letters or numbers, no spaces.';
      else if (seen.has(c)) e[`promoRows.${i}.code`] = 'This code is listed twice.';
      seen.add(c);
      if (!(r.pct >= 1 && r.pct <= 90)) e[`promoRows.${i}.pct`] = 'Enter 1 to 90.';
    });
    return showErrors(form, e);
  };

  $('[data-save]', el).addEventListener('click', () => {
    if (!validate()) return toast('Please fix the highlighted fields.', { kind: 'error', duration: 4000 });
    const out = fromDraft(draft);
    const res = saveSection('site', out);
    if (!res.ok) return toast(res.error || 'Couldn’t save. Please try again.', { kind: 'error' });
    savedSite = clone(out);
    draft = toDraft(out);
    paint();
    sync();
    toast('Saved — live on the site', { kind: 'success', action: { label: 'View on site', href: siteUrl('/') } });
  });
  $('[data-discard]', el).addEventListener('click', async () => {
    if (!(await confirmDiscard())) return;
    draft = toDraft(savedSite);
    paint();
    sync();
    toast('Changes discarded.', { kind: 'info', duration: 3000 });
  });

  paint();
  sync();
  return { isDirty };
}
