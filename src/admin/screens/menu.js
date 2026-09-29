import { getContent, saveSection, imageToDataURL } from '../../core/cms.js';
import { icon, esc, money, clone, same, slug, uid, siteUrl, plural, $, $$ } from '../lib.js';
import { pageHead, toast, closeToasts, openDialog, confirmDialog, field, toggle, bindForm, showErrors, callout, tabs, empty } from '../ui.js';
import { storageWarning } from '../storage.js';

const LIBRARY = [
  ['/images/breakfast.jpg', 'Breakfast plate'],
  ['/images/coffee-counter.jpg', 'Coffee counter'],
  ['/images/dish-burger.jpg', 'Burger'],
  ['/images/dish-salad.jpg', 'Salad'],
  ['/images/dish-walleye.jpg', 'Fish plate'],
  ['/images/dish-pasta.jpg', 'Pasta'],
  ['/images/dish-dessert.jpg', 'Dessert'],
  ['/images/chef-plating.jpg', 'Chef plating'],
  ['/images/cocktail.jpg', 'Cocktail'],
  ['/images/bar.jpg', 'Bar'],
  ['/images/rooftop.jpg', 'Rooftop'],
  ['/images/dining-room.jpg', 'Dining room'],
];
const FALLBACK = { breakfast: '/images/breakfast.jpg', lunch: '/images/dish-burger.jpg', dinner: '/images/dish-walleye.jpg', drinks: '/images/cocktail.jpg' };

