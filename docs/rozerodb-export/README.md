# ROZeroDB public data export

This export captures the visible text and metadata from every public page listed in
`https://rozerodb.com/sitemap.xml`, plus all eight public tool routes found in the
site navigation.

Run:

```powershell
node .\rozerodb-export\crawl-rozerodb.mjs
```

Output is written to `rozerodb-export/data/` as one JSONL file per category. Each
line is a standalone JSON object. See `manifest.json` for counts and failures.

The crawler intentionally does not access `/api/`, which is disallowed by the
site's `robots.txt`, and it does not mirror images or executable files.
