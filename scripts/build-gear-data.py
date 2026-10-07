"""Equipment and cards for the build simulator: data/build-gear.json.

The simulator (/tools/build, owner 6 Oct 2026) needs, per piece: where it
goes, weapon type and level, base ATK/MATK/DEF/MDEF, card slots, the level
and classes that can wear it, and its refine schedule. Those come from the
roz.prontera.info item records (docs/prontera-build-planner-2026-10-06,
local only); names and icons come from our own items table so they match
the rest of the site. What each piece does is data/item-effects.json.

Only items our table has and the live client knows (data/game-absent-items
is applied on the page side through the same ids).

Run: python scripts/build-gear-data.py
"""
import glob
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'prontera-build-planner-2026-10-06', 'data', 'items')
OUT = os.path.join(ROOT, 'data', 'build-gear.json')


def env(name):
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    raise SystemExit(f'{name} missing')


def ours():
    url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    rows, start = {}, 0
    while True:
        req = urllib.request.Request(
            f'{url}/rest/v1/items?select=id,name_en,icon_url,category&category=in.("Weapon","Armor","Card")&order=id',
            headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Range': f'{start}-{start + 999}'},
        )
        batch = json.load(urllib.request.urlopen(req))
        rows.update({r['id']: r for r in batch})
        if len(batch) < 1000:
            return rows
        start += 1000


absent = set()
absent_file = os.path.join(ROOT, 'data', 'game-absent-items.json')
if os.path.exists(absent_file):
    raw = json.load(open(absent_file, encoding='utf-8'))
    ids = raw.get('ids', raw) if isinstance(raw, dict) else raw
    absent = {int(i) for i in (ids if isinstance(ids, list) else ids.keys())}

def group(g):
    """A set bonus group in item-effects.json's shape: {c: condition, b: [bonus tuples]}."""
    c = {}
    if g.get('refine_min'):
        c['refine'] = g['refine_min']
    if g.get('refine_sum_min'):
        c['refineSum'] = g['refine_sum_min']
    if g.get('min_base_level'):
        c['level'] = g['min_base_level']
    if g.get('siege_only'):
        c['siege'] = True
    if g.get('condition_class_slugs'):
        c['classes'] = g['condition_class_slugs']
    if g.get('proc_trigger'):
        c['proc'] = g['proc_trigger']
    if g.get('is_event_limited'):
        c['event'] = True
    b = []
    for x in g.get('bonuses') or []:
        target = x.get('target')
        if target and x.get('target_kind') and x['target_kind'] != 'player':
            target = f"{x['target_kind']}:{target}"
        row = [x['bonus_type'], x['value'], target, x.get('per_refine_levels'), x.get('target_skill')]
        if x.get('scaling_skill'):
            row.append(x['scaling_skill'])
        b.append(row)
    return {'c': c, 'b': b, 't': g.get('effect_text') or ''}


site = ours()
gear, cards, slug_id = {}, {}, {}
for path in sorted(glob.glob(os.path.join(SRC, '*.json'))):
    rec = json.load(open(path, encoding='utf-8'))
    it = rec['item']
    iid = it.get('item_id_ingame')
    if isinstance(iid, int) and it.get('slug'):
        slug_id[it['slug']] = iid
    if not isinstance(iid, int) or iid not in site or iid in absent:
        continue
    slots = it.get('equip_slots') or []
    if rec['section'] == 'cards':
        if slots:
            cards[str(iid)] = {'n': site[iid]['name_en'], 'on': slots[0], 'i': site[iid]['icon_url']}
        continue
    if not slots or slots == ['ammo']:
        continue
    classes = sorted({c['slug'] for c in rec.get('required_classes') or []})
    entry = {
        'n': site[iid]['name_en'],
        'i': site[iid]['icon_url'],
        'on': slots,
        'sl': it.get('slots') or 0,
    }
    for key, field in (('wt', 'weapon_type'), ('wl', 'weapon_level'), ('atk', 'physical_attack'), ('matk', 'magic_attack'),
                       ('def', 'physical_defense'), ('mdef', 'magic_defense'), ('lv', 'min_level'), ('rs', 'refine_schedule')):
        if it.get(field) not in (None, 0, ''):
            entry[key] = it[field]
    if classes:
        entry['cls'] = classes
    gear[str(iid)] = entry

