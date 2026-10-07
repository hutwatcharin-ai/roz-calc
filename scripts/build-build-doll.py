"""The build simulator's character, with the headgear the build wears.

Owner, 7 Oct 2026: a hat put on in /tools/build should show on the character
in the equip window. Drawing every class with every hat ahead of time would
be thousands of pictures, so the two are drawn apart and stacked on the page,
the way the game itself stacks them:

  body   one picture per class and sex: the class body with the default head,
         standing, facing front, on a 200x200 canvas whose feet are at
         (100, 150); plus where the body's anchor is (the point the head and
         every headgear hang from)
  hat    one picture per headgear view id and sex, cropped, with its offset
         from that anchor

The page puts a hat at body anchor + hat offset, which is what the client
does (scripts/build-costume-fit.py draws the same way, on the Novice only).
Reads the extracted client sprites, as build-costume-fit.py does.

Usage: python scripts/build-build-doll.py
"""
import functools
import json
import os
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
OUT = os.path.join(ROOT, 'public', 'images', 'build-doll')
MAP = os.path.join(ROOT, 'data', 'build-doll.json')

SEXES = {'m': '남', 'f': '여'}
ORIGIN = (100, 150)
HAT_ORIGIN = (100, 100)
# Class slug -> body sprite name.
BODY = {
    'novice': '초보자', 'swordsman': '검사', 'mage': '마법사', 'archer': '궁수', 'acolyte': '성직자', 'merchant': '상인',
    'thief': '도둑', 'knight': '기사', 'priest': '프리스트', 'wizard': '위저드', 'blacksmith': '제철공', 'hunter': '헌터',
    'assassin': '어세신', 'crusader': '크루세이더', 'monk': '몽크', 'sage': '세이지', 'rogue': '로그', 'alchemist': '연금술사',
    'bard': '바드', 'dancer': '무희',
}

L = lub.runtime()
lub.load(L, os.path.join(SYSTEM, 'itemInfo_data.lub'))
class_num = {int(k): lub.to_py(v).get('ClassNum') for k, v in L.globals()[b'tbl_data'].items()}
L2 = lub.runtime()
for f in ('accessoryid.lub', 'accname.lub'):
    err = lub.load(L2, f'{LUA}/datainfo/{f}')
    assert err is None, (f, err)
acc_name = {int(k): lub.to_py(v) for k, v in L2.globals()[b'AccNameTable'].items()}


@functools.lru_cache(maxsize=None)
def part(path):
    return Spr(path + '.spr'), Act(path + '.act')


def first(a):
    """Standing, facing front."""
    return a.actions[0][0]


def body(cls, sex):
    s = SEXES[sex]
    path = f'{SPRITE}/인간족/몸통/{s}/{BODY[cls]}_{s}'
    if not os.path.exists(path + '.spr'):
        return None
    b = part(path)
    h = part(f'{SPRITE}/인간족/머리통/{s}/1_{s}')
    bf = first(b[1])
    hf = first(h[1])
    canvas = Image.new('RGBA', (200, 200))
    draw_layers(canvas, ORIGIN, b[0], bf)
    if bf['anchors'] and hf['anchors']:
        shift = (bf['anchors'][0][0] - hf['anchors'][0][0], bf['anchors'][0][1] - hf['anchors'][0][1])
        draw_layers(canvas, ORIGIN, h[0], hf, shift)
    anchor = bf['anchors'][0][:2] if bf['anchors'] else (0, -70)
    return canvas, anchor


def hat(view, sex):
    name = acc_name.get(view)
    s = SEXES[sex]
    path = f'{SPRITE}/악세사리/{s}/{s}{name}' if name else None
    if not path or not os.path.exists(path + '.spr') or not os.path.exists(path + '.act'):
        return None
    sp, ac = part(path)
    f = first(ac)
    shift = (-f['anchors'][0][0], -f['anchors'][0][1]) if f['anchors'] else (0, 0)
    canvas = Image.new('RGBA', (200, 200))
    draw_layers(canvas, HAT_ORIGIN, sp, f, shift)
    box = canvas.getbbox()
    if not box:
        return None
    return canvas.crop(box), (box[0] - HAT_ORIGIN[0], box[1] - HAT_ORIGIN[1])


def main():
    os.makedirs(OUT, exist_ok=True)
    gear = json.load(open(os.path.join(ROOT, 'data', 'build-gear.json'), encoding='utf-8'))['gear']
    bodies = {}
    for cls in BODY:
        for sex in SEXES:
            got = body(cls, sex)
            if not got:
                continue
            img, (ax, ay) = got
            img.save(os.path.join(OUT, f'body-{cls}-{sex}.webp'), lossless=True, method=6)
            bodies[f'{cls}-{sex}'] = [ORIGIN[0] + ax, ORIGIN[1] + ay]
    hats, views, missing = {}, {}, 0
    for sid, g in gear.items():
        if not any(s.startswith('head_') for s in g['on']):
            continue
        view = class_num.get(int(sid))
        if not view:
            missing += 1
            continue
        key = f'v{view}'
        if key not in views:
            entry = {}
            for sex in SEXES:
                got = hat(view, sex)
                if not got:
                    continue
                img, (x, y) = got
                img.save(os.path.join(OUT, f'hat-{view}-{sex}.webp'), lossless=True, method=6)
                entry[sex] = [x, y, img.width, img.height]
            views[key] = entry
        if views[key]:
            hats[sid] = key
        else:
            missing += 1
    json.dump(
        {
            '_meta': {
                'what': 'Build simulator paper doll (scripts/build-build-doll.py): body pictures per class-sex with the '
                        'anchor the headgear hangs from (canvas 200x200, feet at 100,150), and headgear pictures per view '
                        'id and sex with their offset from that anchor [x, y, w, h].',
                'source': 'RO Zero Global client sprites',
                'hats': len(hats),
                'missing': missing,
            },
            'bodies': bodies,
            'views': {k: v for k, v in views.items() if v},
            'hats': hats,
        },
        open(MAP, 'w', encoding='utf-8'),
        ensure_ascii=False,
        separators=(',', ':'),
    )
    print(len(bodies), 'bodies,', len(hats), 'head items drawn,', missing, 'without a sprite')


main()
