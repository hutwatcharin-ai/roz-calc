"""The dress room's scene backdrops (grass field, Prontera plaza), drawn from the client's ground
and building textures: a sky, a horizon line of trees or houses, and the ground laid back in
perspective under the character's feet (y 450 of 600, the stage's origin 150 of 200 at 3x).

Only these derived pictures are committed; the textures stay in the local client.

Writes public/images/dress-up/bg-<name>.webp.
Usage: py -3 scripts/build-dress-up-backdrops.py"""
import os
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')
T = 'D:/Data grf roz/data_grf_extracted/files/data/texture/'
O = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'images', 'dress-up') + os.sep
W = H = 600
HZ = 200          # horizon y
FEET = 450        # feet y (origin 150 of 200, x3)
SS = 2            # supersample


def tex(path):
    return np.asarray(Image.open(T + path).convert('RGB'), dtype=np.float32)


def keyed(path):
    """Magenta colour key to alpha."""
    im = Image.open(T + path).convert('RGBA')
    a = np.asarray(im).copy()
    m = (a[..., 0] > 200) & (a[..., 1] < 60) & (a[..., 2] > 200)
    a[m, 3] = 0
    return Image.fromarray(a)


def floor(base, tile_px, centre=None, haze=(200, 220, 235), fog=0.55, alt=None):
    """Perspective ground under the horizon. tile_px: on-screen size of one tile at the feet.
    centre: a round patch of another texture under the feet. alt: a second texture blended in
    low-frequency patches."""
    w, h = W * SS, H * SS
    hz, feet = HZ * SS, FEET * SS
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    dy = np.maximum(ys - hz, 0.5)
    depth = (feet - hz) / dy                      # 1 at the feet, grows to the horizon
    tile = tile_px * SS
    u = (xs - w / 2) * depth / tile + 0.5         # tile units, 0.5 = centre of the feet tile
    # distance into the screen in tile units, 0.5 at the feet
    v = (depth - 1) * (feet - hz) / tile * 1.8 + 0.5  # 1.8: the ground is seen at a slant, as in the game
    bh, bw = base.shape[:2]
    img = base[((v % 1) * bh).astype(int) % bh, ((u % 1) * bw).astype(int) % bw]
    if alt is not None:
        # low-frequency patches of a second texture, so the ground is not one flat repeat
        ah, aw = alt.shape[:2]
        other = alt[((v % 1) * ah).astype(int) % ah, ((u % 1) * aw).astype(int) % aw]
        n = (np.sin(u * 0.9 + 1.3) * np.sin(v * 1.1 + 0.4) + np.sin(u * 0.37 - v * 0.53 + 2.0)) * 0.5
        t = np.clip((n + 0.1) * 1.6, 0, 1)[..., None]
        img = img * (1 - t) + other * t
    if centre is not None:
        ch, cw = centre.shape[:2]
        k = 3.4  # the round centre spans k tiles across
        cu, cv = (u - 0.5) / k + 0.5, (v - 0.5) / k + 0.5
        r = np.hypot(cu - 0.5, cv - 0.5)
        t = np.clip((0.5 - r) / 0.04, 0, 1)[..., None]
        cen = centre[((cv % 1) * ch).astype(int) % ch, ((cu % 1) * cw).astype(int) % cw]
        img = img * (1 - t) + cen * t
    # fog toward the horizon, and a touch darker near the bottom
    f = np.clip((depth - 1) / 9, 0, 1)[..., None] ** 0.6 * fog
    img = img * (1 - f) + np.array(haze, np.float32) * f
    img = img * (1 - 0.18 * np.clip((ys - feet) / (h - feet), 0, 1))[..., None]
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).rectangle([0, HZ, W, H], fill=255)
    return out, mask


def sky(top, bottom, clouds=0, seed=1):
    g = np.linspace(0, 1, H)[:, None, None]
    img = np.array(top, np.float32) * (1 - g) + np.array(bottom, np.float32) * g
    im = Image.fromarray(np.repeat(img, W, axis=1).astype(np.uint8)).convert('RGBA')
    if clouds:
        rng = np.random.default_rng(seed)
        layer = Image.new('RGBA', (W, H), (255, 255, 255, 0))
        d = ImageDraw.Draw(layer)
        for _ in range(clouds):
            cx, cy = rng.uniform(0, W), rng.uniform(25, HZ - 70)
            for _ in range(7):
                rx, ry = rng.uniform(18, 42), rng.uniform(9, 16)
                ox, oy = rng.uniform(-50, 50), rng.uniform(-10, 8)
                d.ellipse([cx + ox - rx, cy + oy - ry, cx + ox + rx, cy + oy + ry], fill=(255, 255, 255, 190))
        layer = layer.filter(ImageFilter.GaussianBlur(4))
        im.alpha_composite(layer)
    return im


