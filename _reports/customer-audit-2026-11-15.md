# Customer-experience audit — 15 November 2026

The audit tested 23 simulated visitors sequentially, inspected every existing route, and fixed four confirmed usability gaps. All 23 journeys pass after the fixes. These are browser simulations, not recruited customers or evidence of improved conversion.

## Fixes supported by observed failures

| Confirmed issue | Observed effect | Fix and verification |
| --- | --- | --- |
| Existing account/help pages were absent from searchable cards | Package, 50,000-credit and referral-troubleshooting searches could not find the appropriate existing page | Included six existing help pages in the same searchable/category-filtered collection. The library now searches 33 resources, including 27 task guides. Three failing visitor searches now pass. |
| Escape always returned focus to the mobile menu button | Pressing Escape in search moved the visitor away from the search field, even with the menu closed | Escape handles the menu only while it is open. Search focus and open-menu dismissal both pass. |
| Unknown addresses used the host's generic error | A visitor at a mistyped address had no site-specific recovery navigation | Added a noindex custom 404 with library, homepage and account-help links. Preview preserves HTTP 404; unknown-path visitor test passes. |
| Sticky mobile signup bar could cover keyboard focus | Actual Tab navigation reached links completely hidden behind the bar | Focus scrolling accounts for the visible fixed bar. Rechecked 334 Tab stops across homepage, library and calculator at mobile/desktop sizes: no fully hidden controls found. |

The homepage HTML, shared CSS and sharing image are unchanged. Shared JavaScript has two targeted keyboard fixes; the homepage design, code, copy, images, referral destination and owner-reported figures remain the same.

## Sequential visitor results

Each visitor starts in an isolated browser context and follows its own recorded steps. The full steps are in the accompanying JSON report.

| # | Simulated visitor | Engine | Result |
| --- | --- | --- | --- |
| 1 | New desktop player checks code and official signup | chromium | Pass |
| 2 | New phone visitor follows onboarding to PC requirements | chromium | Pass |
| 3 | Existing account holder checks the grace period | chromium | Pass |
| 4 | Signed-in RSI visitor understands homepage redirects | chromium | Pass |
| 5 | Prospective buyer searches for game-package help | chromium | Pass |
| 6 | New recruit searches for the 50,000-credit explanation | chromium | Pass |
| 7 | Frustrated visitor searches for a referral that is not working | chromium | Pass |
| 8 | Returning player finds HOTAS setup | chromium | Pass |
| 9 | Phone keyboard user presses Escape while searching | chromium | Pass |
| 10 | Keyboard-only reader uses skip link and native FAQ | chromium | Pass |
| 11 | Small-screen reader at a 320 CSS-pixel viewport | chromium | Pass |
| 12 | Visitor denies clipboard permission | chromium | Pass |
| 13 | Privacy-conscious visitor blocks storage and analytics | chromium | Pass |
| 14 | German-language phone visitor | chromium | Pass |
| 15 | No-JavaScript mobile visitor | chromium | Pass |
| 16 | Crew planner calculates a shared contract | chromium | Pass |
| 17 | Galaxy pilot checks door and staggered-fire guidance | chromium | Pass |
| 18 | Printer user keeps an offline departure list | chromium | Pass |
| 19 | Old bookmark visitor arrives at a 2025 event | chromium | Pass |
| 20 | Visitor opens a mistyped or removed page | chromium | Pass |
| 21 | Fonts fail on a slow phone connection | chromium | Pass |
| 22 | Firefox desktop reader finds and uses a tool | firefox | Pass |
| 23 | WebKit mobile reader finds and uses a tool | webkit | Pass |

WebKit and Firefox checks use those actual browser engines; a mobile viewport is not a claim of testing a physical iPhone. No sign-in, signup submission, payment, support ticket or outbound message was performed.

The first automation run recorded seven failures. Inspection established five visitor failures (three search cases, Escape focus and missing-page recovery) and two harness problems: a heading assertion needed to wait for navigation, and a toast assertion also matched the code output's native status role. Those test assertions were corrected. A later full Tab pass independently exposed the sticky-bar obstruction. Its hit testing was also refined to use the actual fragments of wrapped inline links, avoiding false reports on their empty bounding-box space.

## Whole-site and visual coverage

- 55 routes after adding the recovery page, at 320, 390, 768 and 1440 CSS pixels: **220 checks**, no horizontal-overflow, broken-image or browser-runtime failures.
- Redirects were followed to their canonical destination. The fixed sharing-image artboard was inspected as artwork rather than treated as a normal responsive reading page.
- Full-page desktop/mobile captures were collected for every non-redirect page. Mobile top/middle/bottom contact sheets and all nine homepage regions were visually reviewed, including header, hero, quick facts, signup steps, guides, status, FAQs, closing action and footer.
- Axe 4.14.0 ran 50 WCAG A/AA rule scans across page and theme states: **zero automated violations**. The photo-backed homepage contrast check requires manual review; its hero was visually inspected. This is not a complete accessibility certification or a screen-reader user study.
- The independent signup regression passed 26 desktop/mobile page checks plus clipboard success/failure, official-link interception, analytics event behavior, preference persistence, 11 signup languages at three widths, mobile navigation, archive relocation, no JavaScript, blocked storage, Do Not Track and event expiry.
- Search/calculator regressions passed after the help index expanded. Static validation passes 55 pages and 40 sitemap URLs; the recovery page stays out of the sitemap. Calculator arithmetic checks include 16 rejected input cases.
- Guide/recovery generation is idempotent. No arbitrary review-date refreshes were made.

