"""Read the client's .str effect files (texture/effect/**/*.str), the format hat effects use.

Layout (little endian), version 0x94:
    'STRM' u32 version, u32 fps, u32 max_key, u32 layer_count, 16 reserved bytes
    per layer: i32 texture_count, texture_count x char[128] (CP949, NUL padded),
               i32 key_count, key_count x 124-byte keys:
        i32 frame, u32 type, f32 pos[2], f32 uv[8], f32 xy[8] (4 x corners then 4 y corners),
        f32 aniframe, u32 anitype, f32 delay, f32 angle, f32 color[4] (0-255),
        u32 src_blend, u32 dst_blend (Direct3D D3DBLEND values), u32 mt_preset

A layer's keys come in pairs: type 0 sets the layer's state at its frame, a type 1 key after
it holds per-frame deltas from that frame on. Our own reading of the files; no code from
other projects.
"""
import math
import os
import struct
from dataclasses import dataclass, field, replace

KEY = struct.Struct('<iI2f8f8ffIff4fIII')
assert KEY.size == 124


@dataclass(frozen=True)
class StrKey:
    frame: int
    type: int
    pos: tuple
    uv: tuple
    xy: tuple
    aniframe: float
    anitype: int
    delay: float
    angle: float
    color: tuple
    src_blend: int
    dst_blend: int
    mt_preset: int


@dataclass
class StrLayer:
    textures: list
    keys: list = field(default_factory=list)


@dataclass
class Str:
    fps: int
    max_key: int
    layers: list


def parse_str(data: bytes) -> Str:
    if data[:4] != b'STRM':
        raise ValueError('not a .str file')
    version, fps, max_key, n_layers = struct.unpack_from('<4I', data, 4)
    if version != 0x94:
        raise ValueError(f'.str version {version:#x} not supported')
    at = 20 + 16
    layers = []
    for _ in range(n_layers):
        (n_tex,) = struct.unpack_from('<i', data, at)
        at += 4
        textures = []
        for _ in range(n_tex):
            raw = data[at:at + 128].split(b'\0', 1)[0]
            textures.append(raw.decode('cp949', errors='replace'))
            at += 128
        (n_keys,) = struct.unpack_from('<i', data, at)
        at += 4
        keys = []
        for _ in range(n_keys):
            v = KEY.unpack_from(data, at)
            at += KEY.size
            keys.append(StrKey(frame=v[0], type=v[1], pos=tuple(v[2:4]), uv=tuple(v[4:12]), xy=tuple(v[12:20]),
                               aniframe=v[20], anitype=v[21], delay=v[22], angle=v[23], color=tuple(v[24:28]),
                               src_blend=v[28], dst_blend=v[29], mt_preset=v[30]))
        layers.append(StrLayer(textures=textures, keys=keys))
    return Str(fps=fps, max_key=max_key, layers=layers)


def _add(a, b, t):
    return tuple(x + y * t for x, y in zip(a, b))


def layer_state(layer: StrLayer, frame: int):
    """The layer's key state at `frame`, or None when it is not shown then."""
    base = None
    morph = None
    for k in layer.keys:
        if k.frame > frame:
            break
        if k.type == 0:
            base, morph = k, None
        elif base is not None:
            morph = k
    if base is None:
        return None
    if morph is None:
        return base
    dt = frame - morph.frame
    # texture animation runs at `delay` textures per frame; an infinite rate (common) means none
    rate = morph.delay if base.anitype in (1, 2, 3, 4) else morph.aniframe
    ani = base.aniframe + (rate * dt if math.isfinite(rate) else 0.0)
    return replace(base, pos=_add(base.pos, morph.pos, dt), uv=_add(base.uv, morph.uv, dt),
                   xy=_add(base.xy, morph.xy, dt), aniframe=ani, angle=base.angle + morph.angle * dt,
                   color=_add(base.color, morph.color, dt))


def find_texture(str_path: str, name: str):
    """The texture file next to the .str, matched without regard to case; None when absent."""
    folder = os.path.dirname(str_path)
    want = name.replace('\\', '/').split('/')[-1].lower()
    try:
        for f in os.listdir(folder):
            if f.lower() == want:
                return os.path.join(folder, f)
    except FileNotFoundError:
        pass
    return None
