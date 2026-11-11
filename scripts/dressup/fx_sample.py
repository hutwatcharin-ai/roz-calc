"""Sample of hat effects on a Novice, for checking size and position against the game by eye.

Writes public/draft/fx-sample/<name>.webp (animated, 2x) and sheet.png (one still per effect).
public/draft/ is untracked draft space. Kept for recalibrating fxrender's origin later.

Usage: PYTHONIOENCODING=utf-8 py -3 scripts/dressup/fx_sample.py [HAT_EF_name ...]
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import lub  # noqa: E402
from ro_sprite import Spr, Act  # noqa: E402
from dressup import fxrender, reference, zorder  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'public', 'draft', 'fx-sample')
SPRITE = f'{zorder.GRF}/sprite'
HATINFO = f'{zorder.GRF}/luafiles514/lua files/hateffectinfo'
EFFECT = f'{zorder.GRF}/texture/effect'
SIZE = (320, 320)
FEET = (160, 250)
BG = (27, 29, 42)
DEFAULT = ['HAT_EF_Magiccircle', 'HAT_EF_C_Light_Tower', 'HAT_EF_C_Swirling_Flame']


def hat_table():
    L = lub.runtime()
    for f in ('hateffectids.lub', 'hateffectinfo.lub'):
        assert lub.load(L, f'{HATINFO}/{f}') is None, f
    g = L.globals()
    return lub.to_py(g[b'HatEFID']), lub.to_py(g[b'hatEffectTable'])


def novice():
    s = '남'
    body = (Spr(zorder.src(f'{SPRITE}/인간족/몸통/{s}/초보자_{s}.spr')), Act(zorder.src(f'{SPRITE}/인간족/몸통/{s}/초보자_{s}.act')), False)
    head = (Spr(zorder.src(f'{SPRITE}/인간족/머리통/{s}/1_{s}.spr')), Act(zorder.src(f'{SPRITE}/인간족/머리통/{s}/1_{s}.act')), True)
    return reference.render([body, head], 0, [0, 0], size=SIZE, origin=FEET)


def place(canvas_arr, buf, additive):
    if buf is None:
        return
    img, left, top = buf
    x = FEET[0] + left - fxrender.ORIGIN_PX[0]
    y = FEET[1] + top - fxrender.ORIGIN_PX[1]
    a = np.asarray(img, np.float32) / 255.0
    h, w = a.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(SIZE[0], x + w), min(SIZE[1], y + h)
    if x1 <= x0 or y1 <= y0:
        return
    a = a[y0 - y:y1 - y, x0 - x:x1 - x]
    region = canvas_arr[y0:y1, x0:x1]
    if additive:
        region[..., :3] = np.minimum(1.0, region[..., :3] + a[..., :3] * a[..., 3:4])
    else:
        region[..., :3] = a[..., :3] * a[..., 3:4] + region[..., :3] * (1 - a[..., 3:4])


def frame_image(char, n, a, before):
    base = np.zeros((SIZE[1], SIZE[0], 3), np.float32)
    base[...] = np.array(BG, np.float32) / 255.0
    ch = np.asarray(char, np.float32) / 255.0

    def draw_char():
        base[...] = ch[..., :3] * ch[..., 3:4] + base * (1 - ch[..., 3:4])

    if not before:
        draw_char()
    place(base, n, False)
    place(base, a, True)
    if before:
        draw_char()
    return Image.fromarray((base * 255 + 0.5).astype(np.uint8), 'RGB')


def main():
    names = sys.argv[1:] or DEFAULT
    ids, table = hat_table()
    char = novice()
    os.makedirs(OUT, exist_ok=True)
    stills = []
    for name in names:
        info = table[ids[name]]
        path = os.path.join(EFFECT, *info['resourceFileName'].split('\\'))
        frames = fxrender.render_frames(path)
        before = bool(info.get('isRenderBeforeCharacter'))
        imgs = [frame_image(char, n, a, before).resize((SIZE[0] * 2, SIZE[1] * 2), Image.NEAREST) for n, a in frames]
        fps = fxrender.strfx.parse_str(fxrender._read(path)).fps
        imgs[0].save(os.path.join(OUT, f'{name}.webp'), save_all=True, append_images=imgs[1:],
                     duration=round(1000 / fps), loop=0, lossless=False, quality=85)
        stills.append(imgs[len(imgs) // 3])
        print(name, info, len(frames), 'frames')
    sheet = Image.new('RGB', (sum(i.width for i in stills), stills[0].height))
    x = 0
    for im in stills:
        sheet.paste(im, (x, 0))
        x += im.width
    sheet.save(os.path.join(OUT, 'sheet.png'))
    print('wrote', OUT)


if __name__ == '__main__':
    main()
