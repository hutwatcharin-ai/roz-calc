"""Export the whole dress-up wardrobe from the extracted client: every class body in each cloth
colour, every hair style and colour, every headgear and garment view a game item uses, and every
weapon type a class can hold. Each part is one WebP atlas + one JSON (scripts/dressup/part.py),
with the client's draw order baked in (zorder.z_baked).

Writes (out/dress-up/ is not committed; it goes to R2 with scripts/upload-dress-up.mjs):
  out/dress-up/body/<cls>-<sex>-<cloth>.<hash>.{json,webp}
  out/dress-up/head/<style>-<sex>-<colour>.<hash>.{json,webp}
  out/dress-up/acc/<view>-<sex>.<hash>.{json,webp}
  out/dress-up/robe/<view>-<cls>-<sex>.<hash>.{json,webp}
  out/dress-up/weapon/<cls>-<sex>-<wtype>.<hash>.{json,webp}
  out/dress-up/cart/<n>.<hash>.{json,webp}   the merchant carts (scripts/dressup/cart.py)
  data/dress-up.json           the index the page reads (files: logical key -> hashed stem; the
                               page fetches <stem>.json and <stem>.webp)
  data/dress-up-manifest.json  per part: source files (mtime, size) and the content hash

<hash> is the first 8 hex of sha256(json bytes + webp bytes), shared by the pair, so a file name
never changes meaning and R2 can cache it forever.

Incremental: a part whose source files (sprite, act, palette, and imf where the z uses it) have
the same mtime and size as in the manifest, and whose outputs exist, is not exported again. A
change to the exporter code or the client's draw-order tables rebuilds everything.

Classes come from BODY in scripts/build-build-doll.py; item slots from position() and garment
files from robe_files() in scripts/build-costume-fit.py; weapon sprite names from the client's
WeaponNameTable as build-build-doll.py reads it.

Usage: PYTHONIOENCODING=utf-8 py -3 scripts/build-dress-up.py [--jobs N] [--only PREFIX]
"""
import argparse
import hashlib
import importlib.util
import inspect
import io
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding='utf-8')

from dressup import cart, part, zorder  # noqa: E402

GRF = zorder.GRF
SPRITE = f'{GRF}/sprite'
OUT = os.path.join(ROOT, 'out', 'dress-up')
INDEX = os.path.join(ROOT, 'data', 'dress-up.json')
MANIFEST = os.path.join(ROOT, 'data', 'dress-up-manifest.json')
DATA_ROOT = 'D:/Data grf roz/'
SEXES = {'m': '남', 'f': '여'}
HAIR_STYLES = 32
CLOTH = (0, 2, 3)  # stylingshopinfo AddBodyPalette; 0 = the sprite's own palette (part.CLOTH_ZERO)
# WeaponNameTable type ids (weapontable.lub) -> URL-safe slug. 9, 21 and 23 repeat 8, 20 and 10's
# sprite name and are left out; ids 31+ are single weapons with their own sprite, not types.
WTYPES = {
    1: 'dagger', 2: 'sword', 3: 'sword2h', 4: 'spear', 5: 'spear2h', 6: 'axe', 7: 'axe2h', 8: 'mace',
    10: 'rod', 11: 'bow', 12: 'knuckle', 13: 'instrument', 14: 'whip', 15: 'book', 16: 'katar',
    17: 'revolver', 18: 'rifle', 19: 'gatling', 20: 'shotgun', 22: 'shuriken',
    25: 'dagger-dagger', 26: 'sword-sword', 27: 'axe-axe', 28: 'dagger-sword', 29: 'dagger-axe', 30: 'sword-axe',
}
# High class outfits the game sells to 2nd classes: slug -> (body sprite, the class it dresses).
# They are classes of their own in the index, with `of` naming the 2nd class. The client has no
# high class weapon sprites, so they hold the 2nd class's weapons.
HIGH = {
    'lord-knight': ('로드나이트', 'knight'), 'high-priest': ('하이프리', 'priest'),
    'high-wizard': ('하이위저드', 'wizard'), 'whitesmith': ('화이트스미스', 'blacksmith'),
    'sniper': ('스나이퍼', 'hunter'), 'assassin-cross': ('어쌔신크로스', 'assassin'),
    'paladin': ('팔라딘', 'crusader'), 'champion': ('챔피온', 'monk'), 'professor': ('프로페서', 'sage'),
    'stalker': ('스토커', 'rogue'), 'creator': ('크리에이터', 'alchemist'), 'clown': ('클라운', 'bard'),
    'gypsy': ('집시', 'dancer'),
}
# Classes that push a cart (Pushcart): the merchant line and its high class outfits.
CART_CLASSES = {'merchant', 'blacksmith', 'alchemist', 'whitesmith', 'creator'}
ATTACK_TYPES = (5, 10, 11)
# Hair colour names: the client's _DressHeadPaletteList (Korean, read through cp874 by lupa).
HAIR_TH = {'기본': 'สีเดิม', '노란색': 'เหลือง', '보라색': 'ม่วง', '연갈색': 'น้ำตาลอ่อน', '녹색': 'เขียว',
           '파란색': 'น้ำเงิน', '흰색': 'ขาว', '진갈색': 'น้ำตาลเข้ม', '붉은색': 'แดง'}
