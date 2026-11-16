# Star Citizen Referrals

An independent static field guide by PatchOps. The single referral code is
`STAR-9L66-ZTDY`; signup links open official RSI with that code attached.

## Run locally

```sh
python3 scripts/serve-preview.py
```

Visit http://localhost:4173. No build or dependency installation is needed.

## Validate

```sh
python3 scripts/check-site.py
node --check assets/js/script.js
```

The site shares `assets/css/site.css` and `assets/js/script.js`. HTML contains the
real content, links and structured data; essential signup works without JavaScript.
The homepage signup panel supports eleven languages. Longer guides are in English.

## Content and data

- Update facts against official RSI sources and record the actual review date.
- Do not roll dates forward automatically or reuse old promotional deadlines.
- `assets/api.json` and `assets/ai-instructions.txt` expose factual site data.
- Recruitment counts are owner-reported snapshots, not live statistics.
- Artwork provenance is in `assets/images/flight/credits.json`.
- The sitemap includes current canonical guides. Old duplicate URLs redirect to
  relevant guides; expired event URLs carry explicit archive notices.

## Hosting

GitHub Pages serves the `main` branch root at https://starcitizenreferrals.space/.
The existing `update-dates.sh` pre-commit entry now validates rather than rewriting
review dates. No separate Sites hosting project is required.

Google Analytics uses the existing measurement ID. Conversion actions are
`copy_referral_code` and `open_rsi_signup`, with placement and page path. Outbound
clicks do not establish completed RSI signups or purchases. Do Not Track is respected.

This is an unofficial fan site, not affiliated with Cloud Imperium Games or RSI.
Game artwork belongs to its respective owners. See the site's disclosure and privacy
pages for details.

Optional end-to-end browser checks require Playwright. With it installed outside
the repository, run:

```sh
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/browser-check.cjs
```

Start the local server first. The check prints its temporary artifact directory
and covers desktop/mobile routes, copy permission failures, saved preferences,
translations, aliases, event expiry, no-JavaScript access and analytics behavior.

## Guide library

The task guides and library live under `pages/guides/`. Their editable sources
are `_content/guides/*.html`, metadata and official sources are in
`_content/guides/catalog.json`, and the guide-only template is
`_content/guide-template.html`. The underscore source directory is excluded by
GitHub Pages/Jekyll; visitors receive the generated complete HTML pages.

```sh
python3 scripts/build-guides.py
python3 scripts/check-site.py
```

The generator writes the guide pages, contextual guide navigation and new
sitemap entries. It asserts that the homepage, shared CSS/JS and sharing image
remain unchanged. Edit actual review dates after researching the source; the
script does not roll older pages' dates forward.

With the local server running and Playwright available, verify the catalog with:

```sh
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/guide-browser-check.cjs
```

This checks all catalog guides and the library at 320, 390, 768 and 1440px,
including source links, referral identity, contents links and guide discovery.

The evergreen references avoid fixed patch numbers, ship rankings and live price
tables. Keep conceptual explanations separate from changing implementation
details and link those details to their official source. The departure checklist
uses native checkboxes with an optional session-only count and print button; it
does not save progress or read game state. Verify its interactions and print
layout with:

```sh
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/evergreen-browser-check.cjs
```

The library's search and category filter use local title, summary and curated
related-term matching, including common questions and control aliases. Optional
starting paths group existing resources by what a visitor wants to do, and each
generated guide ends with three related next steps. Search does not store text or place it in the URL;
all cards remain accessible without JavaScript. The mission-budget planner uses
entered contract totals, an equal reward split, personal expenses and whole-trip
time. It does not fetch live prices or payouts. Run the arithmetic checks with:

```sh
node scripts/mission-budget-check.cjs
node scripts/search-query-check.cjs
```

With the preview server running, check search, combined filters, empty results,
calculator validation, result layouts and no-JavaScript content with:

```sh
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/discovery-browser-check.cjs
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/navigation-browser-check.cjs
```

## Visitor and whole-site audits

Visitor tests use fresh, isolated browser contexts one at a time. They simulate
new and existing accounts, mobile/keyboard use, blocked clipboard/storage,
translations, no JavaScript, tools, archives, missing pages, Firefox and WebKit.
They do not register RSI accounts, submit payments or contact anyone.

Use the test-owned preview runner so a long audit does not depend on a separate
background server session:

```sh
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/run-local-audit.cjs scripts/customer-journey-check.cjs scripts/focus-visibility-check.cjs scripts/discovery-browser-check.cjs
```

For full-page screenshots, 320/390/768/1440px checks and automated accessibility
checks, fetch the pinned checker into a temporary location, then run:

```sh
curl -fL https://unpkg.com/axe-core@4.14.0/axe.min.js -o /tmp/sc-audit-axe.min.js
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/run-local-audit.cjs scripts/site-experience-audit.cjs
```

Set `SC_AXE_PATH` for a different checker location. Without it, the script still
checks routes/layouts and captures screenshots but does not run axe. Automated
checks are not a complete accessibility certification. `SC_AUDIT_PHASE=before`
records failing journeys for investigation; the default mode fails the command
if a confirmed journey or layout/runtime check fails.

`loading-audit.cjs` records cold-load Chromium traces under a documented
slower-network/CPU profile. It uses the live site by default and can take
`SC_QA_BASE` for another origin. Its results are laboratory measurements, not
field INP, a Lighthouse score, conversion tracking or real-user research.

`_content/guides/library-extras.json` includes existing signup and help pages
in local library search without regenerating those pages as new guides.
`404.html` is generated from `_content/not-found.html`; it stays noindex and
out of the sitemap. The local preview preserves HTTP 404 for unknown paths,
matching GitHub Pages recovery behavior. Audit summaries are in `_reports/`,
which stays outside the published Jekyll site.
