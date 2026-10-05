"""Every item icon in one sheet, for the screenshot reader on /admin/prices.

The NPC sell window draws each item's 24x24 inventory icon; the reader names
a row by matching that icon against these (components/SellShotReader). One
sheet instead of four thousand requests: a grid of 24x24 cells in the order of
the ids file next to it.

Usage: python scripts/build-sell-icon-atlas.py
"""
import glob
import json
import math
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public', 'images', 'items')
OUT = os.path.join(ROOT, 'public', 'admin-data')
CELL = 24

icons = {}
for path in glob.glob(os.path.join(SRC, '*')):
    stem = os.path.splitext(os.path.basename(path))[0]
    if not stem.isdigit():
        continue
    try:
        im = Image.open(path).convert('RGBA')
    except Exception:
        continue
    if im.size != (CELL, CELL):
        # Only true 24px inventory icons can match the game's; a resized
        # picture would never be pixel-equal and only adds false candidates.
        continue
    # Some ids have both a .gif and a .png; one is enough.
    icons.setdefault(int(stem), im)
icons = sorted(icons.items(), key=lambda kv: kv[0])

cols = math.ceil(math.sqrt(len(icons)))
rows = math.ceil(len(icons) / cols)
sheet = Image.new('RGBA', (cols * CELL, rows * CELL))
for i, (_, im) in enumerate(icons):
    sheet.paste(im, ((i % cols) * CELL, (i // cols) * CELL))
os.makedirs(OUT, exist_ok=True)
sheet.save(os.path.join(OUT, 'icon-atlas.png'), optimize=True)
json.dump({'cell': CELL, 'cols': cols, 'ids': [i for i, _ in icons]}, open(os.path.join(OUT, 'icon-atlas.json'), 'w'))
print(len(icons), 'icons', f'{cols}x{rows}', os.path.getsize(os.path.join(OUT, 'icon-atlas.png')) // 1024, 'KB')
