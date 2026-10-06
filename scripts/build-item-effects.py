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
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'prontera-build-planner-2026-10-06', 'data', 'items')
OUT = os.path.join(ROOT, 'data', 'item-effects.json')

FLAT = {'str': 'str', 'agi': 'agi', 'vit': 'vit', 'int': 'int', 'dex': 'dex', 'luck': 'luk',
        'hit': 'hit', 'flee': 'flee', 'crit': 'crit', 'hp': 'hp', 'sp': 'sp'}

LABELS = {'str': 'STR', 'agi': 'AGI', 'vit': 'VIT', 'int': 'INT', 'dex': 'DEX', 'luck': 'LUK', 'hit': 'HIT',
          'flee': 'FLEE', 'crit': r'(?:CRIT|Critical)', 'hp': r'(?:MHP|Max ?HP)', 'sp': r'(?:MSP|Max ?SP)'}
CONDITIONAL = re.compile(r'\b(when|if|for each|for every|each|while|during|combined|used with|equipped with|together with|refine)', re.I)


def flat_is_conditional(text, key, value):
    """Whether the sentence that states this flat stat is a conditional one."""
    pattern = re.compile(LABELS[key] + r'[^.0-9]{0,12}[+-]?\s*' + str(abs(value)) + r'(?!\d)', re.I)
    for sentence in re.split(r'(?<=[.!])\s+|\n', text):
        if pattern.search(sentence):
            return bool(CONDITIONAL.search(sentence))
    return False


items = {}
for path in sorted(glob.glob(os.path.join(SRC, '*.json'))):
    rec = json.load(open(path, encoding='utf-8'))
    it = rec['item']
    iid = it.get('item_id_ingame')
    if not isinstance(iid, int):
        continue
    groups = []
    # The flat fields fold conditional lines in: Eclipse Card's "When used with
    # Lunatic Card, FLEE +18" arrives as flee: 18, Nine Tail's "at +9, FLEE
    # +20" as flee: 20. A flat stat whose sentence in the item text is
    # conditional goes into its own group, flagged for the reader to check.
    flat, flagged = [], []
    for k in FLAT:
        if not it.get(k):
            continue
        row = [FLAT[k], it[k], None, None, None]
        (flagged if flat_is_conditional(it.get('description') or '', k, it[k]) else flat).append(row)
    if flat:
        groups.append({'c': {}, 'b': flat})
    if flagged:
        groups.append({'c': {'text': True}, 'b': flagged})
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
        # A group with no condition whose own sentence is conditional ("When
        # equipped with Rocker Card, FLEE +18") lost its condition upstream.
        # "For each refine" and "per level of X" are already in the numbers.
        scaled = all(bb.get('per_refine_levels') or bb.get('scaling_skill') for bb in g.get('bonuses') or [])
        if not cond and not scaled and g.get('effect_text') and CONDITIONAL.search(g['effect_text']):
            cond['text'] = True
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


# Food and buff items that raise a stat, HIT, FLEE or CRI: the "what can I eat
# for more HIT" list on /tools/hit-flee. From prontera's buff table; only
# consumables (skills are the class guides' business), with the item id the
# slug ends in so the page can link our own item page.
RELEVANT = {'str', 'agi', 'vit', 'int', 'dex', 'luk', 'hit', 'flee', 'crit', 'perfect_dodge', 'aspd', 'aspd_percent', 'atk', 'matk'}
buffs = json.load(open(os.path.join(os.path.dirname(SRC), 'skill-buffs.json'), encoding='utf-8'))['buffs']
foods = []
for buff in buffs:
    if buff['source'] != 'consumable':
        continue
    tail = buff['slug'].rsplit('-', 1)[-1]
    if not tail.isdigit():
        continue
    # Enchant stones (Sharp, Fighting Spirit, Spell) are listed as consumables
    # there; they are not eaten. All 19 sit in 4700-4999.
    if 4700 <= int(tail) <= 4999:
        continue
    level = buff['levels'][0]
    bonuses = {}
    for g in level.get('groups') or []:
        for b in g.get('bonuses') or []:
            if b['bonus_type'] in RELEVANT and not b.get('target_skill'):
                bonuses[b['bonus_type']] = bonuses.get(b['bonus_type'], 0) + b['value']
    if bonuses:
        foods.append({'id': int(tail), 'name': buff['name'], 'b': bonuses, 'text': level.get('text') or ''})
with open(os.path.join(ROOT, 'data', 'food-buffs.json'), 'w', encoding='utf-8') as f:
    json.dump({'_meta': {'how': 'python scripts/build-item-effects.py', 'source': 'roz.prontera.info buff table, 6 Oct 2026'}, 'foods': sorted(foods, key=lambda x: x['name'])}, f, ensure_ascii=False, separators=(',', ':'))
print(len(foods), 'food buffs')
