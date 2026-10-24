"""Pack one small picture of every headgear look, garment, hair style and hair colour into a single
sheet, so the dress-up picker can show tiles to tap instead of a search box.

Reads the exported parts in out/dress-up/ (scripts/build-dress-up.py) and data/dress-up.json, draws the
first frame of each part's first action facing the viewer, trims it, and fits it in a CELL x CELL square.
Writes out/dress-up/thumb/sheet.<hash8>.webp and data/dress-up-thumbs.json:

    {"v": 1, "cell": 48, "cols": 32, "file": "thumb/sheet.<hash8>.webp",
     "at": {"acc/<view>": n, "robe/<view>": n, "head/<style>-<sex>": n, "colour/<id>-<sex>": n}}

n is the cell index, row-major. Headgear items that share a view share a tile, which is why the picker
shows one tile per look rather than one per item (half the items are a costume and a plain copy of the
same sprite). Run by `npm run dress-up:build` after build-dress-up.py.

Usage: PYTHONIOENCODING=utf-8 py -3 scripts/build-dress-up-thumbs.py
"""
import hashlib
import io
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'dress-up')
INDEX = os.path.join(ROOT, 'data', 'dress-up.json')
THUMBS = os.path.join(ROOT, 'data', 'dress-up-thumbs.json')
CELL = 48
COLS = 32
# The class a garment tile is drawn from when it has a sprite for it: a plain body shape.
ROBE_ORDER = ('novice', 'swordsman', 'acolyte', 'mage', 'archer', 'merchant', 'thief')


def draw(stem):
    """The first frame facing the viewer that draws something, trimmed, or None when none does.
    Some animated headgear starts on an empty frame, so later frames and actions are tried in turn."""
    with open(os.path.join(OUT, stem + '.json'), encoding='utf-8') as f:
        part = json.load(f)
    atlas = Image.open(os.path.join(OUT, stem + '.webp')).convert('RGBA')
    acts = sorted(part['acts'], key=int)
    for act in acts:
        for frame in part['acts'][act]:
            canvas = Image.new('RGBA', (400, 400))
            for x, y, ax, ay, aw, ah, mirror, sx, sy, _rot, *_ in frame[0]:
                if aw <= 0 or ah <= 0:
                    continue
                piece = atlas.crop((ax, ay, ax + aw, ay + ah))
                if mirror:
                    piece = piece.transpose(Image.FLIP_LEFT_RIGHT)
                w, h = max(1, round(aw * abs(sx))), max(1, round(ah * abs(sy)))
                if (w, h) != (aw, ah):
                    piece = piece.resize((w, h), Image.NEAREST)
                canvas.alpha_composite(piece, (200 + x - w // 2, 200 + y - h // 2))
            box = canvas.getbbox()
            if box:
                return canvas.crop(box)
    return None


def fit(img):
    """Centre the picture in a CELL square: pixel-doubled when small, smoothed down when big."""
    side = max(img.size)
    sq = Image.new('RGBA', (side, side))
    sq.alpha_composite(img, ((side - img.width) // 2, (side - img.height) // 2))
    if side <= CELL // 2:
        sq = sq.resize((side * 2, side * 2), Image.NEAREST)
        out = Image.new('RGBA', (CELL, CELL))
        out.alpha_composite(sq, ((CELL - sq.width) // 2, (CELL - sq.height) // 2))
        return out
    return sq.resize((CELL, CELL), Image.NEAREST if side <= CELL else Image.LANCZOS)


def main():
    with open(INDEX, encoding='utf-8') as f:
        full = json.load(f)
    files = full['files']
    want = []  # (thumb key, part key)
    seen = set()
    for it in full['items'].values():
        view = it['view']
        if it['slots'] == ['garment']:
            key = f'robe/{view}'
            cands = [f'robe/{view}-{c}-{s}' for c in ROBE_ORDER for s in ('m', 'f')]
            cands += sorted(k for k in files if k.startswith(f'robe/{view}-'))
        else:
            key = f'acc/{view}'
            cands = [f'acc/{view}-m', f'acc/{view}-f']
        if key in seen:
            continue
        seen.add(key)
        part = next((k for k in cands if k in files), None)
        if part:
            want.append((key, part))
    for sex in ('m', 'f'):
        for n in range(1, full['hair']['styles'] + 1):
            if f'head/{n}-{sex}-0' in files:
                want.append((f'head/{n}-{sex}', f'head/{n}-{sex}-0'))
        for c in full['hair']['colours']:
            if f'head/1-{sex}-{c["id"]}' in files:
                want.append((f'colour/{c["id"]}-{sex}', f'head/1-{sex}-{c["id"]}'))

    cells, at = [], {}
    for key, part in want:
        img = draw(files[part])
        if img is None:
            continue
        at[key] = len(cells)
        cells.append(fit(img))
    rows = (len(cells) + COLS - 1) // COLS
    sheet = Image.new('RGBA', (COLS * CELL, rows * CELL))
    for i, c in enumerate(cells):
        sheet.alpha_composite(c, ((i % COLS) * CELL, (i // COLS) * CELL))
    # 256 colours, then lossless: 256 KB instead of 585 KB for the full-colour sheet, and pixel art
    # keeps its hard edges (lossy WebP smears them and is bigger at a quality that hides it).
    sheet = sheet.quantize(256, method=Image.Quantize.FASTOCTREE).convert('RGBA')
    buf = io.BytesIO()
    sheet.save(buf, 'WEBP', lossless=True, method=6)
    data = buf.getvalue()
    name = f'thumb/sheet.{hashlib.sha256(data).hexdigest()[:8]}.webp'
    os.makedirs(os.path.join(OUT, 'thumb'), exist_ok=True)
    for old in os.listdir(os.path.join(OUT, 'thumb')):
        if f'thumb/{old}' != name:
            os.remove(os.path.join(OUT, 'thumb', old))
    with open(os.path.join(OUT, name), 'wb') as f:
        f.write(data)
    with open(THUMBS, 'w', encoding='utf-8') as f:
        json.dump({'v': 1, 'cell': CELL, 'cols': COLS, 'file': name, 'at': at}, f, separators=(',', ':'))
    print(f'{len(cells)} tiles, sheet {sheet.width}x{sheet.height} {len(data) / 1024:.0f} KB -> {name}')


if __name__ == '__main__':
    main()
