# Web fonts

Served by `app/layout.tsx` through `next/font/local`. All three families are
SIL Open Font License 1.1, taken from the google/fonts repository
(`ofl/sarabun`, `ofl/chakrapetch`, `ofl/ibmplexmono`) and subset with
fontTools on 7 Sep 2026:

- Sarabun 400/600/700 and Chakra Petch 700: Thai + Latin
  (U+0000-00FF, U+0E01-0E5B, general punctuation, U+25CC dotted circle)
- IBM Plex Mono 400/700: Latin only (numbers and codes)

Six files, 93 kB in all. It was ten until 23 Sep 2026: every page preloads
every weight, so Sarabun 500, Chakra Petch 600 and IBM Plex Mono 500/600 cost
56 kB on every first view for weights the design barely used. The rules that
asked for them now ask for a weight that ships -- keep it that way, and refer
to the families through the `--font-*` variables, never by name (a plain
"Sarabun" in CSS matches nothing: next/font gives them hashed names).

Regenerate: download the TTFs, then
`python -m fontTools.subset <file>.ttf --unicodes=<ranges> --flavor=woff2 --layout-features='*' --no-hinting --output-file=<file>.woff2`