SLOT_WORDS = (('Upper', 'upper'), ('Middle', 'mid'), ('Lower', 'lower'))
FOLDERS = ('body', 'head', 'acc', 'robe', 'weapon', 'cart')
# What a part's bytes depend on besides its sources: these modules, plus export_one() and integral()
# here (hashed by source, so editing the rest of this script does not force a full rebuild).
CODE_FILES = ('dressup/part.py', 'dressup/zorder.py', 'dressup/cart.py', 'ro_sprite.py')


def load_script(name, filename):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def rel(path):
    path = path.replace('\\', '/')
    return path[len(DATA_ROOT):] if path.startswith(DATA_ROOT) else path


def stat(path):
    st = os.stat(path)
    return [rel(path), st.st_mtime_ns, st.st_size]


def code_signature():
    h = hashlib.sha256()
    for f in CODE_FILES:
        with open(os.path.join(HERE, f), 'rb') as fh:
            h.update(fh.read())
    for fn in (export_one, integral):
        h.update(inspect.getsource(fn).encode())
    for f in zorder.LUA_FILES:
        h.update(json.dumps(stat(zorder.src(f'{zorder.LUA}/{f}'))).encode())
    return h.hexdigest()[:16]


# ---------------------------------------------------------------- worker (one part)

def integral(o):
    """1.0 -> 1: the same number to JSON.parse, 2 bytes shorter (every layer has scale 1.0, 1.0)."""
    if isinstance(o, float) and o.is_integer():
        return int(o)
    if isinstance(o, dict):
        return {k: integral(v) for k, v in o.items()}
    if isinstance(o, list):
        return [integral(v) for v in o]
    return o


def export_one(spec):
    """spec: dict(key, kind, zkind, view, job, sex, spr, act, pal). Writes the pair, returns
    (key, hash, json bytes, webp bytes) or (key, None, error)."""
    from ro_sprite import Spr, Act
    try:
        spr, act = Spr(spec['spr']), Act(spec['act'])
        if spec['kind'] == 'cart':
            act, z_of = cart.act_for(act), cart.z_of
        else:
            z_of = zorder.part_z_of(spec['zkind'], spec['view'], spec['job'], spec['sex'], fn=zorder.z_baked)
        atlas, meta = part.export_part(spr, act, palette=spec['pal'], z_of=z_of)
        jb = json.dumps(integral(meta), separators=(',', ':')).encode()
        buf = io.BytesIO()
        # quality is the lossless effort: 100 is ~11% smaller than the default 80 (measured)
        atlas.save(buf, 'WEBP', lossless=True, method=6, quality=100)
        wb = buf.getvalue()
        h = hashlib.sha256(jb + wb).hexdigest()[:8]
        stem = os.path.join(OUT, f"{spec['key']}.{h}")
        os.makedirs(os.path.dirname(stem), exist_ok=True)
        with open(stem + '.json', 'wb') as f:
            f.write(jb)
        with open(stem + '.webp', 'wb') as f:
            f.write(wb)
        return spec['key'], h, len(jb), len(wb)
    except Exception as e:  # a malformed sprite costs one part, not the run
        return spec['key'], None, f'{type(e).__name__}: {e}', 0


# ---------------------------------------------------------------- the wardrobe

def slots_of(sid, desc, fit):
    """['garment'] or the head slots in the item's position line; the same test as
    build-costume-fit.position(), split into Upper/Middle/Lower."""
    kind = fit.position(desc)
    if kind == 'garment':
        return ['garment']
    if kind == 'head':
        line = next((l for l in desc if re.search(r'Upper|Middle|Lower', l)), None)
        if line is None:
            raise ValueError(f'item {sid}: position() says headgear but no desc line names Upper/Middle/Lower')
        return [slot for word, slot in SLOT_WORDS if word in line]
    return []


