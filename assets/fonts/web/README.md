# Web fonts

Served by `app/layout.tsx` through `next/font/local`. All three families are
SIL Open Font License 1.1, taken from the google/fonts repository
(`ofl/sarabun`, `ofl/chakrapetch`, `ofl/ibmplexmono`) and subset with
fontTools on 7 Sep 2026:

- Sarabun 400/500/600/700 and Chakra Petch 600/700: Thai + Latin
  (U+0000-00FF, U+0E01-0E5B, general punctuation, U+25CC dotted circle)
- IBM Plex Mono 400/500/600/700: Latin only (numbers and codes)

Regenerate: download the TTFs, then
`python -m fontTools.subset <file>.ttf --unicodes=<ranges> --flavor=woff2 --layout-features='*' --no-hinting --output-file=<file>.woff2`
