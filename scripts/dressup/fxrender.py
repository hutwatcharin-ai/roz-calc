"""Pre-render a .str hat effect (scripts/dressup/strfx.py) into frames and a WebP atlas for the dress-up room.

Every frame becomes two buffers, because the page can only add light with a separate canvas
(CSS mix-blend-mode: plus-lighter):
  n  layers drawn with ordinary alpha blending, over transparent
  a  layers drawn additively (Direct3D dst blend ONE or DESTALPHA); stored premultiplied-friendly:
     alpha = brightest channel, colour = light / alpha, so drawing it with plus-lighter adds the light
Layers keep their order inside each buffer; a file that mixes both kinds loses the order between
them (accepted in the spec).

STR space: the effect's origin (320, 240) is the character's feet (checked by eye against the game
at the Task 3 checkpoint). Angles run 1024 to a turn. A quad's corners are xy[0..3] (x) and
xy[4..7] (y): top-left, top-right, bottom-right, bottom-left, mapped to the texture rect uv[0..3].
"""
import hashlib
import io
import json
import logging
import math
import os

import numpy as np
from PIL import Image

from dressup import strfx

log = logging.getLogger('fxrender')

STR_ORIGIN = (320.0, 240.0)
CANVAS = (1024, 1024)
ORIGIN_PX = (512, 700)  # where STR_ORIGIN lands on the work canvas
MAGENTA = (255, 0, 255)


def is_additive(src_blend: int, dst_blend: int) -> bool:
    return dst_blend in (2, 7)


def degrees(angle: float) -> float:
    return angle * 360.0 / 1024.0


def _read(path):
    with open(path, 'rb') as f:
        return f.read()


_tex_cache = {}


def _texture(path):
    if path not in _tex_cache:
        im = Image.open(path).convert('RGBA')
        if path.lower().endswith('.bmp'):
            a = np.asarray(im).copy()
            key = (a[..., 0] == MAGENTA[0]) & (a[..., 1] == MAGENTA[1]) & (a[..., 2] == MAGENTA[2])
            a[key, 3] = 0
            im = Image.fromarray(a, 'RGBA')
        _tex_cache[path] = im
    return _tex_cache[path]


def _perspective(dst, src):
    """PIL PERSPECTIVE coefficients mapping output points dst[i] to input points src[i]."""
    m, v = [], []
    for (x, y), (u, w) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        v.append(u)
        m.append([0, 0, 0, x, y, 1, -w * x, -w * y])
        v.append(w)
    return np.linalg.solve(np.array(m, float), np.array(v, float)).tolist()


def _tex_index(state, n):
    i = int(math.floor(state.aniframe))
    if state.anitype == 3:
        return i % n
    if state.anitype == 4:
        return (n - 1 - i) % n
    return max(0, min(n - 1, i))


def _draw_layer(state, tex, n_buf, a_buf):
    xs, ys = state.xy[0:4], state.xy[4:8]
    rad = math.radians(degrees(state.angle))
    c, s = math.cos(rad), math.sin(rad)
    ox = ORIGIN_PX[0] + state.pos[0] - STR_ORIGIN[0]
    oy = ORIGIN_PX[1] + state.pos[1] - STR_ORIGIN[1]
    pts = [(ox + x * c - y * s, oy + x * s + y * c) for x, y in zip(xs, ys)]
    x0 = max(0, int(math.floor(min(p[0] for p in pts))))
    y0 = max(0, int(math.floor(min(p[1] for p in pts))))
    x1 = min(CANVAS[0], int(math.ceil(max(p[0] for p in pts))))
    y1 = min(CANVAS[1], int(math.ceil(max(p[1] for p in pts))))
    if x1 - x0 < 1 or y1 - y0 < 1:
        return None
    tw, th = tex.size
    u0, v0, u1, v1 = state.uv[0:4]
    src = [(u0 * tw, v0 * th), (u1 * tw, v0 * th), (u1 * tw, v1 * th), (u0 * tw, v1 * th)]
    dst = [(px - x0, py - y0) for px, py in pts]
    try:
        coeffs = _perspective(dst, src)
    except np.linalg.LinAlgError:
        return None  # a degenerate quad (all corners on a line) draws nothing
    warped = tex.transform((x1 - x0, y1 - y0), Image.PERSPECTIVE, coeffs, Image.BILINEAR)
    w = np.asarray(warped, dtype=np.float32) / 255.0
    col = np.clip(np.array(state.color, np.float32) / 255.0, 0, 1)
    rgb = w[..., :3] * col[:3]
    alpha = w[..., 3] * col[3]
    if is_additive(state.src_blend, state.dst_blend):
        a_buf[y0:y1, x0:x1] += rgb * alpha[..., None]
    else:
        region = n_buf[y0:y1, x0:x1]
        inv = 1.0 - alpha[..., None]
        region[..., :3] = rgb * alpha[..., None] + region[..., :3] * inv
        region[..., 3] = alpha + region[..., 3] * (1.0 - alpha)
    return x0, y0, x1, y1