def hair_colours():
    import lub
    L = lub.runtime()
    err = lub.load(L, zorder.src(f'{zorder.LUA}/dressroom/jobdresslist.lub'))
    assert err is None, err
    out = []
    for _, row in sorted(lub.to_py(L.globals()[b'_DressHeadPaletteList_m']).items()):
        name, cid = row[1], int(row[2])
        ko = re.sub(r'^\(\d+\)', '', name.encode('cp874').decode('cp949'))
        out.append({'id': cid, 'th': HAIR_TH[ko]})
    return out


def attack_type(act_path):
    """The attack action (5, 10 or 11) a class uses with a weapon type: the client draws the weapon
    sprite only in that action, so it is the one with drawn layers. None when none has any."""
    from ro_sprite import Act
    a = Act(act_path)
    best, best_n = None, 0
    for t in ATTACK_TYPES:
        n = sum(1 for frame in a.actions[t * 8:(t + 1) * 8] for f in frame for l in f['layers'] if l['spr'] >= 0)
        if n > best_n:
            best, best_n = t, n
    return best


def wardrobe():
    """(specs, index-without-files, coverage). specs: one per part to export."""
    fit = load_script('build_costume_fit', 'build-costume-fit.py')
    doll = load_script('build_build_doll', 'build-build-doll.py')
    src = zorder.src
    exists = lambda p: os.path.exists(src(p))
    specs = []

    def add(key, kind, zkind, view, job, sex_kr, spr, act, pal=None, imf=False):
        sources = [src(spr), src(act)] + ([pal] if pal else [])
        if imf:
            f = src(f'{GRF}/imf/{job}_{sex_kr}.imf')
            if os.path.exists(f):
                sources.append(f)
        specs.append(dict(key=key, kind=kind, zkind=zkind, view=view, job=job, sex=sex_kr,
                          spr=src(spr), act=src(act), pal=pal, sources=sources))

    classes, cls_sexes = [], []
    attack_fallback, attack_disagree = 0, []
    body_of = {**doll.BODY, **{slug: job for slug, (job, _) in HIGH.items()}}
    rows = [(slug, job, job, None) for slug, job in doll.BODY.items()]
    rows += [(slug, job, doll.BODY[of], of) for slug, (job, of) in HIGH.items()]
    for slug, job, wjob, of in rows:
        sexes = [sx for sx, s in SEXES.items() if exists(f'{SPRITE}/인간족/몸통/{s}/{job}_{s}.spr')]
        weapons, by_sex, cloth = [], {}, None
        for sx in sexes:
            s = SEXES[sx]
            cls_sexes.append(f'{slug}-{sx}')
            body = f'{SPRITE}/인간족/몸통/{s}/{job}_{s}'
            pals = {c: None if c == 0 else src(f'{GRF}/palette/몸/{job}_{s}_{c}.pal') for c in CLOTH}
            pals = {c: p for c, p in pals.items() if p is None or os.path.exists(p)}  # the Clown has none
            cloth = [c for c in CLOTH if c in pals and (cloth is None or c in cloth)]
            for c, pal in pals.items():
                add(f'body/{slug}-{sx}-{c}', 'body', 'body', None, job, s, body + '.spr', body + '.act', pal, imf=True)
            for wid, wslug in WTYPES.items():
                path = f'{SPRITE}/인간족/{wjob}/{wjob}_{s}{doll.weapon_name[wid]}'
                if not (exists(path + '.spr') and exists(path + '.act')):
                    continue
                add(f'weapon/{slug}-{sx}-{wslug}', 'weapon', 'weapon', None, job, s, path + '.spr', path + '.act')
                t = attack_type(src(path + '.act'))
                if t is None:
                    attack_fallback += 1
                by_sex.setdefault(sx, {})[wslug] = t or 5
                if wslug not in weapons:
                    weapons.append(wslug)
        # The attack action differs by sex for some pairs (the Novice's female dagger is attack3,
        # the male's attack2), so the index has only attackTypeBySex: no per-class value a reader
        # could apply to the wrong sex.
        first = by_sex.get(sexes[0], {})
        for sx in sexes[1:]:
            attack_disagree += [f'{slug}-{sx}-{w}' for w, t in by_sex.get(sx, {}).items() if w in first and first[w] != t]
        row = {'slug': slug, 'sexes': sexes, 'cloth': cloth or [0], 'weapons': weapons, 'attackTypeBySex': by_sex}
        if of:
            row['of'] = of
        if slug in CART_CLASSES:
            row['cart'] = True
        classes.append(row)

    for n, name in enumerate(cart.NAMES):
        base = f'{SPRITE}/이팩트/{name}'
        add(f'cart/{n}', 'cart', 'cart', None, '초보자', '남', base + '.spr', base + '.act')

    for sx, s in SEXES.items():
        for h in range(1, HAIR_STYLES + 1):
            head = f'{SPRITE}/인간족/머리통/{s}/{h}_{s}'
            for c in range(9):
                pal = src(f'{GRF}/palette/머리/머리{h}_{s}_{c}.pal')
                add(f'head/{h}-{sx}-{c}', 'head', 'head', None, '초보자', s, head + '.spr', head + '.act', pal)

    # Items: every game item with a view id in a headgear or garment slot.
    items, missing, acc_done, robe_done, view_slot = {}, [], {}, {}, {}
    zkind_of = lambda slots: 'acc_upper' if 'upper' in slots else 'acc_mid' if 'mid' in slots else 'acc_lower'
    every = set(cls_sexes)
    for sid, it in sorted(fit.game.items(), key=lambda kv: int(kv[0])):
        slots = slots_of(sid, it['desc'], fit)
        view = fit.class_num.get(int(sid))
        if not slots or not view:
            continue
        has, why = {}, []
        if slots == ['garment']:
            name = fit.robe_name.get(view)
            if not name:
                why.append(f'robe view {view} not in RobeNameTable')
            else:
                no = []
                for cs in cls_sexes:
                    slug, sx = cs.rsplit('-', 1)
                    key = f'robe/{view}-{cs}'
                    if key not in robe_done:
                        files = fit.robe_files(name, SEXES[sx], body_of[slug])
                        robe_done[key] = bool(files)
                        if files:
                            add(key, 'robe', 'robe', view, body_of[slug], SEXES[sx], files[0], files[1], imf=True)
                    if robe_done[key]:
                        has[cs] = True
                    else:
                        no.append(cs)
                if no:
                    why.append(f'garment {name}: no sprite for ' + (', '.join(no) if len(no) < len(every) else 'any class'))
        else:
            name = fit.acc_name.get(view)
            if not name:
                why.append(f'headgear view {view} not in AccNameTable')
            else:
                zk = zkind_of(slots)
                if view_slot.setdefault(view, zk) != zk:
                    zk = view_slot[view]  # the first item with this view sets its draw slot
                no = []
                for sx, s in SEXES.items():
                    key = f'acc/{view}-{sx}'
                    if key not in acc_done:
                        base = f'{SPRITE}/악세사리/{s}/{s}{name}'
                        acc_done[key] = exists(base + '.spr') and exists(base + '.act')
                        if acc_done[key]:
                            add(key, 'acc', zk, view, '초보자', s, base + '.spr', base + '.act')
                    if acc_done[key]:
                        has.update({cs: True for cs in cls_sexes if cs.endswith('-' + sx)})
                    else:
                        no.append(sx)
                if no:
                    why.append(f'headgear {name}: no sprite for sex ' + '/'.join(no))
        items[sid] = {'slots': slots, 'view': view, 'has': has}
        if set(has) != every:
            missing.append({'id': int(sid), 'why': '; '.join(why) or 'no sprite'})
    index = {
        'v': 1,
        'classes': classes,
        'hair': {'styles': HAIR_STYLES, 'colours': hair_colours()},
        'clothZero': part.CLOTH_ZERO,
        'carts': len(cart.NAMES),
        'items': items,
    }
    coverage = {'itemsWithView': len(items), 'drawnEverywhere': len(items) - len(missing), 'missing': missing}
    notes = {'attackFallback': attack_fallback, 'attackDisagree': attack_disagree,
             'viewSlotConflicts': sum(1 for sid, it in items.items() if it['slots'] != ['garment']
                                      and zkind_of(it['slots']) != view_slot.get(it['view'], zkind_of(it['slots'])))}
    return specs, index, coverage, notes


