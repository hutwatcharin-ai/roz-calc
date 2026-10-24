"""Turn one sprite part (a .spr + .act) into a browser atlas and flat JSON.

Only the standing/walking/sitting/etc. actions in KEPT_TYPES are kept
(action = type * 8 + direction). Pictures are packed once each into a PNG
atlas 512 px wide; the JSON says where every layer of every frame goes.
"""
import copy
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ro_sprite import Spr, Act  # noqa: E402,F401

KEPT_TYPES = (0, 1, 2, 4, 5, 6, 8, 10, 11)
ATLAS_W = 512
GAP = 1  # px between pictures so scaling never bleeds a neighbour in

# A body's colour 0 is the sprite's own palette: for the Novice body it is
# byte-equal to palette/몸/<job>_<sex>_0.pal, so no palette file is needed.
CLOTH_ZERO = 'own'


def apply_palette(spr, pal_path):
    """A copy of spr whose palette images are re-coloured from a 1024-byte RGBA .pal."""
    with open(pal_path, 'rb') as f:
        raw = f.read()
    if len(raw) != 1024:
        raise ValueError(f'{pal_path}: palette must be 1024 bytes, got {len(raw)}')
    pal = [tuple(raw[i * 4:i * 4 + 3]) for i in range(256)]
    out = copy.copy(spr)
    out.pal = pal
    out.pal_images = []
    for old, px in zip(spr.pal_images, spr.pal_px):
        img = Image.new('RGBA', old.size)
        img.putdata([(0, 0, 0, 0) if c == 0 else pal[c] + (255,) for c in px])
        out.pal_images.append(img)
    return out


def _pack(sizes):
    """Shelf-pack {key: (w, h)}; tallest first. Returns ({key: (x, y)}, height)."""
    pos = {}
    x = y = shelf = 0
    for key, (w, h) in sorted(sizes.items(), key=lambda kv: (-kv[1][1], kv[0])):
        if x and x + w > ATLAS_W:
            y += shelf + GAP
            x = shelf = 0
        pos[key] = (x, y)
        x += w + GAP
        shelf = max(shelf, h)
    return pos, y + shelf


def export_part(spr, act, types=KEPT_TYPES, palette=None):
    if palette is not None:
        spr = apply_palette(spr, palette)
    actions = [t * 8 + d for t in types for d in range(8)]

    def frames_for(a):
        return act.actions[a] if a < len(act.actions) else act.actions[0]

    used = {}
    for a in actions:
        for frame in frames_for(a):
            for l in frame['layers']:
                if l['spr'] < 0:
                    continue
                key = (l['kind'], l['spr'])
                if key not in used:
                    img = spr.image(l['spr'], l['kind'])
                    if img is not None:
                        used[key] = img
    pos, height = _pack({k: v.size for k, v in used.items()})
    atlas = Image.new('RGBA', (ATLAS_W, max(1, height)))
    for key, img in used.items():
        atlas.paste(img, pos[key])
    width = max([pos[k][0] + used[k].width for k in used], default=1)
    atlas = atlas.crop((0, 0, width, max(1, height)))

    acts, delay = {}, {}
    for a in actions:
        frames = []
        for frame in frames_for(a):
            layers = []
            for l in frame['layers']:
                key = (l['kind'], l['spr'])
                if l['spr'] < 0 or key not in used:
                    continue
                ax, ay = pos[key]
                aw, ah = used[key].size
                r, g, b, al = l['color']
                layers.append([l['x'], l['y'], ax, ay, aw, ah, 1 if l['mirror'] else 0,
                               l['sx'], l['sy'], l['rot'], r, g, b, al])
            anchor = list(frame['anchors'][0]) if frame['anchors'] else None
            frames.append([layers, anchor, 0])
        acts[str(a)] = frames
        d = act.delays[a] if a < len(act.delays) else 4.0
        delay[str(a)] = max(40, round(d * 25))
    return atlas, {'v': 1, 'w': atlas.width, 'h': atlas.height, 'acts': acts, 'delay': delay}
