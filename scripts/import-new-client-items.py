"""Adds items that the live client knows and our items table does not.

Written for the 1 Oct 2026 patch (owner: "add the new items"): 88 ids appeared
in the client's own item table (System/itemInfo_data.lub + iteminfo_*.lub);
the Kumamon, Baphomet Cult, Amon Ra, Baby Shark, gacha and guild-event
costumes, boxes and tickets.

Every field comes from the client:
  name_en      data/game-items.json (the Thai client's display name, which
               is the English name the site already uses everywhere)
  description  iteminfo_enUS.lub, colour codes removed
  category     costume flag -> Costume Equipment; Box/Pack/Package ->
               Package/Box; everything else -> Other (what the table uses for
               event tickets, Get Poring devices and quest boxes)
  weapon_type  the costume's "Position" line, mapped to the table's labels
  required_level, slots  from the description / itemInfo_data
  icon         texture/유저인터페이스/item/<resource>.bmp from the patch's
               extracted GRF or the 22 Sep one, magenta made transparent;
               none found -> icon_url null (ItemIcon draws a placeholder)
Items whose name is blank in the client are skipped (not live yet).

Run: python scripts/import-new-client-items.py [--apply]
"""
import json, os, re, sys, urllib.request
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import lub

APPLY = '--apply' in sys.argv
ROOT = os.path.join(os.path.dirname(__file__), '..')
SYSTEM = r'D:\RagnarokZero\System'
from grf_snapshots import weekly_roots  # noqa: E402
ICON_DIRS = [
    # Every GrfDiffTool snapshot, newest first (no date to edit per patch).
    *(f'{root}/texture/유저인터페이스/item' for root in weekly_roots()),
    # 15 Oct 2026 patch, read with tools/grf-extract.mjs (flag-1 icons only).
    r'D:\Data grf roz\grf-2026-10-15-icons\files\data\texture\유저인터페이스\item',
    r'D:\data_grf_comparison_20261001\extracted\added\data\texture\유저인터페이스\item',
    r'D:\data_grf_comparison_20261001\extracted\changed\data\texture\유저인터페이스\item',
    r'D:\Data grf roz\data_grf_extracted\files\data\texture\유저인터페이스\item',
]
POSITION = {
    'Upper': 'Upper Head', 'Middle': 'Mid Head', 'Lower': 'Lower Head', 'Garment': 'Garment',
    'Upper, Middle': 'Upper/Mid Head', 'Middle, Lower': 'Mid/Lower Head', 'Upper, Lower': 'Upper/Lower Head',
    'Upper, Middle, Lower': 'All Head Slots',
}

env = {}
for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/items'


def http(method, url, key, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json',
                                          'Prefer': 'return=minimal'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or b'null')


def strip(s):
    return re.sub(r'\^[0-9A-Fa-f]{6}', '', str(s)).strip()


def position(lines, label):
    """The slots a "Position : X" line names. 29 Oct 2026: some lines run on
    ("Position : Middle/Lower Weight : 0") or have no colon; "/" joins slots."""
    for l in lines:
        m = re.match(label + r'\s*:?\s*([A-Za-z ,/]+?)\s*(?:Weight\b.*)?$', l)
        if m:
            return ', '.join(x.strip() for x in m.group(1).replace('/', ',').split(',') if x.strip())
    return None


def table(path, name):
    L = lub.runtime()
    lub.load(L, path)
    return {int(k): lub.to_py(v) for k, v in L.globals()[name.encode()].items()}


game = json.load(open(os.path.join(ROOT, 'data', 'game-items.json'), encoding='utf-8'))['items']
have = set()
for off in range(0, 20000, 1000):
    page = http('GET', f'{URL}?select=id&order=id&offset={off}&limit=1000', env['SUPABASE_SERVICE_ROLE_KEY'])
    have.update(r['id'] for r in page)
    if len(page) < 1000:
        break

data = table(os.path.join(SYSTEM, 'itemInfo_data.lub'), 'tbl_data')
en = table(os.path.join(SYSTEM, 'iteminfo_enUS.lub'), 'tbl_string')

rows = []
for sid, g in game.items():
    iid = int(sid)
    if iid in have or not g['name'].strip():
        continue
    e = en.get(iid, {})
    lines = [strip(e['identifiedDescriptionName'][k]) for k in sorted(e.get('identifiedDescriptionName') or {})]
    lines = [l for l in lines if l and l != '_']
    desc = ' '.join(lines)
    pos = position(lines, 'Position')
    if pos not in POSITION:
        # 15 Oct 2026: some new costumes have an English text without the
        # Position line; the Thai text still says "ตำแหน่ง : Upper".
        th = [strip(l) for l in g.get('desc') or []]
        pos = position(th, 'ตำแหน่ง')
    lvl = next((l.split(':', 1)[1].strip() for l in lines if l.startswith('Required Level')), None)
    d = data.get(iid, {})
    name = g['name'].strip()
    if g['costume'] or d.get('costume'):
        cat = 'Costume Equipment'
    elif re.search(r'\b(Box|Pack|Package)\b', name):
        cat = 'Package/Box'
    else:
        cat = 'Other'
    # 29 Oct 2026: the patch brought real gear (capes) and cards, not only
    # costumes and boxes. Their "Type : Garment" / "Class : Card" line decides.
    kind = next((m.group(1) for l in lines for m in [re.match(r'(?:Type|Class)\s*:\s*(\w+)', l)] if m), None)
    if cat == 'Other' and kind == 'Card':
        cat = 'Card'
    elif cat == 'Other' and kind in ('Garment', 'Armor', 'Shoes', 'Shield', 'Headgear', 'Accessory'):
        cat = 'Armor'
    jobs = next((l.split(':', 1)[1].strip() for l in lines if l.startswith('Equippable by')), None)
    res = d.get('identifiedResourceName')
    icon = None
    for folder in ICON_DIRS:
        p = os.path.join(folder, f'{res}.bmp') if res else None
        if p and os.path.exists(p):
            im = Image.open(p).convert('RGBA')
            px = im.load()
            for y in range(im.height):
                for x in range(im.width):
                    if px[x, y][:3] == (255, 0, 255):
                        px[x, y] = (0, 0, 0, 0)
            out = os.path.join(ROOT, 'public', 'images', 'items', f'{iid}.png')
            if APPLY:
                im.save(out)
            icon = f'/images/items/{iid}.png'
            break
    rows.append({
        'id': iid, 'name_en': name, 'category': cat,
        'weapon_type': POSITION.get(pos) if cat == 'Costume Equipment' else ('Card' if cat == 'Card' else None),
        'required_level': int(lvl) if lvl and lvl.isdigit() else None,
        'slots': d.get('slotCount') or 0,
        'equippable_classes': [j.strip() for j in jobs.split(',')] if cat == 'Armor' and jobs else [],
        'icon_url': icon, 'description': desc or None,
    })

for r in rows:
    print(f"{r['id']:>8} {r['category']:18} {str(r['weapon_type']):14} icon={'Y' if r['icon_url'] else '-'} {r['name_en']}")
print(len(rows), 'to add;', sum(1 for r in rows if r['icon_url']), 'with icons')
if APPLY and rows:
    http('POST', URL, env['SUPABASE_SERVICE_ROLE_KEY'], rows)
    print('inserted')
