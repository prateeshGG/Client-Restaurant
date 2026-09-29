import { getContent, saveSection } from '../../core/cms.js';
import { icon, esc, clone, same, siteUrl, columbus, longDate, fmtTime, WEEKDAYS, WEEKDAYS_LONG, parseISO, $, $$ } from '../lib.js';
import { pageHead, toast, field, bindForm, showErrors, saveBar, paintSaveBar, callout, confirmDiscard, confirmDialog } from '../ui.js';

const KEYS = ['hours', 'schedule', 'reservations'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun reads naturally

export default function hoursScreen(el, ctx) {
  const c = getContent();
  let saved = { hours: c.hours, schedule: c.schedule, reservations: { ...c.reservations, closedDates: [...(c.reservations.closedDates || [])] } };
  let draft = clone(saved);
  const isDirty = () => !same(draft, saved);
  const today = columbus().iso;

  el.innerHTML = `
    ${pageHead({
      title: 'Hours & closures',
      lede: 'Opening times, the live “open now” status, and when guests can book a table. Closing for a holiday? Add the date under <button class="a-linkbtn" type="button" data-jump>One-off closures</button>.',
    })}
    <form class="a-form a-hours" novalidate data-hours-form></form>
    ${saveBar({})}`;
  const form = $('[data-hours-form]', el);
  const sync = () => paintSaveBar(el, isDirty());

  const dayChecks = (name, selected, attrs, legend) => `
    <fieldset class="a-days"><legend class="a-label">${legend}</legend>
      <div class="a-days__row">
      ${DAY_ORDER.map(
        (d) => `<label class="a-daychip"><input type="checkbox" value="${d}" ${selected.includes(d) ? 'checked' : ''} ${attrs} data-name="${name}"><span><abbr title="${WEEKDAYS_LONG[d]}">${WEEKDAYS[d]}</abbr></span></label>`
      ).join('')}
      </div>
    </fieldset>`;

  const paint = (focusSel) => {
    const r = draft.reservations;
    const closures = [...(r.closedDates || [])].sort();
    form.innerHTML = `
      <section class="a-card" aria-labelledby="h-display">
        <header class="a-card__head">
          <div><h2 class="a-card__title" id="h-display">Opening hours guests read</h2><p class="a-card__sub">The words shown on the website, exactly as you type them.</p></div>
        </header>
        <ul class="a-rows" data-rows="hours">
          ${draft.hours
            .map(
              (h, i) => `<li class="a-row3">
              ${field({ label: 'Service', bind: `hours.${i}.label`, value: h.label, required: true, attrs: 'maxlength="30"' })}
              ${field({ label: 'Days', bind: `hours.${i}.days`, value: h.days, attrs: 'maxlength="30" placeholder="e.g. Tue – Sun"' })}
              ${field({ label: 'Times', bind: `hours.${i}.time`, value: h.time, required: true, attrs: 'maxlength="40" placeholder="e.g. 5:00 – 10:00 pm"' })}
              <button class="a-iconbtn a-iconbtn--danger a-row3__x" type="button" data-remove-hours="${i}" aria-label="Remove ${esc(h.label || 'this row')} (${esc(h.days)})">${icon('trash', 18)}</button>
            </li>`
            )
            .join('')}
        </ul>
        <button class="a-btn a-btn--secondary" type="button" data-add-hours>${icon('plus', 18)} Add a line</button>
      </section>

      <section class="a-card" aria-labelledby="h-sched">
        <header class="a-card__head">
          <div><h2 class="a-card__title" id="h-sched">Live “open now” schedule</h2><p class="a-card__sub">Powers the “Kitchen open · Dinner until 10 pm” line on the site (Columbus time). Keep it matching the hours above.</p></div>
        </header>
        <ul class="a-services">
          ${draft.schedule
            .map(
              (s, i) => `<li class="a-service" data-service="${i}">
              <div class="a-service__top">
                ${field({ label: 'Service', bind: `schedule.${i}.label`, value: s.label, required: true, attrs: 'maxlength="30"' })}
                <div class="a-service__times">
                  ${field({ label: 'Opens', bind: `schedule.${i}.open`, value: s.open, type: 'time', required: true, attrs: 'step="900"' })}
                  ${field({ label: 'Closes', bind: `schedule.${i}.close`, value: s.close === '24:00' ? '00:00' : s.close, type: 'time', required: true, attrs: 'step="900" data-type="close"', hint: '12:00 am = midnight' })}
                </div>
                <button class="a-iconbtn a-iconbtn--danger a-service__x" type="button" data-remove-service="${i}" aria-label="Remove ${esc(s.label || 'this service')}">${icon('trash', 18)}</button>
              </div>
              <div data-field="schedule.${i}.d">${dayChecks(`sched-${i}`, s.d, `data-sched="${i}"`, 'Open on')}<p class="a-error" role="alert"></p></div>
            </li>`
            )
            .join('')}
        </ul>
        <button class="a-btn a-btn--secondary" type="button" data-add-service>${icon('plus', 18)} Add a service</button>
      </section>

      <section class="a-card" aria-labelledby="h-res">
        <header class="a-card__head">
          <div><h2 class="a-card__title" id="h-res">Table reservations</h2><p class="a-card__sub">When guests can book a dinner table online.</p></div>
        </header>
        <div class="a-sub">
          <h3 class="a-sub__h">Closed for dinner every week</h3>
          ${dayChecks('closed', r.closedDays, 'data-closedday', 'Closed on')}
          <p class="a-hint">${r.closedDays.length ? `No online bookings on ${r.closedDays.map((d) => WEEKDAYS_LONG[d] + 's').join(', ')}.` : 'Open for bookings every day of the week.'}</p>
        </div>

        <div class="a-sub" id="closures" tabindex="-1">
          <h3 class="a-sub__h">One-off closures</h3>
          <p class="a-hint">Holidays, private events or repairs. Guests can’t book a table on these dates.</p>
          <div class="a-addrow" data-field="newClosure">
            <label class="sr-only" for="closure-date">Date to close</label>
            <input class="a-input" type="date" id="closure-date" min="${today}" data-closure-input data-bind-skip aria-describedby="closure-err">
            <button class="a-btn a-btn--secondary" type="button" data-add-closure>${icon('ban', 18)} Close this date</button>
            <p class="a-error" id="closure-err" role="alert"></p>
          </div>
          ${
            closures.length
              ? `<ul class="a-chips" aria-label="Closed dates">${closures
                  .map(
                    (d) => `<li class="a-chipx ${d < today ? 'is-past' : ''}"><span>${icon('ban', 15)} ${longDate(d)}${d < today ? ' <small>(past)</small>' : ''}</span>
                    <button type="button" class="a-chipx__x" data-remove-closure="${d}" aria-label="Re-open ${longDate(d)}">${icon('x', 16)}</button></li>`
                  )
                  .join('')}</ul>`
              : '<p class="a-muted a-sub__empty">No one-off closures planned.</p>'
          }
        </div>

        <div class="a-sub" data-field="slots">
          <h3 class="a-sub__h">Booking times</h3>
          <p class="a-hint">The times guests can pick. Each one is a seating, e.g. 5:00, 5:30, 6:00…</p>
          <ul class="a-chips" aria-label="Booking times">${[...r.slots]
            .sort()
            .map((s) => `<li class="a-chipx"><span>${fmtTime(s)}</span><button type="button" class="a-chipx__x" data-remove-slot="${s}" aria-label="Remove ${fmtTime(s)}">${icon('x', 16)}</button></li>`)
            .join('')}</ul>
          <div class="a-addrow" data-field="newSlot">
            <label class="sr-only" for="slot-new">New booking time</label>
            <input class="a-input" type="time" id="slot-new" step="900" data-slot-input data-bind-skip aria-describedby="slot-err">
            <button class="a-btn a-btn--secondary" type="button" data-add-slot>${icon('plus', 18)} Add time</button>
            <p class="a-error" id="slot-err" role="alert"></p>
          </div>
        </div>

        <div class="a-sub">
          <h3 class="a-sub__h">Booking rules</h3>
          <div class="a-form__row a-form__row--2">
            ${field({ label: 'Largest party online', bind: 'reservations.maxParty', value: r.maxParty, type: 'number', required: true, suffix: 'guests', attrs: 'min="1" max="30" step="1" inputmode="numeric" data-type="int"', hint: 'Bigger groups are asked to call or send an event enquiry.' })}
            ${field({ label: 'Book up to', bind: 'reservations.daysAhead', value: r.daysAhead, type: 'number', required: true, suffix: 'days ahead', attrs: 'min="7" max="365" step="1" inputmode="numeric" data-type="int"' })}
          </div>
        </div>
      </section>`;
    if (focusSel) $(focusSel, form)?.focus();
  };

  bindForm(form, () => draft, () => sync());

  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.sched != null) {
      const i = +t.dataset.sched;
      draft.schedule[i].d = $$(`[data-sched="${i}"]`, form).filter((x) => x.checked).map((x) => +x.value).sort();
      sync();
    }
    if (t.dataset.closedday != null) {
      draft.reservations.closedDays = $$('[data-closedday]', form).filter((x) => x.checked).map((x) => +x.value).sort();
      const hint = t.closest('.a-sub').querySelector('.a-hint');
      const cd = draft.reservations.closedDays;
      hint.textContent = cd.length ? `No online bookings on ${cd.map((d) => WEEKDAYS_LONG[d] + 's').join(', ')}.` : 'Open for bookings every day of the week.';
      sync();
    }
  });

  const err = (id, m) => {
    const e = $(`#${id}`, form);
    e.textContent = m;
    e.closest('[data-field]')?.classList.toggle('is-invalid', !!m);
  };
  const addClosure = () => {
    const input = $('[data-closure-input]', form);
    const v = input.value;
    if (!v) return err('closure-err', 'Pick a date first.'), input.focus();
    if (v < today) return err('closure-err', 'That date has already passed.'), input.focus();
    if (draft.reservations.closedDates.includes(v)) return err('closure-err', `${longDate(v)} is already closed.`), input.focus();
    draft.reservations.closedDates.push(v);
    draft.reservations.closedDates.sort();
    paint('[data-closure-input]');
    sync();
    const weekly = draft.reservations.closedDays.includes(parseISO(v).getDay());
    toast(`${longDate(v)} added — press Save changes to close it on the site.${weekly ? ' (You’re already closed that weekday.)' : ''}`, { kind: 'info', duration: 5000 });
  };
  const addSlot = () => {
    const input = $('[data-slot-input]', form);
    const v = input.value;
    if (!/^\d{2}:\d{2}$/.test(v)) return err('slot-err', 'Pick a time first.'), input.focus();
    if (draft.reservations.slots.includes(v)) return err('slot-err', `${fmtTime(v)} is already a booking time.`), input.focus();
    draft.reservations.slots.push(v);
    draft.reservations.slots.sort();
    paint('[data-slot-input]');
    sync();
  };

  form.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.addHours != null) {
      draft.hours.push({ label: '', days: '', time: '' });
      paint(`[data-bind="hours.${draft.hours.length - 1}.label"]`);
    } else if (d.removeHours != null) {
      draft.hours.splice(+d.removeHours, 1);
      paint('[data-add-hours]');
    } else if (d.addService != null) {
      draft.schedule.push({ label: '', d: [0, 1, 2, 3, 4, 5, 6], open: '09:00', close: '17:00' });
      paint(`[data-bind="schedule.${draft.schedule.length - 1}.label"]`);
    } else if (d.removeService != null) {
      draft.schedule.splice(+d.removeService, 1);
      paint('[data-add-service]');
    } else if (d.addClosure != null) return addClosure();
    else if (d.removeClosure != null) {
      draft.reservations.closedDates = draft.reservations.closedDates.filter((x) => x !== d.removeClosure);
      paint('[data-closure-input]');
    } else if (d.addSlot != null) return addSlot();
    else if (d.removeSlot != null) {
      draft.reservations.slots = draft.reservations.slots.filter((x) => x !== d.removeSlot);
      paint('[data-slot-input]');
    } else return;
    sync();
  });
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    if (e.target.matches('[data-closure-input]')) addClosure();
    if (e.target.matches('[data-slot-input]')) addSlot();
  });
  form.addEventListener('input', (e) => {
    if (e.target.matches('[data-closure-input]')) err('closure-err', '');
    if (e.target.matches('[data-slot-input]')) err('slot-err', '');
  });

  const validate = () => {
    const e = {};
    draft.hours.forEach((h, i) => {
      if (!String(h.label).trim()) e[`hours.${i}.label`] = 'Name the service, e.g. Dinner.';
      if (!String(h.time).trim()) e[`hours.${i}.time`] = 'Add the times, e.g. 5:00 – 10:00 pm.';
    });
    draft.schedule.forEach((s, i) => {
      if (!String(s.label).trim()) e[`schedule.${i}.label`] = 'Name the service.';
      if (!/^\d{2}:\d{2}$/.test(s.open)) e[`schedule.${i}.open`] = 'Pick an opening time.';
      if (!/^\d{2}:\d{2}$/.test(s.close)) e[`schedule.${i}.close`] = 'Pick a closing time.';
      else if (s.close <= s.open) e[`schedule.${i}.close`] = 'Closing must be after opening (use 12:00 am for midnight).';
      if (!s.d.length) e[`schedule.${i}.d`] = 'Tick at least one day.';
    });
    const r = draft.reservations;
    if (!r.slots.length) e.slots = 'Add at least one booking time.';
    if (!Number.isInteger(r.maxParty) || r.maxParty < 1 || r.maxParty > 30) e['reservations.maxParty'] = 'Enter 1 to 30.';
    if (!Number.isInteger(r.daysAhead) || r.daysAhead < 7 || r.daysAhead > 365) e['reservations.daysAhead'] = 'Enter 7 to 365 days.';
    // day checkbox groups + slots use their own error slots
    $$('[data-field^="schedule."][data-field$=".d"], [data-field="slots"]', form).forEach((f) => {
      const m = e[f.dataset.field] || '';
      f.classList.toggle('is-invalid', !!m);
      const p = f.querySelector(':scope > .a-error') || f.querySelector('.a-error');
      if (p && f.dataset.field !== 'slots') p.textContent = m;
      if (f.dataset.field === 'slots') $('#slot-err', form).textContent = m;
    });
    return showErrors(form, e) && !Object.keys(e).length;
  };

  $('[data-save]', el).addEventListener('click', async () => {
    if (!validate()) return toast('Please fix the highlighted fields.', { kind: 'error', duration: 4000 });
    if (!draft.hours.length) {
      $('[data-add-hours]', form)?.focus();
      return toast('Add at least one line of opening hours — guests need to see when you’re open.', { kind: 'error', duration: 6000 });
    }
    if (!draft.schedule.length) {
      $('[data-add-service]', form)?.focus();
      return toast('Add at least one service to the “Open now” schedule, or the website will always say you’re closed.', { kind: 'error', duration: 7000 });
    }
    if (draft.reservations.closedDays.length === 7) {
      const ok = await confirmDialog({
        title: 'Stop all online table bookings?',
        text: 'Every day of the week is ticked as closed, so guests won’t be able to book a table online on any date. To close for just a few days, use <strong>One-off closures</strong> instead.',
        confirmLabel: 'Yes, close every day',
        cancelLabel: 'Go back',
        danger: true,
      });
      if (!ok) return;
    }
    draft.hours = draft.hours.map((h) => ({ label: h.label.trim(), days: String(h.days || '').trim(), time: h.time.trim() }));
    draft.schedule = draft.schedule.map((s) => ({ ...s, label: s.label.trim() }));
    for (const k of KEYS) {
      if (same(draft[k], saved[k])) continue;
      const res = saveSection(k, draft[k]);
      if (!res.ok) return toast(res.error || 'Couldn’t save. Please try again.', { kind: 'error' });
    }
    saved = clone(draft);
    sync();
    toast('Saved — live on the site', { kind: 'success', action: { label: 'View on site', href: siteUrl('/reserve') } });
  });
  $('[data-discard]', el).addEventListener('click', async () => {
    if (!(await confirmDiscard())) return;
    draft = clone(saved);
    paint();
    sync();
    toast('Changes discarded.', { kind: 'info', duration: 3000 });
  });

  paint();
  sync();
  const jump = () => {
    const box = $('#closures', form);
    box.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    $('[data-closure-input]', form).focus({ preventScroll: true });
  };
  $('[data-jump]', el).addEventListener('click', jump);
  if (ctx.route.query.focus === 'closures') setTimeout(jump, 80);
  return { isDirty };
}
