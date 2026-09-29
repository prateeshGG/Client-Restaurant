import { getContent, saveSection, imageToDataURL } from '../../core/cms.js';
import { storageWarning } from '../storage.js';

const PHOTO = { maxW: 1200, quality: 0.75 }; // keeps each photo around 150–250 KB
import { icon, esc, money, clone, same, siteUrl, plural, $, $$ } from '../lib.js';
import { pageHead, toast, field, toggle, bindForm, showErrors, saveBar, paintSaveBar, callout, confirmDiscard } from '../ui.js';

const norm = (r) => {
  const x = clone(r);
  x.closed = !!x.closed;
  return x;
};

export default function roomsScreen(el, ctx) {
  let rooms = getContent().rooms;
  const wanted = ctx.route.parts[1];
  const room = rooms.find((r) => r.id === wanted) || rooms[0];
  let saved = norm(room);
  let draft = norm(room);
  const isDirty = () => !same(draft, saved);

  el.innerHTML = `
    ${pageHead({
      title: 'Rooms & rates',
      lede: 'Change nightly prices, descriptions and photos, or close a room for maintenance. Press <strong>Save changes</strong> when you’re done.',
    })}
    <div class="a-rooms ${wanted ? 'has-id' : 'no-id'}">
      <nav class="a-roomlist" aria-label="Your rooms"><ul data-roomlist></ul></nav>
      <section class="a-roomedit" aria-labelledby="room-edit-title" data-editor></section>
    </div>`;

  const paintList = () => {
    $('[data-roomlist]', el).innerHTML = rooms
      .map(
        (r) => `<li><a class="a-roomcard" href="#/rooms/${esc(r.id)}" ${r.id === draft.id ? 'aria-current="true"' : ''}>
          <img src="${esc(r.images[0] || '')}" alt="" width="72" height="56" loading="lazy">
          <span class="a-roomcard__text"><strong>${esc(r.name)}</strong><small>${money(r.rate)}/night · ${plural(r.inventory, 'room')}</small></span>
          ${r.closed ? '<span class="a-chip a-chip--amber">Closed</span>' : ''}
          ${icon('chevR', 18, 'a-roomcard__chev')}
        </a></li>`
      )
      .join('');
  };

  const editor = $('[data-editor]', el);
  const paintEditor = () => {
    editor.innerHTML = `
      <a class="a-back" href="#/rooms">${icon('left', 18)} All rooms</a>
      <div class="a-roomedit__head">
        <h2 class="a-h2" id="room-edit-title">${esc(saved.name)}</h2>
        <a class="a-link" href="${siteUrl('/stay/' + draft.id)}" target="_blank" rel="noopener">${icon('external', 16)} See this room on the site<span class="sr-only"> (opens in a new tab)</span></a>
      </div>
      <form class="a-form" novalidate data-room-form>
        <section class="a-card" aria-labelledby="rs-price">
          <header class="a-card__head"><h3 class="a-card__title" id="rs-price">Price & availability</h3></header>
          <div class="a-form__row a-form__row--3">
            ${field({ label: 'Nightly rate', bind: 'rate', value: draft.rate, type: 'number', required: true, prefix: '$', suffix: '/ night', attrs: 'min="20" max="5000" step="1" inputmode="decimal" data-type="number"', hint: 'Before tax. Promo codes come off this.' })}
            ${field({ label: 'How many of this room', bind: 'inventory', value: draft.inventory, type: 'number', required: true, attrs: 'min="1" max="99" step="1" inputmode="numeric" data-type="int"', hint: 'Rooms of this type you can sell each night.' })}
          </div>
          ${toggle({ label: 'Closed for maintenance', bind: 'closed', checked: draft.closed, hint: 'Guests still see the room, but it can’t be booked until you switch this off.' })}
          <div data-closed-note>${draft.closed ? callout('<strong>This room can’t be booked right now.</strong> It shows as unavailable in the booking steps on every design.', 'warn') : ''}</div>
        </section>

        <section class="a-card" aria-labelledby="rs-basics">
          <header class="a-card__head"><h3 class="a-card__title" id="rs-basics">Name & description</h3></header>
          ${field({ label: 'Room name', bind: 'name', value: draft.name, required: true, attrs: 'maxlength="40"' })}
          ${field({ label: 'Short line', bind: 'short', value: draft.short, required: true, as: 'textarea', rows: 2, attrs: 'maxlength="160"', hint: 'One sentence, shown on room cards. <span data-count="short"></span>' })}
          ${field({ label: 'Full description', bind: 'description', value: draft.description, required: true, as: 'textarea', rows: 5, attrs: 'maxlength="800"', hint: 'Shown on the room’s own page. <span data-count="description"></span>' })}
        </section>

        <section class="a-card" aria-labelledby="rs-beds">
          <header class="a-card__head"><h3 class="a-card__title" id="rs-beds">Beds & size</h3></header>
          <div class="a-form__row a-form__row--2">
            ${field({ label: 'Bed (as guests read it)', bind: 'bed', value: draft.bed, required: true, attrs: 'maxlength="30"', hint: 'For example “King” or “2 Queens”.' })}
            ${field({ label: 'Bed filter', bind: 'bedType', value: draft.bedType, as: 'select', required: true, options: [{ value: 'king', label: 'King' }, { value: 'queen', label: 'Queen' }], hint: 'Which filter on the Stay page finds this room.' })}
            ${field({ label: 'Sleeps', bind: 'sleeps', value: draft.sleeps, type: 'number', required: true, suffix: 'guests', attrs: 'min="1" max="10" step="1" inputmode="numeric" data-type="int"' })}
            ${field({ label: 'Size', bind: 'size', value: draft.size, type: 'number', required: true, suffix: 'sq ft', attrs: 'min="50" max="5000" step="1" inputmode="numeric" data-type="int"' })}
          </div>
        </section>

        <section class="a-card" aria-labelledby="rs-amen">
          <header class="a-card__head"><h3 class="a-card__title" id="rs-amen">Amenities</h3><p class="a-card__sub">The little list of features on the room page.</p></header>
          <ul class="a-chips" data-amenities aria-label="Amenities"></ul>
          <div class="a-addrow" data-field="amenityNew">
            <label class="sr-only" for="amen-new">New amenity</label>
            <input class="a-input" id="amen-new" placeholder="Add an amenity, e.g. Balcony" maxlength="30" data-amen-input aria-describedby="amen-err">
            <button class="a-btn a-btn--secondary" type="button" data-amen-add>${icon('plus', 18)} Add</button>
            <p class="a-error" id="amen-err" role="alert"></p>
          </div>
        </section>

        <section class="a-card" aria-labelledby="rs-photos">
          <header class="a-card__head"><h3 class="a-card__title" id="rs-photos">Photos</h3><p class="a-card__sub">The first photo is the cover. Big photos are resized for you.</p></header>
          <ul class="a-photos" data-photos></ul>
          <p class="a-error" data-photo-err role="alert"></p>
        </section>
      </form>
      ${saveBar({})}`;

    const form = $('[data-room-form]', editor);
    bindForm(form, () => draft, (path) => {
      if (path === 'closed') $('[data-closed-note]', editor).innerHTML = draft.closed ? callout('<strong>This room can’t be booked right now.</strong> It shows as unavailable in the booking steps on every design.', 'warn') : '';
      counts();
      sync();
    });
    paintAmenities();
    paintPhotos();
    counts();
    sync();

    $('[data-amen-add]', editor).addEventListener('click', addAmenity);
    $('[data-amen-input]', editor).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addAmenity();
      }
    });
    $('[data-save]', editor).addEventListener('click', save);
    $('[data-discard]', editor).addEventListener('click', async () => {
      if (!(await confirmDiscard())) return;
      draft = clone(saved);
      paintEditor();
      toast('Changes discarded.', { kind: 'info', duration: 3000 });
      $('[data-bind="rate"]', editor)?.focus();
    });
  };
  const counts = () => {
    $$('[data-count]', editor).forEach((s) => {
      const k = s.dataset.count;
      s.textContent = `${String(draft[k] || '').length} characters.`;
    });
  };
  const sync = () => paintSaveBar(editor, isDirty());

  function paintAmenities() {
    const ul = $('[data-amenities]', editor);
    ul.innerHTML = draft.amenities.length
      ? draft.amenities
          .map((a, i) => `<li class="a-chipx"><span>${esc(a)}</span><button type="button" class="a-chipx__x" data-amen-remove="${i}" aria-label="Remove ${esc(a)}">${icon('x', 16)}</button></li>`)
          .join('')
      : '<li class="a-muted">No amenities listed yet.</li>';
    $$('[data-amen-remove]', ul).forEach((b) =>
      b.addEventListener('click', () => {
        const i = +b.dataset.amenRemove;
        draft.amenities.splice(i, 1);
        paintAmenities();
        sync();
        ($$('[data-amen-remove]', ul)[Math.min(i, draft.amenities.length - 1)] || $('[data-amen-input]', editor)).focus();
      })
    );
  }
  function addAmenity() {
    const input = $('[data-amen-input]', editor);
    const v = input.value.trim();
    const err = $('#amen-err', editor);
    err.textContent = '';
    if (!v) return (err.textContent = 'Type an amenity first.'), input.focus();
    if (draft.amenities.some((a) => a.toLowerCase() === v.toLowerCase())) return (err.textContent = 'That one is already on the list.'), input.focus();
    if (draft.amenities.length >= 12) return (err.textContent = 'Keep it to 12 or fewer — the most useful ones.'), input.focus();
    draft.amenities.push(v);
    input.value = '';
    paintAmenities();
    sync();
    input.focus();
  }

  function paintPhotos(focusSel) {
    const ul = $('[data-photos]', editor);
    const n = draft.images.length;
    ul.innerHTML =
      draft.images
        .map(
          (src, i) => `<li class="a-phototile">
          <div class="a-phototile__img"><img src="${esc(src)}" alt="${esc(draft.name)} — photo ${i + 1} of ${n}" loading="lazy">${i === 0 ? '<span class="a-chip a-chip--dark">Cover</span>' : ''}</div>
          <div class="a-phototile__bar">
            <button class="a-iconbtn a-iconbtn--sm" type="button" data-ph="left" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move photo ${i + 1} earlier">${icon('left', 18)}</button>
            <button class="a-iconbtn a-iconbtn--sm" type="button" data-ph="right" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="Move photo ${i + 1} later">${icon('right', 18)}</button>
            <label class="a-iconbtn a-iconbtn--sm a-file" title="Replace photo">
              <input type="file" accept="image/jpeg,image/png,image/webp" data-ph-replace="${i}" data-bind-skip>
              ${icon('refresh', 18)}<span class="sr-only">Replace photo ${i + 1}</span>
            </label>
            <button class="a-iconbtn a-iconbtn--sm a-iconbtn--danger" type="button" data-ph="remove" data-i="${i}" aria-label="Remove photo ${i + 1}">${icon('trash', 18)}</button>
          </div>
        </li>`
        )
        .join('') +
      `<li class="a-phototile a-phototile--add">
        <label class="a-photoadd a-file">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple data-ph-add data-bind-skip>
          ${icon('upload', 24)}<span>Add photos</span><small>JPG, PNG or WebP</small>
        </label>
      </li>`;
    $$('[data-ph]', ul).forEach((b) =>
      b.addEventListener('click', () => {
        const i = +b.dataset.i;
        const a = b.dataset.ph;
        if (a === 'remove') {
          if (draft.images.length === 1) return photoErr('A room needs at least one photo. Add another before removing this one.');
          draft.images.splice(i, 1);
          paintPhotos(`[data-ph="remove"][data-i="${Math.min(i, draft.images.length - 1)}"]`);
        } else {
          const j = a === 'left' ? i - 1 : i + 1;
          [draft.images[i], draft.images[j]] = [draft.images[j], draft.images[i]];
          paintPhotos(`[data-ph="${a}"][data-i="${j}"]`);
        }
        sync();
      })
    );
    $$('[data-ph-replace]', ul).forEach((inp) =>
      inp.addEventListener('change', async () => {
        const f = inp.files[0];
        if (!f) return;
        const i = +inp.dataset.phReplace;
        try {
          draft.images[i] = await imageToDataURL(f, PHOTO);
          paintPhotos(`[data-ph-replace="${i}"]`);
          sync();
          photoErr('');
        } catch (x) {
          photoErr(x.message);
        }
      })
    );
    $('[data-ph-add]', ul).addEventListener('change', async (e) => {
      const files = [...e.target.files];
      photoErr('');
      for (const f of files) {
        try {
          draft.images.push(await imageToDataURL(f, PHOTO));
        } catch (x) {
          photoErr(`${f.name}: ${x.message}`);
        }
      }
      paintPhotos('[data-ph-add]');
      sync();
    });
    if (focusSel) {
      const t = $(focusSel, ul);
      (t && !t.disabled ? t : $('[data-ph-add]', ul)).focus();
    }
  }
  const photoErr = (m) => ($('[data-photo-err]', editor).textContent = m);

  function save() {
    const e = {};
    const d = draft;
    if (!String(d.name).trim()) e.name = 'Give the room a name.';
    if (String(d.short).trim().length < 10) e.short = 'Write a short line (at least 10 characters).';
    if (String(d.description).trim().length < 20) e.description = 'Write a description (at least 20 characters).';
    const rawRate = String($('[data-bind="rate"]', editor)?.value ?? d.rate).trim();
    if (!/^\d{1,4}(\.\d{1,2})?$/.test(rawRate)) e.rate = 'Enter the rate in dollars, like 189 or 189.50.';
    else if (Number(rawRate) < 20) e.rate = 'Nightly rates start at $20 — check the number.';
    else if (Number(rawRate) > 5000) e.rate = 'That rate looks too high — check it.';
    if (!Number.isInteger(d.inventory) || d.inventory < 1 || d.inventory > 99) e.inventory = 'Enter a whole number from 1 to 99.';
    if (!String(d.bed).trim()) e.bed = 'Describe the bed, e.g. “King”.';
    if (!Number.isInteger(d.sleeps) || d.sleeps < 1 || d.sleeps > 10) e.sleeps = 'Enter 1 to 10 guests.';
    if (!Number.isInteger(d.size) || d.size < 50 || d.size > 5000) e.size = 'Enter the size in square feet (50 to 5,000).';
    if (!d.images.length) photoErr('Add at least one photo.');
    if (!showErrors(editor, e) || !d.images.length) {
      toast('Please fix the highlighted fields.', { kind: 'error', duration: 4000 });
      return;
    }
    const out = clone(d);
    out.name = out.name.trim();
    out.short = out.short.trim();
    out.description = out.description.trim();
    out.rate = Math.round(Number(out.rate) * 100) / 100;
    if (!out.closed) delete out.closed;
    const next = rooms.map((r) => (r.id === out.id ? out : r));
    const res = saveSection('rooms', next);
    if (!res.ok) return toast(res.error || 'Couldn’t save. Please try again.', { kind: 'error' });
    rooms = next;
    saved = norm(out);
    draft = norm(out);
    sync();
    paintList();
    $('#room-edit-title', editor).textContent = saved.name;
    toast('Saved — live on the site', { kind: 'success', action: { label: 'View on site', href: siteUrl('/stay') } });
    storageWarning();
  }

  paintList();
  paintEditor();
  return { isDirty };
}
