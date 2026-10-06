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
