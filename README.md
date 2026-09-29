# Scioto House — Hotel & Kitchen website (5 design options + Owner Dashboard)

A complete, working website for a new boutique hotel with a restaurant in Columbus, Ohio, delivered as
**five visually distinct design directions** plus an **Owner Dashboard** that share one content file and one set of working flows.

## Run it
```bash
npm install
npm run dev        # http://localhost:3000  → design chooser
npm run build      # production build in dist/
npm run preview    # serve the production build on :3000
```
Routes: `/` chooser · `/familiar/` · `/fresh/` · `/atelier/` · `/noir/` · `/terra/` · `/admin/` (Owner Dashboard) (each site uses `#/…` routes below).

## 1. What was designed
Marketing + direct-booking site for a 20-room hotel and all-day restaurant ("the Kitchen") in a restored 1891 brick
building. **"Scioto House" is a placeholder name** — rename in `src/content.js`.

| Option | Style | Based on |
|---|---|---|
| **Familiar** | Very close to the client's sample, with its problems fixed | cleancreations.com (see `02-extraction/SAMPLE-AUDIT.md`) |
| **A · Fresh** | Bright, clean, green accent | Client's sample (cleancreations.com) |
| **B · Atelier** | Professional, editorial, monochrome, square | Ace Hotel, The Hoxton |
| **C · Noir** | After-dark cinematic luxury: black, champagne, Didone caps, video hero | EDITION, Proper, Atomix |
| **D · Terra** | Sun-baked & earthy: sand/terracotta/olive, arches, mono type, sticky booking bar | Casa Cook, 1 Hotels, Hotel Esencia |

