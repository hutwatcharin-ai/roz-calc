"""Pictures for the October 2026 events page (/news/events-2026-10), out of
the client's own files: NPC sprites by their navi_npc sprite id (resolved
through npcidentity.lub), the event monsters, the collab illustration, the
farm map and the two produce icons.

Run: python scripts/build-event-2026-10-images.py
Reads D:/data_grf_comparison_20261001/extracted (the 1 Oct 2026 patch) and
D:/data_grf_extracted/files (the 22 Sep 2026 client) for older sprites.
"""
import io, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import lub
from ro_sprite import Spr, Act, render

NEW = r'D:\data_grf_comparison_20261001\extracted'
OLD = r'D:\data_grf_extracted\files'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'events', '2026-10')
os.makedirs(OUT, exist_ok=True)

# npc sprite id (navi_npc column 4) -> output name
NPCS = {
    10668: 'kumamon', 654: 'barmundt', 755: 'raymond', 919: 'yen', 932: 'anselm',
    3030: 'dark-figure', 494: 'al-noma', 1511: 'amon-ra', 794: 'apep', 22380: 'watermelon-poring',
}


def first(*paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None


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


# npcidentity: JT_ name -> id
L = lub.runtime()
lub.load(L, first(NEW + r'\changed\data\luafiles514\lua files\datainfo\npcidentity.lub',
                  OLD + r'\data\luafiles514\lua files\datainfo\npcidentity.lub'))
ident = None
for k, v in L.globals().items():
    if 'npcidentity' in str(k).lower() or 'jobtbl' in str(k).lower():
        ident = v
        break
by_id = {}
for k, v in ident.items():
    by_id[int(v)] = (k.decode() if isinstance(k, bytes) else str(k))
for sid, out in NPCS.items():
    jt = by_id.get(sid)
    if not jt:
        print('no JT for', sid, out)
        continue
    name = jt[3:].lower() if jt.startswith('JT_') else jt.lower()
    base = sprite_paths('npc', name) or sprite_paths('몬스터', name)
    if not base:
        print('no sprite for', sid, jt)
        continue
    save_sprite(base, out)

# Event monsters and pets new in this patch.
# The fields you harvest on the farm (navi_npc sprites 10666/10667).
for name, out in (('clb_k_mob1', 'watermelon-field'), ('clb_k_mob2', 'tomato-field')):
    base = sprite_paths('몬스터', name)
    if base:
        save_sprite(base, out)

# Illustration, farm map, produce icons.
ui = NEW + r'\added\data\texture\유저인터페이스'
Image.open(ui + r'\illust\k_collabo_jp_01.png').save(os.path.join(OUT, 'kumamon-collab.png'))
Image.open(ui + r'\map\clb_kuma.bmp').convert('RGB').save(os.path.join(OUT, 'clb_kuma.webp'), quality=82)
for icon, out in (('clb_k_water', 'kumamoto-watermelon'), ('clb_k_toma', 'kumamoto-tomato')):
    im = Image.open(ui + rf'\item\{icon}.bmp').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][:3] == (255, 0, 255):
                px[x, y] = (0, 0, 0, 0)
    im.save(os.path.join(OUT, out + '.png'))
print('done')
