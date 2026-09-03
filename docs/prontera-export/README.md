# prontera.info + rozeroguide export

Crawled 3 Sep 2026 per user request, to research the Random Options / Affix
system (rozerodb's own affix page doesn't document which weapon types belong
to its "Melee/Magic/Ranged Series" groupings -- prontera.info's
/random-options page states Melee and Ranged pools are identical, which
narrows the real distinction to physical-ATK vs magic-MATK weapons).

- `crawl-prontera.mjs` -- crawls every URL in roz.prontera.info's sitemaps
  (robots.txt allows everything except /api/, matching the posture already
  used for docs/rozerodb-export). List/detail pages are a Nuxt 3 SSR app:
  real data ships inside a `<script id="__NUXT_DATA__">` payload (Nuxt's
  "devalue" flattened-array format, not plain JSON) alongside the visible
  text. Each JSONL record keeps both the cleaned text AND the raw
  `nuxt_data` string -- turning that into structured fields needs a
  page-type-specific parser, not written yet.
- `data/googlesites-rozeroguide.jsonl` -- the community guide at
  sites.google.com/view/rozeroguide (client-rendered SPA; both routes serve
  the same bundle, so one record covers the whole guide's text).

Nothing here has been imported into the site or cross-checked yet -- this is
raw capture only, same sequencing as the rozerodb crawl (grab everything
first, write targeted import/compare scripts per data type later, when there
is an actual feature that needs it).
