"""Collection illustrations for gear pages (owner, 3 Nov 2026: show the item's
picture as a holo card on its page).

The picture is the one the game's own item window shows: the client's
collection illustration, texture/유저인터페이스/collection/<resource>.bmp,
named by itemInfo_data.lub's identifiedResourceName. Only the rendered WebP
goes into the repo, never the client file. Magenta is the client's "nothing
here", made transparent as in scripts/build-costume-art.py.

Gear only (Armor and Weapon rows of our items table); costumes keep their
fitting room and costume-art.

Sources, newest first: weekly GRF snapshots (D:/Data grf roz/weekly), the
15 Oct collection extract, then the 22 Sep extraction.

Run: python scripts/build-item-art.py
"""
import glob
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402
from PIL import Image  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLL = 'data/texture/유저인터페이스/collection'
DIRS = sorted(glob.glob(f'D:/Data grf roz/weekly/*/added/{COLL}') + glob.glob(f'D:/Data grf roz/weekly/*/changed/{COLL}'), reverse=True) + [
    f'D:/Data grf roz/grf-2026-10-15-coll/files/{COLL}',
    f'D:/Data grf roz/data_grf_extracted/files/{COLL}',
]
OUT = os.path.join(ROOT, 'public', 'images', 'item-art')
MAP = os.path.join(ROOT, 'data', 'item-art.json')


def env():
    out = {}
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if '=' in line and not line.startswith('#'):
            k, v = line.rstrip('\n').split('=', 1)
            out[k.strip()] = v.strip().strip('"')
    return out


def gear_ids():
    e = env()
    ids, offset = [], 0
    while True:
        url = f"{e['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/items?select=id&category=in.(Armor,Weapon)&order=id&offset={offset}&limit=1000"
        req = urllib.request.Request(url, headers={'apikey': e['SUPABASE_SERVICE_ROLE_KEY'], 'Authorization': 'Bearer ' + e['SUPABASE_SERVICE_ROLE_KEY']})
        rows = json.load(urllib.request.urlopen(req))
        ids += [r['id'] for r in rows]
        if len(rows) < 1000:
            return ids
        offset += 1000


def clear_background(img):
    """Magenta anywhere, and the white card the picture sits on, become
    transparent. The white is cleared only where it touches the edge (a flood
    fill), so white inside the item -- a blade, a feather -- stays."""
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 250 and g < 5 and b > 250:
                px[x, y] = (0, 0, 0, 0)

    def pale(p):
        return p[3] == 0 or (p[0] >= 236 and p[1] >= 236 and p[2] >= 236)

    seen = set()
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        if not pale(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return img


def main():
    L = lub.runtime()
    lub.load(L, 'D:/RagnarokZero/System/itemInfo_data.lub')
    res = {int(k): lub.to_py(v, enc='cp949').get('identifiedResourceName') for k, v in L.globals()[b'tbl_data'].items()}
    os.makedirs(OUT, exist_ok=True)
    items, made, none = {}, set(), 0
    for iid in gear_ids():
        name = res.get(iid)
        path = next((os.path.join(d, f'{name}.bmp') for d in DIRS if name and os.path.exists(os.path.join(d, f'{name}.bmp'))), None)
        if not path:
            none += 1
            continue
        # One file per picture, named by the first item that uses it; items
        # sharing a resource share the file.
        key = next((k for k, v in items.items() if v == name), None)
        if key is None:
            img = clear_background(Image.open(path).convert('RGBA'))
            img.save(os.path.join(OUT, f'{iid}.webp'), quality=90, method=6)
            made.add(iid)
        items[str(iid)] = name
    file_of = {}
    for sid, name in items.items():
        file_of.setdefault(name, sid)
    json.dump(
        {
            '_meta': {'what': 'Gear id -> public/images/item-art/<file>.webp, the client collection illustration (scripts/build-item-art.py).', 'items': len(items), 'pictures': len(made), 'none': none},
            'items': {sid: file_of[name] for sid, name in items.items()},
        },
        open(MAP, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'),
    )
    print('items', len(items), 'pictures', len(made), 'no picture', none)


if __name__ == '__main__':
    main()
