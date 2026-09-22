"""Every walkable warp in the game, from the client's navigation table.

luafiles514/lua files/navigation/navi_link_data.lub (inside data.grf) lists
each portal and warp NPC the in-game /navi knows: the map and cell it stands
on, and the map it sends you to. The world map reads it to find which field
each dungeon opens from and the order of its floors, instead of a hand-kept
list that showed Pyramids as one floor.

Field 3 of a row is its kind: 200 a portal, 201 a warp NPC (a guard, a
boatman), 204 the Kafra teleport service. Kafra rows are dropped: they join
every town to every other, and would make every dungeon "open from" every
town.

Channel copies (bea_d03_a, pry_d01_z) name the map they are built on inside
their .rsw; that base map is recorded too, so a warp into a channel counts as
a warp into its floor.

Writes data/map-links.json:
  { links: [[fromMap, x, y, toMap, kind], ...], channelOf: { channelCode: baseCode } }
(kind 200 portal, 201 warp NPC)

Run: python scripts/build-map-links.py [path-to-grf-data]
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402

DATA = sys.argv[1] if len(sys.argv) > 1 else r'D:\data_grf_extracted\files\data'
SRC = os.path.join(DATA, 'luafiles514', 'lua files', 'navigation', 'navi_link_data.lub')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'map-links.json')
WALKABLE = {200, 201}

L = lub.runtime()
err = lub.load(L, SRC)
rows = L.globals().Navi_Link_data
if rows is None:
    raise SystemExit(f'no Navi_Link_data ({err})')

links = set()
maps = set()
for _, row in rows.items():
    r = lub.to_py(row)
    src, dst = r.get(1), r.get(7)
    if r.get(3) not in WALKABLE or not isinstance(src, str) or not isinstance(dst, str) or src == dst:
        continue
    links.add((src, int(r.get(5) or 0), int(r.get(6) or 0), dst, r.get(3)))
    maps.update((src, dst))

channel_of = {}
for code in sorted(maps):
    path = os.path.join(DATA, f'{code}.rsw')
    if not os.path.exists(path):
        continue
    found = re.findall(rb'([\w@\-]+)\.gnd', open(path, 'rb').read(400))
    base = found[0].decode().lower() if found else None
    if base and base != code.lower():
        channel_of[code] = base

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'links': sorted(links), 'channelOf': channel_of}, f, separators=(',', ':'))
print(f'{len(links)} links, {len(channel_of)} channel maps -> {os.path.normpath(OUT)}')
