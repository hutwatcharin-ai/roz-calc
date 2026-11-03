"""Class essences for /tools/enchant: data/essences.json.

Owner, 3 Nov 2026: show what each class's armour essence does. Everything here
is the game's own Thai item text (data/game-items.json); this script only
sorts the 60 essences by class and splits each text into the parts a reader
scans for: what it always gives, what it gives only to that class line, and
what grows with the armour's refine.

Run: python scripts/build-essences.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(ROOT, 'data', 'game-items.json')
OUT = os.path.join(ROOT, 'data', 'essences.json')

# Class key, Thai-facing label, first or second job, and the name the client
# uses at the start of the essence's name.
CLASSES = [
    ('swordman', 'Swordman', 1, "Swordman's"),
    ('mage', 'Mage', 1, "Mage's"),
    ('archer', 'Archer', 1, "Archer's"),
    ('acolyte', 'Acolyte', 1, "Acolyte's"),
    ('merchant', 'Merchant', 1, "Merchant's"),
    ('thief', 'Thief', 1, "Thief's"),
    ('knight', 'Knight', 2, "Knight's"),
    ('crusader', 'Crusader', 2, 'Crusader'),
    ('wizard', 'Wizard', 2, 'Wizard'),
    ('sage', 'Sage', 2, "Sage's"),
    ('hunter', 'Hunter', 2, 'Hunter'),
    ('bard', 'Bard / Dancer', 2, "Bard & Dancer's"),
    ('priest', 'Priest', 2, 'Priest'),
    ('monk', 'Monk', 2, "Monk's"),
    ('blacksmith', 'Blacksmith', 2, "Blacksmith's"),
    ('alchemist', 'Alchemist', 2, 'Alchemist'),
    ('assassin', 'Assassin', 2, 'Assassin'),
    ('rogue', 'Rogue', 2, "Rogue's"),
]

NAME = re.compile(r"^(?P<who>.+?) Essence(?: (?P<v>II|Ⅱ))? Lv\.(?P<lv>[12])$")
# Where one part of the text ends and the next begins.
SPLIT = re.compile(r'(?=เมื่อสวมใส่โดย )|(?=ทุกการอัปเกรด Armor )')


def clean(lines):
    out = []
    for line in lines:
        line = re.sub(r'\^[0-9a-fA-F]{6}', '', line).strip()
        if line.startswith('น้ำหนัก') or line == '_':
            break
        if line:
            out.append(line)
    return re.sub(r'\s+', ' ', ' '.join(out)).strip()


def parts(text):
    """[{kind, text}] in reading order. kind: base, class (only that class
    line), refine (per armour refine)."""
    res = []
    for chunk in (c.strip(' ,') for c in SPLIT.split(text)):
        if not chunk:
            continue
        if chunk.startswith('ทุกการอัปเกรด Armor'):
            res.append({'kind': 'refine', 'text': chunk})
        elif chunk.startswith('เมื่อสวมใส่โดย'):
            res.append({'kind': 'class', 'text': chunk})
        else:
            res.append({'kind': 'base', 'text': chunk})
    return res


def main():
    game = json.load(open(GAME, encoding='utf-8'))['items']
    by_who = {c[3]: c for c in CLASSES}
    rows = []
    for item_id, item in game.items():
        m = NAME.match(item['name'])
        if not m or m['who'] not in by_who:
            continue
        key = by_who[m['who']][0]
        icon = next((f'/images/items/{item_id}.{ext}' for ext in ('png', 'gif')
                     if os.path.exists(os.path.join(ROOT, 'public', 'images', 'items', f'{item_id}.{ext}'))), None)
        rows.append({
            'id': int(item_id), 'name': item['name'], 'cls': key,
            'variant': 'II' if m['v'] else 'I', 'lv': int(m['lv']), 'icon': icon,
            'parts': parts(clean(item['desc'])),
        })
    rows.sort(key=lambda r: ([c[0] for c in CLASSES].index(r['cls']), r['variant'], r['lv']))
    per = {c[0]: sum(r['cls'] == c[0] for r in rows) for c in CLASSES}
    missing = [k for k, n in per.items() if n != (2 if dict((c[0], c[2]) for c in CLASSES)[k] == 1 else 4)]
    if missing:
        raise SystemExit(f'unexpected essence count for: {missing} {per}')
    out = {
        '_meta': {
            'how': 'python scripts/build-essences.py',
            'source': "game client Thai item text (data/game-items.json)",
        },
        'classes': [{'key': c[0], 'label': c[1], 'job': c[2]} for c in CLASSES],
        'essences': rows,
    }
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(rows), 'essences;', 'no icon:', [r['id'] for r in rows if not r['icon']])


if __name__ == '__main__':
    main()
