"""Warp points for each map page: where the exits are, and the minimap to
draw them on (owner, 5 Oct 2026: "show the warps that connect the maps").

Inputs, all from the game client:
  data/map-links.json         every walkable warp (scripts/build-map-links.py)
  <grf>/<code>.gat            the map's size in cells, to place a warp
  <grf>/texture/유저인터페이스/map/<code>.bmp
                              the 512 px minimap. The client scales the map
                              to fit 512 on its long side and centres it; the
                              rest is pure magenta, made transparent here.
  <grf>/mapnametable_enus.txt names for maps the site has no page for
                              (towns, interiors: "Prontera Market Street")

Only maps with a page on the site get a picture (map_stats in the
database). A channel copy (gef_f10_a) shares its base map's picture and its
warps are counted on the page it folds into.

Writes data/map-warps.json and public/images/maps/navi/<code>.webp.

Run: python scripts/build-map-warps.py [path-to-grf-data]
"""
import json
import os
import re
import struct
import sys
import urllib.request

from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = sys.argv[1] if len(sys.argv) > 1 else r'D:\Data grf roz\data_grf_extracted\files\data'
MINI = os.path.join(DATA, 'texture', '유저인터페이스', 'map')
OUT_JSON = os.path.join(ROOT, 'data', 'map-warps.json')
OUT_IMG = os.path.join(ROOT, 'public', 'images', 'maps', 'navi')
os.makedirs(OUT_IMG, exist_ok=True)


def env(name):
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    raise SystemExit(f'{name} missing from .env.local')


def page_codes():
    """Map codes with a page, and the name each page shows."""
    url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    codes, start = {}, 0
    while True:
        req = urllib.request.Request(
            f'{url}/rest/v1/map_stats?select=map_code,map_display_name&order=map_code',
            headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Range': f'{start}-{start + 999}'},
        )
        rows = json.load(urllib.request.urlopen(req))
        codes.update({r['map_code']: r['map_display_name'] for r in rows})
        if len(rows) < 1000:
            return codes
        start += 1000


# resnametable.txt points one map name at another map's files: the boss room
# b_sp_d05 is drawn from in_sphinx5, gld_dun01_2 from gld_dun01, the
# channel nrd_d01_a from nrd_dun01. Those names have no .gat or minimap of
# their own, so without it they had no picture and no size.
alias = {}
for line in open(os.path.join(DATA, 'resnametable.txt'), encoding='latin-1'):
    m = re.match(r'^([\w@\-]+)\.gat#([\w@\-]+)\.gat#', line)
    if m and m.group(1).lower() != m.group(2).lower():
        alias[m.group(1).lower()] = m.group(2).lower()


def files_of(code):
    return alias.get(code, code)


def gat_size(code):
    path = os.path.join(DATA, files_of(code) + '.gat')
    if not os.path.exists(path):
        return None
    head = open(path, 'rb').read(14)
    return struct.unpack('<ii', head[6:14])


names = {}
for line in open(os.path.join(DATA, 'mapnametable_enus.txt'), encoding='utf-8', errors='replace'):
    m = re.match(r'^([\w@\-]+)\.rsw#([^#]+)#', line)
    if m:
        names[m.group(1)] = m.group(2).strip()

links_file = json.load(open(os.path.join(ROOT, 'data', 'map-links.json'), encoding='utf-8'))
channel_of = links_file['channelOf']
base = lambda c: channel_of.get(c, c)  # noqa: E731
pages = page_codes()


def spawn_names():
    """The name a map page shows: monster_spawns.map_display_name ("Orc Village"
    for gef_fild10, where map_stats says only "Geffen Field")."""
    url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    found, start = {}, 0
    while True:
        req = urllib.request.Request(
            f'{url}/rest/v1/monster_spawns?select=map_code,map_display_name&map_display_name=not.is.null&order=map_code',
            headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Range': f'{start}-{start + 999}'},
        )
        rows = json.load(urllib.request.urlopen(req))
        for r in rows:
            found.setdefault(r['map_code'], r['map_display_name'])
        if len(rows) < 1000:
            return found
        start += 1000


for code, shown in spawn_names().items():
    if code in pages:
        pages[code] = shown

# map-links.json only knows the channel copies that appear in a warp. A page
# for pay_d00_z (built on pay_dun00) has none, so read its .rsw the same way.
for page in pages:
    if page in channel_of:
        continue
    rsw = os.path.join(DATA, page + '.rsw')
    if os.path.exists(rsw):
        found = re.findall(rb'([\w@\-]+)\.gnd', open(rsw, 'rb').read(400))
        if found and found[0].decode().lower() != page.lower():
            channel_of[page] = found[0].decode().lower()

linked = {l[0] for l in links_file['links']} | {l[3] for l in links_file['links']}
for page in pages:
    if page in channel_of or page in linked:
        continue
    # A boss room (b_sp_d05) is another map's files under its own name and
    # stands where that floor stands. A page with a floor of its own and its
    # own warps (gld_dun01_2) is left alone: folding it into gld_dun01 would
    # drop the stairs between the two.
    if page in alias:
        # The channels drawn from the same files may already know the floor
        # they belong to (sp_d05_z and b_sp_d05 are both in_sphinx5, filed
        # under rin_sphinx5); join them there rather than start a new one.
        twins = [channel_of[s] for s, f in alias.items() if f == alias[page] and s in channel_of]
        channel_of[page] = twins[0] if twins else alias[page]
    # Two pages carry a stray underscore (gef_fild03_, moc_fild17_) on a code
    # the game has without one.
    elif page.endswith('_') and os.path.exists(os.path.join(DATA, page.rstrip('_') + '.gat')):
        channel_of[page] = page.rstrip('_')

