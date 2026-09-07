"""Turns the raw prontera map PNGs (docs/prontera-export/map-images/, ~135 KB
each, gitignored) into the WebP files the site serves from
public/images/maps/full/. Quality 75 lands around 40 KB for a 512 px terrain
render, a third of the PNG, with no visible loss on a map picture.

Run after scripts/mirror-prontera-maps.mjs:  python scripts/compress-map-images.py
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'docs', 'prontera-export', 'map-images')
OUT = os.path.join(ROOT, 'public', 'images', 'maps', 'full')

index = json.load(open(os.path.join(OUT, '_index.json'), encoding='utf-8'))
codes = sorted({v['prontera'] for v in index.values()})
made = skipped = 0
total = 0
for code in codes:
    src = next((os.path.join(RAW, f'{code}.{e}') for e in ('png', 'gif') if os.path.exists(os.path.join(RAW, f'{code}.{e}'))), None)
    if not src:
        print('missing raw file for', code)
        continue
    dst = os.path.join(OUT, f'{code}.webp')
    if os.path.exists(dst):
        skipped += 1
    else:
        Image.open(src).convert('RGB').save(dst, 'WEBP', quality=75, method=6)
        made += 1
    total += os.path.getsize(dst)
print(f'{len(codes)} maps: wrote {made}, kept {skipped}, {total/1024/1024:.1f} MB total')
