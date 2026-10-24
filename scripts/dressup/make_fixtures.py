"""Client-derived test fixtures for the dress-up renderer (lib/dress-up).

Writes, under lib/dress-up/__fixtures__/:
  parts/<key>.json + parts/<key>.rgba.gz   one exported part (atlas as gzip of raw RGBA, w x h from the JSON)
  looks.json                               30 looks: {parts:[{key,anchored}], action, frames, ref}
  ref/<n>.rgba.gz                          200 x 200 reference picture of look n (feet at 100,150)

Derived pictures only: no .spr/.act/.pal is copied. Seed 1, so a rerun gives the same files.
Usage: PYTHONIOENCODING=utf-8 py -3 scripts/dressup/make_fixtures.py
"""
import gzip
import json
import os
import random
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.stdout.reconfigure(encoding='utf-8')
from ro_sprite import Spr, Act  # noqa: E402
from dressup import part, reference  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'lib', 'dress-up', '__fixtures__')
LIMIT = 1536 * 1024
GRF = 'D:/Data grf roz/data_grf_extracted/files/data'
NEW = 'D:/Data grf roz/grf-2026-10-15-sprites/files/data'
SPRITE = f'{GRF}/sprite'
SEXES = {'m': '남', 'f': '여'}
LOOKS = 30
SEED = 1

# Headgear sprite names (accname view id in the comment). No client headgear has 1 frame
# standing: a plain one has 3 (head looks front/left/right), animated ones have 24. The
# one-action sprite _cons_of_poison (every action falls back to it) was tried and left out: its
# JSON repeats the same frames for all 72 actions and costs 600 KB.
HATS = {
    'goggles': '_고글',                  # view 1: 3 frames standing (head looks front/left/right)
    'ghostring': '_고스트링톨햇',        # view 1551: 24 animated frames
    'catband': '_고양이머리띠',          # view 2: a second, plain 3-frame headgear
}
# Garments (RobeNameTable view id): one with its own root .spr shared by all jobs, one animated.
ROBES = {
    'lollipop': 'C_Big_Lollipop',        # view 194: shared root .spr
    'angel': 'Wing_Of_Angel_Move',       # view 61: 24 animated frames
}
DAGGER = '단검'


def src(path):
    """The newest copy of a client file (the 15 Oct patch's, else the 22 Sep one)."""
    newer = NEW + path[len(GRF):]
    return newer if os.path.exists(newer) else path


def load(spr_path, act_path=None):
    return Spr(src(spr_path)), Act(src(act_path or spr_path[:-4] + '.act'))


def robe_files(name, sex):
    base = f'{SPRITE}/로브/{name}'
    own = f'{base}/{sex}/초보자_{sex}'
    if os.path.exists(src(own + '.spr')) and os.path.exists(src(own + '.act')):
        return own + '.spr', own + '.act', False
    shared = f'{base}/{name.lower()}.spr'
    if os.path.exists(src(shared)) and os.path.exists(src(own + '.act')):
        return shared, own + '.act', True
    raise FileNotFoundError(f'{name} {sex}')


def build_parts():
    """{key: dict(spr, act, anchored, kind, sex)} for the fixed part set."""
    parts = {}
    pal = lambda p: src(f'{GRF}/palette/{p}')
    for sx, s in SEXES.items():
        body = load(f'{SPRITE}/인간족/몸통/{s}/초보자_{s}.spr')
        for c in (0, 2):
            p = None if c == 0 else pal(f'몸/초보자_{s}_{c}.pal')
            parts[f'body-{sx}-c{c}'] = dict(spr=body[0], act=body[1], pal=p, anchored=False, kind='body', sex=sx)
        for h in (1, 17):
            head = load(f'{SPRITE}/인간족/머리통/{s}/{h}_{s}.spr')
            for c in (0, 5):
                parts[f'head{h}-{sx}-c{c}'] = dict(spr=head[0], act=head[1], pal=pal(f'머리/머리{h}_{s}_{c}.pal'),
                                                   anchored=True, kind='head', sex=sx)
        for k, name in HATS.items():
            hat = load(f'{SPRITE}/악세사리/{s}/{s}{name}.spr')
            parts[f'hat-{k}-{sx}'] = dict(spr=hat[0], act=hat[1], pal=None, anchored=True, kind='hat', sex=sx)
        for k, name in ROBES.items():
            sp, ac, shared = robe_files(name, s)
            print('robe', name, s, 'shared root spr' if shared else 'own spr')
            parts[f'robe-{k}-{sx}'] = dict(spr=load(sp, ac)[0], act=load(sp, ac)[1], pal=None, anchored=False,
                                           kind='robe', sex=sx)
        wp = load(f'{SPRITE}/인간족/초보자/초보자_{s}_{DAGGER}.spr')
        parts[f'weapon-dagger-{sx}'] = dict(spr=wp[0], act=wp[1], pal=None, anchored=False, kind='weapon', sex=sx)
    return parts


def write_gz(path, data):
    with open(path, 'wb') as raw, gzip.GzipFile(fileobj=raw, mode='wb', mtime=0, compresslevel=9) as gz:
        gz.write(data)


def frame_count(act, action):
    return len(act.actions[action] if action < len(act.actions) else act.actions[0])


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'parts'))
    os.makedirs(os.path.join(OUT, 'ref'))
    parts = build_parts()
    for key, p in sorted(parts.items()):
        atlas, meta = part.export_part(p['spr'], p['act'], palette=p['pal'])
        with open(os.path.join(OUT, 'parts', key + '.json'), 'w', encoding='utf-8') as f:
            json.dump(meta, f, separators=(',', ':'))
        write_gz(os.path.join(OUT, 'parts', key + '.rgba.gz'), atlas.tobytes())
    # references need palette-applied sprites: same as what was exported
    drawn = {k: (part.apply_palette(p['spr'], p['pal']) if p['pal'] else p['spr'], p['act']) for k, p in parts.items()}

    rng = random.Random(SEED)
    looks = []
    for n in range(LOOKS):
        sx = rng.choice('mf')
        keys = [f'body-{sx}-c{rng.choice((0, 2))}', f'head{rng.choice((1, 17))}-{sx}-c{rng.choice((0, 5))}']
        if rng.random() < 0.7:
            keys.append(f'hat-{rng.choice(list(HATS))}-{sx}')
        if rng.random() < 0.5:
            keys.append(f'robe-{rng.choice(list(ROBES))}-{sx}')
        if rng.random() < 0.5:
            keys.append(f'weapon-dagger-{sx}')
        action = rng.choice(part.KEPT_TYPES) * 8 + rng.randrange(8)
        frames = [rng.randrange(frame_count(parts[k]['act'], action)) for k in keys]
        ref = reference.render([(*drawn[k], parts[k]['anchored']) for k in keys], action, frames)
        write_gz(os.path.join(OUT, 'ref', f'{n}.rgba.gz'), ref.tobytes())
        looks.append({'parts': [{'key': k, 'anchored': parts[k]['anchored']} for k in keys],
                      'action': action, 'frames': frames, 'ref': n})
    with open(os.path.join(OUT, 'looks.json'), 'w', encoding='utf-8') as f:
        json.dump(looks, f, separators=(',', ':'))

    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
    print(f'{len(looks)} looks, {len(parts)} parts, {total / 1024:.0f} KB')
    if total > LIMIT:
        print(f'over the {LIMIT // 1024} KB limit')
        sys.exit(1)


main()