def hills(im, colour, base, amp, seed, blur=2):
    rng = np.random.default_rng(seed)
    xs = np.arange(W)
    y = base - amp * (0.6 * np.sin(xs / rng.uniform(60, 90) + rng.uniform(0, 6))
                      + 0.4 * np.sin(xs / rng.uniform(25, 40) + rng.uniform(0, 6)))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.polygon([(0, H)] + [(int(x), float(yy)) for x, yy in zip(xs, y)] + [(W, H)], fill=colour)
    im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def strip(im, sprite, height, y_bottom, step, jitter=0, seed=0, tint=None):
    rng = np.random.default_rng(seed)
    s = sprite.resize((int(sprite.width * height / sprite.height), height), Image.LANCZOS)
    if tint:
        a = np.asarray(s).astype(np.float32)
        a[..., :3] = a[..., :3] * (1 - tint[1]) + np.array(tint[0]) * tint[1]
        s = Image.fromarray(a.astype(np.uint8))
    x = -rng.uniform(0, step)
    while x < W:
        im.alpha_composite(s, (int(x), int(y_bottom - height + rng.uniform(-jitter, jitter))))
        x += step * rng.uniform(0.7, 1.1)


def shadow(im):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([W / 2 - 62, FEET - 14, W / 2 + 62, FEET + 14], fill=(0, 0, 0, 70))
    im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(8)))


def treeline(im, leaves, y, height, seed, dark=0.0, haze=None):
    """A line of round tree tops filled with a leaf texture."""
    rng = np.random.default_rng(seed)
    mask = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(mask)
    x = -20
    while x < W + 20:
        r = rng.uniform(0.45, 0.75) * height
        d.ellipse([x - r, y - r * 1.6, x + r, y + r * 0.4], fill=255)
        x += r * rng.uniform(0.9, 1.4)
    d.rectangle([0, y - 2, W, y + 6], fill=255)
    tile = leaves.convert('RGB')
    fill = Image.new('RGB', (W, H))
    for ty in range(0, H, tile.height):
        for tx in range(0, W, tile.width):
            fill.paste(tile, (tx, ty))
    a = np.asarray(fill).astype(np.float32)
    shade = np.clip((np.arange(H)[:, None] - (y - height)) / height, 0, 1)[..., None]
    a = a * (1 - dark) * (1 - 0.35 * shade)
    if haze:
        a = a * (1 - haze[1]) + np.array(haze[0], np.float32) * haze[1]
    layer = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')
    layer.putalpha(mask.filter(ImageFilter.GaussianBlur(1)))
    im.alpha_composite(layer)


def grass():
    im = sky((80, 150, 222), (196, 228, 244), clouds=7, seed=4)
    hills(im, (150, 192, 170, 255), HZ - 22, 14, 3, blur=3)
    treeline(im, Image.open(T + '필드바닥/prt_초원06.bmp'), HZ - 4, 34, 5, dark=0.25, haze=((150, 195, 190), 0.45))
    treeline(im, Image.open(T + '필드바닥/prt_초원06.bmp'), HZ + 3, 22, 8, dark=0.15, haze=((150, 195, 190), 0.2))
    g, mask = floor(tex('필드바닥/prt_초원01.bmp'), 120, haze=(175, 210, 195), fog=0.45, alt=tex('필드바닥/prt_초원01.bmp')[::-1] * np.array([0.78, 0.86, 0.62], np.float32))
    im.paste(g, (0, 0), mask)
    flowers = keyed('나무잡초꽃/myo-grs1.bmp')
    fl = flowers.resize((170, int(flowers.height * 170 / flowers.width)), Image.LANCZOS)
    im.alpha_composite(fl, (-40, H - fl.height + 8))
    im.alpha_composite(fl.transpose(Image.FLIP_LEFT_RIGHT), (W - fl.width + 40, H - fl.height + 8))
    shadow(im)
    return im


def prontera():
    im = sky((120, 150, 205), (240, 214, 180), clouds=4, seed=11)
    walls = [keyed(f'프론테라/{n}') for n in ('ho-wall-1.bmp', 'ho-wall-2.bmp', 'ho-wall-3.bmp', 'ho-wall.bmp')]
    x, i = -40, 0
    while x < W:
        w = walls[i % len(walls)]
        h = 105 + (i * 37) % 30
        s = w.resize((int(w.width * h / w.height), h), Image.LANCZOS)
        im.alpha_composite(s, (x, HZ + 8 - h))
        x += s.width
        i += 1
    haze = Image.new('RGBA', (W, H), (240, 214, 180, 0))
    a = np.zeros((H, W), np.uint8)
    a[:HZ + 8] = np.linspace(40, 90, HZ + 8)[:, None].astype(np.uint8)
    haze.putalpha(Image.fromarray(a))
    im.alpha_composite(haze)
    g, mask = floor(tex('필드바닥/prt_도시02.bmp'), 95, centre=tex('필드바닥/prt_도시01.bmp'), haze=(232, 212, 186), fog=0.5)
    im.paste(g, (0, 0), mask)
    shadow(im)
    return im


if __name__ == '__main__':
    os.makedirs(O, exist_ok=True)
    for name, fn in (('grass', grass), ('prontera', prontera)):
        path = O + f'bg-{name}.webp'
        fn().convert('RGB').save(path, 'WEBP', quality=86, method=6)
        print(path, os.path.getsize(path) // 1024, 'KB')