def du(path):
    by = {}
    for d, _, fs in os.walk(path):
        for f in fs:
            top = os.path.relpath(d, path).split(os.sep)[0]
            if top not in FOLDERS:
                continue
            n, b = by.get(top, (0, 0))
            by[top] = (n + 1, b + os.path.getsize(os.path.join(d, f)))
    return by


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--jobs', type=int, default=max(1, (os.cpu_count() or 2) - 1))
    ap.add_argument('--only', default='', help='export only part keys starting with this (no index write)')
    args = ap.parse_args()
    t0 = time.time()
    specs, index, coverage, notes = wardrobe()
    if args.only:
        specs = [s for s in specs if s['key'].startswith(args.only)]
    old = {}
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding='utf-8') as f:
            old = json.load(f)
    code = code_signature()
    old_parts = old.get('parts', {}) if old.get('code') == code else {}
    todo, parts = [], {}
    for s in specs:
        sig = [stat(p) for p in s['sources']]
        prev = old_parts.get(s['key'])
        z = [s['zkind'], s['view']]  # a slot change in game-items changes the baked z
        if prev and prev['src'] == sig and prev.get('z') == z and all(
                os.path.exists(os.path.join(OUT, f"{s['key']}.{prev['hash']}.{ext}")) for ext in ('json', 'webp')):
            parts[s['key']] = prev
        else:
            todo.append((s, sig))
    print(f'{len(specs)} parts, {len(specs) - len(todo)} unchanged, {len(todo)} to export ({args.jobs} jobs)')
    failed = {}
    sig_of = {s['key']: sig for s, sig in todo}
    z_of = {s['key']: [s['zkind'], s['view']] for s, _ in todo}
    if todo:
        from multiprocessing import Pool
        with Pool(args.jobs) as pool:
            for n, (key, h, a, b) in enumerate(pool.imap_unordered(export_one, [s for s, _ in todo], chunksize=4), 1):
                if h is None:
                    failed[key] = a
                else:
                    parts[key] = {'src': sig_of[key], 'z': z_of[key], 'hash': h, 'json': a, 'webp': b}
                if n % 200 == 0 or n == len(todo):
                    print(f'  {n}/{len(todo)}  {time.time() - t0:.0f}s', flush=True)
    for key, err in sorted(failed.items()):
        print('FAILED', key, err)
    if args.only:
        print('--only: index and manifest not written')
        return

    # A part that failed draws nothing: take it out of `has`.
    for it in index['items'].values():
        view = it['view']
        for cs in list(it['has']):
            key = f'robe/{view}-{cs}' if it['slots'] == ['garment'] else f'acc/{view}-{cs.rsplit("-", 1)[1]}'
            if key in failed:
                del it['has'][cs]
    every = {f"{c['slug']}-{sx}" for c in index['classes'] for sx in c['sexes']}
    known = {m['id'] for m in coverage['missing']}
    for sid, it in index['items'].items():
        if set(it['has']) != every and int(sid) not in known:
            coverage['missing'].append({'id': int(sid), 'why': 'sprite failed to export'})
    coverage['missing'].sort(key=lambda m: m['id'])
    coverage['drawnEverywhere'] = coverage['itemsWithView'] - len(coverage['missing'])

    # Stale files from earlier builds go; the folder holds exactly this build.
    keep = {f'{k}.{p["hash"]}.{ext}' for k, p in parts.items() for ext in ('json', 'webp')}
    removed = 0
    for d, _, fs in os.walk(OUT):
        for f in fs:
            r = os.path.relpath(os.path.join(d, f), OUT).replace(os.sep, '/')
            if r.split('/')[0] in FOLDERS and r not in keep:
                os.remove(os.path.join(d, f))
                removed += 1

    index['files'] = {k: f'{k}.{parts[k]["hash"]}' for k in sorted(parts)}
    index['coverage'] = coverage
    with open(INDEX, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, separators=(',', ':'))
    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump({'v': 1, 'code': code, 'parts': {k: parts[k] for k in sorted(parts)}}, f, ensure_ascii=False,
                  separators=(',', ':'))

    by = du(OUT)
    total = sum(b for _, b in by.values())
    for top in sorted(by):
        print(f'  {top:7s} {by[top][0]:6d} files {by[top][1] / 2**20:8.1f} MB')
    print(f'  total   {sum(n for n, _ in by.values()):6d} files {total / 2**20:8.1f} MB  (removed {removed} stale)')
    print(f"attackType: {notes['attackFallback']} fallback to 5, {len(notes['attackDisagree'])} m/f disagreements"
          f"{' ' + ', '.join(notes['attackDisagree'][:10]) if notes['attackDisagree'] else ''}")
    print(f"headgear views worn in different slots by different items: {notes['viewSlotConflicts']}")
    print(f"itemsWithView {coverage['itemsWithView']}  drawnEverywhere {coverage['drawnEverywhere']}  "
          f"missing {len(coverage['missing'])}  failed {len(failed)}  ({time.time() - t0:.0f}s)")


if __name__ == '__main__':
    main()
