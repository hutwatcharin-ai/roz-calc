"""NPC pictures for /news/patch-2026-11-26 (A Hard Choice, Bug Extermination),
out of the client's own files: each NPC by its navi_npc sprite id, resolved
through npcidentity.lub, the same way as build-event-2026-11-images.py.

The sprite ids come from the 26 Nov 2026 client's navi_npc.lub, matched on
the coordinates the official event notices give:
  comodo 33/212      sprite 707  Guard Ars
  beach_dun 242/67   sprite 575  Old Woman Enko
  cmd_fild08 326/323 sprite 943  Guillon
  anthell01 53/246   sprite 940  Lyrias

Run: python scripts/build-event-2026-11-26-images.py
Reads every GrfDiffTool snapshot (newest first), then the full 22 Sep 2026
extract for older sprites. Writes PNGs only; no raw game file leaves those
folders.
"""
import os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import lub
from ro_sprite import Spr, Act, render
from grf_snapshots import weekly_roots

ROOTS = [*weekly_roots(), r'D:\Data grf roz\data_grf_extracted\files\data']
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'events', '2026-11-26')
os.makedirs(OUT, exist_ok=True)

NPCS = {707: 'guard-ars', 575: 'enko', 943: 'guillon', 940: 'lyrias'}


def find(rel):
    for root in ROOTS:
        p = os.path.join(root, rel)
        if os.path.exists(p):
            return p
    return None


def sprite_base(folder, name):
    for root in ROOTS:
        base = os.path.join(root, 'sprite', folder, name)
        if os.path.exists(base + '.spr') and os.path.exists(base + '.act'):
            return base
    return None


def save_sprite(base, out_name, scale=2):
    spr, act = Spr(base + '.spr'), Act(base + '.act')
    img = render([(spr, act, False)], 0, 0, size=(400, 400), origin=(200, 300))
    box = img.getbbox()
    if box:
        img = img.crop(box)
    img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    img.save(os.path.join(OUT, out_name + '.png'))
    print('wrote', out_name, img.size)


L = lub.runtime()
lub.load(L, find(os.path.join('luafiles514', 'lua files', 'datainfo', 'npcidentity.lub')))
by_id = {}
for k, v in L.globals().items():
    if 'npcidentity' in str(k).lower() or 'jobtbl' in str(k).lower():
        for jt, sid in v.items():
            by_id[int(sid)] = jt.decode() if isinstance(jt, bytes) else str(jt)
        break

for sid, out in NPCS.items():
    jt = by_id.get(sid)
    if not jt:
        print('no JT for', sid, out)
        continue
    name = jt[3:].lower() if jt.startswith('JT_') else jt.lower()
    base = sprite_base('npc', name) or sprite_base('몬스터', name)
    if not base:
        print('no sprite for', sid, jt)
        continue
    save_sprite(base, out)
print('done')