# Sets and card combos: active when every piece is worn (prontera's rule,
# 04-items-cards-refine-options.md). A set with a piece we do not carry can
# never complete here, so it is left out rather than shown half.
# Enchant and costume stones count as worn pieces too (Critical Stones,
# Variable Casting Stones).
stones = set(json.load(open(os.path.join(ROOT, 'data', 'build-enchants.json'), encoding='utf-8'))['stones'])
sets = []
raw_sets = json.load(open(os.path.join(SRC, '..', 'item-sets.json'), encoding='utf-8'))['sets']
for s in raw_sets:
    ids = [slug_id.get(p) for p in s['piece_slugs']]
    if not ids or any(i is None or (str(i) not in gear and str(i) not in cards and str(i) not in stones) for i in ids):
        continue
    sets.append({'n': s['name'], 'ids': ids, 'g': [group(g) for g in s['bonus_groups']]})

# Sets prontera does not list, read from the client's own Thai item text
# ("เมื่อสวมใส่ร่วมกับ ..."), found checking rozeroplanner's set list on
# 7 Oct 2026. rozeroplanner's own numbers are not used: its Toad + Roda Frog
# says MaxHP +300 where the card text says FLEE +18.
def stat_pair(name, ids, a, b):
    return {'n': name, 'ids': ids, 'g': [{'c': {}, 'b': [[a, 3, None, None, None], [b, 3, None, None, None]]}]}


CLIENT_SETS = [
    {'n': 'Pantie & Undershirt', 'ids': [2339, 2522], 'g': [{'c': {}, 'b': [['agi', 5, None, None, None], ['flee', 10, None, None, None]]}]},
    {'n': 'Gentleman Staff & Magician Hat', 'ids': [1629, 5045],
     'g': [{'c': {}, 'b': [['dex', 2, None, None, None], ['int', 2, None, None, None], ['sp_recovery_percent', 5, None, None, None]]}]},
    {'n': 'Toad & Roda Frog Card', 'ids': [4306, 4014], 'g': [{'c': {}, 'b': [['flee', 18, None, None, None]]}]},
    stat_pair('Change STR (Middle) & (Lower)', [25003, 25012], 'int', 'dex'),
    stat_pair('Change INT (Middle) & (Lower)', [25005, 25013], 'dex', 'vit'),
    stat_pair('Change DEX (Middle) & (Lower)', [25007, 25010], 'vit', 'agi'),
    stat_pair('Change VIT (Middle) & (Lower)', [25006, 25008], 'agi', 'luk'),
    stat_pair('Change AGI (Middle) & (Lower)', [25004, 25009], 'luk', 'str'),
    stat_pair('Change LUK (Middle) & (Lower)', [25002, 25011], 'str', 'int'),
    stat_pair('STR +3 INT -3 & STR +3 DEX -3', [29014, 29015], 'dex', 'int'),
    stat_pair('INT +3 DEX -3 & INT +3 VIT -3', [29016, 29017], 'dex', 'vit'),
    stat_pair('DEX +3 VIT -3 & DEX +3 AGI -3', [29018, 29019], 'vit', 'agi'),
    stat_pair('VIT +3 AGI -3 & VIT +3 LUK -3', [29020, 29021], 'agi', 'luk'),
    stat_pair('AGI +3 LUK -3 & AGI +3 STR -3', [29022, 29023], 'luk', 'str'),
    stat_pair('LUK +3 STR -3 & LUK +3 INT -3', [29024, 29025], 'str', 'int'),
    {'n': 'Variable Cast Reduction (Upper, Middle & Lower)', 'ids': [29156, 29157, 29158],
     'g': [{'c': {}, 'b': [['cast_time_variable_percent', -6, None, None, None]]}]},
]
have = {tuple(sorted(s['ids'])) for s in sets}
for s in CLIENT_SETS:
    if tuple(sorted(s['ids'])) in have:
        continue
    if all(str(i) in gear or str(i) in cards or str(i) in stones for i in s['ids']):
        sets.append(s)

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'_meta': {'how': 'python scripts/build-gear-data.py', 'source': 'roz.prontera.info item records + our items table, 6 Oct 2026'},
               'gear': gear, 'cards': cards, 'sets': sets}, f, ensure_ascii=False, separators=(',', ':'))
print(len(gear), 'gear,', len(cards), 'cards,', len(sets), f'of {len(raw_sets)} sets ->', os.path.normpath(OUT), os.path.getsize(OUT) // 1024, 'KB')
