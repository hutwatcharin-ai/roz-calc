"""Pictures of a Novice wearing each costume, out of the client's own sprites.

The costume pages showed only the inventory icon, which says little about how
a hat looks on a character (owner, 2 Oct 2026: "a preview, not a simulator").
Every picture is drawn here once, ahead of time; the page only picks which one
to show.

For each costume:
  itemInfo_data.lub   item id   -> ClassNum (the view id)
  accname.lub         view id   -> sprite name for headgear, under 악세사리/
  spriterobename.lub  view id   -> folder name for garments, under 로브/

and the costume is drawn on the Novice body and the default head, facing
front, three-quarter and back, male and female. Bound copies share their
twin's view id, so a picture is made once per view id, not per item.

One sheet per view id, 3 columns (front, diag, back) by 2 rows (male, female),
every cell the same size, at 1x; the page scales it with pixelated rendering.
Headgear also gets a head close-up sheet in the same layout.

Usage: python scripts/build-costume-fit.py
"""
import functools
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.stdout.reconfigure(encoding='utf-8')
import lub  # noqa: E402
from ro_sprite import Spr, Act, draw_layers  # noqa: E402
from PIL import Image  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYSTEM = 'D:/RagnarokZero/System'
GRF = 'D:/Data grf roz/data_grf_extracted/files/data'
SPRITE = f'{GRF}/sprite'
LUA = f'{GRF}/luafiles514/lua files'
OUT = os.path.join(ROOT, 'public', 'images', 'costume-fit')
MAP = os.path.join(ROOT, 'data', 'costume-fit.json')

DIRS = (0, 1, 4)  # front, three-quarter, back
SEXES = ('남', '여')  # male, female
HEAD = 40  # head close-up cell, px at 1x

L = lub.runtime()
lub.load(L, os.path.join(SYSTEM, 'itemInfo_data.lub'))
class_num = {int(k): lub.to_py(v).get('ClassNum') for k, v in L.globals()[b'tbl_data'].items()}
L2 = lub.runtime()
for f in ('accessoryid.lub', 'accname.lub', 'spriterobeid.lub', 'spriterobename.lub'):
    err = lub.load(L2, f'{LUA}/datainfo/{f}')
    assert err is None, (f, err)
g = L2.globals()
acc_name = {int(k): lub.to_py(v) for k, v in g[b'AccNameTable'].items()}
robe_name = {int(k): lub.to_py(v) for k, v in g[b'RobeNameTable'].items()}

game = json.load(open(os.path.join(ROOT, 'data', 'game-items.json'), encoding='utf-8'))['items']


@functools.lru_cache(maxsize=None)
def spr(path):
    return Spr(path)


@functools.lru_cache(maxsize=None)
def act(path):
    return Act(path)


def frame(a, action):
    frames = a.actions[action] if action < len(a.actions) else a.actions[0]
    return frames[0]


def robe_files(name, sex):
    """A garment's own .spr per job, or one shared .spr at the folder root
    with only the .act per job (Wings_Of_Raguel and 25 others)."""
    base = f'{SPRITE}/로브/{name}'
    own = f'{base}/{sex}/초보자_{sex}'
    if os.path.exists(own + '.spr') and os.path.exists(own + '.act'):
        return own + '.spr', own + '.act'
    shared = f'{base}/{name.lower()}.spr'
    if os.path.exists(shared) and os.path.exists(own + '.act'):
        return shared, own + '.act'
    return None


def draw(sex, direction, acc=None, robe=None):
    body = (spr(f'{SPRITE}/인간족/몸통/{sex}/초보자_{sex}.spr'), act(f'{SPRITE}/인간족/몸통/{sex}/초보자_{sex}.act'))
    head = (spr(f'{SPRITE}/인간족/머리통/{sex}/1_{sex}.spr'), act(f'{SPRITE}/인간족/머리통/{sex}/1_{sex}.act'))
    canvas = Image.new('RGBA', (200, 200))
    origin = (100, 150)
    bf = frame(body[1], direction)

    def put(part, anchored):
        s, a = part
        f = frame(a, direction)
        shift = (0, 0)
        if anchored and bf['anchors'] and f['anchors']:
            shift = (bf['anchors'][0][0] - f['anchors'][0][0], bf['anchors'][0][1] - f['anchors'][0][1])
        draw_layers(canvas, origin, s, f, shift)

    # A garment hangs behind the body seen from the front, over it from behind.
    back = direction in (2, 3, 4, 5)
    if robe and not back:
        put(robe, False)
    put(body, False)
    put(head, True)
    if acc:
        put(acc, True)
    if robe and back:
        put(robe, False)
    return canvas


