"""Pictures of a Novice wearing each costume -- and each ordinary headgear --
out of the client's own sprites.

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

29 Oct 2026 (owner: "a preview for every hat, the ordinary ones too"):
non-costume headgear (type Headgear, an Upper/Middle/Lower position) gets the
same sheet. Ordinary garments are left out: the game draws no robe for them.

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
# Newer copies first: every GrfDiffTool snapshot, newest first
# (scripts/grf_snapshots.py), then the 15 Oct 2026 sprite extraction. A file
# there wins over the 22 Sep extraction.
from grf_snapshots import weekly_roots  # noqa: E402
NEWER = (*weekly_roots(), 'D:/Data grf roz/grf-2026-10-15-sprites/files/data')
SPRITE = f'{GRF}/sprite'
LUA = f'{GRF}/luafiles514/lua files'


def src(path):
    """The newest copy of a client file: the latest snapshot's, else the 22 Sep one."""
    if path.startswith(GRF):
        for root in NEWER:
            newer = root + path[len(GRF):]
            if os.path.exists(newer):
                return newer
    return path


def exists(path):
    return os.path.exists(src(path))
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
    err = lub.load(L2, src(f'{LUA}/datainfo/{f}'))
    assert err is None, (f, err)
g = L2.globals()
acc_name = {int(k): lub.to_py(v) for k, v in g[b'AccNameTable'].items()}
robe_name = {int(k): lub.to_py(v) for k, v in g[b'RobeNameTable'].items()}

game = json.load(open(os.path.join(ROOT, 'data', 'game-items.json'), encoding='utf-8'))['items']


@functools.lru_cache(maxsize=None)
def spr(path):
    return Spr(src(path))


@functools.lru_cache(maxsize=None)
def act(path):
    return Act(src(path))


def frame(a, action, i=0):
    frames = a.actions[action] if action < len(a.actions) else a.actions[0]
    return frames[i % len(frames)]


def frames_of(a, action):
    """How many standing frames a part has facing this way, and how long each shows (ms)."""
    frames = a.actions[action] if action < len(a.actions) else a.actions[0]
    delay = a.delays[action] if action < len(a.delays) else 4.0
    return len(frames), max(40, round(delay * 25))


def robe_files(name, sex, job='초보자'):
    """A garment's own .spr per job, or one shared .spr at the folder root
    with only the .act per job (Wings_Of_Raguel and 25 others).
    scripts/build-dress-up.py asks for every job; this script only the Novice."""
    base = f'{SPRITE}/로브/{name}'
    own = f'{base}/{sex}/{job}_{sex}'
    if exists(own + '.spr') and exists(own + '.act'):
        return own + '.spr', own + '.act'
    shared = f'{base}/{name.lower()}.spr'
    if exists(shared) and exists(own + '.act'):
        return shared, own + '.act'
    return None


def draw(sex, direction, acc=None, robe=None, i=0):
    body = (spr(f'{SPRITE}/인간족/몸통/{sex}/초보자_{sex}.spr'), act(f'{SPRITE}/인간족/몸통/{sex}/초보자_{sex}.act'))
    head = (spr(f'{SPRITE}/인간족/머리통/{sex}/1_{sex}.spr'), act(f'{SPRITE}/인간족/머리통/{sex}/1_{sex}.act'))
    canvas = Image.new('RGBA', (200, 200))
    origin = (100, 150)
    bf = frame(body[1], direction)

    def put(part, anchored, step=0):
        s, a = part
        f = frame(a, direction, step)
        shift = (0, 0)
        if anchored and bf['anchors'] and f['anchors']:
            shift = (bf['anchors'][0][0] - f['anchors'][0][0], bf['anchors'][0][1] - f['anchors'][0][1])
        draw_layers(canvas, origin, s, f, shift)

    # A garment hangs behind the body seen from the front, over it from behind.
    back = direction in (2, 3, 4, 5)
    if robe and not back:
        put(robe, False, i)
    put(body, False)
    put(head, True)
    if acc:
        put(acc, True, i)
    if robe and back:
        put(robe, False, i)
    return canvas


def position(desc):
    text = ' '.join(desc)
    if 'Garment' in text:
        return 'garment'
    if re.search(r'Upper|Middle|Lower', text):
        return 'head'
    return None


def is_headgear(desc):
    """An ordinary hat: its description's type line says Headgear."""
    return bool(re.search(r':\s*(\^[0-9A-Fa-f]{6})?Headgear\b', ' '.join(desc)))


