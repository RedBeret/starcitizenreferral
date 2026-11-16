# Star Citizen Referrals

An independent static field guide by PatchOps. The single referral code is
`STAR-9L66-ZTDY`; signup links open official RSI with that code attached.

## Run locally

```sh
python3 -m http.server 4173
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
