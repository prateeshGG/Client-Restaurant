import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import '@fontsource/bodoni-moda/500';
import '@fontsource/bodoni-moda/400-italic';
import '@fontsource/big-shoulders-display/800';
import '@fontsource/dm-mono/400';
import '@fontsource/poppins/400';
import '@fontsource/poppins/600';
import './proposal.css';
import { proposal, proof, pricing as pricingDefaults, plan, designs } from './proposal.config.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: pricingDefaults.currency, maximumFractionDigits: 0 }).format(n);

/* localStorage can throw (private mode, blocked): the page must work without it. */
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

const params = new URLSearchParams(location.search);
const presenter = params.has('presenter');

/* ── Personalisation: ?client=Rhino%20Roofing ─────────────────── */
const client = { ...proposal.client, ...(params.get('client') ? { name: params.get('client').slice(0, 80) } : {}) };
const bind = { agency: proposal.agency, presenter: proposal.presenter, client: client.name, place: client.place };
document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = bind[el.dataset.bind] ?? el.textContent; });
document.title = `Website Proposal — ${client.name}`;
$('#today').textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
$('#year').textContent = new Date().getFullYear();

/* ── Pricing state (defaults ← config, overridden by the presenter's edits) ── */
const PRICE_KEY = 'proposal:pricing:v1';
const CHOICE_KEY = 'proposal:choice:v1';
const num = (v, d) => (Number.isFinite(+v) && +v >= 0 && v !== '' ? +v : d);
const saved = store.get(PRICE_KEY) || {};
const price = {
  setupList: num(saved.setupList, pricingDefaults.setupList),
  setupOffer: num(saved.setupOffer, pricingDefaults.setupOffer),
  hosting: num(saved.hosting, pricingDefaults.hosting),
  freeMonths: Math.round(num(saved.freeMonths, pricingDefaults.freeMonths)),
  addOns: pricingDefaults.addOns.map((a) => ({ ...a, monthly: num(saved.addOns?.[a.id], a.monthly) })),
};
const choice = store.get(CHOICE_KEY) || {};
const state = {
  dir: designs.some((d) => d.id === choice.dir) ? choice.dir : null,
  on: new Set(Array.isArray(choice.on) ? choice.on.filter((id) => price.addOns.some((a) => a.id === id)) : price.addOns.filter((a) => a.on).map((a) => a.id)),
  offer: false,
};
const saveChoice = () => store.set(CHOICE_KEY, { dir: state.dir, on: [...state.on] });

/* ── Static sections ─────────────────────────────────────────── */
function renderAnchors() {
  $('#anchors').innerHTML = price.addOns.map((a) => `
    <article class="anchor">
      <h4>${esc(a.name)}</h4>
      <p>${esc(a.blurb)}</p>
      <p class="anchor__v"><s data-addon-price="${esc(a.id)}">${money(a.monthly)}</s><span> / month on its own</span></p>
    </article>`).join('');
}

function renderDesigns() {
  $('#designList').innerHTML = designs.map((d) => `
    <article class="dz" id="dz-${d.id}" style="--ac:${d.accent};--ff:${d.font}">
      <div class="dz__shots">
        <figure class="dz__desk"><img src="/proposal/${d.id}-desktop.jpg" width="1440" height="900" loading="lazy" alt="${esc(d.name)} design, desktop home page"></figure>
        <figure class="dz__phone"><img src="/proposal/${d.id}-mobile.jpg" width="780" height="1688" loading="lazy" alt="${esc(d.name)} design, phone home page"></figure>
      </div>
      <div class="dz__txt">
        <p class="dz__n">Option ${d.n}</p>
        <h3>${esc(d.name)}</h3>
        <p class="dz__vibe">${esc(d.vibe)}</p>
        <p>${esc(d.blurb)}</p>
        <p class="dz__best"><strong>Best if</strong> ${esc(d.bestIf)}</p>
        <ul class="dz__feat">${d.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        <div class="dz__meta">
          <ul class="sw" aria-label="Palette">${d.palette.map((c) => `<li style="--c:${c}"></li>`).join('')}</ul>
          <span>${esc(d.type)}</span>
        </div>
        <div class="dz__act">
          <a class="btn btn--dk" href="${d.url}" target="_blank" rel="noopener">Open live ${esc(d.name)} →<span class="sr"> (new tab)</span></a>
          <button class="btn btn--pick" type="button" data-pick="${d.id}" aria-pressed="false">Choose this look</button>
        </div>
      </div>
    </article>`).join('');
}

