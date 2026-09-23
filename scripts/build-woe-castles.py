"""The castle table the client itself ships, for /guides/woe.

data/luafiles514/lua files/agit/agitconfig*.lub holds one entry per castle:
its map, the number the client files it under, the Kafra warp cost outside a
siege and during one, and the castle's name. The Korean-encoded name table is
ignored; the English one (agitconfig_string) is what is read.

IMPORTANT: a castle being in the client's config does NOT mean the live server
runs a siege on it. The page says that beside the table.

    python scripts/build-woe-castles.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import lub  # noqa: E402

BASE = "D:/data_grf_extracted/files/data/luafiles514/lua files/agit/"
# The Thai client's own pair: _data holds the map/warp rows, _thth the names
# it shows (which are the English ones -- castle names are not translated).
# agitconfig.lub and agitconfig_strings.lub carry the Korean names instead.
FILES = ("agitconfig_data.lub", "agitconfig_thth.lub")
OUT = ROOT / "data" / "woe-castles.json"

# The prefix in front of _casNN says which town the castle belongs to. The
# client does not carry this mapping, so it is written here from the map codes
# themselves, which are the town's own prefix.
REGIONS = {
    "prtg": "Prontera",
    "payg": "Payon",
    "gefg": "Geffen",
    "aldeg": "Al De Baran",
    "arug": "Arunafeltz",
    "schg": "Schwaltzvalt",
}

L = lub.runtime()
for name in FILES:
    err = lub.load(L, BASE + name)
    if err:
        raise SystemExit(f"{name}: {err}")

info = lub.to_py(L.globals()[b"tbl_AgitInfo_data"])
names = lub.to_py(L.globals()[b"tbl_AgitInfo_string"])

castles = []
for gat, row in info.items():
    code = gat.replace(".gat", "")
    prefix = code.split("_")[0]
    warp = row.get("Warp", {})
    castles.append(
        {
            "code": code,
            "number": row.get("Number"),
            "name": (names.get(gat) or {}).get("Name"),
            "region": REGIONS.get(prefix, prefix),
            "warpZeny": warp.get("CostZeny"),
            "warpZenySiege": warp.get("CostZenySeigeTime"),
        }
    )
castles.sort(key=lambda c: c["number"])

out = {
    "_meta": {
        "what": "Castles the live client's own agitconfig lists, with the Kafra warp cost.",
        "caution": "A castle in the client config is not proof the server runs a siege on it.",
        "source": "RO Zero Global client, data/luafiles514/lua files/agit/agitconfig*.lub",
        "regenerate": "python scripts/build-woe-castles.py",
        "total": len(castles),
    },
    "castles": castles,
}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
regions = {}
for c in castles:
    regions[c["region"]] = regions.get(c["region"], 0) + 1
print(f"{len(castles)} castles: {regions}")
