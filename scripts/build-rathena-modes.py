"""Four monster behaviour flags rozerodb does not carry, derived from rAthena.

    assist      ลุม        -- joins in when a nearby monster of its kind is hit
    castSensor  ไวต่อเวท   -- attacks a player who casts near it (idle or chase)
    detector    มองมุด     -- sees Hiding / Cloaking
    plant       ตีทีละ 1   -- takes 1 damage per hit

Source: rathena/rathena db/re/mob_db.yml, read through the Aegis `Ai`
type table in doc/mob_db_mode_list.txt (each Ai number is a fixed set of
mode bits), plus `Class: Boss` (adds Detector), Insect/Demon race (Detector),
and any explicit `Modes:` overrides applied last. "Plant" is what rAthena
gives the 1-damage plants: IgnoreMelee and IgnoreMagic both set (Red Plant
1078, Black Mushroom 1084...). Mandragora is Ai 10 = aggressive and rooted,
not a plant in this sense.

Why trust kRO-renewal data for Zero: on the one flag both sources have,
rAthena's Ai table reproduces rozerodb's "Aggressive" for all 466
comparable monsters (checked 25 Sep 2026, 0 disagreements). The page still
labels these four as rAthena's, because they are not measured in Zero.

Matched on numeric monster id. Zero-only ids (event copies 3xxx "Mj",
20xxx, 22xxx "Mq", 25xxx) have no rAthena row and are left out -- the
page shows "no data" for them rather than a guess.

Run:  python scripts/build-rathena-modes.py       (needs `pip install pyyaml`)
Writes data/raw/rathena-modes.json; scripts/build-monster-modes.mjs merges it.
"""
import io
import json
import os
import tempfile
import urllib.request

import yaml

ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = os.path.join(ROOT, 'data', 'raw', 'monsters.json')
DEST = os.path.join(ROOT, 'data', 'raw', 'rathena-modes.json')
MOB_DB = 'https://raw.githubusercontent.com/rathena/rathena/master/db/re/mob_db.yml'

# Aegis AI type -> mode bits, transcribed from rAthena doc/mob_db_mode_list.txt.
AI = {
    '01': 0x0081, '02': 0x0083, '03': 0x1089, '04': 0x3885, '05': 0x2085, '06': 0x0000,
    '07': 0x108B, '08': 0x7085, '09': 0x3095, '10': 0x0084, '11': 0x0084, '12': 0x2085,
    '13': 0x308D, '17': 0x0091, '19': 0x3095, '20': 0x3295, '21': 0x3695, '24': 0x00A1,
    '25': 0x0001, '26': 0xB695, '27': 0x8084,
}
CLASS = {'Normal': 0, 'Boss': 0x6200000, 'Guardian': 0x4000000, 'Battlefield': 0xC000000, 'Event': 0x1000000}
BIT = {
    'CanMove': 1, 'Looter': 2, 'Aggressive': 4, 'Assist': 8, 'CastSensorIdle': 16, 'NoRandomWalk': 32,
    'NoCast': 64, 'CanAttack': 128, 'CastSensorChase': 512, 'ChangeChase': 1024, 'Angry': 2048,
    'ChangeTargetMelee': 4096, 'ChangeTargetChase': 8192, 'TargetWeak': 16384, 'RandomTarget': 32768,
    'IgnoreMelee': 0x10000, 'IgnoreMagic': 0x20000, 'IgnoreRanged': 0x40000, 'Mvp': 0x80000,
    'IgnoreMisc': 0x100000, 'KnockBackImmune': 0x200000, 'TeleportBlock': 0x400000,
    'FixedItemDrop': 0x1000000, 'Detector': 0x2000000, 'StatusImmune': 0x4000000, 'SkillImmune': 0x8000000,
}


def load_mob_db():
    path = os.path.join(tempfile.gettempdir(), 'rathena-mob_db.yml')
    urllib.request.urlretrieve(MOB_DB, path)
    return yaml.safe_load(io.open(path, encoding='utf-8'))


def modes_of(entry):
    ai = str(entry.get('Ai')).zfill(2) if entry.get('Ai') is not None else '06'
    mode = AI.get(ai, 0) | CLASS.get(entry.get('Class', 'Normal'), 0)
    if entry.get('Race') in ('Insect', 'Demon'):
        mode |= BIT['Detector']
    for key, on in (entry.get('Modes') or {}).items():
        bit = BIT.get(key)
        if bit is None:
            continue
        mode = (mode | bit) if on else (mode & ~bit)
    return ai, mode


doc = load_mob_db()
raw = json.load(io.open(RAW, encoding='utf-8'))
rows = raw.get('monsters', raw.get('rows', raw))

by_id = {}
for entry in doc['Body']:
    ai, mode = modes_of(entry)
    by_id[entry['Id']] = {
        'name': entry.get('Name'),
        'ai': ai,
        'aggressive': bool(mode & BIT['Aggressive']),
        'assist': bool(mode & BIT['Assist']),
        'castSensor': bool(mode & (BIT['CastSensorIdle'] | BIT['CastSensorChase'])),
        'detector': bool(mode & BIT['Detector']),
        'plant': bool(mode & BIT['IgnoreMelee']) and bool(mode & BIT['IgnoreMagic']),
    }

out, missing = {}, []
agree = disagree = 0
disagreements = []
for row in rows:
    m = by_id.get(row['id'])
    if not m:
        missing.append(row['id'])
        continue
    out[str(row['id'])] = {k: m[k] for k in ('assist', 'castSensor', 'detector', 'plant', 'ai')} | {'rathenaName': m['name']}
    labels = {s.get('raw') for s in (row.get('ragnarokZero') or {}).get('specialStatus') or [] if s.get('raw')}
    if labels:
        if ('Aggressive' in labels) == m['aggressive']:
            agree += 1
        else:
            disagree += 1
            disagreements.append(row['id'])

# The whole point of the check above: if rAthena stops agreeing with rozerodb
# on the flag they share, its other flags are not to be trusted for Zero
# either, and this must fail rather than quietly write worse data.
if disagree > 0:
    raise SystemExit(f'rAthena disagrees with rozerodb on Aggressive for {disagree} monsters: {disagreements}')

json.dump(
    {
        '_meta': {
            'what': 'assist / castSensor / detector / plant per monster id, derived from rAthena mob_db.yml Ai types and Modes; ids with no rAthena row are absent.',
            'source': MOB_DB,
            'regenerate': 'python scripts/build-rathena-modes.py',
            'aggressiveCheck': {'compared': agree + disagree, 'agree': agree, 'disagree': disagree},
            'matched': len(out),
            'missingIds': missing,
        },
        'modes': out,
    },
    io.open(DEST, 'w', encoding='utf-8'), ensure_ascii=False, indent=1,
)
print(f'{len(rows)} rows, {len(out)} matched, {len(missing)} without an rAthena row; Aggressive agrees {agree}/{agree + disagree}')
for key in ('assist', 'castSensor', 'detector', 'plant'):
    print(f'  {key}: {sum(1 for v in out.values() if v[key])}')