def _crop(img, left, top):
    box = img.getbbox()
    if not box:
        return None
    return img.crop(box), left + box[0], top + box[1]


def _to_images(n_buf, a_buf, dirty):
    if dirty is None:
        return None, None
    x0, y0, x1, y1 = dirty
    n_buf = n_buf[y0:y1, x0:x1]
    a_buf = a_buf[y0:y1, x0:x1]
    # n: premultiplied -> straight alpha
    alpha = n_buf[..., 3:4]
    straight = np.where(alpha > 1e-6, n_buf[..., :3] / np.maximum(alpha, 1e-6), 0)
    n_img = np.dstack([straight, alpha]).clip(0, 1)
    light = a_buf.clip(0, 1)
    la = light.max(axis=2, keepdims=True)
    a_rgb = np.where(la > 1e-6, light / np.maximum(la, 1e-6), 0)
    a_img = np.dstack([a_rgb, la]).clip(0, 1)
    to = lambda arr: Image.fromarray((arr * 255 + 0.5).astype(np.uint8), 'RGBA')
    return _crop(to(n_img), x0, y0), _crop(to(a_img), x0, y0)


def render_frames(str_path: str, step: int = 1):
    """[(n, a)] per kept frame; each is (RGBA image, left, top) on the work canvas, or None."""
    s = strfx.parse_str(_read(str_path))
    textures = []
    for layer in s.layers:
        got = []
        for name in layer.textures:
            p = strfx.find_texture(str_path, name)
            if p is None:
                log.warning('%s: texture %s not found, layer part skipped', str_path, name)
            got.append(_texture(p) if p else None)
        textures.append(got)
    out = []
    n_buf = np.zeros((CANVAS[1], CANVAS[0], 4), np.float32)
    a_buf = np.zeros((CANVAS[1], CANVAS[0], 3), np.float32)
    for frame in range(0, s.max_key + 1, step):
        dirty = None
        for layer, texs in zip(s.layers, textures):
            if not texs:
                continue
            st = strfx.layer_state(layer, frame)
            if st is None:
                continue
            tex = texs[_tex_index(st, len(texs))]
            if tex is not None:
                box = _draw_layer(st, tex, n_buf, a_buf)
                if box:
                    dirty = box if dirty is None else (min(dirty[0], box[0]), min(dirty[1], box[1]),
                                                        max(dirty[2], box[2]), max(dirty[3], box[3]))
        out.append(_to_images(n_buf, a_buf, dirty))
        if dirty:
            x0, y0, x1, y1 = dirty
            n_buf[y0:y1, x0:x1] = 0
            a_buf[y0:y1, x0:x1] = 0
    return out


def _pack(images, max_w=2048):
    """Shelf-pack images; returns (positions [(x, y)], width, height)."""
    order = sorted(range(len(images)), key=lambda i: -images[i].height)
    pos = [None] * len(images)
    x = y = shelf = 0
    width = 0
    for i in order:
        w, h = images[i].size
        if x + w > max_w:
            x, y, shelf = 0, y + shelf, 0
        pos[i] = (x, y)
        x += w
        shelf = max(shelf, h)
        width = max(width, x)
    return pos, max(1, width), max(1, y + shelf)


def export_fx(str_path, out_dir, key, pos_x, pos_y, before, step=1):
    """Write <out_dir>/<key>.<hash8>.json and .webp; returns (hash8, json bytes, webp bytes)."""
    s = strfx.parse_str(_read(str_path))
    frames = render_frames(str_path, step=step)
    pieces = [b for pair in frames for b in pair if b is not None]
    pos, w, h = _pack([p[0] for p in pieces])
    atlas = Image.new('RGBA', (w, h))
    at = {}
    for (img, left, top), (x, y) in zip(pieces, pos):
        atlas.paste(img, (x, y))
        at[id(img)] = [x, y, img.width, img.height,
                       left - ORIGIN_PX[0] + pos_x, top - ORIGIN_PX[1] + pos_y]
    rect = lambda b: None if b is None else at[id(b[0])]
    data = {'v': 1, 'fps': round(s.fps / step), 'before': bool(before),
            'frames': [{'n': rect(n), 'a': rect(a)} for n, a in frames]}
    buf = io.BytesIO()
    atlas.save(buf, 'WEBP', lossless=True, method=6)
    webp = buf.getvalue()
    js = json.dumps(data, separators=(',', ':')).encode('utf-8')
    h8 = hashlib.sha1(js + webp).hexdigest()[:8]
    path = os.path.join(out_dir, f'{key}.{h8}')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for ext, b in (('.json', js), ('.webp', webp)):
        with open(path + ext, 'wb') as f:
            f.write(b)
    return h8, js, webp
