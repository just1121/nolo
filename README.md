# Winesecrets — Use RO for Lo or No

Local prototype for the Winesecrets No/Lo campaign page and **No/Lo Project Planner**.

This is a deliberately **no-build static prototype** (plain HTML/CSS/JS, no npm, no bundler):
it runs from any static file server, deploys to GitHub Pages as-is, and ports into
WordPress later by embedding the `js/` bundle and copying the page sections.

## Run locally

Any static server works. Simplest:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173/>.

(Or `npx serve .` if you prefer Node.)

## Deploy to GitHub Pages

Push this folder to a repo and enable Pages — no build step required.
The page loads Montserrat + Source Sans 3 from Google Fonts (the production
WordPress site already serves these families).

## Where things live

Layout notes (2026-08-12 compression passes): the "quality problem", "what are you
trying to make?", proof, and regulatory sections were removed; "Why RO?" is a
collapsible toggle; Test Track is the focal dark band with condensed steps; and the
Project Planner opens in a modal (`#ws-nolo-planner-modal`) — every "Build …" CTA
opens it via `WSNoLo.planner.open()`.

| Area | File |
| --- | --- |
| Page structure, all section copy, planner modal shell | `index.html` |
| Planner + explorer copy, options, result-logic wording, feature flags | `js/content.js` |
| Planner logic: state, validation, classification, results, print, mock lead submit | `js/planner.js` |
| Analytics event adapter (console logger in prototype) | `js/analytics.js` |
| Visitor personalization + engagement score | `js/visitor.js` |
| Page wiring: target explorer, cards, nav, debug panel | `js/main.js` |
| Brand tokens (sampled from winesecrets.com 2026-08-11) + all styles + print stylesheet | `css/styles.css` |

## Debug / demo controls

Query-string switches (local only):

- `/?debug=1` — debug panel (visit count, engagement score, planner status, target category, stored project version, recent events) with reset buttons
- `/?visitor=new` — reset visitor state
- `/?visitor=engaged` — simulate an engaged visitor (explorer used + planner started)
- `/?visitor=high-intent` — simulate a high-intent visitor
- `/?planner=complete` — load the demo scenario (2026 Cabernet, 13.7% → ≤0.5%, 6,500 gal, brand extension, mouthfeel) straight to the project brief

Reset everything: use the debug panel buttons, or in the browser console:

```js
localStorage.removeItem("ws_nolo_project_v1"); localStorage.removeItem("ws_nolo_visitor_v1");
```

## Changing CTA destinations

- Hero / final CTAs: anchors in `index.html` (`#project-planner`, `#test-track`, winesecrets.com URLs)
- Brief CTAs and button labels: `WSNoLo.content.ctas` in `js/content.js`
- Lead submission: `submitNoLoProject()` in `js/planner.js` — currently a console mock; swap for the
  approved WordPress REST / CRM endpoint at integration time

## Swapping brand tokens

All colors/typography are CSS custom properties at the top of `css/styles.css`
(`--ws-brand-primary`, `--ws-text`, `--font-heading`, …), sampled from the production
site. Re-verify against production CSS during WordPress integration.

## Analytics

`WSNoLo.track(name, props)` in `js/analytics.js` logs to the console and debug panel.
The property allowlist strips free text; lot sizes are banded. Replace the `send()`
function with the approved analytics integration in production.

## Production note

This repository is a local prototype. Lead submission, regulatory guidance, production
claims (marked `[VERIFY ...]` in comments), final branding values and WordPress
integration require Winesecrets approval before deployment. See spec §49 for the
content-approval checklist.
