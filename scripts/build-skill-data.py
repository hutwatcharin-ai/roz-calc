"""Skills for the build simulator: data/build-skills.json.

Owner, 7 Oct 2026: the simulator should count passives and buffs, and say how
hard a skill hits and how long a monster takes to die. From the
roz.prontera.info export (docs/prontera-build-planner-2026-10-06, local):

  passives  class passives that change the status window or the damage. The
            export gives most of them as level text only ("DEX +3",
            "FLEE +12, After second job: FLEE +16"), so each one is read with
            its own pattern below; a skill whose text does not match is left
            out rather than guessed.
  buffs     skill buffs from the buff table, with their bonuses per level
            (Blessing 10: STR/INT/DEX +10, HIT +20). Only those with numbers.
  attacks   attack skills per class: damage % per level (the export's
            formula when it has one, else its ratio), hits, element, cast,
            delays, cooldown, SP.

Icons come from our own skills table. Run: python scripts/build-skill-data.py
"""
import glob
import json
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'prontera-build-planner-2026-10-06', 'data')
OUT = os.path.join(ROOT, 'data', 'build-skills.json')


def env(name):
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    raise SystemExit(f'{name} missing')


def icons():
    url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    out, start = {}, 0
    while True:
        req = urllib.request.Request(f'{url}/rest/v1/skills?select=name,icon_url&order=name',
                                     headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Range': f'{start}-{start + 999}'})
        rows = json.load(urllib.request.urlopen(req))
        for r in rows:
            if r.get('icon_url'):
                out.setdefault(r['name'].strip().lower(), r['icon_url'])
        if len(rows) < 1000:
            return out
        start += 1000


ICONS = icons()


def icon(name):
    return ICONS.get(name.strip().lower())


# Passive skill -> what its level text says, as (bonus type, pattern for the
# number). `w`: only with these weapon types; `t`: only against these targets;
# `second`: a second pattern used once the class is a 2nd job.
PASSIVES = {
    'owls-eye': {'fx': [('dex', r'DEX \+(\d+)')]},
    'vultures-eye': {'fx': [('hit_percent', r'Hit Rate \+(\d+)%')], 'w': ['bow']},
    'improve-dodge': {'fx': [('flee', r'^FLEE \+(\d+)')], 'second': [('flee', r'After second job: FLEE \+(\d+)')]},
    'flee': {'fx': [('flee', r'FLEE \+(\d+)')]},
    'weaponry-research': {'fx': [('hit', r'HIT \+(\d+)'), ('mastery', r'Damage \+(\d+)')]},
    'axe-mastery': {'fx': [('mastery', r'Damage: \+(\d+)')], 'w': ['axe_1h', 'axe_2h', 'sword_1h']},
    'axe-mastery-2': {'fx': [('mastery', r'ATK \+(\d+)'), ('hit', r'HIT \+(\d+)')], 'w': ['axe_1h', 'axe_2h']},
    'mace-mastery': {'fx': [('mastery', r'Damage \+(\d+)'), ('crit', r'CRIT \+(\d+)')], 'w': ['mace']},
    'sword-mastery': {'fx': [('mastery', r'Damage \+(\d+)')], 'w': ['sword_1h', 'dagger']},
    'two-handed-sword-mastery': {'fx': [('mastery', r'Damage \+(\d+)')], 'w': ['sword_2h']},
    'spear-mastery': {'fx': [('mastery', r'Damage \+(\d+)')], 'w': ['spear_1h', 'spear_2h']},
    'katar-mastery': {'fx': [('mastery', r'Damage: \+(\d+)')], 'w': ['katar']},
    # Zero's own numbers (8 Oct 2026): 7% a level, plus HIT a percent a level;
    # with a dagger only, as the skill text says.
    'double-attack': {'fx': [('double_attack', r'Activation Chance: (\d+)%'), ('hit_percent', r'HIT Bonus: (\d+)%')], 'w': ['dagger']},
    'advanced-katar-mastery': {'fx': [('damage_percent', r'Damage Increase: \+(\d+)%')], 'w': ['katar']},
    'iron-fists': {'fx': [('mastery', r'Damage \+(\d+)')], 'w': ['bare_hand', 'knuckle']},
    'demon-bane': {'fx': [('mastery', r'Damage \+(\d+)')], 't': ['race:demon', 'element:undead']},
    'beastbane': {'fx': [('mastery', r'Damage: \+(\d+)')], 't': ['race:brute', 'race:insect']},
    'faith': {'fx': [('hp', r'MHP \+(\d+)')]},
    'meditation': {'fx': [('sp_percent', r'Max SP \+(\d+)%')]},
    'soul-drain': {'fx': [('sp_percent', r'Max SP \+(\d+)%')]},
    'music-lessons': {'fx': [('sp_percent', r'MSP \+(\d+)%')], 'wfx': [('mastery', r'Instrument Damage \+(\d+)'), ('aspd_percent', r'After Attack Delay -(\d+)%')], 'w': ['instrument']},
    'dance-lessons': {'fx': [('sp_percent', r'MSP \+(\d+)%')], 'wfx': [('mastery', r'Whip Damage \+(\d+)'), ('crit', r'CRIT \+(\d+)')], 'w': ['whip']},
    'plagiarism': {'fx': [('aspd_percent', r'ASPD \+(\d+(?:\.\d+)?)%')]},
    'study': {'wfx': [('mastery', r'Damage \+(\d+)'), ('aspd_percent', r'ASPD \+(\d+(?:\.\d+)?)%')], 'w': ['book']},
    'hilt-binding': {'fixed': [('str', 1)]},
    'enlarge-weight-limit': {'fx': [('weight', r'Weight Limit \+(\d+)')]},
}
SECOND_JOBS = {'knight', 'crusader', 'wizard', 'sage', 'hunter', 'bard', 'dancer', 'priest', 'monk', 'blacksmith', 'alchemist', 'assassin', 'rogue'}


def values(texts, pattern):
    out = []
    for t in texts:
        m = re.search(pattern, t or '')
        if not m:
            return None
        out.append(float(m.group(1)) if '.' in m.group(1) else int(m.group(1)))
    return out


passives, attacks, owners = {}, {}, {}
for path in sorted(glob.glob(os.path.join(SRC, 'classes', '*-skills.json'))):
    cls = os.path.basename(path)[:-len('-skills.json')]
    line = json.load(open(path, encoding='utf-8'))['line']
    attacks[cls] = []
    for tier in line:
        for s in tier['skills']:
            slug = s['slug']
            levels = s['levels'] or []
            texts = [l.get('description_text') or '' for l in levels]
            if slug in PASSIVES:
                owners.setdefault(slug, set()).add(cls)
                spec = PASSIVES[slug]
                if slug in passives:
                    continue
                entry = {'n': s['name'].strip(), 'max': s['max_level'], 'i': icon(s['name'])}
                fx, ok = {}, True
                for key in ('fx', 'wfx', 'second'):
                    for typ, pat in spec.get(key, []):
                        v = values(texts, pat)
                        if v is None:
                            ok = False
                            break
                        fx.setdefault(key, {})[typ] = v
                for typ, val in spec.get('fixed', []):
                    fx.setdefault('fx', {})[typ] = [val] * s['max_level']
                if not ok or not fx:
                    print('passive text did not match, left out:', slug, texts[:2])
                    continue
                entry.update(fx)
                if spec.get('w'):
                    entry['w'] = spec['w']
                if spec.get('t'):
                    entry['t'] = spec['t']
                passives[slug] = entry
                continue
            if s['passive'] == 'passive' or not levels:
                continue
            rows = []
            for l in levels:
                ratio = l.get('damage_ratio_percent')
                if not ratio and not s.get('damage_formula_expression'):
                    rows = None
                    break
                hits = l.get('hit_count') if l.get('damage_ratio_basis') == 'per_hit' else 0
                vct = l.get('cast_variable_ms') if l.get('cast_variable_ms') is not None else l.get('cast_time_ms')
                rows.append([ratio or 0, hits or 0, vct or 0, l.get('cast_fixed_ms') or 0, l.get('after_cast_delay_ms') or 0, l.get('cooldown_ms') or 0, l.get('sp_cost') or 0])
            if not rows:
                continue
            kind = levels[-1].get('damage_kind') or 'atk'
            if kind not in ('atk', 'matk'):
                continue  # atk_matk (Grand Cross) mixes both; not modelled
            a = {'s': slug, 'n': s['name'].strip(), 'max': s['max_level'], 'k': kind, 'el': s.get('element'), 'i': icon(s['name']), 'lv': rows}
            if s.get('damage_formula_expression'):
                a['f'] = s['damage_formula_expression']
            attacks[cls].append(a)

for slug, entry in passives.items():
    entry['cls'] = sorted(owners[slug])
    # Improve Dodge: the "after second job" value applies to these classes.
    if 'second' in entry:
        entry['secondCls'] = sorted(c for c in owners[slug] if c in SECOND_JOBS)

# Buffs whose numbers the buff table leaves out but the skill's own text
# gives (owner, 7 Oct 2026): Gloria "LUK +30", Rising Dragon "MHP and MSP +
# (Skill Lv)%", the weapon endows (Aspersio holy, Enchant Poison poison, the
# Sage endows), and Weapon Perfection "removes weapon size penalties".
# `endow` sets the weapon's element; `no_size_penalty` drops the size table.
# The Sage endows' "Fire Magical Damage +x%" is fire *magic*, not damage to
# fire monsters as the table filed it: skill_element:fire.
EXTRA = {
    'gloria': lambda lv: [['luk', 30, None]],
    'rising-dragon': lambda lv: [['hp_percent', lv, None], ['sp_percent', lv, None]],
    'aspersio': lambda lv: [['endow', 1, 'element:holy']],
    'enchant-poison': lambda lv: [['endow', 1, 'element:poison']],
    'endow-blaze': lambda lv: [['endow', 1, 'element:fire']],
    'endow-quake': lambda lv: [['endow', 1, 'element:earth']],
    'endow-tornado': lambda lv: [['endow', 1, 'element:wind']],
    'endow-tsunami': lambda lv: [['endow', 1, 'element:water']],
    'weapon-perfection': lambda lv: [['no_size_penalty', 1, None]],
    # Client text: Magnificat "doubles natural SP recovery", Mental Strength
    # "reduces all damage taken by 90%" (its ASPD cut has no number, left out).
    'magnificat': lambda lv: [['sp_recovery_percent', 100, None]],
    'mental-strength': lambda lv: [['damage_taken_percent', -90, None]],
}

buffs = []
for b in json.load(open(os.path.join(SRC, 'skill-buffs.json'), encoding='utf-8'))['buffs']:
    if b['source'] != 'skill':
        continue
    lv = []
    for level in b['levels']:
        rows = []
        for g in level.get('groups') or []:
            if g.get('proc_trigger') or g.get('siege_only'):
                continue
            for x in g.get('bonuses') or []:
                if x.get('target_skill') or x.get('scaling_skill'):
                    continue
                target = None
                if x.get('target_kind') and x.get('target') and x['target_kind'] != 'player':
                    target = f"{x['target_kind']}:{x['target']}"
                rows.append([x['bonus_type'], x['value'], target])
        if b['slug'] in EXTRA:
            rows = [r for r in rows if not (r[0] == 'magic_damage_percent' and b['slug'].startswith('endow-'))]
            if b['slug'].startswith('endow-'):
                rows += [['magic_damage_percent', x['value'], f"skill_element:{x['target']}"]
                         for g in level.get('groups') or [] for x in g.get('bonuses') or [] if x['bonus_type'] == 'magic_damage_percent']
            rows += EXTRA[b['slug']](len(lv) + 1)
        lv.append(rows)
    if not any(lv):
        continue
    buffs.append({'s': b['slug'], 'n': b['name'], 'max': b['maxLevel'], 'i': icon(b['name']),
                  'cls': [c['slug'] for c in b.get('classes') or []], 'lv': lv, 'txt': b['levels'][-1].get('text') or ''})

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'_meta': {'how': 'python scripts/build-skill-data.py', 'source': 'roz.prontera.info skill planner + buff table, captured 6 Oct 2026'},
               'passives': passives, 'buffs': buffs, 'attacks': {k: v for k, v in attacks.items() if v}}, f, ensure_ascii=False, separators=(',', ':'))
print(len(passives), 'passives,', len(buffs), 'buffs,', sum(len(v) for v in attacks.values()), 'attack skills ->', os.path.getsize(OUT) // 1024, 'KB')
