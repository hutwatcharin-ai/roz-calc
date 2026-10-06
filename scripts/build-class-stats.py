"""Per-class numbers for the class guides and stat tools: data/class-stats.json.

Source: roz.prontera.info's stat planner and combat tables (captured 6 Oct
2026 in docs/prontera-build-planner-2026-10-06, local only):
  - stat point rules (48 to start, floor((L-1)/5)+3 a level, raising x costs
    floor((x-1)/10)+2) -- matches the budget the Blacksmith advice used;
  - the stat each Job level adds;
  - base HP/SP per base level -- prontera measured these for Acolyte and
    Thief only, and says other classes can read 20-25% high;
  - base ASPD per weapon type, the shield penalty, the weight bonus. These
    are flagged other_region (from another server's data).

Run: python scripts/build-class-stats.py
"""
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'prontera-build-planner-2026-10-06', 'data')
OUT = os.path.join(ROOT, 'data', 'class-stats.json')

tables = json.load(open(os.path.join(SRC, 'combat-tables.json'), encoding='utf-8'))
tables = tables.get('tables', tables)

classes = {}
constants = None
for path in sorted(glob.glob(os.path.join(SRC, 'classes', '*-stats.json'))):
    rec = json.load(open(path, encoding='utf-8'))
    slug = rec['job_class']['slug']
    constants = constants or rec['constants']
    curve = lambda key: [p['value'] for p in sorted(rec['curves'][key], key=lambda p: p['base_level'])]  # noqa: E731
    job = tables['jobs'].get(slug, {})
    classes[slug] = {
        'name': rec['job_class']['name'],
        'tier': rec['job_class']['tier'],
        'jobBonuses': [[b['job_level'], b['stat']] for b in sorted(rec['job_bonuses'], key=lambda b: b['job_level'])],
        'hp': curve('base_hp'),
        'sp': curve('base_sp'),
        'aspd': tables['aspd'].get(slug, {}),
        'shieldPenalty': job.get('shield_aspd_penalty', 0),
        'weightBonus': job.get('weight_bonus', 0),
    }

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({
        '_meta': {
            'how': 'python scripts/build-class-stats.py',
            'source': 'roz.prontera.info stat planner and combat tables, captured 6 Oct 2026',
            'hpSpMeasured': ['acolyte', 'thief'],
            'aspdSource': tables.get('tables_data_source'),
            'aspdCap': 190,
        },
        'constants': constants,
        'classes': classes,
    }, f, ensure_ascii=False, separators=(',', ':'))
print(f'{len(classes)} classes -> {os.path.normpath(OUT)}')

# Per-level timing a skill tooltip needs and our skill_levels table lacks:
# variable and fixed cast, after-cast delay, cooldown, hits. Keyed by
# prontera's skill slug, which is the slug our skill_levels rows carry.
skills = json.load(open(os.path.join(SRC, 'skills-catalog.json'), encoding='utf-8'))
skills = skills if isinstance(skills, list) else skills.get('skills', [])
extra = {}
for skill in skills:
    for lv in skill.get('levels') or []:
        row = {}
        for key, field in (('cv', 'cast_variable_ms'), ('cf', 'cast_fixed_ms'), ('acd', 'after_cast_delay_ms'), ('cd', 'cooldown_ms'), ('h', 'hit_count')):
            if lv.get(field) not in (None, 0):
                row[key] = lv[field]
        if lv.get('delay_follows_aspd'):
            row['aspd'] = 1
        if row:
            extra.setdefault(skill['slug'], {})[str(lv['level'])] = row
with open(os.path.join(ROOT, 'data', 'skill-level-extra.json'), 'w', encoding='utf-8') as f:
    json.dump({'_meta': {'how': 'python scripts/build-class-stats.py', 'source': 'roz.prontera.info skill levels (client_extract), 6 Oct 2026'}, 'skills': extra}, f, separators=(',', ':'))
print(len(extra), 'skills with timing')
