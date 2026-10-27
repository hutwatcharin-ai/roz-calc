"""Weapon reform (★ weapons) from the RO Zero client: data/reform.json.

Source: the client's itemreform tables (luafiles514/lua files/itemreform/
itemreformsystem_data.lub), read with scripts/lub.py. Each row turns a base
weapon refined +7 to +20 into its ★ version for a pile of that weapon's
token and Goblin Coin Shards; the refine drops by 7 and cards, enchants,
random options and grade carry over.

The table names items by their client resource names (Z_Chain_RF), which
data/game-items.json does not carry, so rows are matched to item ids by
name: the result to "★ <name>", the token to "★ <name> Forging/Crafting
Token", the coin to "Goblin Coin Shard". Anything that does not match stops
the build rather than going quietly missing.

Only the derived numbers and ids are written; the .lub itself never enters
the repo (public).

Run: py -3 scripts/build-reform.py [path-to-itemreform-folder]
"""
import json
import os
import re
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
DIR = sys.argv[1] if len(sys.argv) > 1 else r'D:\Data grf roz\grf-2026-10-15\files\data\luafiles514\lua files\itemreform'
COIN = 'ZTW_G_Coin_C_P'
# Resource stems whose token is named after the weapon players know:
# the knuckle reform is Z_Hora_ in the table and "Studded Knuckles" on its token.
TOKEN_ALIAS = {'hora': 'studdedknuckles'}


def norm(s):
    return re.sub(r'[^a-z]', '', s.lower())


def stem(resource):
    """Z_Ring_Pommel_Saber_RF -> ringpommelsaber"""
    return norm(re.sub(r'^Z_|_(RF|TK)?$', '', resource))


def main():
    L = lub.runtime()
    for f in ('itemreformsystem_strings.lub', 'itemreformsystem_data.lub'):
        err = lub.load(L, os.path.join(DIR, f))
        if err:
            raise SystemExit(f'{f}: {err}')
    data = lub.to_py(L.globals().ReformInfo_data, enc='utf-8')

    items = json.load(open(os.path.join(ROOT, 'data', 'game-items.json'), encoding='utf-8'))['items']
    stars = {norm(v['name'][1:]): int(k) for k, v in items.items() if v['name'].startswith('★') and 'Token' not in v['name']}
    tokens = {
        norm(re.sub(r' (Forging|Crafting) Token$', '', v['name'][1:])): int(k)
        for k, v in items.items() if v['name'].startswith('★') and v['name'].endswith('Token')
    }
    coin = next(int(k) for k, v in items.items() if v['name'] == 'Goblin Coin Shard')

    def find(table, key, what):
        hits = [v for k, v in table.items() if k.startswith(key) or key.startswith(k)]
        if len(hits) != 1:
            raise SystemExit(f'{what} {key}: {len(hits)} matches')
        return hits[0]

    rows = []
    for key in sorted(data, key=int):
        r = data[key]
        star = find(stars, stem(r['ResultItem']), 'result')
        mats = r['Material']
        tk = next(m for m in mats if m != COIN)
        tstem = stem(tk)
        token = find(tokens, TOKEN_ALIAS.get(tstem, tstem), 'token')
        base = items[str(token)]['name'][2:]
        base = re.sub(r' (Forging|Crafting) Token$', '', base)
        rows.append({
            'star': star,
            'base': base,
            'baseIds': sorted(int(k) for k, v in items.items() if norm(v['name']) == norm(base)),
            'token': token,
            'tokenAmount': mats[tk],
            'coin': coin,
            'coinAmount': mats[COIN],
            'refineMin': r['NeedRefineMin'],
            'refineMax': r['NeedRefineMax'],
            'refineChange': r['ChangeRefineValue'],
            'keepsCards': bool(r['PreserveSocketItem']),
            'keepsGrade': bool(r['PreserveGrade']),
            'keepsOptions': r['RandomOptionCode'] == '',
        })

    out = {
        '_meta': {
            'source': 'RO Zero Global client, luafiles514/lua files/itemreform/itemreformsystem_data.lub (ReformInfo_data)',
            'built': date.today().isoformat(),
            'how': 'py -3 scripts/build-reform.py',
        },
        'reforms': rows,
    }
    with open(os.path.join(ROOT, 'data', 'reform.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'{len(rows)} reforms')


if __name__ == '__main__':
    main()
