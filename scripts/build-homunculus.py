"""Collects everything the Zero client says about homunculi into one file.

The deep research round for this page came back almost entirely from rAthena,
which is a third-party emulator built for a different ruleset. The client in
D:/data_grf_extracted is this game's own client, so its Thai text is the
strongest source we have and it costs no web quota. This script reads it.

What it writes to data/homunculus.json:
  alchemist   the five skills the owner casts, in prerequisite order
  homunculus  the four creatures, each with the skills only it can learn
  items       the six items the guide names, with the client's Thai text

Every string is the client's own wording with the ^RRGGBB colour codes removed;
nothing is reworded here, so the page cannot drift from what the game says.

Usage: python scripts/build-homunculus.py
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402

LUA = 'D:/data_grf_extracted/files/data/luafiles514/lua files/'
SYSTEM = 'D:/data_grf_extracted/System/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'homunculus.json')
READ_ON = '2026-09-24'

# The owner's five, ordered by the prerequisite chain the client itself states:
# Bioethics -> Rest -> Call Homunculus, with the two recovery skills after.
ALCHEMIST = ['AM_BIOETHICS', 'AM_REST', 'AM_CALLHOMUN', 'AM_HEALHOMUN', 'AM_RESURRECTHOMUN']
# Prefix -> creature. Skills are listed in client skill-id order, which is the
# order the skill window shows them in.
CREATURES = [
    ('lif', 'Lif', 'HLIF_'),
    ('amistr', 'Amistr', 'HAMI_'),
    ('filir', 'Filir', 'HFLI_'),
    ('vanilmirth', 'Vanilmirth', 'HVAN_'),
]
ITEMS = [7142, 7140, 7141, 7143, 7144, 100371]

COLOUR = re.compile(r'\^[0-9a-fA-F]{6}')
LEVEL_LINE = re.compile(r'^\[Lv\.(\d+)\]\s*(.*)$')
FIELDS = {
    'MAX Lv.': 'maxLevel',
    'เงื่อนไข': 'requires',
    'ประเภท': 'kind',
    'Type': 'role',
    'เป้าหมาย': 'target',
    'รายละเอียด': 'detail',
}


def clean(text):
    return COLOUR.sub('', text).strip()


def join(value):
    """Client tables hold multi-line text as a table of lines."""
    if isinstance(value, dict):
        return '\n'.join(str(v) for _, v in sorted(value.items()))
    return str(value)


def parse_skill(code, sid, raw):
    """Client skill text -> fields. The first line is the English name, then
    'label : value' lines, then one '[Lv.n]' line per level."""
    lines = [clean(l) for l in raw.split('\n')]
    out = {'code': code, 'id': sid, 'name': lines[0] if lines else code, 'levels': []}
    body = []
    current = None
    for line in lines[1:]:
        hit = LEVEL_LINE.match(line)
        if hit:
            out['levels'].append({'level': int(hit.group(1)), 'text': hit.group(2).strip()})
            current = None
            continue
        label, sep, value = line.partition(' : ')
        if sep and label.strip() in FIELDS:
            current = FIELDS[label.strip()]
            out[current] = value.strip()
            continue
        if line and current == 'detail':
            # The detail wraps over several lines; the client breaks it for the
            # tooltip width, not at sentence ends, so rejoin with a space.
            out['detail'] = f"{out['detail']} {line}".strip()
        elif line:
            body.append(line)
    if body:
        out['extra'] = ' '.join(body)
    if 'maxLevel' in out:
        out['maxLevel'] = int(re.sub(r'\D', '', out['maxLevel']) or 0) or None
    return out


def skills():
    L = lub.runtime()
    for f in ('skillinfoz/skillid.lub', 'skillinfoz/skilldescript_thth.lub'):
        err = lub.load(L, LUA + f)
        if err:
            raise SystemExit(f'{f}: {err}')
    g = L.globals()
    skid = lub.to_py(g[b'SKID'])
    desc = lub.to_py(g[b'SKILL_DESCRIPT'])
    text = {}
    for code, sid in skid.items():
        if sid in desc:
            text[code] = (sid, join(desc[sid]))
    return text


def items():
    L = lub.runtime()
    # itemInfo_data.lub calls C_MsgString, which only exists inside the running
    # client; a pass-through stub is enough to let the table build.
    L.execute(b'function C_MsgString(a,b) return tostring(b or a) end')
    for f in ('iteminfo_thTH.lub', 'itemInfo_data.lub'):
        err = lub.load(L, SYSTEM + f)
        if err:
            raise SystemExit(f'{f}: {err}')
    g = L.globals()
    rows = []
    for iid in ITEMS:
        found = None
        for table in (b'tbl_string', b'tbl_data'):
            tbl = g[table]
            if tbl is None:
                continue
            value = tbl[iid]
            if value is not None:
                found = lub.to_py(value)
                break
        if found is None:
            raise SystemExit(f'item {iid} is not in the client tables')
        lines = [clean(l) for l in join(found.get('identifiedDescriptionName', '')).split('\n')]
        # The client ends every description with a divider and the weight; the
        # page shows weight from our own database instead.
        while lines and (lines[-1].startswith('น้ำหนัก') or lines[-1] in ('_', '')):
            lines.pop()
        rows.append({'id': iid, 'name': clean(str(found.get('identifiedDisplayName', ''))), 'text': '\n'.join(lines).strip()})
    return rows


text = skills()
missing = [c for c in ALCHEMIST if c not in text]
if missing:
    raise SystemExit(f'client has no Thai text for {missing}')

data = {
    '_meta': {
        'source': 'ไคลเอนต์ Ragnarok Zero Global (data/luafiles514 + System)',
        'read': READ_ON,
        'note': 'ข้อความทุกบรรทัดเป็นของไคลเอนต์เอง ตัดเฉพาะรหัสสี ^RRGGBB ออก',
    },
    'alchemist': [parse_skill(code, *text[code]) for code in ALCHEMIST],
    'homunculus': [],
    'items': items(),
}

for key, name, prefix in CREATURES:
    own = sorted(
        (parse_skill(code, *text[code]) for code in text if code.startswith(prefix)),
        key=lambda s: s['id'],
    )
    if len(own) != 4:
        raise SystemExit(f'{name}: expected 4 skills, found {len(own)}')
    data['homunculus'].append({'key': key, 'name': name, 'sprite': f'/images/homun/{key}.webp',
                               'evolvedSprite': f'/images/homun/{key}_h.webp', 'skills': own})

with open(OUT, 'w', encoding='utf-8') as fh:
    json.dump(data, fh, ensure_ascii=False, indent=1)
    fh.write('\n')

print(f"{len(data['alchemist'])} alchemist skills, "
      f"{sum(len(h['skills']) for h in data['homunculus'])} homunculus skills, "
      f"{len(data['items'])} items -> data/homunculus.json")
for h in data['homunculus']:
    print(' ', h['name'], ':', ', '.join(s['name'] for s in h['skills']))
