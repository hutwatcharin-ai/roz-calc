"""Contact sheet for the owner's draw-order review: out/dress-up/contact-sheet.png (gitignored).

40 items on the Novice and the Knight (male). Each row: 8 directions standing, then sit (d 1)
and attack1 (d 1, middle frame), for the Novice then the Knight. Drawn with reference.render and
zorder.part_z_of, i.e. exactly the order baked into the exported parts.

Categories (first entries whose sprites exist for both jobs are taken):
  wings (robes not in RobeTopLayer), back items (RobeTopLayer robes), masks, wigs (headgear with a
  TB_Layer_Priority value in the 1xx band), headgear whose TB_Layer_Priority entry carries a
  Direction table (every such table is empty in this client), and headgear from the other bands.
Usage: PYTHONIOENCODING=utf-8 py -3 scripts/dressup/contact_sheet.py
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding='utf-8')
import lub  # noqa: E402
from ro_sprite import Spr, Act  # noqa: E402
from dressup import reference, zorder  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'out', 'dress-up', 'contact-sheet.png')
SPRITE = f'{zorder.GRF}/sprite'
SEX = '남'
JOBS = ('초보자', '기사')
COUNT = 40

# (category, kind, view); kind 'robe' views are RobeNameTable ids, the rest AccNameTable ids.
CANDIDATES = [
    ('wing', 'robe', 1), ('wing', 'robe', 3), ('wing', 'robe', 8), ('wing', 'robe', 10),
    ('wing', 'robe', 24), ('wing', 'robe', 9), ('wing', 'robe', 49), ('wing', 'robe', 55),
    ('wing', 'robe', 17), ('wing', 'robe', 20), ('wing', 'robe', 5),
    ('back', 'robe', 2), ('back', 'robe', 4), ('back', 'robe', 16), ('back', 'robe', 23),
    ('back', 'robe', 61), ('back', 'robe', 68), ('back', 'robe', 194), ('back', 'robe', 62),
    ('back', 'robe', 82), ('back', 'robe', 26), ('back', 'robe', 43), ('back', 'robe', 22),
    ('mask', 'acc_mid', 91), ('mask', 'acc_mid', 78), ('mask', 'acc_mid', 68), ('mask', 'acc_mid', 153),
    ('mask', 'acc_mid', 8),
    ('wig', 'acc_upper', 2517), ('wig', 'acc_upper', 1775), ('wig', 'acc_upper', 1513),
    ('wig', 'acc_upper', 1673), ('wig', 'acc_upper', 1563), ('wig', 'acc_upper', 302),
    ('direction', 'acc_upper', 2082), ('direction', 'acc_upper', 1035), ('direction', 'acc_upper', 100),
    ('direction', 'acc_upper', 2184), ('direction', 'acc_upper', 2664), ('direction', 'acc_upper', 1310),
    ('band', 'acc_lower', 446), ('band', 'acc_upper', 1318), ('band', 'acc_upper', 2279),
    ('band', 'acc_upper', 992), ('band', 'acc_upper', 2276), ('band', 'acc_upper', 1485),
    ('plain', 'acc_upper', 1), ('plain', 'acc_upper', 2),
]
QUOTA = dict(wing=8, back=9, mask=4, wig=6, direction=6, band=6, plain=4)

CELL_W, CELL_H = 140, 160
CROP = (30, 10, 30 + CELL_W, 10 + CELL_H)  # of the 200 x 200 render, feet at (100, 150)
LABEL_W = 230
HEADER_H = 40


def exists(path):
    return os.path.exists(zorder.src(path))


def load(spr, act):
    return Spr(zorder.src(spr)), Act(zorder.src(act))


def names():
    L = zorder.lua()
    err = lub.load(L, zorder.src(f'{zorder.LUA}/datainfo/accname.lub'))
    assert err is None, err
    g = L.globals()
    acc = {int(k): lub.to_py(v) for k, v in g[b'AccNameTable'].items()}
    robe = {int(k): lub.to_py(v) for k, v in g[b'RobeNameTable'].items()}
    prio = lub.to_py(g[b'TB_Layer_Priority'])['Items_List']
    return acc, robe, prio


def item_files(kind, view, job, acc, robe):
    """(spr, act, anchored) for one item on one job, or None when the client has no sprite."""
    if kind == 'robe':
        name = robe.get(view)
        if not name:
            return None
        base = f'{SPRITE}/로브/{name}'
        act = f'{base}/{SEX}/{job}_{SEX}.act'
        if not exists(act):
            return None
        for spr in (f'{base}/{SEX}/{job}_{SEX}.spr', f'{base}/{name}.spr', f'{base}/{name.lower()}.spr'):
            if exists(spr):
                return spr, act, False
        return None
    name = acc.get(view)
    if not name:
        return None
    spr = f'{SPRITE}/악세사리/{SEX}/{SEX}{name}.spr'
    return (spr, spr[:-4] + '.act', True) if exists(spr) and exists(spr[:-4] + '.act') else None


def pick(acc, robe):
    taken, per = [], {}
    for cat, kind, view in CANDIDATES:
        if per.get(cat, 0) >= QUOTA[cat]:
            continue
        files = [item_files(kind, view, j, acc, robe) for j in JOBS]
        if all(files):
            taken.append((cat, kind, view, files))
            per[cat] = per.get(cat, 0) + 1
        else:
            print('skipped (no sprite):', cat, kind, view)
    return taken[:COUNT]


def cells():
    """(action, frame chooser) per column: 8 stand directions, sit d 1, attack1 d 1 middle."""
    out = [(d, lambda n: 0, f'd{d}') for d in range(8)]
    out.append((2 * 8 + 1, lambda n: 0, 'sit'))
    out.append((5 * 8 + 1, lambda n: n // 2, 'atk1'))
    return out


def main():
    acc, robe, prio = names()
    items = pick(acc, robe)
    print(len(items), 'items')
    font_path = 'C:/Windows/Fonts/malgun.ttf'
    font = ImageFont.truetype(font_path, 13) if os.path.exists(font_path) else ImageFont.load_default()
    small = ImageFont.truetype(font_path, 11) if os.path.exists(font_path) else font
    cols = cells()
    width = LABEL_W + len(JOBS) * len(cols) * CELL_W
    sheet = Image.new('RGBA', (width, HEADER_H + len(items) * CELL_H), (236, 236, 228, 255))
    draw = ImageDraw.Draw(sheet)
    for j, job in enumerate(JOBS):
        x0 = LABEL_W + j * len(cols) * CELL_W
        draw.text((x0 + 4, 2), {'초보자': 'Novice (초보자)', '기사': 'Knight (기사)'}[job], fill='black', font=font)
        for c, (_a, _f, label) in enumerate(cols):
            draw.text((x0 + c * CELL_W + 4, 20), label, fill=(60, 60, 60), font=small)
        draw.line([(x0, 0), (x0, sheet.height)], fill=(120, 0, 0), width=2)

    body, head = {}, {}
    for job in JOBS:
        body[job] = load(f'{SPRITE}/인간족/몸통/{SEX}/{job}_{SEX}.spr', f'{SPRITE}/인간족/몸통/{SEX}/{job}_{SEX}.act')
        head[job] = load(f'{SPRITE}/인간족/머리통/{SEX}/1_{SEX}.spr', f'{SPRITE}/인간족/머리통/{SEX}/1_{SEX}.act')

    for r, (cat, kind, view, files) in enumerate(items):
        y0 = HEADER_H + r * CELL_H
        name = robe.get(view) if kind == 'robe' else acc.get(view)
        extra = ''
        if kind == 'robe':
            extra = 'RobeTopLayer' if zorder.is_top_layer(view) else 'not top layer'
        elif view in prio:
            extra = f"TB {prio[view].get('Default')}" + (' +Direction{}' if 'Direction' in prio[view] else '')
        draw.text((4, y0 + 4), f'{r + 1}. {cat}', fill='black', font=font)
        draw.text((4, y0 + 22), f'{kind} {view}', fill='black', font=font)
        draw.text((4, y0 + 40), str(name), fill='black', font=small)
        draw.text((4, y0 + 56), extra, fill=(80, 80, 80), font=small)
        draw.line([(0, y0), (width, y0)], fill=(190, 190, 180))
        for j, job in enumerate(JOBS):
            spr_path, act_path, anchored = files[j]
            item = load(spr_path, act_path)
            parts = [
                (*body[job], False, zorder.part_z_of('body', None, job, SEX)),
                (*head[job], True, zorder.part_z_of('head', None, job, SEX)),
                (*item, anchored, zorder.part_z_of(kind, view, job, SEX)),
            ]
            for c, (action, choose, _label) in enumerate(cols):
                n = len(body[job][1].actions[action])
                f = choose(n)
                pic = reference.render(parts, action, [f, f, f]).crop(CROP)
                x = LABEL_W + (j * len(cols) + c) * CELL_W
                sheet.alpha_composite(pic, (x, y0))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sheet.convert('RGB').save(OUT, optimize=True)
    print(OUT, sheet.size, f'{os.path.getsize(OUT) / 1024:.0f} KB')
    for r, (cat, kind, view, _f) in enumerate(items):
        print(f'{r + 1:2}. {cat:9} {kind:9} {view:5} {robe.get(view) if kind == "robe" else acc.get(view)}')


if __name__ == '__main__':
    main()
