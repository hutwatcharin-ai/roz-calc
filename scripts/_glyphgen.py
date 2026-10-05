"""One-off: learn the sell window's digit bitmaps and title anchor from the
three labelled screenshots of 5 Oct 2026, and check a right-to-left parse."""
import sys, json
import numpy as np
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

TRUTH = {
    'screenOdin004.jpg': ['0', '0', '125->155', '13->16', '109->135', '279->346', '161->199', '69->85'],
    'screenOdin005.jpg': ['161->199', '69->85', '97->120', '154->191', '0', '3', '15->18', None],
    'screenOdin006.jpg': ['154->191', '0', '3', '15->18', '73->91', None, None, None],
}
DARK = 110


def load(n):
    return np.asarray(Image.open('D:/RagnarokZero/ScreenShot/' + n).convert('L')).astype(np.int16)


def segments(mask):
    cols = mask.any(axis=0)
    out, x = [], 0
    while x < len(cols):
        if cols[x]:
            s = x
            while x < len(cols) and cols[x]:
                x += 1
            out.append((s, x))
        else:
            x += 1
    return out


def price_glyphs(img, y, x0=150, x1=266):
    mask = img[y:y + 9, x0:x1] < DARK
    segs = segments(mask)
    # keep the rightmost run: stop at the first gap of 8+ px from the right
    keep = []
    for s, e in reversed(segs):
        if keep and keep[-1][0] - e >= 8:
            break
        keep.append((s, e))
    keep.reverse()
    return [mask[:, s:e] for s, e in keep]


def code(bm):
    return '.'.join(''.join('1' if v else '0' for v in row) for row in bm)


tpl = {}
for shot, rows in TRUTH.items():
    img = load(shot)
    for k, t in enumerate(rows):
        if t is None:
            continue
        gs = price_glyphs(img, 149 + 32 * k)
        chars = list(t.replace('->', '->')) + ['Z']
        if len(gs) != len(chars):
            print('MISMATCH', shot, k, t, len(gs), len(chars))
            continue
        for c, g in zip(chars, gs):
            tpl.setdefault(c, set()).add(code(g))

for c in sorted(tpl):
    print(c, len(tpl[c]))
print(json.dumps({c: sorted(v) for c, v in tpl.items()}))

# title anchor: the dark pixels of the window title
img = load('screenOdin004.jpg')
title = img[126:139, 30:95] < DARK
ys, xs = title.nonzero()
print('title box', ys.min() + 126, ys.max() + 126, xs.min() + 30, xs.max() + 30)
t = title[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
print('TITLE', t.shape, code(t))