def main():
    os.makedirs(OUT, exist_ok=True)
    items, sheets, skipped = {}, {}, {'no_view': 0, 'no_sprite': 0, 'no_position': 0}
    naked = {(sex, d): draw(sex, d).getbbox() for sex in SEXES for d in DIRS}
    for sid, it in sorted(game.items(), key=lambda kv: int(kv[0])):
        kind = position(it['desc'])
        if not it.get('costume') and not (kind == 'head' and is_headgear(it['desc'])):
            continue
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
                if not base or not (exists(base + '.spr') and exists(base + '.act')):
                    break
                parts[sex] = dict(acc=(spr(base + '.spr'), act(base + '.act')))
        if len(parts) != len(SEXES):
            skipped['no_sprite'] += 1
            continue
        # A costume that moves standing still (wings flapping, a floating
        # piece) gets every standing frame; the sheet becomes an animated
        # WebP, all six cells in step (owner, 15 Oct 2026: "the ones that
        # move do not move").
        part = lambda sex: next(iter(parts[sex].values()))[1]
        counts = [frames_of(part(sex), d) for sex in SEXES for d in DIRS]
        # A headgear's standing action has three frames that are not motion:
        # they are the head looking ahead, left and right. Only more than
        # that is an animation.
        if kind == 'head':
            counts = [(1, t) if c == 3 else (c, t) for c, t in counts]
        n = min(24, max(c for c, _ in counts))
        ms = max((t for c, t in counts if c == max(c for c, _ in counts)), default=100)
        try:
            # At most 12 pictures a loop: every other frame of a 24-frame
            # costume, shown twice as long, looks the same at half the bytes.
            stride = -(-n // 12)
            ms *= stride
            steps = [{(sex, d): draw(sex, d, **parts[sex], i=i) for sex in SEXES for d in DIRS} for i in range(0, n, stride)]
            views = steps[0]
        except Exception as e:  # a malformed sprite skips one costume, not the run
            print('render failed', sid, it['name'], e)
            skipped['no_sprite'] += 1
            continue
        boxes = [v.getbbox() for st in steps for v in st.values() if v.getbbox()]
        x0 = min(b[0] for b in boxes) - 3
        y0 = min(b[1] for b in boxes) - 3
        x1 = max(b[2] for b in boxes) + 3
        y1 = max(b[3] for b in boxes) + 3
        w, h = x1 - x0, y1 - y0
        def compose(st):
            sheet = Image.new('RGBA', (w * 3, h * 2))
            for r, sex in enumerate(SEXES):
                for c, d in enumerate(DIRS):
                    sheet.alpha_composite(st[(sex, d)].crop((x0, y0, x1, y1)), (c * w, r * h))
            return sheet

        def save(imgs, path):
            # Frames that are all the same picture are one still picture.
            if all(im.tobytes() == imgs[0].tobytes() for im in imgs[1:]):
                imgs = imgs[:1]
            if len(imgs) == 1:
                imgs[0].save(path, lossless=True, method=6)
            else:
                # Moving sheets run to 24 frames: lossy keeps them near a
                # tenth of the lossless size. The first frame is also kept
                # still and lossless, for list tiles.
                imgs[0].save(path, save_all=True, append_images=imgs[1:], duration=ms, loop=0, quality=80, method=6, allow_mixed=True)
                imgs[0].save(path.replace('.webp', '-still.webp'), lossless=True, method=6)

        sheets_seq = [compose(st) for st in steps]
        save(sheets_seq, os.path.join(OUT, f'{key}.webp'))
        entry = {'w': w, 'h': h, 'garment': kind == 'garment'}
        if n > 1 and any(im.tobytes() != sheets_seq[0].tobytes() for im in sheets_seq[1:]):
            entry['frames'] = n
        if kind == 'head':
            def head_sheet(st):
                hs = Image.new('RGBA', (HEAD * 3, HEAD * 2))
                for r, sex in enumerate(SEXES):
                    for c, d in enumerate(DIRS):
                        nb = naked[(sex, d)]
                        cx, hy = (nb[0] + nb[2]) // 2, nb[1]
                        hs.alpha_composite(st[(sex, d)].crop((cx - HEAD // 2, hy - 8, cx + HEAD // 2, hy - 8 + HEAD)), (c * HEAD, r * HEAD))
                return hs
            save([head_sheet(st) for st in steps], os.path.join(OUT, f'{key}-head.webp'))
            entry['head'] = HEAD
        sheets[key] = entry
        items[sid] = key
    json.dump(
        {
            '_meta': {
                'what': 'Costume or headgear item id -> sheet in public/images/costume-fit (scripts/build-costume-fit.py). '
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


if __name__ == '__main__':
    main()
