"""What each item does, as numbers: data/item-effects.json.

Source: roz.prontera.info's item records (owner, 6 Oct 2026: "use what we got
on our old pages"), captured in docs/prontera-build-planner-2026-10-06 (local
only, git-excluded). Each record carries:
  - plain fields: weight, DEF, MDEF, weapon element, the refine schedule, and
    flat stats (STR +2, FLEE +5 ...) on 480 items;
  - bonus_groups: 937 groups of bonuses with the condition they hold under
    (refine at least +X, every N refines, siege only, a class, on a skill).
The flat fields and the unconditional groups never repeat one another
(checked: 0 overlaps), so both are kept.

The item text on our own pages stays the authority; these numbers drive the
summary line, the effect filters and the calculators.

Writes data/item-effects.json:
  { items: { "<id>": { w, def, mdef, el, rs, g: [ { c: {...}, b: [[type, value, target, per, skill, scalingSkill?], ...] } ] } } }

Run: python scripts/build-item-effects.py
"""
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'prontera-build-planner-2026-10-06', 'data', 'items')
OUT = os.path.join(ROOT, 'data', 'item-effects.json')

FLAT = {'str': 'str', 'agi': 'agi', 'vit': 'vit', 'int': 'int', 'dex': 'dex', 'luck': 'luk',
        'hit': 'hit', 'flee': 'flee', 'crit': 'crit', 'hp': 'hp', 'sp': 'sp'}

items = {}
for path in sorted(glob.glob(os.path.join(SRC, '*.json'))):
    rec = json.load(open(path, encoding='utf-8'))
    it = rec['item']
    iid = it.get('item_id_ingame')
    if not isinstance(iid, int):
        continue
    groups = []
    flat = [[FLAT[k], it[k], None, None, None] for k in FLAT if it.get(k)]
    if flat:
        groups.append({'c': {}, 'b': flat})
    for g in rec.get('bonus_groups') or []:
        cond = {}
        if g.get('refine_min'):
            cond['refine'] = g['refine_min']
        if g.get('refine_sum_min'):
            cond['refineSum'] = g['refine_sum_min']
        if g.get('min_base_level'):
            cond['level'] = g['min_base_level']
        if g.get('siege_only'):
            cond['siege'] = True
        if g.get('condition_class_slugs'):
            cond['classes'] = g['condition_class_slugs']
        if g.get('proc_trigger'):
            cond['proc'] = g['proc_trigger']
        if g.get('is_event_limited'):
            cond['event'] = True
        bonuses = []
        for b in g.get('bonuses') or []:
            skill = (b.get('target_skill') or {}).get('name')
            target = b['target'] if b.get('target_kind') and b.get('target') != 'player' else ('player' if b.get('target_kind') == 'player' else None)
            if b.get('target_kind') and b.get('target_kind') != 'player':
                target = f"{b['target_kind']}:{b['target']}"
            scaling = (b.get('scaling_skill') or {}).get('name') if isinstance(b.get('scaling_skill'), dict) else b.get('scaling_skill')
            row = [b['bonus_type'], b['value'], target, b.get('per_refine_levels'), skill]
            # "ATK +3 per level of Prepare Potion": the value is per skill level.
            if scaling:
                row.append(scaling)
            bonuses.append(row)
        if bonuses:
            groups.append({'c': cond, 'b': bonuses})
    entry = {}
    for key, field in (('w', 'weight'), ('def', 'physical_defense'), ('mdef', 'magic_defense'), ('el', 'element'), ('rs', 'refine_schedule')):
        if it.get(field) not in (None, 0, ''):
            entry[key] = it[field]
    if groups:
        entry['g'] = groups
    if entry:
        # Several slugs can share an id (bound and unbound costume pairs); the
        # record with more to say wins.
        if str(iid) not in items or len(json.dumps(entry)) > len(json.dumps(items[str(iid)])):
            items[str(iid)] = entry

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({
        '_meta': {
            'how': 'python scripts/build-item-effects.py',
            'source': 'roz.prontera.info item records, captured 6 Oct 2026 (site data dated 1 Oct 2026)',
            'items': len(items),
        },
        'items': items,
    }, f, ensure_ascii=False, separators=(',', ':'))
print(f'{len(items)} items -> {os.path.normpath(OUT)} ({os.path.getsize(OUT) // 1024} KB)')

# The refine bonus tables: the total ATK (weapons; MATK is the same number)
# or DEF (armour) an item has at each refine, +1 to +20. Totals, not steps --
# a level 3 weapon gains 5 a refine to +15 and 59 a refine after.
schedules = json.load(open(os.path.join(os.path.dirname(SRC), 'refine.json'), encoding='utf-8'))['schedules']
refine = {
    s['key']: [step['bonus_def'] if s['key'] == 'armor' else step['bonus_atk'] for step in sorted(s['steps'], key=lambda x: x['level'])]
    for s in schedules
}
with open(os.path.join(ROOT, 'data', 'refine-bonus.json'), 'w', encoding='utf-8') as f:
    json.dump({'_meta': {'how': 'python scripts/build-item-effects.py', 'what': 'total ATK (weapons, MATK equal) or DEF (armor) at refine +1..+20', 'source': 'roz.prontera.info refine schedules, 6 Oct 2026'}, 'schedules': refine}, f, separators=(',', ':'))
print('refine schedules', {k: v[:3] + ['...', v[-1]] for k, v in refine.items()})
