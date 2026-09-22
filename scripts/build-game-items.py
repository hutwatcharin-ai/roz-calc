"""Item names and Thai descriptions straight from the live RO Zero Global client.

Source: the client's System folder (itemInfo_data.lub + iteminfo_thTH.lub),
copied by the owner on 22 Sep 2026 to D:\\data_grf_extracted\\System. Those
files ship with the game's own patcher (path _patch_glob_roz_live), so this is
the text a player reads in game -- names, Thai descriptions, slot counts.

The .lub files are Lua 5.1 bytecode built for 32-bit; scripts/lub.py rewrites
them for a 64-bit Lua (lupa) and runs them.

Writes data/game-items.json:
  { _meta: {...}, items: { "<id>": { name, desc: [lines], slots, costume } } }

`desc` keeps the client's ^RRGGBB colour codes; lib/game-items.ts renders them.
An item absent from this file is absent from the game's own item table, which
is what the site's "not in the current game" label reads.

Run: python scripts/build-game-items.py [path-to-System]
"""
import json
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402

SYSTEM = sys.argv[1] if len(sys.argv) > 1 else r'D:\data_grf_extracted\System'
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'game-items.json')


def table(path, name):
    L = lub.runtime()
    err = lub.load(L, path)
    t = L.globals()[name.encode()]
    if t is None:
        raise SystemExit(f'{path}: no {name} ({err})')
    # itemInfo_data ends by calling a client function the file never defines;
    # the table it builds is complete before that line, so the error is benign.
    return {int(k): lub.to_py(v) for k, v in t.items()}


def main():
    strings = table(os.path.join(SYSTEM, 'iteminfo_thTH.lub'), 'tbl_string')
    data = table(os.path.join(SYSTEM, 'itemInfo_data.lub'), 'tbl_data')
    items = {}
    for item_id, s in sorted(strings.items()):
        lines = s.get('identifiedDescriptionName') or {}
        desc = [str(lines[k]).rstrip() for k in sorted(lines)] if isinstance(lines, dict) else []
        d = data.get(item_id, {})
        items[str(item_id)] = {
            'name': str(s.get('identifiedDisplayName') or '').strip(),
            'desc': desc,
            'slots': d.get('slotCount'),
            'costume': bool(d.get('costume')),
        }
    out = {
        '_meta': {
            'source': 'RO Zero Global client System/iteminfo_thTH.lub + itemInfo_data.lub (_patch_glob_roz_live)',
            'built': date.today().isoformat(),
            'items': len(items),
        },
        'items': items,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    thai = sum(1 for v in items.values() if any('\u0e00' <= c <= '\u0e7f' for c in ''.join(v['desc'])))
    print(f'{len(items)} items, {thai} with Thai text -> {os.path.normpath(OUT)} ({os.path.getsize(OUT):,} bytes)')


if __name__ == '__main__':
    main()
