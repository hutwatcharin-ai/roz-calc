"""Illustrations for costumes the fitting room cannot draw (owner, 15 Oct 2026:
"these costumes have no preview").

Most of them are effect costumes -- an aura, falling leaves, a shield of light
around the character. The client draws those with its effect engine, not as a
sprite on the body (their view id is 0), so there is no picture of a
character wearing one to make. What the client does ship for each is its
collection illustration (texture/유저인터페이스/collection/<resource>.bmp),
the picture the game's own item window shows. This puts that picture, at 2x,
where the fitting room would be.

Sources, newest first: the 15 Oct patch (tools/grf-extract.mjs into
D:/Data grf roz/grf-2026-10-15-coll), then the 22 Sep extraction.

Run: python scripts/build-costume-art.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402
from PIL import Image  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = [
    'D:/Data grf roz/grf-2026-10-15-coll/files/data/texture/유저인터페이스/collection',
    'D:/Data grf roz/data_grf_extracted/files/data/texture/유저인터페이스/collection',
]
OUT = os.path.join(ROOT, 'public', 'images', 'costume-art')
MAP = os.path.join(ROOT, 'data', 'costume-art.json')

L = lub.runtime()
lub.load(L, 'D:/RagnarokZero/System/itemInfo_data.lub')
res = {int(k): lub.to_py(v, enc='cp949').get('identifiedResourceName') for k, v in L.globals()[b'tbl_data'].items()}
game = json.load(open(os.path.join(ROOT, 'data', 'game-items.json'), encoding='utf-8'))['items']
fit = json.load(open(os.path.join(ROOT, 'data', 'costume-fit.json'), encoding='utf-8'))['items']

os.makedirs(OUT, exist_ok=True)
items, made, none = {}, set(), 0
for sid, it in game.items():
    if not it.get('costume') or sid in fit:
        continue
    name = res.get(int(sid))
    path = next((os.path.join(d, f'{name}.bmp') for d in DIRS if name and os.path.exists(os.path.join(d, f'{name}.bmp'))), None)
    if not path:
        none += 1
        continue
    key = name.lower()
    if key not in made:
        img = Image.open(path).convert('RGBA')
        # The collection pictures use magenta for "nothing here".
        px = img.load()
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, a = px[x, y]
                if r > 250 and g < 5 and b > 250:
                    px[x, y] = (0, 0, 0, 0)
        img.save(os.path.join(OUT, f'{key}.webp'), lossless=True, method=6)
        made.add(key)
    items[sid] = key
json.dump(
    {
        '_meta': {'what': 'Costume id -> public/images/costume-art/<key>.webp, the client collection illustration, for costumes with no fitting-room sheet (scripts/build-costume-art.py).', 'items': len(items), 'pictures': len(made), 'none': none},
        'items': items,
    },
    open(MAP, 'w', encoding='utf-8'),
    ensure_ascii=False,
    separators=(',', ':'),
)
print('items', len(items), 'pictures', len(made), 'no picture', none)