# Nordfeld is in the client's maps but not in the Global navigation table;
# the Korean table shipped beside it (navi_link.lub) has its warps. Read it
# only for maps the Global table says nothing about, so Global data wins
# wherever it exists. Its channel names (nrd_d01_a) resolve through
# resnametable to the page they belong to.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lub  # noqa: E402

KR_FIELDS = (1, 7, 8, 9, 3)  # from, x, y, to, kind
known = {base(l[0]) for l in links_file['links']}
kr_lua = lub.runtime()
lub.load(kr_lua, os.path.join(DATA, 'luafiles514', 'lua files', 'navigation', 'navi_link.lub'))
norm = lambda c: c if c in pages else alias.get(c, c)  # noqa: E731
kr_added = 0
page_bases = {base(p) for p in pages}
for _, row in kr_lua.globals().Navi_Link.items():
    r = lub.to_py(row)
    frm, x, y, to, kind = (r.get(i) for i in KR_FIELDS)
    if kind not in (200, 201) or not isinstance(frm, str) or not isinstance(to, str):
        continue
    frm, to = norm(frm.lower()), norm(to.lower())
    if frm == to or base(frm) in known:
        continue
    if base(frm) not in page_bases:
        continue
    links_file['links'].append([frm, int(x or 0), int(y or 0), to, kind])
    kr_added += 1
print(f'{kr_added} warps from the Korean navigation table')

# The navigation table names the base map (moc_fild12) while the site may
# only have pages for its channel copies (moc_f12_a, _b, _z): a warp belongs
# to every page built on the map it stands on.
channels = {}
for page in pages:
    channels.setdefault(base(page), []).append(page)


def homes(code):
    # The map itself when it has a page, and every channel page built on it
    # (pay_d00_z, the Challenge copy of pay_dun00, is a page of its own).
    found = set(channels.get(base(code), []))
    if code in pages:
        found.add(code)
    return sorted(found, key=lambda c: (c != code, c))


def page_for(code):
    found = homes(code)
    return found[0] if found else code


maps = {}
for frm, x, y, to, kind in links_file['links']:
    dest = page_for(to)
    for home in homes(frm):
        if base(dest) == base(home):
            continue
        entry = maps.setdefault(home, {'exits': {}, 'from': set(), 'navi': {}})
        pts = entry['exits'].setdefault(f'{dest}|{kind}', [])
        if [x, y] not in pts:
            pts.append([x, y])
        # The code /navi knows for this warp: the map it is listed on.
        entry['navi'].setdefault(f'{dest}|{kind}', frm)
for frm, x, y, to, kind in links_file['links']:
    src = page_for(frm)
    for dest in homes(to):
        if dest in maps and base(src) != base(dest):
            maps[dest]['from'].add(src)

out = {}
made = 0
for code, entry in sorted(maps.items()):
    pic = next(
        (c for c in (code, files_of(code), base(code), files_of(base(code))) if os.path.exists(os.path.join(MINI, c + '.bmp'))),
        code,
    )
    size = gat_size(code) or gat_size(base(code))
    bmp = os.path.join(MINI, pic + '.bmp')
    if not size or not os.path.exists(bmp):
        continue
    w, h = size
    target = os.path.join(OUT_IMG, pic + '.webp')
    if not os.path.exists(target):
        a = np.array(Image.open(bmp).convert('RGBA'))
        magenta = (a[:, :, 0] > 240) & (a[:, :, 1] < 16) & (a[:, :, 2] > 240)
        a[magenta, 3] = 0
        Image.fromarray(a).save(target, 'WEBP', quality=82, method=6)
        made += 1
    exits = []
    for key, pts in entry['exits'].items():
        dest, kind = key.rsplit('|', 1)
        exits.append({'to': dest, 'kind': int(kind), 'pts': sorted(pts), 'navi': entry['navi'][key], 'page': dest in pages})
    out[code] = {'w': w, 'h': h, 'pic': pic, 'exits': exits, 'from': [[f, f in pages] for f in sorted(entry['from'])]}

# Maps the English name table has not caught up with (Nordfeld is only in the
# Korean table, as 노르트펠트).
EXTRA_NAMES = {'nordfeld': 'Nordfeld'}


# Several maps share one name ("Geffen Field" is gef_fild00 to 14); a list of
# three "Geffen Field" says nothing, so a shared name carries its code.
def shown_names(codes):
    raw = {c: pages.get(c) or names.get(c) or EXTRA_NAMES.get(c) for c in codes}
    raw = {c: n for c, n in raw.items() if n}
    # Channel copies of one map (gef_fild10, gef_f10_a) are not a clash.
    count = {}
    for n in {(base(c), n) for c, n in raw.items()}:
        count[n[1]] = count.get(n[1], 0) + 1
    return {c: (f'{n} ({c})' if count[n] > 1 else n) for c, n in sorted(raw.items())}


used = {e['to'] for m in out.values() for e in m['exits']} | {f for m in out.values() for f, _ in m['from']}
with open(OUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(
        {
            '_meta': {'how': 'python scripts/build-map-warps.py', 'maps': len(out), 'source': 'client navi_link_data, .gat sizes, minimaps, mapnametable_enus'},
            'maps': out,
            # The site's own page name first ("Orc Village"): the client calls
            # every Geffen field "Geffen Field", which says nothing in a list.
            'names': shown_names(used | set(out)),
        },
        f,
        ensure_ascii=False,
        separators=(',', ':'),
    )
print(f'{len(out)} map pages with warps, {made} new pictures -> {os.path.normpath(OUT_JSON)}')