export default function menuScreen(el, ctx) {
  let menu = getContent().menu;
  let period = menu.periods.some((p) => p.id === ctx.route.query.period) ? ctx.route.query.period : 'dinner';
  if (!menu.periods.some((p) => p.id === period)) period = menu.periods[0].id;
  let q = '';
  let openDish = null; // { dlg, dirty } while the Add/Edit dialog is open
  const UNDO = 'menu-undo';

  const persist = (msg, { undo, quiet } = {}) => {
    const r = saveSection('menu', menu);
    if (!r.ok) {
      toast(r.error || 'Couldn’t save. Please try again.', { kind: 'error' });
      menu = getContent().menu;
      paintList();
      return false;
    }
    if (!quiet) toast(msg || 'Saved — live on the site', { kind: 'success', tag: undo ? UNDO : undefined, duration: undo ? 10000 : 6000, action: undo ? { label: 'Undo', onClick: undo } : { label: 'View on site', href: siteUrl('/dine') } });
    return true;
  };

  el.innerHTML = `
    ${pageHead({
      title: 'Menu',
      lede: 'Add dishes, change prices and photos, or mark something sold out for today. Each change is saved straight away and shows on the website menu.',
      actions: `<button class="a-btn a-btn--primary" type="button" data-action="add-dish">${icon('plus', 18)} Add a dish</button>`,
    })}
    ${callout('<strong>Ran out of something?</strong> Switch on <em>Sold out today</em> and the dish disappears from the online menu. Switch it off tomorrow — nothing is deleted.', 'tip')}
    <div class="a-card a-card--flush">
      <div class="a-menubar">
        <div class="a-tabs-inline" role="tablist" aria-label="Menu sections" data-tablist></div>
        <div class="a-search a-search--sm">
          ${icon('search', 18)}
          <label class="sr-only" for="menu-q">Find a dish</label>
          <input class="a-input" id="menu-q" type="search" placeholder="Find a dish" autocomplete="off" data-search>
        </div>
      </div>
      <div role="tabpanel" id="menu-panel" data-panel tabindex="-1"></div>
    </div>`;

  const tablist = $('[data-tablist]', el);
  const panel = $('[data-panel]', el);
  const paintTabs = () => {
    tablist.innerHTML = menu.periods
      .map((p) => {
        const items = menu.items.filter((i) => i.period === p.id);
        const off = items.filter((i) => i.available === false).length;
        return `<button class="a-tab-inline" role="tab" id="mt-${p.id}" data-value="${p.id}" aria-controls="menu-panel" aria-selected="${p.id === period}" tabindex="${p.id === period ? 0 : -1}">
          ${esc(p.label)} <span class="a-tab-inline__n">${items.length}</span>${off ? `<span class="a-tab-inline__off" title="${off} sold out">${off} sold out</span>` : ''}</button>`;
      })
      .join('');
    // Phones: the tab row scrolls sideways — keep the chosen section in view.
    const cur = $(`#mt-${period}`, tablist);
    if (cur && tablist.scrollWidth > tablist.clientWidth) tablist.scrollLeft = Math.max(0, cur.offsetLeft - tablist.offsetLeft - 16);
    tabs(tablist, (v) => {
      period = v;
      paintTabs();
      $(`#mt-${v}`, tablist).focus();
      paintList();
    });
  };

  const row = (it, idx, arr) => `
    <li class="a-dish ${it.available === false ? 'is-off' : ''}" data-dish="${esc(it.id)}">
      <div class="a-dish__order" role="group" aria-label="Reorder ${esc(it.name)}">
        <button class="a-iconbtn a-iconbtn--sm" type="button" data-move="-1" ${idx === 0 || q ? 'disabled' : ''} aria-label="Move ${esc(it.name)} up">${icon('up', 18)}</button>
        <button class="a-iconbtn a-iconbtn--sm" type="button" data-move="1" ${idx === arr.length - 1 || q ? 'disabled' : ''} aria-label="Move ${esc(it.name)} down">${icon('down', 18)}</button>
      </div>
      <img class="a-dish__img" src="${esc(it.image || FALLBACK[it.period])}" alt="" loading="lazy" width="64" height="64">
      <div class="a-dish__main">
        <p class="a-dish__name"><strong>${esc(it.name)}</strong>${(it.diet || []).map((d) => `<abbr class="a-diet" title="${esc(menu.diets.find((x) => x.id === d)?.label || d)}">${esc(d.toUpperCase())}</abbr>`).join('')}${it.featured ? `<span class="a-chip a-chip--violet">${icon('star', 13)} Featured</span>` : ''}${it.available === false ? '<span class="a-chip a-chip--amber">Sold out today</span>' : ''}</p>
        <p class="a-dish__desc">${esc(it.desc)}</p>
      </div>
      <p class="a-dish__price">${money(it.price, it.price % 1 !== 0)}</p>
      <div class="a-dish__toggles">
        ${toggle({ label: 'Sold out today', checked: it.available === false, attrs: 'data-soldout', compact: true })}
        ${toggle({ label: 'Featured', checked: !!it.featured, attrs: 'data-featured', compact: true })}
      </div>
      <div class="a-dish__actions">
        <button class="a-btn a-btn--secondary a-btn--sm" type="button" data-edit>${icon('edit', 16)} Edit<span class="sr-only"> ${esc(it.name)}</span></button>
        <button class="a-iconbtn a-iconbtn--danger" type="button" data-delete aria-label="Delete ${esc(it.name)}">${icon('trash', 18)}</button>
      </div>
    </li>`;

  const paintList = (focus) => {
    const p = menu.periods.find((x) => x.id === period);
    panel.setAttribute('aria-labelledby', `mt-${period}`);
    const all = menu.items.filter((i) => i.period === period);
    const list = all.filter((i) => !q || `${i.name} ${i.desc}`.toLowerCase().includes(q));
    panel.innerHTML = `
      <div class="a-menuhead">
        <p><strong>${esc(p.label)}</strong> <span class="a-muted">· ${esc(p.note || '')}</span></p>
        <p class="a-muted">${plural(all.length, 'dish', 'dishes')}${all.some((i) => i.available === false) ? ` · ${all.filter((i) => i.available === false).length} sold out today` : ''}</p>
      </div>
      ${
        list.length
          ? `<ul class="a-dishes">${list.map(row).join('')}</ul>`
          : q
            ? empty({ icon: 'search', title: `No ${esc(p.label.toLowerCase())} dishes match “${esc(q)}”`, text: 'Check the spelling, or look in another menu section.' })
            : empty({ icon: 'menu', title: `No ${esc(p.label.toLowerCase())} dishes yet`, text: 'Add the first one — it appears on the website as soon as you save.', actions: `<button class="a-btn a-btn--primary" type="button" data-action="add-here">${icon('plus', 18)} Add a dish</button>` })
      }`;
    $('[data-action="add-here"]', panel)?.addEventListener('click', () => editDish(null));
    if (focus) {
      const [id, sel] = focus;
      const target = $(`[data-dish="${CSS.escape(id)}"] ${sel}`, panel);
      (target && !target.disabled ? target : $(`[data-dish="${CSS.escape(id)}"] [data-edit]`, panel))?.focus();
    }
  };

  panel.addEventListener('click', async (e) => {
    const li = e.target.closest('[data-dish]');
    if (!li) return;
    const id = li.dataset.dish;
    const it = menu.items.find((x) => x.id === id);
    const mv = e.target.closest('[data-move]');
    if (mv && !mv.disabled) {
      const dir = +mv.dataset.move;
      const peers = menu.items.map((x, i) => [x, i]).filter(([x]) => x.period === it.period);
      const pos = peers.findIndex(([x]) => x.id === id);
      const other = peers[pos + dir];
      if (!other) return;
      const a = peers[pos][1], b = other[1];
      [menu.items[a], menu.items[b]] = [menu.items[b], menu.items[a]];
      if (persist('', { quiet: true })) {
        paintList([id, `[data-move="${dir}"]`]);
        announce(`${it.name} moved ${dir < 0 ? 'up' : 'down'}.`);
      }
      return;
    }
    if (e.target.closest('[data-edit]')) return editDish(it);
    if (e.target.closest('[data-delete]')) {
      const ok = await confirmDialog({ title: `Delete “${it.name}”?`, text: 'It will be removed from the website menu. If you only ran out for today, use <strong>Sold out today</strong> instead.', confirmLabel: 'Delete dish', cancelLabel: 'Keep it', danger: true });
      if (!ok) return;
      const index = menu.items.findIndex((x) => x.id === id);
      const [removed] = menu.items.splice(index, 1);
      const after = menu.items[index]?.id; // put it back in front of the same neighbour
      closeToasts(UNDO); // only the latest delete can be undone
      if (persist(`“${removed.name}” deleted`, {
        undo: () => {
          // Re-read the saved menu so later edits (sold out, prices…) are kept.
          menu = getContent().menu;
          if (menu.items.some((x) => x.id === removed.id)) return;
          const at = after ? menu.items.findIndex((x) => x.id === after) : -1;
          menu.items.splice(at >= 0 ? at : menu.items.length, 0, removed);
          if (persist(`“${removed.name}” is back on the menu`)) {
            paintTabs();
            paintList([removed.id, '[data-edit]']);
          }
        },
      })) {
        paintTabs();
        paintList();
        panel.focus();
      }
    }
  });
  panel.addEventListener('change', (e) => {
    const li = e.target.closest('[data-dish]');
    if (!li) return;
    const it = menu.items.find((x) => x.id === li.dataset.dish);
    if (e.target.matches('[data-soldout]')) {
      if (e.target.checked) it.available = false;
      else delete it.available;
      if (persist(e.target.checked ? `“${it.name}” is sold out — hidden from the website menu` : `“${it.name}” is back on the website menu`)) {
        paintTabs();
        paintList([it.id, '[data-soldout]']);
      }
    }
    if (e.target.matches('[data-featured]')) {
      it.featured = e.target.checked;
      if (persist(e.target.checked ? `“${it.name}” is now featured` : `“${it.name}” is no longer featured`)) paintList([it.id, '[data-featured]']);
    }
  });

  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  el.append(live);
  const announce = (m) => (live.textContent = m);

  $('[data-search]', el).addEventListener('input', (e) => {
    q = e.target.value.trim().toLowerCase();
    paintList();
  });
  $('[data-action="add-dish"]', el).addEventListener('click', () => editDish(null));

  /* ── Add / edit dialog ── */
  function editDish(existing) {
    const isNew = !existing;
    const start = isNew ? { id: '', period, name: '', desc: '', price: '', diet: [], image: '', featured: false } : clone(existing);
    if (start.available === undefined) start.available = true;
    const draft = clone(start);
    const dietBoxes = menu.diets
      .map((d) => `<label class="a-check"><input type="checkbox" value="${esc(d.id)}" data-diet ${draft.diet.includes(d.id) ? 'checked' : ''}><span class="a-check__box" aria-hidden="true">${icon('check', 14)}</span><span>${esc(d.label)}</span></label>`)
      .join('');
    const dlg = openDialog({
      title: isNew ? 'Add a dish' : `Edit “${esc(existing.name)}”`,
      size: 'lg',
      className: 'a-dish-dialog',
      body: `
        <form class="a-form" novalidate data-dish-form>
          <div class="a-form__grid">
            <div class="a-form__col">
              ${field({ label: 'Dish name', bind: 'name', value: draft.name, required: true, attrs: 'maxlength="60" autocomplete="off" data-autofocus' })}
              ${field({ label: 'Description', bind: 'desc', value: draft.desc, required: true, as: 'textarea', rows: 3, hint: 'What’s in it, in a line. At least 10 characters.', attrs: 'maxlength="180"' })}
              <div class="a-form__row">
                ${field({ label: 'Price', bind: 'price', value: draft.price, type: 'number', required: true, prefix: '$', attrs: 'min="0" step="0.5" inputmode="decimal" data-type="number"' })}
                ${field({ label: 'Menu section', bind: 'period', value: draft.period, as: 'select', options: menu.periods.map((p) => ({ value: p.id, label: p.label })), required: true })}
              </div>
              <fieldset class="a-fieldset"><legend class="a-label">Dietary <span class="a-optional">optional</span></legend><div class="a-checks">${dietBoxes}</div></fieldset>
              <div class="a-form__switches">
                ${toggle({ label: 'Featured', hint: 'Shown in highlights on the home page', bind: 'featured', checked: !!draft.featured })}
                ${toggle({ label: 'Sold out today', hint: 'Hidden from the website menu', attrs: 'data-dlg-soldout', checked: draft.available === false })}
              </div>
            </div>
            <div class="a-form__col">
              <div class="a-field" data-field="image">
                <span class="a-label" id="img-label">Photo</span>
                <div class="a-photo" data-photo>
                  <img alt="" data-photo-img ${draft.image ? `src="${esc(draft.image)}"` : 'hidden'}>
                  <div class="a-photo__empty" data-photo-empty ${draft.image ? 'hidden' : ''}>${icon('image', 28)}<span>No photo yet</span></div>
                </div>
                <div class="a-photo__actions">
                  <label class="a-btn a-btn--secondary a-file">
                    <input type="file" accept="image/jpeg,image/png,image/webp" data-image-input data-bind-skip aria-describedby="img-hint img-err">
                    ${icon('upload', 18)} Upload a photo
                  </label>
                  <div class="a-select a-select--inline">
                    <label class="sr-only" for="img-lib">Or choose one of your photos</label>
                    <select class="a-input" id="img-lib" data-image-lib data-bind-skip>
                      <option value="">Or pick one of your photos…</option>
                      ${LIBRARY.map(([src, label]) => `<option value="${src}" ${draft.image === src ? 'selected' : ''}>Library photo: ${label}</option>`).join('')}
                    </select>${icon('chevD', 18)}
                  </div>
                </div>
                <p class="a-hint" id="img-hint">JPG, PNG or WebP. Big photos are resized for you. Guests see it when they hover or tap the dish.</p>
                <p class="a-error" id="img-err" role="alert"></p>
              </div>
            </div>
          </div>
        </form>`,
      footer: `<button class="a-btn a-btn--ghost" type="button" data-dialog-close>Cancel</button>
               <button class="a-btn a-btn--primary" type="button" data-dialog-save disabled>${icon('check', 18)} ${isNew ? 'Add to menu' : 'Save dish'}</button>`,
    });
    const form = $('[data-dish-form]', dlg.el);
    const save = $('[data-dialog-save]', dlg.el);
    const dirty = () => !same(draft, start);
    const sync = () => (save.disabled = !dirty());
    bindForm(form, () => draft, sync);
    form.addEventListener('change', (e) => {
      if (e.target.matches('[data-diet]')) {
        draft.diet = $$('[data-diet]', form).filter((c) => c.checked).map((c) => c.value);
        sync();
      }
      if (e.target.matches('[data-dlg-soldout]')) {
        draft.available = !e.target.checked;
        sync();
      }
    });
    const img = $('[data-photo-img]', form);
    const setImage = (src) => {
      draft.image = src;
      img.src = src;
      img.hidden = !src;
      $('[data-photo-empty]', form).hidden = !!src;
      showErrors(form, {});
      sync();
    };
    $('[data-image-lib]', form).addEventListener('change', (e) => e.target.value && setImage(e.target.value));
    $('[data-image-input]', form).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const err = $('#img-err', form);
      err.textContent = '';
      $('[data-photo]', form).classList.add('is-loading');
      try {
        setImage(await imageToDataURL(file, { maxW: 800, quality: 0.75 }));
        $('[data-image-lib]', form).value = '';
      } catch (x) {
        err.textContent = x.message;
        $('[data-field="image"]', form).classList.add('is-invalid');
      } finally {
        $('[data-photo]', form).classList.remove('is-loading');
        e.target.value = '';
      }
    });
    openDish = { dlg, dirty };
    dlg.setGuard(async () => !dirty() || (await confirmDialog({ title: 'Discard your changes?', text: 'You changed this dish but haven’t saved it.', confirmLabel: 'Discard changes', cancelLabel: 'Keep editing', danger: true })));
    $('[data-autofocus]', form).focus();
    form.addEventListener('submit', (e) => (e.preventDefault(), save.click()));
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file' && !save.disabled) {
        e.preventDefault();
        save.click();
      }
    });

    save.addEventListener('click', () => {
      const errors = {};
      const name = String(draft.name || '').trim();
      const desc = String(draft.desc || '').trim();
      const price = Number(draft.price);
      if (!name) errors.name = 'Give the dish a name.';
      else if (menu.items.some((x) => x.id !== draft.id && x.name.trim().toLowerCase() === name.toLowerCase() && x.period === draft.period)) errors.name = 'There’s already a dish with this name in that section.';
      if (desc.length < 10) errors.desc = desc ? `A little more, please — at least 10 characters (now ${desc.length}).` : 'Add a short description (at least 10 characters).';
      if (draft.price === '' || !Number.isFinite(price) || price <= 0) errors.price = 'Enter a price above $0, like 14 or 14.50.';
      else if (price > 999) errors.price = 'That price looks too high — check it.';
      if (!showErrors(form, errors)) return;

      const item = {
        ...(isNew ? {} : existing),
        id: isNew ? uniqueId(name) : existing.id,
        period: draft.period,
        name,
        desc,
        price: Math.round(price * 100) / 100,
        diet: draft.diet,
        image: draft.image || FALLBACK[draft.period] || '/images/dining-room.jpg',
        featured: !!draft.featured,
      };
      if (draft.available === false) item.available = false;
      else delete item.available;
      if (isNew) menu.items.push(item);
      else {
        const i = menu.items.findIndex((x) => x.id === existing.id);
        // moved to another section → place at the end of that section
        if (existing.period !== item.period) {
          menu.items.splice(i, 1);
          menu.items.push(item);
        } else menu.items[i] = item;
      }
      if (!persist(isNew ? `“${item.name}” added — live on the site` : 'Saved — live on the site')) return;
      if (String(draft.image).startsWith('data:')) storageWarning();
      period = item.period;
      dlg.close(null, { force: true });
      paintTabs();
      paintList();
      setTimeout(() => $(`[data-dish="${CSS.escape(item.id)}"] [data-edit]`, panel)?.focus(), 200);
    });
  }
  const uniqueId = (name) => {
    let id = slug(name);
    while (menu.items.some((x) => x.id === id)) id = `${slug(name)}-${uid()}`.slice(0, 48);
    return id;
  };

  paintTabs();
  paintList();
  if (ctx.route.query.add) setTimeout(() => editDish(null), 60);
  return {
    // A half-filled Add/Edit dialog counts as unsaved work (Back, reload, sign out all ask first).
    isDirty: () => !!(openDish && openDish.dlg.el.isConnected && !openDish.dlg.el.classList.contains('is-closing') && openDish.dirty()),
    destroy: () => {
      openDish?.dlg.close(null, { force: true });
      openDish = null;
      closeToasts(UNDO);
    },
  };
}
