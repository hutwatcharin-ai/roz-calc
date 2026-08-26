# OG image

`public/og-default.png` (1200x630) is rendered from `og-default.html` by headless
Chrome. It is a static file committed to the repo -- nothing generates it at request
time, deliberately: on another project on this same VPS, concurrent request-time OG
generation exhausted a 2 GB box, and a `sharp` fallback to WASM produced 65 covers
with no text on them and no error anywhere.

Regenerate after editing the HTML (adjust the Chrome path for your machine):

    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
      --headless --disable-gpu --hide-scrollbars --window-size=1200,630 \
      --screenshot="$(cygpath -w "$PWD/public/og-default.png")" \
      "file:///$(cygpath -w "$PWD/scripts/og/og-default.html" | sed 's|\|/|g')"

Then OPEN THE PNG AND LOOK AT IT. A correctly-sized file with no text on it is the
exact failure this note exists to prevent, and it does not raise an error.

The counts in the image are written by hand and go stale as data is added. They are
marketing copy on a static image, not a live figure -- update them when they drift
far enough to matter.
