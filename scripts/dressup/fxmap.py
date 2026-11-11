"""Which items wear which hat effect (texture/effect/**/*.str) in the dress-up room.

The real game links an item to its effect on the server, so the client has no table for it.
We rebuild the link, first match wins:
  rathena  rAthena's item script calls hateffect(HAT_EF_...) for the id (data/rathena-hateffect.json)
  name     the item's identifiedResourceName equals an HAT_EF_* name, ignoring HAT_EF_, C_, case
           and punctuation (C_Swirling_Flame -> HAT_EF_C_Swirling_Flame)
  twin     another item with the same identifiedResourceName is already mapped (Bound copies)
  manual   MANUAL below, each line confirmed by hand
Candidates: every id in effectHatItemTable plus every costume with ClassNum 0 (no sprite), that
the game has (data/game-items.json), minus EXCLUDED.

Usage: PYTHONIOENCODING=utf-8 py -3 scripts/dressup/fxmap.py [--refresh]
  prints mapped / unmatched; --refresh re-reads rAthena's item db into data/rathena-hateffect.json
"""
import json
import os
import re
import sys
from dataclasses import dataclass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# item id -> HAT_EF_* name, for items no rule above finds. Each line says how it was confirmed.
MANUAL: dict = {
    18742: 'HAT_EF_C_MoonStar_Accessory',  # 달과별의장식 = moon and star ornament; moonstar.str
    20062: 'HAT_EF_Angel_Stairs',  # 엔젤스테어즈 = "angel stairs"; cloudh.str
    20209: 'HAT_EF_MERMAID_LONGING',  # 인어공주의그리움 = the mermaid's longing; efst_mermaid_loging
    420865: 'HAT_EF_C_Hill_Shrine',  # resource C_Hill_Shrin (sic); efst_C_Hill_Shrine
    # resource c_mysgph_portal; both HAT_EF_C_MgSgPh_Potarl (255) and HAT_EF_C_MSP_Potarl (315) play
    # efst_c_mysgph_portal/potal.str; 315 is the later entry, added with this costume's release
    420935: 'HAT_EF_C_MSP_Potarl',
}

EXCLUDED = {24966, 1270260, 1270291, 1270292, 1270293, 1270294}  # Taming Ring, guild shields

RATHENA_URLS = [
    'https://raw.githubusercontent.com/rathena/rathena/master/db/re/item_db_equip.yml',
    'https://raw.githubusercontent.com/rathena/rathena/master/db/pre-re/item_db_equip.yml',
]


@dataclass(frozen=True)
class FxRef:
    ef_id: int
    str_rel: str  # path under texture/effect, forward slashes
    pos_x: int  # hatEffectPosX
    pos_y: int  # hatEffectPos
    before: bool  # isRenderBeforeCharacter
    how: str  # name | rathena | twin | manual


def norm(name: str) -> str:
    n = re.sub(r'^HAT_EF_', '', name, flags=re.I)
    n = re.sub(r'^C_', '', n, flags=re.I)
    return re.sub(r'[^0-9a-z]', '', n.lower())


def parse_rathena(yml: str) -> dict:
    out, cur = {}, None
    for line in yml.splitlines():
        m = re.match(r'\s*- Id:\s*(\d+)', line)
        if m:
            cur = int(m.group(1))
            continue
        m = re.search(r'hateffect\s*\(?\s*(HAT_EF_\w+)', line, re.I)
        if m and cur is not None:
            out.setdefault(cur, m.group(1))
    return out


