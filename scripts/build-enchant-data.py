"""Enchant stones for the build simulator: data/build-enchants.json.

Owner, 6 Oct 2026: the simulator should take costume enchants, essences and
equipment enchants too. All three are "enchant-stone" records in the
roz.prontera.info export (docs/prontera-build-planner-2026-10-06, local
only); what each does is already in data/item-effects.json. This file only
says what a stone is and where it goes:

  upper / middle / lower / garment   costume stones, by the slot their name says
  essence                            class essences; their text speaks of the
                                     armour's refine, so the page puts them on armour
  plain                              stat stones for equipment enchant slots

"Boost: <skill>" gems only unlock a skill on Advanced Guild weapons and add
nothing a status window shows, so they are left out. So is a stone with no
numbers in item-effects: picking it would change nothing.

Run: python scripts/build-enchant-data.py (after build-item-effects.py)
"""
import glob
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'prontera-build-planner-2026-10-06', 'data', 'items')
OUT = os.path.join(ROOT, 'data', 'build-enchants.json')


def env(name):
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    raise SystemExit(f'{name} missing')


effects = json.load(open(os.path.join(ROOT, 'data', 'item-effects.json'), encoding='utf-8'))['items']
absent = set(json.load(open(os.path.join(ROOT, 'data', 'game-absent-items.json'), encoding='utf-8'))['ids'])

stones = {}
for path in sorted(glob.glob(os.path.join(SRC, '*.json'))):
    rec = json.load(open(path, encoding='utf-8'))
    if not any(c['slug'] == 'enchant-stone' for c in rec.get('categories') or []):
        continue
    it = rec['item']
    iid = it.get('item_id_ingame')
    name = it['name']
    if not isinstance(iid, int) or iid in absent or name.startswith('Boost:') or not effects.get(str(iid), {}).get('g'):
        continue
    kind = 'plain'
    for slot in ('Upper', 'Middle', 'Lower', 'Garment'):
        if f'({slot})' in name:
            kind = slot.lower()
    if 'Essence' in name and 'Lv.' in name:
        kind = 'essence'
    stones[str(iid)] = {'n': name, 'k': kind}

# Names and icons as our own pages show them.
url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
ids = list(stones)
for i in range(0, len(ids), 150):
    req = urllib.request.Request(
        f"{url}/rest/v1/items?select=id,name_en,icon_url&id=in.({','.join(ids[i:i + 150])})",
        headers={'apikey': key, 'Authorization': f'Bearer {key}'},
    )
    for row in json.load(urllib.request.urlopen(req)):
        s = stones[str(row['id'])]
        s['i'] = row['icon_url']
        # Our name where prontera's is only the effect ("AGI +1"), keeping the slot word.
        s['n'] = row['name_en'] or s['n']
missing = [k for k, s in stones.items() if 'i' not in s]
for k in missing:
    del stones[k]

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'_meta': {'how': 'python scripts/build-enchant-data.py', 'source': 'roz.prontera.info enchant-stone records, 6 Oct 2026'},
               'stones': stones}, f, ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(len(stones), 'stones', dict(Counter(s['k'] for s in stones.values())), f'({len(missing)} not in our items table)')
