/* Open the native calendar/time picker when the user clicks anywhere on a date field,
 * not only on the small calendar icon. Used by every design option and the Owner Dashboard. */
let bound = false;
import { enableDatePicker } from './datepicker.js';

export function enablePickers() {
  if (bound) return;
  bound = true;
  enableDatePicker();
  document.addEventListener('click', (e) => {
    const input = e.target.closest?.('input[type="date"], input[type="time"], input[type="month"], input[type="datetime-local"]');
    if (!input || input.disabled || input.readOnly || typeof input.showPicker !== 'function') return;
    // Date fields on mouse/trackpad devices use the themed calendar (datepicker.js) instead.
    if (input.type === 'date' && matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    try {
      input.showPicker();
    } catch {
      /* not allowed in this context (e.g. cross-origin iframe) — the icon still works */
    }
  });
}
