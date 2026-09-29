/* OPTION C — NOIR (after-dark cinematic luxury). Header, drawer, footer + page/ui wiring. */
import { site, hours } from '../../content.js';
import { icon } from '../../core/util.js';
import { directionsUrl } from '../../core/map.js';
import { NAV, word, statusHTML } from './shared.js';
import { noirUI } from './kit.js';
import { pages } from './pages.js';

const header = () => `
  <header class="site-header">
    <div class="site-header__inner">
      <nav class="site-header__nav" aria-label="Main"><ul class="nav-links">${NAV.map(([p, l]) => `<li><a href="#${p}" data-nav="${p}">${l}</a></li>`).join('')}</ul>
        <button class="menu-btn btn btn--ghost" type="button" data-drawer-open aria-expanded="false" aria-controls="drawer" aria-label="Open menu"><span class="menu-btn__bars" aria-hidden="true"></span><span class="menu-btn__t">Menu</span></button>
      </nav>
      ${word()}
      <div class="site-header__cta">
        <a class="site-header__table hide-md" href="#/reserve">Book a table</a>
        <a class="btn btn--primary site-header__reserve" href="#/book">Reserve</a>
      </div>
    </div>
  </header>
  <div class="drawer" id="drawer" data-drawer hidden>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="drawer__top">${word()}<button class="btn btn--icon" type="button" data-drawer-close aria-label="Close menu">${icon('x', 22)}</button></div>
      <ul class="drawer__links">${[['/', 'Home'], ...NAV, ['/manage', 'Your booking']].map(([p, l]) => `<li><a href="#${p}" data-nav="${p}">${l}</a></li>`).join('')}</ul>
      <p class="drawer__status" data-status>${statusHTML()}</p>
      <div class="drawer__cta"><a class="btn btn--primary btn--lg" href="#/book">Reserve a room</a><a class="btn btn--secondary btn--lg" href="#/reserve">Book a table</a></div>
      <p class="drawer__meta">${site.address.line1}, ${site.address.line2}<br>${site.phone}</p>
    </div>
  </div>
  <nav class="mobile-reserve" aria-label="Quick reserve"><a href="#/book">Reserve a room</a><a href="#/reserve">Book a table</a></nav>`;

const footer = () => `
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__word" aria-hidden="true">Scioto House</p>
      <div class="site-footer__grid">
        <div><h2 class="site-footer__h">Address</h2><p>${site.address.line1}<br>${site.address.line2}<br><a href="${directionsUrl()}" target="_blank" rel="noopener">Directions</a></p></div>
        <div><h2 class="site-footer__h">Reservations</h2><p><a href="tel:${site.phone.replace(/\D/g, '')}">${site.phone}</a><br><a href="mailto:${site.email}">${site.email}</a><br><a href="#/manage">Manage a booking</a></p></div>
        <div><h2 class="site-footer__h">Hours</h2><p>${hours.slice(2, 5).map((h) => `${h.label} · ${h.days}<br><span>${h.time}</span>`).join('<br>')}</p></div>
        <div class="newsletter"><h2 class="site-footer__h">The late list</h2>${noirUI.newsletterForm('Openings, chef’s-counter nights and first dibs on the Loft')}</div>
      </div>
      <div class="site-footer__base">
        <p>© ${new Date().getFullYear()} ${site.name} · ${site.city}</p>
        <p class="site-footer__social">${['Instagram', 'Facebook', 'TikTok'].map((s) => `<a href="${site.social[s.toLowerCase()]}">${s}</a>`).join('')}</p>
        <a class="owner-link" href="/admin/" data-owner-link>${icon('key', 16)}<span>Owner login</span></a>
      </div>
    </div>
  </footer>`;

export default { header, footer, pages, ui: noirUI };
