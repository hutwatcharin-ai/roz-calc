"""Read Ragnarok .spr / .act files and draw frames of an action.

.spr holds the pictures (palette images, run-length coded, plus RGBA ones);
.act says, for every action and frame, which pictures go where. A player is
drawn from several of these stacked: body, head (placed by anchor points),
weapon and the weapon's slash glow.

Formats as documented by the community tools (roBrowser, ActEditor):
  SPR: "SP", version (minor, major), counts, images, palette (256 x RGBA).
  ACT: "AC", version, actions -> frames -> layers (+ anchors, delays).
"""
import struct
from PIL import Image


class Spr:
    def __init__(self, path):
        d = open(path, 'rb').read()
        assert d[:2] == b'SP', path
        minor, major = d[2], d[3]
        ver = major + minor / 10
        n_pal = struct.unpack_from('<H', d, 4)[0]
        n_rgba = struct.unpack_from('<H', d, 6)[0] if ver >= 2.0 else 0
        off = 8 if ver >= 2.0 else 6
        pal_raw = d[-1024:]
        pal = [tuple(pal_raw[i * 4:i * 4 + 3]) for i in range(256)]
        self.pal_images = []
        for _ in range(n_pal):
            w, h = struct.unpack_from('<HH', d, off)
            off += 4
            if ver >= 2.1:
                size = struct.unpack_from('<H', d, off)[0]
                off += 2
                raw = d[off:off + size]
                off += size
                px = bytearray()
                i = 0
                while i < len(raw):
                    c = raw[i]
                    i += 1
                    if c == 0:
                        run = raw[i]
                        i += 1
                        px += b'\x00' * (run or 1)
                    else:
                        px.append(c)
            else:
                px = d[off:off + w * h]
                off += w * h
            px = px[:w * h].ljust(w * h, b'\x00')
            img = Image.new('RGBA', (w, h))
            img.putdata([(0, 0, 0, 0) if c == 0 else pal[c] + (255,) for c in px])
            self.pal_images.append(img)
        self.rgba_images = []
        for _ in range(n_rgba):
            w, h = struct.unpack_from('<HH', d, off)
            off += 4
            raw = d[off:off + w * h * 4]
            off += w * h * 4
            # stored ABGR, bottom-up
            img = Image.frombytes('RGBA', (w, h), bytes(raw), 'raw', 'ABGR').transpose(Image.FLIP_TOP_BOTTOM)
            self.rgba_images.append(img)

    def image(self, index, kind):
        pool = self.rgba_images if kind == 1 else self.pal_images
        return pool[index] if 0 <= index < len(pool) else None


class Act:
    def __init__(self, path):
        d = open(path, 'rb').read()
        assert d[:2] == b'AC', path
        minor, major = d[2], d[3]
        ver = major + minor / 10
        n_actions = struct.unpack_from('<H', d, 4)[0]
        off = 16
        self.actions = []
        for _ in range(n_actions):
            n_frames = struct.unpack_from('<I', d, off)[0]
            off += 4
            frames = []
            for _ in range(n_frames):
                off += 32  # unused range boxes
                n_layers = struct.unpack_from('<I', d, off)[0]
                off += 4
                layers = []
                for _ in range(n_layers):
                    x, y, spr, mirror = struct.unpack_from('<iiiI', d, off)
                    off += 16
                    color = (255, 255, 255, 255)
                    sx = sy = 1.0
                    rot = 0
                    kind = 0
                    if ver >= 2.0:
                        color = tuple(d[off:off + 4])
                        off += 4
                        if ver >= 2.4:
                            sx, sy = struct.unpack_from('<ff', d, off)
                            off += 8
                        else:
                            sx = sy = struct.unpack_from('<f', d, off)[0]
                            off += 4
                        rot, kind = struct.unpack_from('<ii', d, off)
                        off += 8
                        if ver >= 2.5:
                            off += 8  # width, height
                    layers.append(dict(x=x, y=y, spr=spr, mirror=mirror, color=color, sx=sx, sy=sy, rot=rot, kind=kind))
                sound = -1
                if ver >= 2.0:
                    sound = struct.unpack_from('<i', d, off)[0]
                    off += 4
                anchors = []
                if ver >= 2.3:
                    n_anchor = struct.unpack_from('<I', d, off)[0]
                    off += 4
                    for _ in range(n_anchor):
                        ax, ay = struct.unpack_from('<ii', d, off + 4)
                        anchors.append((ax, ay))
                        off += 16
                frames.append(dict(layers=layers, anchors=anchors, sound=sound))
            self.actions.append(frames)
        self.delays = [4.0] * n_actions
        if ver >= 2.1:
            n_events = struct.unpack_from('<I', d, off)[0]
            off += 4 + 40 * n_events
            if ver >= 2.2:
                self.delays = list(struct.unpack_from('<%df' % n_actions, d, off))


def draw_layers(canvas, origin, spr, frame, shift=(0, 0)):
    """Paste one sprite's layers for a frame onto canvas, origin = feet."""
    ox, oy = origin
    for layer in frame['layers']:
        if layer['spr'] < 0:
            continue
        img = spr.image(layer['spr'], layer['kind'])
        if img is None:
            continue
        img = img.copy()
        if layer['mirror']:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        if layer['sx'] != 1 or layer['sy'] != 1:
            img = img.resize((max(1, round(img.width * abs(layer['sx']))), max(1, round(img.height * abs(layer['sy'])))), Image.NEAREST)
        if layer['rot']:
            img = img.rotate(-layer['rot'], expand=True, resample=Image.NEAREST)
        r, g, b, a = layer['color']
        if (r, g, b, a) != (255, 255, 255, 255):
            px = img.split()
            px = [ch.point(lambda v, m=m: v * m // 255) for ch, m in zip(px, (r, g, b, a))]
            img = Image.merge('RGBA', px)
        x = ox + layer['x'] + shift[0] - img.width // 2
        y = oy + layer['y'] + shift[1] - img.height // 2
        canvas.alpha_composite(img, (x, y))


def render(parts, action, frame_index, size=(200, 200), origin=(100, 150)):
    """parts: list of (Spr, Act, uses_anchor). The first part is the body;
    parts with uses_anchor sit where the body's anchor says (a head)."""
    canvas = Image.new('RGBA', size)
    body_spr, body_act, _ = parts[0]
    body_frames = body_act.actions[action]
    body_frame = body_frames[frame_index % len(body_frames)]
    for spr, act, uses_anchor in parts:
        frames = act.actions[action] if action < len(act.actions) else act.actions[0]
        frame = frames[frame_index % len(frames)]
        shift = (0, 0)
        if uses_anchor and body_frame['anchors'] and frame['anchors']:
            bx, by = body_frame['anchors'][0]
            hx, hy = frame['anchors'][0]
            shift = (bx - hx, by - hy)
        draw_layers(canvas, origin, spr, frame, shift)
    return canvas
