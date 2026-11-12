"""Pictures for /news/patch-2026-11-12, out of the client's own files: the
Ant Hell memorial NPC by its navi_npc sprite id (resolved through
npcidentity.lub), copied from build-event-2026-11-images.py.

Run: py -3 scripts/build-patch-2026-11-12-images.py
Reads D:/Data grf roz/weekly/2026-11-12 and the 22 Sep extract for older
sprites. Writes PNGs only; no raw game file leaves those folders.
"""
import os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import lub
from ro_sprite import Spr, Act, render

NEW = r'D:\Data grf roz\weekly\2026-11-12'
OLD = r'D:\Data grf roz\data_grf_extracted\files'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'events', '2026-11-12')
os.makedirs(OUT, exist_ok=True)

# npc sprite id (navi_npc column 4) -> output name
NPCS = {
    # Ant Hell memorial entrance, /navi prt_fild06 37/197 (official notice 189)
    702: 'memorial-member',
    # Joh the Card Collector, Hunting Season exchange (official event 194):
    # /navi morocc 167/97 and payon 177/107
    556: 'card-collector',
    # Yakt <Raid Manager>, Blessing exchange (official event 193): moc_para01 22/35
    855: 'raid-manager',
}
# Event monsters: sprite file name -> output name
MOBS = {}


def sprite_paths(folder, name):
    for root in (NEW + r'\added', NEW + r'\changed', OLD):
        base = os.path.join(root, 'data', 'sprite', folder, name)
        if os.path.exists(base + '.spr') and os.path.exists(base + '.act'):
            return base
    return None


def crop(img):
    box = img.getbbox()
    return img.crop(box) if box else img


def save_sprite(base, out_name, scale=2):
    spr, act = Spr(base + '.spr'), Act(base + '.act')
    img = crop(render([(spr, act, False)], 0, 0, size=(400, 400), origin=(200, 300)))
    if scale != 1:
        img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    img.save(os.path.join(OUT, out_name + '.png'))
    print('wrote', out_name, img.size)


L = lub.runtime()
lub.load(L, NEW + r'\changed\data\luafiles514\lua files\datainfo\npcidentity.lub')
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
    base = sprite_paths('npc', name) or sprite_paths('몬스터', name)
    if not base:
        print('no sprite for', sid, jt, '(missing or encrypted)')
        continue
    save_sprite(base, out)

for name, out in MOBS.items():
    base = sprite_paths('몬스터', name)
    if base:
        save_sprite(base, out)
    else:
        print('no monster sprite', name)
print('done')
