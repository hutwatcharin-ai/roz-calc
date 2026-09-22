"""Frame strips for the home page's arcade fight, from the game client's own
sprites (owner, 22 Sep 2026: "the real sword swing").

One round is 36 frames of 100 ms:
  fighter  0-11 ready stance (x2), 12-20 sword attack, 21-29 sword attack,
           30-35 ready stance
  monster  0-11 walk in, 12-16 stand, 17-19 hurt (first hit lands at frame
           17), 20-25 stand, 26-27 hurt (the critical, frame 26), 28-35 die
The monsters take a round each, so their strip is three rounds long.

Writes public/images/arcade/{fighter,monsters}.webp and prints the frame
size and where the feet sit, which app/globals.css uses.

Usage: python scripts/build-arcade-sprites.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from ro_sprite import Spr, Act, draw_layers  # noqa: E402
from PIL import Image  # noqa: E402

DATA = 'D:/data_grf_extracted/files/data/sprite/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'arcade')
HUMAN = DATA + '인간족/'
MOB = DATA + '몬스터/'
CANVAS = (240, 200)
FEET = (120, 160)

# Player actions come in groups of eight directions; 7 faces down-right,
# into the monsters. Monsters face 1, down-left, back at the fighter.
READY, ATTACK = 4, 10
WALK, HURT, DIE = 1, 3, 4
FIGHTER_DIR, MOB_DIR = 7, 1


def load(path):
    return Spr(path + '.spr'), Act(path + '.act')


def solid(frame):
    # Death splashes grow a see-through puddle drawn with blending the
    # page cannot copy; the pieces alone read fine.
    return dict(frame, layers=[l for l in frame['layers'] if l['color'][3] == 255])


def draw(parts, action, index):
    canvas = Image.new('RGBA', CANVAS)
    body_act = parts[0][1]
    body_frames = body_act.actions[action]
    body_frame = body_frames[index % len(body_frames)]
    for spr, act, uses_anchor in parts:
        frames = act.actions[action]
        frame = solid(frames[index % len(frames)])
        shift = (0, 0)
        if uses_anchor and body_frame['anchors'] and frame['anchors']:
            shift = (body_frame['anchors'][0][0] - frame['anchors'][0][0], body_frame['anchors'][0][1] - frame['anchors'][0][1])
        draw_layers(canvas, FEET, spr, frame, shift)
    return canvas


def fighter_frames():
    parts = [
        (*load(HUMAN + '몸통/남/검사_남'), False),
        (*load(HUMAN + '머리통/남/2_남'), True),
        (*load(HUMAN + '검사/검사_남_검'), False),
        (*load(HUMAN + '검사/검사_남_검_검광'), False),
    ]
    ready = READY * 8 + FIGHTER_DIR
    attack = ATTACK * 8 + FIGHTER_DIR
    seq = [(ready, i) for i in range(12)] + [(attack, i) for i in range(9)] * 2 + [(ready, i) for i in range(6)]
    return [draw(parts, a, i) for a, i in seq]


def monster_frames(name):
    parts = [(*load(MOB + name), False)]
    act = parts[0][1]
    walk, hurt, die = WALK * 8 + MOB_DIR, HURT * 8 + MOB_DIR, DIE * 8 + MOB_DIR
    stand = 0 * 8 + MOB_DIR
    n_die = len(act.actions[die])
    seq = ([(walk, i) for i in range(12)] + [(stand, i) for i in range(5)] + [(hurt, i) for i in range(3)]
           + [(stand, i) for i in range(6)] + [(hurt, i) for i in range(2)]
           + [(die, min(i, n_die - 1)) for i in range(8)])
    return [draw(parts, a, i) for a, i in seq]


def strip(frames, path):
    # One crop box for every frame, so the feet stay put from frame to frame.
    box = None
    for f in frames:
        b = f.getbbox()
        if b:
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    w, h = box[2] - box[0], box[3] - box[1]
    sheet = Image.new('RGBA', (w * len(frames), h))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f.crop(box), (i * w, 0))
    sheet.save(path, lossless=True, method=6, quality=100)
    print(os.path.basename(path), 'frame', w, 'x', h, 'frames', len(frames),
          'feet at', FEET[0] - box[0], FEET[1] - box[1], 'bytes', os.path.getsize(path))


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    strip(fighter_frames(), os.path.join(OUT, 'fighter.webp'))
    mobs = []
    for name in ('poring', 'lunatic', 'drops'):
        mobs += monster_frames(name)
    strip(mobs, os.path.join(OUT, 'monsters.webp'))