def position(desc):
    text = ' '.join(desc)
    if 'Garment' in text:
        return 'garment'
    if re.search(r'Upper|Middle|Lower', text):
        return 'head'
    return None


def main():
    os.makedirs(OUT, exist_ok=True)
    items, sheets, skipped = {}, {}, {'no_view': 0, 'no_sprite': 0, 'no_position': 0}
    naked = {(sex, d): draw(sex, d).getbbox() for sex in SEXES for d in DIRS}
    for sid, it in sorted(game.items(), key=lambda kv: int(kv[0])):
        if not it.get('costume'):
            continue
        kind = position(it['desc'])
        if not kind:
            skipped['no_position'] += 1
            continue
        view = class_num.get(int(sid))
        if not view:
            skipped['no_view'] += 1
            continue
        key = f'{"r" if kind == "garment" else "a"}{view}'
        if key in sheets:
            items[sid] = key
            continue
        parts = {}
        for sex in SEXES:
            if kind == 'garment':
                files = robe_name.get(view) and robe_files(robe_name[view], sex)
                if not files:
                    break
                parts[sex] = dict(robe=(spr(files[0]), act(files[1])))
            else:
                name = acc_name.get(view)
                base = f'{SPRITE}/악세사리/{sex}/{sex}{name}' if name else None
                if not base or not (os.path.exists(base + '.spr') and os.path.exists(base + '.act')):
                    break
                parts[sex] = dict(acc=(spr(base + '.spr'), act(base + '.act')))
        if len(parts) != len(SEXES):
            skipped['no_sprite'] += 1
            continue
        try:
            views = {(sex, d): draw(sex, d, **parts[sex]) for sex in SEXES for d in DIRS}
        except Exception as e:  # a malformed sprite skips one costume, not the run
            print('render failed', sid, it['name'], e)
            skipped['no_sprite'] += 1
            continue
        boxes = [v.getbbox() for v in views.values() if v.getbbox()]
        x0 = min(b[0] for b in boxes) - 3
        y0 = min(b[1] for b in boxes) - 3
        x1 = max(b[2] for b in boxes) + 3
        y1 = max(b[3] for b in boxes) + 3
        w, h = x1 - x0, y1 - y0
        sheet = Image.new('RGBA', (w * 3, h * 2))
        for r, sex in enumerate(SEXES):
            for c, d in enumerate(DIRS):
                sheet.alpha_composite(views[(sex, d)].crop((x0, y0, x1, y1)), (c * w, r * h))
        sheet.save(os.path.join(OUT, f'{key}.webp'), lossless=True, method=6)
        entry = {'w': w, 'h': h, 'garment': kind == 'garment'}
        if kind == 'head':
            hs = Image.new('RGBA', (HEAD * 3, HEAD * 2))
            for r, sex in enumerate(SEXES):
                for c, d in enumerate(DIRS):
                    nb = naked[(sex, d)]
                    cx, hy = (nb[0] + nb[2]) // 2, nb[1]
                    hs.alpha_composite(views[(sex, d)].crop((cx - HEAD // 2, hy - 8, cx + HEAD // 2, hy - 8 + HEAD)), (c * HEAD, r * HEAD))
            hs.save(os.path.join(OUT, f'{key}-head.webp'), lossless=True, method=6)
            entry['head'] = HEAD
        sheets[key] = entry
        items[sid] = key
    json.dump(
        {
            '_meta': {
                'what': 'Costume item id -> sheet in public/images/costume-fit (scripts/build-costume-fit.py). '
                        'Sheet: columns front, three-quarter, back; rows male, female; cell w x h at 1x.',
                'source': 'RO Zero Global client sprites (Novice body, head 1)',
                'items': len(items),
                'sheets': len(sheets),
                'skipped': skipped,
            },
            'items': items,
            'sheets': sheets,
        },
        open(MAP, 'w', encoding='utf-8'),
        ensure_ascii=False,
        separators=(',', ':'),
    )
    print('items', len(items), 'sheets', len(sheets), 'skipped', skipped)


main()
