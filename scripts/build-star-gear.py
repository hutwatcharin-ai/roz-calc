"""Collects what the client says about ★ gear into data/star-gear.json.

The guide page used to describe the ★ system from a single mirrored French
guide, and showed the token list with the client's English text. The client
itself holds more, in Thai:

  * every token's text names the NPC that does the activation, with its map
    and coordinates inside a <NAVI> tag -- that is parsed here, not typed
  * each ★ piece lists its effect in tiers: the part that works as soon as you
    wear it, then what is added at refine +3, +7 and +9

Coverage is uneven on purpose, and the script prints it: the Thai override
table in the client carries the plain ★ pieces but not every ★★ / ★★★ one, so
rows without Thai fall back to the English text our own database holds, and
each row records which language it came from.

Usage: python scripts/build-star-gear.py
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402

SYSTEM = 'D:/data_grf_extracted/System/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'star-gear.json')
READ_ON = '2026-09-24'

COLOUR = re.compile(r'\^[0-9a-fA-F]{6}')
# <NAVI>[Name]<INFO>map,x,y,...</INFO></NAVI> is the client's clickable
# waypoint. The name and the first two numbers are the whole point of it.
NAVI = re.compile(r'<NAVI>\[([^\]]+)\]<INFO>([a-z0-9_@]+),(\d+),(\d+)', re.I)
# The Thai text arrives one tooltip line at a time, so its tiers can be found
# line by line. The English text is one long paragraph, so its tiers have to be
# cut out of the middle of a sentence instead.
TIER_TH = re.compile(r'^เมื่ออัปเกรดถึงขั้น\s*(\d+)\s*,?\s*(.*)$')
TIER_EN = re.compile(
    r'(?:(?:For\s+)?[Ee]very\s*\+?(?P<every>\d+)\s*refine(?:ment)?s?'
    r'|(?:When\s+)?[Aa]t\s+refine\s+level\s*\+?(?P<lvl>\d+)'
    r'|When\s+refined\s+to\s*\+?(?P<to>\d+)(?:\s+or\s+above)?'
    r'|At\s*\+?(?P<at>\d+)\s*refine(?:\s+level)?(?:\s+or\s+higher)?)'
    r'\s*[:,]?\s*',
)
# The client ends every description with a fixed block of stats.
FOOTER_TH = re.compile(r'^(ประเภท|พลังโจมตี|พลังป้องกัน|น้ำหนัก|เลเวลอาวุธ|เลเวลที่ต้องการ|อาชีพที่สวมใส่ได้|ตำแหน่ง)\s*:\s*(.*)$')
FOOTER_KEYS = {
    'ประเภท': 'type',
    'พลังโจมตี': 'atk',
    'พลังป้องกัน': 'def',
    'น้ำหนัก': 'weight',
    'เลเวลอาวุธ': 'weaponLevel',
    'เลเวลที่ต้องการ': 'requiredLevel',
    'อาชีพที่สวมใส่ได้': 'jobs',
    'ตำแหน่ง': 'slot',
}


def clean(text):
    return COLOUR.sub('', text).strip()


def join(value):
    if isinstance(value, dict):
        return '\n'.join(str(v) for _, v in sorted(value.items()))
    return str(value)


def client_items():
    """id -> {name, description} for every ★ row the client has in Thai."""
    L = lub.runtime()
    L.execute(b'function C_MsgString(a,b) return tostring(b or a) end')
    for f in ('iteminfo_thTH.lub', 'itemInfo_data.lub'):
        err = lub.load(L, SYSTEM + f)
        if err:
            raise SystemExit(f'{f}: {err}')
    g = L.globals()
    out = {}
    for table in (b'tbl_string', b'tbl_data'):
        tbl = g[table]
        if tbl is None:
            continue
        for key, value in tbl.items():
            row = lub.to_py(value)
            name = clean(str(row.get('identifiedDisplayName') or ''))
            if not name.startswith('★') or key in out:
                continue
            out[key] = {'name': name, 'description': clean(join(row.get('identifiedDescriptionName', '')))}
    return out


def client_has_plain_version(family_names):
    """Which of these names (already ★-stripped, lower-cased) the client has
    with NO star at all in front of them anywhere in its item tables --
    distinguishes "our table just doesn't have the ordinary version" from
    "the game doesn't have one". Checked 24 Sep 2026: ★ Crossbow, ★ Hora,
    ★ Improved Wrist Guard, ★ Leather Jacket, ★ Long Coat,
    ★ Steel Chainmail, ★★ Broken Blade Halberd, ★★ Oak Wand,
    ★★ Two Handed Sword all come back false -- the ★ piece is the only
    tier of that item that exists at all, in the client or in our table."""
    L = lub.runtime()
    L.execute(b'function C_MsgString(a,b) return tostring(b or a) end')
    for f in ('iteminfo_thTH.lub', 'itemInfo_data.lub'):
        lub.load(L, SYSTEM + f)
    g = L.globals()
    plain_names = set()
    for table in (b'tbl_string', b'tbl_data'):
        tbl = g[table]
        if tbl is None:
            continue
        for _, value in tbl.items():
            row = lub.to_py(value)
            name = clean(str(row.get('identifiedDisplayName') or '')).strip()
            if name and not name.startswith('★'):
                plain_names.add(squash(name))
    return {n: (squash(n) in plain_names) for n in family_names}


def env_file():
    env = {}
    for line in open(os.path.join(os.path.dirname(__file__), '..', '.env.local'), encoding='utf-8'):
        if '=' in line:
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()
    return env


def rest(query):
    env = env_file()
    request = urllib.request.Request(f"{env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/{query}", headers={
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def db_items():
    """Our own table, which has every ★ row but only in English."""
    return rest('items?select=id,name_en,icon_url,category,required_level,description,slots,atk,weapon_type,equippable_classes,weapon_level,sell_price'
                '&name_en=like.%E2%98%85*')


def squash(name):
    """Spelling-insensitive key: the client writes the ordinary bow as
    "Cross Bow" and its ★ version as "★ Crossbow", so an exact-name match
    called the plain one absent (caught 25 Sep 2026 when the token list
    could not link it). Case, spaces and hyphens are dropped."""
    return re.sub(r'[^a-z0-9]', '', name.lower())


def plain_twins(names):
    """The ordinary item each ★ piece is made from, matched by the name with
    the stars removed, spelling-insensitively (see squash). Not every one is
    there: a few ★ pieces have no same-named ordinary row in our table, and
    the page says so rather than inventing a pair. When the table holds the
    same name twice (Zero re-ids), the lowest id is taken."""
    wanted = {squash(n): n for n in names}
    rows = []
    for start in range(0, 20000, 1000):
        page = rest(f'items?select=id,name_en,category,required_level,slots,atk&category=neq.Other'
                    f'&order=id&offset={start}&limit=1000')
        rows.extend(page)
        if len(page) < 1000:
            break
    twins = {}
    for row in rows:
        if row['name_en'].startswith('★'):
            continue
        key = squash(row['name_en'])
        if key in wanted and wanted[key] not in twins:
            twins[wanted[key]] = row
    return twins


def split_thai(description):
    """Thai tooltip -> (base text, tiers, footer). One line at a time, because
    the client wraps a sentence to fit the tooltip; lines are joined back
    together inside whichever part they belong to."""
    base, tiers, footer = [], [], {}
    current = None
    for raw in description.split('\n'):
        line = raw.strip()
        if not line:
            continue
        hit = FOOTER_TH.match(line)
        if hit:
            footer[FOOTER_KEYS[hit.group(1)]] = hit.group(2).strip()
            current = None
            continue
        match = TIER_TH.match(line)
        if match:
            tiers.append({'kind': 'at', 'refine': int(match.group(1)), 'text': match.group(2).strip()})
            current = tiers[-1]
            continue
        if current is not None:
            # Thai has no space between words, so a line the client wrapped is
            # rejoined with a newline, not a space, and the page renders it
            # with white-space: pre-line. A space here would land inside a word.
            current['text'] = f"{current['text']}\n{line}".strip()
        else:
            base.append(line)
    return '\n'.join(base).strip(), [t for t in tiers if t['text']], footer


def split_english(description):
    """English paragraph -> (base text, tiers, {}). The tiers are cut out of
    the middle of the prose, so the text is walked with finditer and each
    tier runs until the next one starts."""
    marks = list(TIER_EN.finditer(description))
    if not marks:
        return description.strip(), [], {}
    base = description[: marks[0].start()].strip()
    tiers = []
    for index, mark in enumerate(marks):
        end = marks[index + 1].start() if index + 1 < len(marks) else len(description)
        every = mark.group('every')
        number = every or mark.group('lvl') or mark.group('to') or mark.group('at')
        tiers.append({
            'kind': 'every' if every else 'at',
            'refine': int(number),
            'text': description[mark.end(): end].strip().rstrip(',').strip(),
        })
    return base, [t for t in tiers if t['text']], {}


def split_effect(description, thai):
    return split_thai(description) if thai else split_english(description)


client = client_items()
rows = db_items()
PLAIN = re.compile(r'^★+\s*')
plain_names = [PLAIN.sub('', r['name_en']) for r in rows if r['category'] != 'Other']
twins = plain_twins(plain_names)
# Only ask the client about the families we actually failed to find in our
# own table -- no point re-checking the 25 that already resolved.
unresolved = sorted({n for n in plain_names if n not in twins})
in_client = client_has_plain_version(unresolved)
print(f'{len(rows)} ★ rows in our database, {len(client)} of them have Thai text in the client')

items, tokens = [], []
npc = None
no_tiers = []
for row in sorted(rows, key=lambda r: r['name_en']):
    iid = row['id']
    thai = iid in client
    description = client[iid]['description'] if thai else (row['description'] or '')
    hit = NAVI.search(description)
    if hit and npc is None:
        npc = {'name': hit.group(1), 'map': hit.group(2), 'x': int(hit.group(3)), 'y': int(hit.group(4))}
    stars = len(re.match(r'★*', row['name_en']).group(0))
    # ★★ and ★★★ are NOT two tiers. The mirrored guide lists both under one
    # heading, "armes de 2ᵉ palier ★★", telling them apart by a suffix on the
    # name (Soleil / Lune) where our English client uses a third star instead.
    # Checked 24 Sep 2026 by matching stat lines: the guide's "Arbalète —
    # Esprit" (ATK+40, CRI-60) is our ★★ Crossbow and its "— Résonance"
    # (MATK+120) is our ★★★ Crossbow. So the second tier offers a choice of
    # two, and calling ★★★ an upgrade of ★★ is wrong -- two of the pairs even
    # have the ★★★ weaker on its headline stat.
    tier = 1 if stars <= 1 else 2
    # The wrist guards carry their variant in the name, after " - ".
    kin = PLAIN.sub('', row['name_en']).split(' - ')[0].strip()
    entry = {
        'id': iid,
        'name': row['name_en'],
        'stars': stars,
        'tier': tier,
        'family': kin,
        'category': row['category'],
        'icon': row['icon_url'],
        'requiredLevel': row['required_level'],
        'slots': row['slots'],
        'lang': 'th' if thai else 'en',
    }
    if row['category'] == 'Other':
        entry['namesNpc'] = bool(hit)
        tokens.append(entry)
        continue
    base, tiers, footer = split_effect(description, thai)
    # The Thai tooltip's trailing block (type/jobs/weight/...) has no English
    # equivalent to parse -- but type and jobs are their own columns in our
    # table regardless of language, so an English row still gets them instead
    # of leaving the page's facts line silently short two fields.
    if not footer.get('type') and row.get('weapon_type'):
        footer['type'] = row['weapon_type']
    if not footer.get('jobs') and row.get('equippable_classes'):
        footer['jobs'] = ', '.join(c if c.endswith('Class') else f'{c} Class' for c in row['equippable_classes'])
    entry.update({'base': base, 'tiers': tiers, 'footer': footer})
    # What the ordinary version of the same piece looks like, so the page can
    # answer "what does the star actually buy me" instead of only "what does
    # the star version do".
    plain_name = PLAIN.sub('', row['name_en'])
    twin = twins.get(plain_name)
    # Same name is not enough: the classic Two-Handed Sword (lv 33) shares a
    # name with ★★ Two Handed Sword (lv 18), which is really ★ Slayer's second
    # tier. A twin must sit at the same required level, or it is not the
    # piece this one was made from.
    if twin is not None and twin['required_level'] != row['required_level']:
        twin = None
    star_atk = int(footer['atk']) if footer.get('atk', '').isdigit() else row.get('atk')
    # When there's no twin, say why: either the client genuinely has no
    # ordinary tier of this item (checked directly, see
    # client_has_plain_version), or it does and our own table is just
    # missing that row -- two different findings, not one blank space.
    entry['plainExistsInGame'] = None if twin is not None else in_client.get(plain_name)
    entry['plain'] = None if twin is None else {
        'id': twin['id'],
        'category': twin['category'],
        'atk': twin['atk'],
        'slots': twin['slots'],
        'requiredLevel': twin['required_level'],
    }
    entry['starAtk'] = star_atk
    # The stat tiles the page shows, the same set an item page shows. Weight
    # and DEF exist only in the client's Thai footer, so they are None for
    # the rows the client has no text for -- the page then leaves that tile
    # out rather than printing a guess.
    entry['stats'] = {
        'atk': star_atk,
        'def': int(footer['def']) if footer.get('def', '').isdigit() else None,
        'slots': row['slots'],
        'weight': int(footer['weight']) if footer.get('weight', '').isdigit() else None,
        'requiredLevel': row['required_level'],
        'weaponLevel': row.get('weapon_level'),
        'sellPrice': row.get('sell_price'),
    }
    if not tiers:
        no_tiers.append(row['name_en'])
    items.append(entry)

if npc is None:
    raise SystemExit('no <NAVI> waypoint found in any token text; the page cannot state where to go')

data = {
    '_meta': {
        'read': READ_ON,
        'source': 'ไคลเอนต์ Ragnarok Zero Global (System/iteminfo_thTH.lub) และฐานข้อมูลไอเทมของเว็บนี้',
        'note': 'แถวที่ lang เป็น th คือข้อความไทยจากไคลเอนต์ ส่วน en คือข้อความอังกฤษจากฐานข้อมูล เพราะไคลเอนต์ยังไม่มีไทยของชิ้นนั้น',
    },
    'npc': npc,
    'items': items,
    'tokens': tokens,
}
with open(OUT, 'w', encoding='utf-8') as fh:
    json.dump(data, fh, ensure_ascii=False, indent=1)
    fh.write('\n')

thai_count = sum(1 for i in items if i['lang'] == 'th')
print(f"npc: {npc['name']} at {npc['map']} {npc['x']},{npc['y']}")
print(f'{len(items)} pieces ({thai_count} in Thai), {len(tokens)} tokens '
      f"({sum(1 for t in tokens if t['namesNpc'])} of them name the NPC)")
paired = [i for i in items if i['plain']]
print(f'{len(paired)} of {len(items)} pieces have an ordinary twin to compare against')
for tier in (1, 2):
    group = [i for i in items if i['tier'] == tier]
    print(f"  tier {tier}: {len(group)} pieces, bonus-step counts {sorted({len(i['tiers']) for i in group})}")

# The second tier comes in pairs, one per variant. If a family ever has one
# member or three, the reading above is wrong and the page must not claim it.
second = {}
for item in items:
    if item['tier'] == 2:
        second.setdefault(item['family'], []).append(item['name'])
odd = {k: v for k, v in second.items() if len(v) != 2}
print(f'  second tier: {len(second)} families, each offering a choice of two')
if odd:
    raise SystemExit(f'expected exactly two variants per family, got {odd}')
if no_tiers:
    print(f'NO TIERS PARSED for {len(no_tiers)}: {no_tiers}')