## 2. Requirements identified
Present both hotel and restaurant · direct room booking · table reservations · menu with dietary filters/search ·
manage/cancel a booking · contact + event enquiries, hours, FAQ · newsletter · owner-editable content ·
distinct style options (4 explored, 2 kept at client's request) · fully responsive. Full list: `../clone-workspace/scioto-house/01-product/PRODUCT.md`.

## 3. Screens / routes
`#/` Home · `#/stay` Rooms (filter/sort) · `#/stay/:id` Room detail (gallery, lightbox) · `#/dine` Menu (tabs, diet filters, search, hours) ·
`#/book` Room booking wizard (4 steps + confirmation) · `#/reserve` Table reservation (2 steps + confirmation) ·
`#/manage` Look up / cancel · `#/about` Story, values, neighbourhood · `#/contact` Contact form, map, hours, FAQ · 404.

## 4. User flows
1. **Book a room** — dates/guests/promo → room (availability, price × nights) → guest details → review (tax, discount, edit links) → confirmation code `SH-XXXXXX` + .ics.
2. **Reserve a table** — party (1–10), date (closed Mondays, 60 days ahead), time slot (full/past disabled) → details → `ST-XXXXXX`.
3. **Manage** — code + last name → details → cancel (confirm dialog) → status "Cancelled" + toast. Deep link `#/manage?code=…`.
4. **Menu** — period tabs (arrow keys) → diet chips → search → empty state with "Clear filters".
5. **Rooms** — guests/bed/sort → empty state with reset → detail → "Book this room" (prefills wizard).
6. **Contact** — General / Event / Press; Event reveals date + guests; validation → sending → success → "Send another".
7. **Newsletter**, **mobile drawer** (focus trap, Esc, scroll lock), **design switcher** (keeps current page).

## 5. Research (inspected live via CSSOM)
cleancreations.com · cravburgers.shop · thehoxton.com · thehotelemma.com · acehotel.com · gramercytavern.com · shakeshack.com.
Measured tokens and findings: `../clone-workspace/scioto-house/02-extraction/RESEARCH.md`.

## 6–7. Patterns extracted & synthesis
Always-visible booking CTA (all refs) · header booking bar (Ace → Atelier) · "How it works" steps + plan cards + tinted reviews (sample → Fresh) ·
"My booking" utility (Hoxton → both).
Avoided: blocking newsletter pop-ups, low-contrast lime buttons (sample's 1.8:1 → 5.1:1), auto-playing sliders.
Design system: `../clone-workspace/scioto-house/03-design-spec/DESIGN.md`.

## 8. Implementation
Vite + vanilla ES modules, no framework — fast, simple to host anywhere.
```
src/content.js        ← THE file the owner edits (rooms, prices, menu, hours, copy, images)
src/core/             ← shared router, flows (booking, reservation, manage, contact, menu, rooms), UI (dialog, drawer, toast, tabs), base CSS
src/themes/<option>/  ← views.js (header, footer, home + page compositions) + theme.css (tokens + skin)
public/images/        ← photos (replace files with same names)
```
Bookings/reservations/messages persist in `localStorage` (demo). `src/core/store.js` is the single integration point for a real
booking engine (e.g. Cloudbeds/Mews) and reservations (OpenTable/Resy/Tock) at launch.

**Owner editing:** for the final build we recommend moving `content.js` into a CMS (WordPress with ACF, or a headless CMS such
as Sanity/Decap) so the owner edits menus, prices and photos in a browser — the templates stay unchanged.

## Real map
MapLibre GL + OpenFreeMap vector tiles (© OpenStreetMap contributors, free, no API key), recoloured per design from CSS
tokens. Pin location: `site.geo` in `src/content.js` (PLACEHOLDER — set to the real building). Lazy-loaded; falls back to an
address card + Google Maps link if unavailable.

## 9. UI flows tested (built-in browser)
All flows above end-to-end, including: validation errors & focus to first invalid field, loading states, back/forward
through wizard steps (draft persists), refresh/deep links, sold-out and closed-day states, cancel dialog (Esc/focus),
lightbox (arrow keys), 404 for unknown routes/rooms, mobile drawer.

## 10. Responsive breakpoints tested
320 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 — every route of every option audited for horizontal overflow
and touch targets < 44px (dev-only helper `src/core/qa.js`): **0 issues**.

## 11. Original design & assets
All layouts, icons (inline SVG set in `src/core/util.js`), logo marks, map illustration and copy are original.
Photos are AI-generated placeholders (to be replaced by the client's consultant). No reference-site assets are used.
All site images verified distinct with a perceptual duplicate check (`clone-workspace/scioto-house/06-qa/check-images.py`).
Removed options (Heritage, Pop) are archived with their images in `clone-workspace/scioto-house/archive/`.
Fonts are open-source, self-hosted via Fontsource: Plus Jakarta Sans, Instrument Serif, Inter, Bodoni Moda,
Big Shoulders Display, DM Mono (substitutes for proprietary fonts seen in research: GT America, Toronto Gothic,
Tiempos, Didot, Oswald/Courier Prime).
Missing images degrade to a neutral placeholder rather than a broken icon.

## 12. Verification
`node clone-app-pat-pro-public/scripts/assert-styles.mjs` → **89/89 style assertions passed, 0 failed** (Fresh, Atelier, Noir, Terra); `npm run build` → exit 0.
Results: `../clone-workspace/scioto-house/06-qa/cycle-3/metrics.json`.

**Placeholders to confirm:** name, address, phone, email, social links, reviews (preview-dinner quotes), lodging tax rate, opening team.

## Media still wanted (stand-ins in use until delivered — see `media` in `src/content.js`)
Noir: `video/noir-hero.mp4` (+ poster), `noir-exterior-night.jpg`, `noir-room-night.jpg`, `noir-dish-dark.jpg`, `noir-cocktail-smoke.jpg`.
Terra: `video/terra-hero.mp4` (+ poster), `terra-courtyard.jpg`, `terra-bread.jpg`, `terra-market.jpg`, `terra-ceramics.jpg`.

## Round 3 changes
- **Familiar** option: faithful to the client's sample (structure, rhythm, lime buttons, utility bar, carousels, plan cards, tinted reviews)
  with its measured problems fixed (no blocking pop-up, 9:1 button contrast instead of 1.8:1, 16px readable body, labelled working countdown,
  heading hierarchy, filters/search, descriptive links).
- **Owner Dashboard** (`/admin/`): rooms (rates, photos, maintenance), menu (add/edit, photos, sold-out today), hours & closures, site info,
  bookings, reservations, messages & subscribers, backup/restore. Every design has an **Owner login** button in its footer.
  Demo sign-in only (credentials in `src/admin/config.js`); edits are stored in the browser (`sh:content:v1`) and layered over `src/content.js`
  via `applyContent()` — in production the same JSON comes from the CMS/API (`src/core/cms.js` is the single swap point).
- **Hover images on menus**: every dish has a photo; each design reveals it differently (quick-view, springing plate, cursor-follow,
  full-bleed backdrop, sliding polaroid) with keyboard-focus and tap equivalents. 15 dish photos are stand-ins until `MEDIA-REQUESTS.md` photos arrive.
- **No shared-looking components**: shared flows now render through `src/core/kit.js` (overridable UI templates; logic binds to data-hooks
  documented in `04-architecture/UI-CONTRACT.md`). Each design supplies its own rooms page, room detail, menu, booking wizard, reservation,
  confirmations, contact, about, footer and mobile menu (`04-architecture/DISTINCT-BRIEF.md`).
- **Fixed**: rooms disappeared after changing bed/sort filters (re-rendered cards stayed at opacity 0 — reveal-on-scroll now auto-observes new elements).

## Demo notes (for reviewing with the client)
- **Owner Dashboard** (`/admin/`): the demo sign-in is pre-filled — just press *Sign in*. It is a demo gate only; edits are saved in
  the reviewer's own browser. The production site needs real owner accounts + a CMS/API behind `src/core/cms.js`.
- **Manage booking / "My booking"**: a sample booking always exists while `site.demoMode` is `true` (`src/content.js`):
  code **SH-DEMO01**, last name **Guest**. The Manage page also lists bookings made on this device for one-click lookup.
- **Date fields**: on desktop a themed calendar (`src/core/datepicker.js`) opens from anywhere in the field; phones keep their native date wheel.
- **Dropdowns**: open lists are styled per design in browsers that support customizable `<select>` (Chrome/Edge); others show their native list.

## Deploy (Vercel)
Framework preset **Vite** · build command `npm run build` · output directory `dist`. All pages are static: `/`, `/familiar/`, `/fresh/`,
`/atelier/`, `/noir/`, `/terra/`, `/admin/`.
