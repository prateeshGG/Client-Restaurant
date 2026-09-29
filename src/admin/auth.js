/* Demo sign-in gate (client-side only — clearly labelled as such in the UI).
 * Session lives in sessionStorage (closes with the tab); failed attempts in localStorage
 * so a refresh can't skip the 30-second pause. */
import { DEMO_OWNER, LOCKOUT } from './config.js';
import { esc, icon, $ } from './lib.js';

const SESSION = 'sh:admin:session';
const ATTEMPTS = 'sh:admin:attempts';

export const session = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION));
  } catch {
    return null;
  }
};
export const signOut = () => sessionStorage.removeItem(SESSION);

const attempts = () => {
  try {
    return { fails: 0, until: 0, ...JSON.parse(localStorage.getItem(ATTEMPTS)) };
  } catch {
    return { fails: 0, until: 0 };
  }
};
const setAttempts = (a) => localStorage.setItem(ATTEMPTS, JSON.stringify(a));

export function loginScreen(root, { onSuccess }) {
  document.title = 'Sign in — Owner Dashboard';
  root.innerHTML = `
  <div class="a-login">
    <section class="a-login__panel" aria-labelledby="login-title">
      <div class="a-brand a-brand--login"><span class="a-brand__mark" aria-hidden="true">SH</span><span class="a-brand__text"><strong>Scioto House</strong><small>Owner dashboard</small></span></div>
      <h1 class="a-login__title" id="login-title" tabindex="-1">Sign in</h1>
      <p class="a-login__lede">Update your menu, rooms, prices and opening hours — and see every booking — in one place.</p>
      <div class="a-demo" role="note">
        ${icon('info', 18)}
        <p><strong>This is a demo.</strong> The sign-in details are already filled in — just press <em>Sign in</em>. Changes you make are saved only in this browser. The live site will get secure owner accounts.</p>
      </div>
      <form class="a-login__form" novalidate data-login>
        <div class="a-field" data-field="email">
          <label class="a-label" for="login-email">Email</label>
          <input class="a-input" id="login-email" name="email" type="email" autocomplete="username" inputmode="email" spellcheck="false" aria-describedby="login-email-e" value="${esc(DEMO_OWNER.email)}">
          <p class="a-error" id="login-email-e" role="alert"></p>
        </div>
        <div class="a-field" data-field="password">
          <label class="a-label" for="login-pass">Password</label>
          <div class="a-affix a-affix--btn">
            <input class="a-input" id="login-pass" name="password" type="password" autocomplete="current-password" spellcheck="false" aria-describedby="login-pass-e" value="${esc(DEMO_OWNER.password)}">
            <button class="a-iconbtn a-affix__btn" type="button" data-reveal-pass aria-pressed="false" aria-label="Show password">${icon('eye', 20)}</button>
          </div>
          <p class="a-error" id="login-pass-e" role="alert"></p>
        </div>
        <div class="a-login__msg" data-login-msg role="alert" aria-live="assertive"></div>
        <button class="a-btn a-btn--primary a-btn--block a-btn--lg" type="submit" data-login-submit>${icon('lock', 18)} Sign in</button>
      </form>
      <p class="a-login__foot"><a class="a-link" href="/">${icon('left', 16)} Back to the website options</a></p>
    </section>
    <aside class="a-login__aside" aria-hidden="true">
      <div class="a-login__art">
        <div class="a-login__card a-login__card--1"><span>${icon('menu', 18)}</span><p><strong>Sweet Corn Salad</strong><small>Marked sold out · live on the site</small></p></div>
        <div class="a-login__card a-login__card--2"><span>${icon('bed', 18)}</span><p><strong>The Brick King</strong><small>$219 → $239 a night</small></p></div>
        <div class="a-login__card a-login__card--3"><span>${icon('calendar', 18)}</span><p><strong>Closed Dec 25</strong><small>Reservations paused for the day</small></p></div>
      </div>
      <p class="a-login__quote">Change something here, and all five website designs update on their next load.</p>
    </aside>
  </div>`;

  const form = $('[data-login]', root);
  const msg = $('[data-login-msg]', root);
  const btn = $('[data-login-submit]', root);
  const email = form.elements.email;
  const pass = form.elements.password;
  let tick;

  const setFieldError = (input, text) => {
    const f = input.closest('[data-field]');
    f.classList.toggle('is-invalid', !!text);
    $('.a-error', f).textContent = text;
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
  };
  // The lock is announced once; the ticking seconds are visual only (aria-hidden),
  // so screen readers aren't interrupted every second.
  const showLock = () => {
    clearInterval(tick);
    const left0 = Math.ceil((attempts().until - Date.now()) / 1000);
    btn.disabled = true;
    msg.className = 'a-login__msg is-lock';
    msg.innerHTML = `${icon('lock', 18)}<span>Too many attempts. For safety, sign-in is paused<span class="sr-only"> for ${left0} seconds</span><span aria-hidden="true"> — try again in <strong class="a-login__count" data-left>${left0} s</strong></span>.</span>`;
    const count = $('[data-left]', msg);
    const paint = () => {
      const left = Math.ceil((attempts().until - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(tick);
        btn.disabled = false;
        msg.className = 'a-login__msg is-ok';
        msg.innerHTML = `${icon('check', 18)}<span>You can try again now.</span>`;
        return;
      }
      count.textContent = `${left} s`;
    };
    tick = setInterval(paint, 1000);
  };
  if (attempts().until > Date.now()) showLock();

  $('[data-reveal-pass]', root).addEventListener('click', (e) => {
    const b = e.currentTarget;
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show));
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.innerHTML = icon(show ? 'eyeOff' : 'eye', 20);
  });
  [email, pass].forEach((i) => i.addEventListener('input', () => setFieldError(i, '')));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const a = attempts();
    if (a.until > Date.now()) return showLock();
    const ev = email.value.trim();
    const pv = pass.value;
    setFieldError(email, ev ? (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ev) ? '' : 'Enter the email address you sign in with.') : 'Enter your email address.');
    setFieldError(pass, pv ? '' : 'Enter your password.');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ev);
    if (!emailOk) return email.focus();
    if (!pv) return pass.focus();

    if (ev.toLowerCase() === DEMO_OWNER.email.toLowerCase() && pv === DEMO_OWNER.password) {
      setAttempts({ fails: 0, until: 0 });
      sessionStorage.setItem(SESSION, JSON.stringify({ email: DEMO_OWNER.email, at: new Date().toISOString() }));
      clearInterval(tick);
      onSuccess();
      return;
    }
    const fails = a.fails + 1;
    if (fails >= LOCKOUT.attempts) {
      setAttempts({ fails: 0, until: Date.now() + LOCKOUT.seconds * 1000 });
      pass.value = '';
      return showLock();
    }
    setAttempts({ fails, until: 0 });
    const left = LOCKOUT.attempts - fails;
    msg.className = 'a-login__msg is-error';
    msg.innerHTML = `${icon('alert', 18)}<span>That email and password don’t match. ${left <= 3 ? `<strong>${left} ${left === 1 ? 'try' : 'tries'} left</strong> before a ${LOCKOUT.seconds}-second pause.` : 'Please check and try again.'}</span>`;
    pass.select();
    pass.focus();
  });
  return () => clearInterval(tick);
}

export const accountEmail = () => esc(session()?.email || '');
