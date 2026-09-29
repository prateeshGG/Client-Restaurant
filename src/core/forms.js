import { esc, icon } from './util.js';

/* ── Field renderers (shared markup, skinned per theme) ── */
export const field = ({ name, label, type = 'text', value = '', required = false, hint = '', autocomplete = '', attrs = '', full = false }) => `
  <div class="field${full ? ' field--full' : ''}">
    <label class="field__label" for="f-${name}">${label}${required ? ' <span class="field__req" aria-hidden="true">*</span>' : ' <span class="field__opt">(optional)</span>'}</label>
    ${
      type === 'textarea'
        ? `<textarea class="field__input" id="f-${name}" name="${name}" rows="4" ${required ? 'required' : ''} ${attrs} aria-describedby="f-${name}-hint f-${name}-err">${esc(value)}</textarea>`
        : `<input class="field__input" id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${attrs} aria-describedby="f-${name}-hint f-${name}-err">`
    }
    ${hint ? `<p class="field__hint" id="f-${name}-hint">${hint}</p>` : ''}
    <p class="field__error" id="f-${name}-err" role="alert"></p>
  </div>`;

export const select = ({ name, label, options, value = '', required = false, hint = '', full = false }) => `
  <div class="field${full ? ' field--full' : ''}">
    <label class="field__label" for="f-${name}">${label}${required ? ' <span class="field__req" aria-hidden="true">*</span>' : ''}</label>
    <div class="field__select">
      <select class="field__input" id="f-${name}" name="${name}" ${required ? 'required' : ''} aria-describedby="f-${name}-hint f-${name}-err">
        ${options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`;
        }).join('')}
      </select>
    </div>
    ${hint ? `<p class="field__hint" id="f-${name}-hint">${hint}</p>` : ''}
    <p class="field__error" id="f-${name}-err" role="alert"></p>
  </div>`;

export const checkbox = ({ name, label, checked = false, required = false }) => `
  <div class="field field--full field--check">
    <label class="check">
      <input type="checkbox" name="${name}" id="f-${name}" ${checked ? 'checked' : ''} ${required ? 'required' : ''} aria-describedby="f-${name}-err">
      <span class="check__box" aria-hidden="true">${icon('check', 14)}</span>
      <span class="check__label">${label}</span>
    </label>
    <p class="field__error" id="f-${name}-err" role="alert"></p>
  </div>`;

/* ── Validation ── */
export const rules = {
  required: (v) => (String(v ?? '').trim() ? '' : 'This field is required.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Enter a valid email, like name@example.com.'),
  phone: (v) => (String(v).replace(/\D/g, '').length >= 10 ? '' : 'Enter a 10-digit phone number.'),
  name: (v) => (/^[\p{L}' .-]{1,60}$/u.test(String(v).trim()) ? '' : 'Use letters only.'),
  checked: (v) => (v ? '' : 'Please tick to continue.'),
};

/** validate(form, { fieldName: [ruleFn|string, ...] }) → { ok, values } and paints errors. */
export function validate(form, schema) {
  const values = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll('input[type=checkbox]').forEach((c) => (values[c.name] = c.checked));
  let firstBad = null;
  for (const [name, list] of Object.entries(schema)) {
    let input = form.elements[name];
    if (!input) continue;
    if (typeof input.length === 'number' && !input.tagName) input = input[0]; // radio group → first control
    let msg = '';
    for (const r of list) {
      const fn = typeof r === 'string' ? rules[r] : r;
      msg = fn(values[name], values);
      if (msg) break;
    }
    setError(input, msg);
    if (msg && !firstBad) firstBad = input;
  }
  if (firstBad) firstBad.focus();
  return { ok: !firstBad, values };
}

export function setError(input, msg) {
  if (!input) return;
  const wrap = input.closest('.field, [data-field]');
  const err = wrap && wrap.querySelector('.field__error');
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  wrap && wrap.classList.toggle('is-invalid', !!msg);
  if (err) err.textContent = msg || '';
}

/* Clear error as the user corrects the field. */
export function liveClear(form) {
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });
  form.addEventListener('change', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });
}
