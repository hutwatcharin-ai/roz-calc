"""Knight Poring sprites for /news/guild-hall-of-fame-s1, from the 15 Oct 2026
client (read with tools/grf-extract.mjs into D:/Data grf roz/grf-2026-10-15-knight).

Colour to name, by the quest's own pairing of each Knight with a flame and a
shield (red Passion = Poring, blue Calm = Pouring, green Embrace = Poporing,
yellow Wisdom = Drops) and the gold one as Golden Knight.

Run: python scripts/build-guild-knight-images.py
"""
import os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from ro_sprite import Spr, Act, render

SRC = r'D:\Data grf roz\grf-2026-10-15-knight\files\data\sprite\몬스터'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'events', 'guild-s1')
os.makedirs(OUT, exist_ok=True)

for colour in ('red', 'blue', 'green', 'yellow', 'gold'):
    base = os.path.join(SRC, f'knight_poring_{colour}')
    img = render([(Spr(base + '.spr'), Act(base + '.act'), False)], 0, 0, size=(400, 400), origin=(200, 300))
    box = img.getbbox()
    img = img.crop(box) if box else img
    img = img.resize((img.width * 2, img.height * 2), Image.NEAREST)
    img.save(os.path.join(OUT, f'knight-{colour}.png'))
    print('wrote', colour, img.size)
