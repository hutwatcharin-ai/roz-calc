"""Portraits of the four homunculi and their evolved forms, from the client.

The guide page needs a picture of each one. The client ships them in
sprite/homun/, so the page can show the real creature instead of borrowing a
screenshot from another site. One idle frame each, trimmed to the drawing and
doubled with nearest-neighbour so the pixels stay square.

The "2" files next to these are the same creature drawn for its other state and
are not used here. The evolved forms are the `_h` files.

Usage: python scripts/build-homun-sprites.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from ro_sprite import Spr, Act, draw_layers  # noqa: E402
from PIL import Image  # noqa: E402

SRC = 'D:/data_grf_extracted/files/data/sprite/homun/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'homun')
NAMES = ['lif', 'amistr', 'filir', 'vanilmirth', 'lif_h', 'amistr_h', 'filir_h', 'vanilmirth_h']

# Action 0 is the idle stance; direction 1 faces down-left, the three-quarter
# view the game shows when a homunculus stands beside its owner.
STAND, FACING = 0, 1
CANVAS = (240, 240)
ORIGIN = (120, 170)
SCALE = 2


def portrait(name):
    spr, act = Spr(SRC + name + '.spr'), Act(SRC + name + '.act')
    action = STAND * 8 + FACING
    frames = act.actions[action] if action < len(act.actions) else act.actions[0]
    canvas = Image.new('RGBA', CANVAS)
    draw_layers(canvas, ORIGIN, spr, frames[0])
    box = canvas.getbbox()
    if box is None:
        raise ValueError('nothing drawn')
    cut = canvas.crop(box)
    return cut.resize((cut.width * SCALE, cut.height * SCALE), Image.NEAREST)


os.makedirs(OUT, exist_ok=True)
for name in NAMES:
    img = portrait(name)
    path = os.path.join(OUT, name + '.webp')
    img.save(path, 'WEBP', lossless=True)
    print(f'{name}: {img.width}x{img.height} -> {os.path.relpath(path, os.path.join(OUT, "..", "..", ".."))}')
