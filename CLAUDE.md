# Winesecrets "Use RO for Lo or No" prototype

Static HTML/CSS/JS site, no build step. Two pages:
- `index.html` — full No/Lo campaign page (target explorer, Test Track popup, project planner; content rendered from `js/content.js`).
- `tools.html` — simplified "Alcohol Exclusion Tools" one-pager (self-contained:
  its own inline `<style>` block and an inline Test Track modal script at the
  bottom of the file; both CTAs open that modal).

## Deploy
Pushing to `main` on github.com/just1121/nolo publishes GitHub Pages at
https://just1121.github.io/nolo/ within ~1 minute. The owner reviews on the
live site, so push after each change unless told otherwise.

## Cache-busting (important)
GitHub Pages caches files for 10 minutes. `index.html` references every CSS/JS
asset with a `?v=YYYYMMDD<letter>` query param (6 occurrences, all kept
identical). Whenever you change `css/styles.css` or any `js/*.js`, bump the
letter on ALL six params in `index.html` in the same commit — otherwise
viewers get fresh HTML with stale assets and the page looks broken.
`tools.html` pins its stylesheet with the same style of param; bump it too
when styles change.

## Copy rules
- Never name "spinning cone" or any competitor technology on-page; say
  "heat-based distillation" or similar. **One deliberate exception:** the Lost
  Aroma and Lost Volume cards on `tools.html`, where the owner supplied the
  RO-vs-distillation copy and directed (2026-09-08) that it run verbatim,
  spinning cone included.
  It carries a `[VERIFY MARKETING]` comment saying so — leave it as written, and
  don't extend the exception to any other copy. Competitive/sensory claims carry
  `[VERIFY MARKETING]` comments, with source citations in `[SOURCES]` comments.
- Benefits trio is fixed wording: No Heat / No Stripping / No Shrink.
- 0.0% ABV offerings were deliberately removed (Winesecrets doesn't do 0.0%);
  don't reintroduce them in explorer/planner options.
- All Test Track links on index.html open the Test Track modal via js/main.js,
  not the section anchor or winesecrets.com.

## Verifying
For layout work, serve locally (`python3 -m http.server`) and check geometry in
a browser; after pushing, confirm the live page picked up the new `?v=` token.
