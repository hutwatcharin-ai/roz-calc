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
    url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    codes, start = set(), 0
    while True:
        req = urllib.request.Request(
            f'{url}/rest/v1/map_stats?select=map_code&order=map_code',
            headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Range': f'{start}-{start + 999}'},
        )
        rows = json.load(urllib.request.urlopen(req))
        codes.update(r['map_code'] for r in rows)
        if len(rows) < 1000:
            return codes
        start += 1000


def gat_size(code):
    path = os.path.join(DATA, code + '.gat')
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
    pic = code if os.path.exists(os.path.join(MINI, code + '.bmp')) else base(code)
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

used = {e['to'] for m in out.values() for e in m['exits']} | {f for m in out.values() for f, _ in m['from']}
with open(OUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(
        {
            '_meta': {'how': 'python scripts/build-map-warps.py', 'maps': len(out), 'source': 'client navi_link_data, .gat sizes, minimaps, mapnametable_enus'},
            'maps': out,
            'names': {c: names[c] for c in sorted(used | set(out)) if c in names},
        },
        f,
        ensure_ascii=False,
        separators=(',', ':'),
    )
print(f'{len(out)} map pages with warps, {made} new pictures -> {os.path.normpath(OUT_JSON)}')