The final full-route visual sweep was followed by the sticky-bar fix; that behavior was validated separately through the full Tab pass, all visitor journeys and the signup regressions. An earlier sweep interrupted by termination of a separate preview process was discarded and rerun with the test-owned preview runner.

## Public loading baseline

One cold Chromium run per page used a 390×844 viewport, 150 ms added latency, 200,000 bytes/second download throughput, 4× CPU slowdown, disabled cache and Do Not Track. Browser traces and network data were recorded. These are **laboratory samples**, not field Core Web Vitals, INP, a Lighthouse score or a percentile across actual users.

| Public page | LCP | CLS | Assessment |
| --- | --- | --- | --- |
| Homepage | 1.388 s | 0.0612 | Within good LCP/CLS targets in this run |
| guide-library.html | 0.968 s | 0.0515 | Within good LCP/CLS targets in this run |
| new-player-guide.html | 0.812 s | 0.0007 | Within good LCP/CLS targets in this run |
| mission-budget.html | 0.824 s | 0.0009 | Within good LCP/CLS targets in this run |

[Google's Web Vitals guidance](https://web.dev/articles/vitals) defines good LCP as within 2.5 seconds and CLS as no more than 0.1, and describes assessing real-user distributions. The samples did not justify speculative image, font or homepage design changes. INP and real-user percentiles were not measured.

## Research and real official-form check

Core referral, currency, access, hardware and release claims were checked against primary RSI documentation:

- [Referral Program FAQ](https://support.robertsspaceindustries.com/hc/en-us/articles/115013102847-Referral-Program-FAQ): standard reward, 24-hour grace period, existing-code restrictions and the separate recruitment-point qualification.
- [Currencies](https://support.robertsspaceindustries.com/hc/en-us/articles/360006492734-Currencies-of-Star-Citizen-UEC-aUEC-REC-Store-Credit): UEC, aUEC, REC and store credit are separate contexts.
- [System requirements](https://support.robertsspaceindustries.com/hc/en-us/articles/360042417374-Star-Citizen-Minimum-System-Requirements) and [Pledges FAQ](https://support.robertsspaceindustries.com/hc/en-us/articles/115013194987-Pledges-FAQ): requirements and game-package access.
- [RSI developer tracker](https://robertsspaceindustries.com/en/community/devtracker/): the dated LIVE/PTU distinction on the site remains consistent with the checked announcements.

A fresh logged-out browser opened the actual official enlistment URL. It redirected to RSI's English signup page with `referral=STAR-9L66-ZTDY`, returned HTTP 200, and displayed a visible input with that exact code. This confirms visible prefill only; it does not confirm a completed registration, purchase, credit delivery or recruitment conversion.

The outbound crawler probed 47 distinct official RSI URLs. Fourteen returned HTTP 200; 33 returned a bot-protection challenge. A challenge response was **not** classified as a broken link. Core support claims were read through the web research tool. The automated crawl cannot certify every external document's availability to every visitor.

Audit criteria also referenced W3C guidance for [keyboard use](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) and [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Recovery follows [GitHub Pages' custom 404 convention](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site).

## Reproduction and evidence

See README for the test-owned preview runner and checker installation. Principal commands:

```sh
python3 scripts/check-site.py
node scripts/mission-budget-check.cjs
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/run-local-audit.cjs scripts/customer-journey-check.cjs scripts/focus-visibility-check.cjs scripts/discovery-browser-check.cjs scripts/browser-check.cjs
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/run-local-audit.cjs scripts/site-experience-audit.cjs
SC_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/loading-audit.cjs
```

Session artifacts (temporary, outside the repository):

| Evidence | Location |
| --- | --- |
| Final visitor journeys | `/tmp/sc-visitors-after-oxoxLL/report.json` |
| Full-route sweep and screenshots | `/tmp/sc-site-audit-after-VichzC/report.json` |
| Final focus hit tests | `/tmp/sc-focus-check-aykiL5/report.json` |
| Signup and translation regressions | `/tmp/sc-referral-qa-g0SQkO/qa-report.json` |
| Search and budget regressions | `/tmp/sc-discovery-check-UUxWuB` |
| Public loading data and traces | `/tmp/sc-loading-audit-qHzGkh/report.json` |
| Actual official signup read-back | `/tmp/sc-official-signup-audit.json` |
| Official-source HTTP probe | `/tmp/sc-audit-source-links.json` |

The accompanying JSON retains the visitor outcomes and compact measurement summary. No ranking, referral-growth or real-customer satisfaction result is inferred from this audit.