def effect_items(game_items, item_info, hat_ids, hat_table, rathena, manual, hat_items=(), str_exists=None):
    """(mapping {item id: FxRef}, unmatched [(item id, reason)])."""
    by_norm, by_upper = {}, {}
    for name in hat_ids:  # HatEFID spells some names twice in different case; the first wins
        by_norm.setdefault(norm(name), name)
        by_upper.setdefault(name.upper(), name)
    cand = {i for i in hat_items} | {i for i, v in item_info.items()
                                     if v.get('ClassNum') == 0 and game_items.get(str(i), {}).get('costume')}
    cand = sorted(i for i in cand if i not in EXCLUDED and str(i) in game_items)

    def ref(name, how):
        ef = hat_ids.get(by_upper.get(name.upper(), name))
        info = hat_table.get(ef) if ef is not None else None
        if info and not info.get('resourceFileName') and info.get('hatEffectID'):
            return None, f'{name} is built-in client effect {info["hatEffectID"]}, no .str'
        if not info or not info.get('resourceFileName'):
            return None, f'{name} has no hatEffectTable entry'
        rel = info['resourceFileName'].replace('\\', '/')
        if str_exists is not None and not str_exists(rel):
            return None, f'no .str: {rel}'
        return FxRef(ef, rel, int(info.get('hatEffectPosX') or 0), int(info.get('hatEffectPos') or 0),
                     bool(info.get('isRenderBeforeCharacter')), how), None

    mapping, why = {}, {}
    for i in cand:
        res = item_info.get(i, {}).get('identifiedResourceName') or ''
        tries = []
        if i in rathena:
            tries.append((rathena[i], 'rathena'))
        if norm(res) in by_norm:
            tries.append((by_norm[norm(res)], 'name'))
        reasons = []
        for name, how in tries:
            r, bad = ref(name, how)
            if r:
                mapping[i] = r
                break
            if bad not in reasons:
                reasons.append(bad)
        if i not in mapping:
            why[i] = '; '.join(reasons) or f'no HAT_EF_ name like {res!r}'
    def twins():
        for i in cand:
            res = item_info.get(i, {}).get('identifiedResourceName')
            if i in mapping or not res:
                continue
            j = next((j for j in sorted(mapping) if item_info.get(j, {}).get('identifiedResourceName') == res), None)
            if j is not None:
                mapping[i] = FxRef(**{**mapping[j].__dict__, 'how': 'twin'})

    twins()
    for i in cand:
        if i not in mapping and i in manual:
            r, bad = ref(manual[i], 'manual')
            if r:
                mapping[i] = r
            else:
                why[i] = bad
    twins()  # Bound copies of manual matches
    unmatched = [(i, why[i]) for i in cand if i not in mapping]
    return mapping, unmatched


def _root():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_rathena(refresh=False):
    path = os.path.join(_root(), 'data', 'rathena-hateffect.json')
    if refresh:
        import urllib.request
        got = {}
        for url in RATHENA_URLS:
            with urllib.request.urlopen(url, timeout=60) as r:
                for k, v in parse_rathena(r.read().decode('utf-8')).items():
                    got.setdefault(k, v)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({str(k): got[k] for k in sorted(got)}, f, indent=0, ensure_ascii=False)
            f.write('\n')
    with open(path, encoding='utf-8') as f:
        return {int(k): v for k, v in json.load(f).items()}


def client_tables():
    """(item_info, hat_ids, hat_table, hat_items) read from the extracted client."""
    import lub
    from dressup import zorder
    L = lub.runtime()
    lub.load(L, os.path.join(SYSTEM, 'itemInfo_data.lub'))  # stops at a later C_MsgString call; tbl_data is set
    item_info = {int(k): lub.to_py(v) for k, v in L.globals()[b'tbl_data'].items()}
    L = lub.runtime()
    base = f'{zorder.GRF}/luafiles514/lua files/hateffectinfo'
    for f in ('hateffectids.lub', 'hateffectinfo.lub', 'effecthatitemtable.lub'):
        err = lub.load(L, zorder.src(f'{base}/{f}'))
        assert err is None, (f, err)
    g = L.globals()
    hat_items = lub.to_py(g[b'effectHatItemTable'])
    hat_items = list(hat_items.values()) if isinstance(hat_items, dict) else list(hat_items)
    return item_info, lub.to_py(g[b'HatEFID']), lub.to_py(g[b'hatEffectTable']), [int(i) for i in hat_items]


SYSTEM = 'D:/RagnarokZero/System'


def effect_dir():
    from dressup import zorder
    return f'{zorder.GRF}/texture/effect'


def real_mapping(refresh=False):
    from dressup import strfx
    game = json.load(open(os.path.join(_root(), 'data', 'game-items.json'), encoding='utf-8'))['items']
    item_info, hat_ids, hat_table, hat_items = client_tables()
    eff = effect_dir()

    def str_exists(rel):
        parts = rel.split('/')
        return strfx.find_texture(os.path.join(eff, *parts), parts[-1]) is not None

    return effect_items(game, item_info, hat_ids, hat_table, load_rathena(refresh), MANUAL,
                        hat_items=hat_items, str_exists=str_exists), game, item_info


def main():
    (mapping, unmatched), game, info = real_mapping('--refresh' in sys.argv)
    for i, r in sorted(mapping.items()):
        print('mapped', i, game[str(i)]['name'], r.ef_id, r.str_rel, r.how)
    for i, why in unmatched:
        print('UNMATCHED', i, game[str(i)]['name'], info.get(i, {}).get('identifiedResourceName'), '-', why)
    print(len(mapping), 'mapped,', len(unmatched), 'unmatched')


if __name__ == '__main__':
    main()