function renderProof() {
  const { stats, testimonials } = proof;
  if (!stats.length && !testimonials.length) return;
  $('#stats').innerHTML = stats.map((s) => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('');
  $('#quotes').innerHTML = testimonials.map((t) => `
    <figure class="quote-card"><blockquote>“${esc(t.quote)}”</blockquote>
      <figcaption><strong>${esc(t.name)}</strong>, ${esc(t.role)}${t.result ? `<br><span>${esc(t.result)}</span>` : ''}</figcaption></figure>`).join('');
  $('#proof').hidden = false;
}

function renderPlan() {
  $('#days').innerHTML = plan.map((p) => `<li><b>${esc(p.day)}</b><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></li>`).join('');
}

/* ── Pricing ─────────────────────────────────────────────────── */
const selectedAddOns = () => price.addOns.filter((a) => state.on.has(a.id));
const addOnMonthly = () => selectedAddOns().reduce((s, a) => s + a.monthly, 0);
const dirName = () => designs.find((d) => d.id === state.dir)?.name;

function renderPicker() {
  $('#priceDir').innerHTML = designs.map((d) => `
    <label class="chip"><input type="radio" name="dir" value="${d.id}" ${state.dir === d.id ? 'checked' : ''}><span style="--ac:${d.accent}"><i style="--c:${d.palette[1]}"></i>${esc(d.name)}</span></label>`).join('');
  $('#addons').innerHTML = price.addOns.map((a) => `
    <label class="add">
      <input type="checkbox" value="${esc(a.id)}" ${state.on.has(a.id) ? 'checked' : ''}>
      <span class="add__box" aria-hidden="true"></span>
      <span class="add__txt"><strong>${esc(a.name)}</strong><small>${esc(a.blurb)}</small></span>
      <span class="add__p">${money(a.monthly)}<small>/mo</small></span>
    </label>`).join('');
}

function row(label, value, cls = '') { return `<div class="${cls}"><dt>${label}</dt><dd>${value}</dd></div>`; }

function quoteRows({ offer }) {
  const free = offer && price.freeMonths > 0;
  const adds = selectedAddOns();
  const rows = [row('Design direction', state.dir ? esc(dirName()) : '<em>Choose one above</em>')];
  rows.push(row('Custom website setup (one-time)', offer && price.setupOffer < price.setupList ? `<s>${money(price.setupList)}</s> <b>${money(price.setupOffer)}</b>` : `<b>${money(offer ? price.setupOffer : price.setupList)}</b>`));
  rows.push(row('Hosting, security &amp; support', `${money(price.hosting)}<small>/mo</small>`));
  adds.forEach((a) => rows.push(row(esc(a.name), free ? `<s>${money(a.monthly)}</s> <b>Free</b> <small>for ${price.freeMonths} mo, then ${money(a.monthly)}/mo</small>` : `${money(a.monthly)}<small>/mo</small>`)));
  return { rows, free, adds };
}

function renderQuote() {
  const { rows, free, adds } = quoteRows({ offer: state.offer });
  const setup = state.offer ? price.setupOffer : price.setupList;
  const monthlyNow = price.hosting + (free ? 0 : addOnMonthly());
  const monthlyAfter = price.hosting + addOnMonthly();
  const saving = Math.max(0, price.setupList - price.setupOffer) + (free ? price.freeMonths * addOnMonthly() : 0);
  rows.push(row('Due at start', money(setup), 'quote__total'));
  rows.push(row(free && adds.length ? `Monthly (first ${price.freeMonths} mo)` : 'Monthly', `${money(monthlyNow)}<small>/mo</small>`, 'quote__sub'));
  if (free && adds.length) rows.push(row('Monthly after that', `${money(monthlyAfter)}<small>/mo</small>`, 'quote__sub'));
  $('#quoteRows').innerHTML = rows.join('');

  const canAccept = !!state.dir;
  $('#offerBox').innerHTML = state.offer
    ? `<p class="offer"><b>One-time offer</b> <span>You save ${money(saving)} when you accept on this call.</span></p>
       <button class="btn btn--block" type="button" id="accept" ${canAccept ? '' : 'disabled aria-describedby="needDir"'}>Accept proposal</button>
       ${canAccept ? '' : '<p class="fine" id="needDir">Choose your design direction to accept.</p>'}
       <button class="link" type="button" id="offerOff">Back to standard price</button>`
    : `<button class="btn btn--block" type="button" id="offerOn">Show the one-time offer</button>
       <p class="fine">There's a special price available while we're on this call.</p>`;
  $('#guarantee').textContent = pricingDefaults.guarantee;
}

function renderChoice() {
  document.querySelectorAll('[data-pick]').forEach((b) => {
    const on = b.dataset.pick === state.dir;
    b.setAttribute('aria-pressed', on);
    b.textContent = on ? '✓ Chosen' : 'Choose this look';
    b.closest('.dz').classList.toggle('is-chosen', on);
  });
  document.querySelectorAll('input[name="dir"]').forEach((i) => { i.checked = i.value === state.dir; });
}

function setDir(id) { state.dir = id; saveChoice(); renderChoice(); renderQuote(); }

function summaryText() {
  const { free, adds } = quoteRows({ offer: state.offer });
  const setup = state.offer ? price.setupOffer : price.setupList;
  const lines = [
    `${proposal.agency} — website proposal for ${client.name}`,
    `Design direction: ${dirName() || '(not chosen)'}`,
    `Setup, due at start: ${money(setup)}${state.offer ? ` (one-time offer, standard ${money(price.setupList)})` : ''}`,
    `Hosting, security & support: ${money(price.hosting)}/mo`,
    ...adds.map((a) => `${a.name}: ${money(a.monthly)}/mo${free ? ` (free for ${price.freeMonths} month${price.freeMonths === 1 ? '' : 's'})` : ''}`),
    `Guarantee: ${pricingDefaults.guarantee}`,
  ];
  return lines.join('\n');
}

function openAccept() {
  const { rows } = quoteRows({ offer: true });
  const setup = price.setupOffer;
  rows.push(row('Due at start', money(setup), 'quote__total'));
  $('#acceptRows').innerHTML = rows.join('');
  const go = $('#acceptGo');
  if (proposal.paymentUrl) { go.href = proposal.paymentUrl; go.hidden = false; $('#acceptNote').textContent = 'You will be taken to our secure payment page.'; }
  else { go.hidden = true; $('#acceptNote').textContent = `Copy your selection and send it back, and ${proposal.agency} will send your secure payment link right away.`; }
  $('#acceptCopy').textContent = 'Copy my selection';
  $('#acceptMail')?.remove();
  if (proposal.contactEmail) {
    const a = Object.assign(document.createElement('a'), { id: 'acceptMail', className: 'btn', textContent: 'Email my selection', href: `mailto:${proposal.contactEmail}?subject=${encodeURIComponent('Proposal accepted — ' + client.name)}&body=${encodeURIComponent(summaryText())}` });
    $('.dlg__act').prepend(a);
  }
  $('#acceptDlg').showModal();
}

/* ── Presenter editor (?presenter) ───────────────────────────── */
function renderEditor() {
  if (!presenter) return;
  $('#editor').hidden = false;
  const field = (id, label, val) => `<label>${label}<input type="number" min="0" step="1" data-edit="${id}" value="${val}"></label>`;
  $('#editorGrid').innerHTML = [
    field('setupList', 'Standard setup fee ($)', price.setupList),
    field('setupOffer', 'One-time offer setup ($)', price.setupOffer),
    field('hosting', 'Hosting / month ($)', price.hosting),
    field('freeMonths', 'Free add-on months', price.freeMonths),
    ...price.addOns.map((a) => field(`addon:${a.id}`, `${esc(a.name)} / month ($)`, a.monthly)),
  ].join('');
}

function persistPrices() {
  store.set(PRICE_KEY, { setupList: price.setupList, setupOffer: price.setupOffer, hosting: price.hosting, freeMonths: price.freeMonths, addOns: Object.fromEntries(price.addOns.map((a) => [a.id, a.monthly])) });
}

/* ── Events ──────────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-pick]');
  if (pick) return setDir(state.dir === pick.dataset.pick ? null : pick.dataset.pick);
  if (e.target.closest('#offerOn')) { state.offer = true; return renderQuote(); }
  if (e.target.closest('#offerOff')) { state.offer = false; return renderQuote(); }
  if (e.target.closest('#accept')) return openAccept();
  if (e.target.closest('#editorReset')) { store.del(PRICE_KEY); location.reload(); }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 'dir') setDir(t.value);
  else if (t.closest('#addons')) { t.checked ? state.on.add(t.value) : state.on.delete(t.value); saveChoice(); renderQuote(); }
});

document.addEventListener('input', (e) => {
  const key = e.target.dataset?.edit;
  if (!key) return;
  const v = num(e.target.value, 0);
  if (key.startsWith('addon:')) price.addOns.find((a) => a.id === key.slice(6)).monthly = v;
  else price[key] = key === 'freeMonths' ? Math.round(v) : v;
  persistPrices();
  renderQuote();
  renderAnchors();
  $('#addons').querySelectorAll('.add').forEach((el, i) => { el.querySelector('.add__p').innerHTML = `${money(price.addOns[i].monthly)}<small>/mo</small>`; });
});

$('#acceptCopy').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(summaryText()); btn.textContent = 'Copied ✓'; }
  catch { btn.textContent = 'Copy not available — select the text above'; }
});

/* Nav: shadow on scroll + current section */
const bar = $('#bar');
const onScroll = () => bar.classList.toggle('is-stuck', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const links = [...document.querySelectorAll('.bar__nav a')];
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => (l.getAttribute('href') === `#${en.target.id}` ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  links.forEach((l) => { const s = $(l.getAttribute('href')); if (s) io.observe(s); });
}

renderAnchors(); renderDesigns(); renderProof(); renderPlan(); renderPicker(); renderEditor(); renderChoice(); renderQuote();
