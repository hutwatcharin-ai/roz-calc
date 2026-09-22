"""Fills the card art ratemyserver could not, from the game client itself.

data/card-art.json lists the cards whose art the site serves (290 of 315 on
9 Sep 2026, from ratemyserver). The client's data.grf carries every card's
illustration: num2cardillustnametable.txt maps a card id to a file name
(CP949, Korean), and texture/유저인터페이스/cardbmp/<name>.bmp is the art.

Only cards listed as withoutArt are filled; art already served is left alone.
Output matches scripts/compress-card-art.py exactly: 150x200 and 60x80 WebP.

Run: python scripts/card-art-from-client.py [path-to-grf-data]
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = sys.argv[1] if len(sys.argv) > 1 else r'D:\data_grf_extracted\files\data'
TABLE = os.path.join(DATA, 'num2cardillustnametable.txt')
BMP = os.path.join(DATA, 'texture', '유저인터페이스', 'cardbmp')
OUT = os.path.join(ROOT, 'public', 'images', 'cards')
THUMB = os.path.join(OUT, 'thumb')
MANIFEST = os.path.join(ROOT, 'data', 'card-art.json')
FULL_SIZE = (150, 200)
THUMB_SIZE = (60, 80)

illust = {}
with open(TABLE, 'rb') as f:
    for raw in f.read().decode('cp949', 'replace').splitlines():
        parts = raw.split('#')
        if len(parts) >= 2 and parts[0].strip().isdigit():
            illust[int(parts[0])] = parts[1].strip()

# The client reuses art too: Picky Poring (4545) points at Poring's file, and
# placeholder cards point at "sorry". Either would show one card's picture
# for another, which card-art.test.ts exists to forbid -- so a file name that
# more than one card uses, or the placeholder, does not count as art.
uses = {}
for name in illust.values():
    uses[name.lower()] = uses.get(name.lower(), 0) + 1

bmp_by_lower = {name.lower(): name for name in os.listdir(BMP)}
manifest = json.load(open(MANIFEST, encoding='utf-8'))
filled, missing = [], []
# withoutArt maps a card id (string key) to why it has no art.
for key in list(manifest['withoutArt']):
    card_id = int(key)
    name = illust.get(card_id)
    shared = not name or name.lower() == 'sorry' or uses[name.lower()] > 1
    file = None if shared else bmp_by_lower.get(f'{name}.bmp'.lower())
    if not file:
        missing.append(key)
        continue
    image = Image.open(os.path.join(BMP, file)).convert('RGB')
    image.resize(FULL_SIZE, Image.LANCZOS).save(os.path.join(OUT, f'{card_id}.webp'), 'WEBP', quality=82, method=6)
    image.resize(THUMB_SIZE, Image.LANCZOS).save(os.path.join(THUMB, f'{card_id}.webp'), 'WEBP', quality=82, method=6)
    filled.append(card_id)
    del manifest['withoutArt'][key]

manifest['withArt'] = sorted(set(manifest['withArt']) | set(filled))
manifest['_meta']['withArt'] = len(manifest['withArt'])
manifest['_meta']['withoutArt'] = len(manifest['withoutArt'])
manifest['_meta']['clientFilled'] = sorted(filled)
manifest['_meta']['clientSource'] = 'game client data.grf cardbmp via num2cardillustnametable.txt, 22 Sep 2026'
json.dump(manifest, open(MANIFEST, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'filled {len(filled)} from the client, still without art: {missing}')
