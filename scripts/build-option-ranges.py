"""Random option roll ranges for the build simulator: data/option-ranges.json.

From rozerodb.com/tools/affixes (pulled 7 Oct 2026 into
docs/rozerodb-export/data/affixes.json). Each row says, for one source
(monster drop, MVP, activation, Glast Heim, blacksmith forging), one item pool
(melee / ranged / magic weapon series, armour, garment, shoes), one option
slot and one option, the range it rolls in. This maps the option names onto
the simulator's option keys (lib/build-calc OPTION_TYPES: type@target) and
keeps the ranges, so the option editor can say what a roll can be.

Reductions ("SP Consumption reduction", "Damage from X reduction") are stored
negative, the way the bonus types count them.

Run: python scripts/build-option-ranges.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'rozerodb-export', 'data', 'affixes.json')
OUT = os.path.join(ROOT, 'data', 'option-ranges.json')

RACE = {'angel': 'angel', 'brute': 'brute', 'demi-human': 'demi_human', 'demon': 'demon', 'dragon': 'dragon', 'fish': 'fish',
        'formless': 'formless', 'insect': 'insect', 'plant': 'plant', 'undead': 'undead'}
ELEM = {e: e for e in ('neutral', 'water', 'earth', 'fire', 'wind', 'poison', 'holy', 'shadow', 'ghost', 'undead')}
PLAIN = {
    'ATK': ('atk', None), 'ATK (%)': ('atk_percent', None), 'MATK': ('matk', None), 'MATK (%)': ('matk_percent', None),
    'ASPD': ('aspd', None), 'ASPD increase (%)': ('aspd_percent', None), 'CRI': ('crit', None),
    'Critical Damage increase (%)': ('crit_damage_percent', None), 'DEF': ('def', None), 'MDEF': ('mdef', None),
    'HIT': ('hit', None), 'FLEE': ('flee', None), 'MaxHP': ('hp', None), 'MaxHP(MHP)': ('hp', None), 'MaxHP (%)': ('hp_percent', None),
    'MaxSP': ('sp', None), 'MaxSP(MSP)': ('sp', None), 'MaxSP (%)': ('sp_percent', None),
    'HP Recovery speed increase (%)': ('hp_recovery_percent', None), 'SP Recovery speed increase (%)': ('sp_recovery_percent', None),
    'Heal increase (%)': ('heal_amount_percent', None), 'Received Healing increase': ('heal_received_percent', None),
    'Long-range Physical Damage increase (%)': ('ranged_damage_percent', None),
}
NEGATIVE = {'SP Consumption reduction (%)': ('sp_cost_percent', None), 'Variable Casting reduction (%)': ('cast_time_variable_percent', None),
            'Variable Casting reduction': ('cast_time_variable_percent', None)}
POOL = {'Melee Series': 'melee', 'Ranged Series': 'ranged', 'Magic Series': 'magic', 'Armor': 'armor', 'Garment': 'garment',
        'Shoes': 'shoes', 'Physical Series': 'melee', 'Forging Weapons': 'forged'}
SOURCE = {'monsterDrop': 'ดรอปมอน', 'mvp': 'MVP', 'activation': 'Activation', 'glast': 'Glast Heim', 'blacksmith': 'ตีเอง'}


def option(name):
    """(type, target, sign) for an option name, or None."""
    if name in PLAIN:
        return (*PLAIN[name], 1)
    if name in NEGATIVE:
        return (*NEGATIVE[name], -1)
    n = name.lower()
    m = re.match(r'(\w+) resistance increase \(%\)', n)
    if m and m.group(1) in ELEM:
        return ('resistance_percent', f'element:{m.group(1)}', 1)
    m = re.match(r'ignore ([\w-]+(?: enemy)?) (phys|magic) def \(%\)', n)
    if m:
        what = m.group(1)
        target = 'monster_kind:normal' if what.startswith('normal') else f"race:{RACE.get(what, what)}"
        return ('ignore_def_percent' if m.group(2) == 'phys' else 'ignore_mdef_percent', target, 1)
    m = re.match(r'(phys|physical|magic) damage to ([\w-]+) (monsters|enemies|targets) \(%\)', n)
    if m:
        kind = 'damage_percent' if m.group(1).startswith('phys') else 'magic_damage_percent'
        what = m.group(2)
        if what in ('boss', 'normal'):
            return (kind, f'monster_kind:{what}', 1)
        if what in ('small', 'medium', 'large'):
            return (kind, f'size:{what}', 1)
        if m.group(3) == 'monsters' and what in RACE:
            return (kind, f'race:{RACE[what]}', 1)
        if what in ELEM:
            return (kind, f'element:{what}', 1)
    m = re.match(r'(phys|magic) damage from (\w+) enemies reduction \(%\)', n)
    if m and m.group(2) in ELEM:
        return ('damage_taken_percent' if m.group(1) == 'phys' else 'magic_damage_taken_percent', f'element:{m.group(2)}', -1)
    m = re.match(r'resistance to ([\w-]+) \(%\)', n)
    if m and m.group(1) in RACE:
        return ('damage_taken_percent', f'race:{RACE[m.group(1)]}', -1)
    return None


data = json.load(open(SRC, encoding='utf-8'))
ranges, unmapped = {}, set()
for source, rows in data.items():
    if source == '_meta':
        continue
    for r in rows:
        opt = option(r['name'])
        # "5-30", or a single value ("1") that rolls as itself.
        m = re.match(r'(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)', str(r['value'])) or re.match(r'(-?\d+(?:\.\d+)?)()$', str(r['value']).strip())
        if m and not m.group(2):
            m = re.match(r'((-?\d+(?:\.\d+)?))', str(r['value']).strip())
        if not opt or not m:
            unmapped.add(r['name'])
            continue
        typ, target, sign = opt
        lo, hi = sorted((float(m.group(1)) * sign, float(m.group(2)) * sign))
        lo, hi = (int(lo) if lo.is_integer() else lo), (int(hi) if hi.is_integer() else hi)
        key = f'{typ}@{target}' if target else typ
        slot = int(re.search(r'\d+', r['tier']).group()) if re.search(r'\d+', r.get('tier', '')) else 0
        row = [POOL.get(r.get('type'), r.get('type')), SOURCE.get(source, source), slot, lo, hi]
        if row not in ranges.setdefault(key, []):
            ranges[key].append(row)

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'_meta': {'how': 'python scripts/build-option-ranges.py', 'source': 'rozerodb.com/tools/affixes, 7 Oct 2026',
                         'row': '[pool, source, option slot, min, max]'}, 'ranges': ranges}, f, ensure_ascii=False, separators=(',', ':'))
print(len(ranges), 'option keys,', sum(len(v) for v in ranges.values()), 'ranges ->', os.path.getsize(OUT) // 1024, 'KB')
if unmapped:
    print('not mapped:', sorted(unmapped))
