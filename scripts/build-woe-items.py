"""Collects everything the Thai client itself says about สงครามกิลด์ (WoE).

The guide page at /guides/woe is built from this file rather than from
sentences somebody typed: every row here is an item the client's own
iteminfo carries, and the line quoted beside it is that item's own
description. Rerun after a client patch:

    python scripts/build-woe-items.py

Source: data/game-items.json, which scripts/build-game-items.py extracts from
the live client's System/iteminfo_thTH.lub. Nothing external is consulted.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "game-items.json"
OUT = ROOT / "data" / "woe-items.json"

raw = json.loads(SRC.read_text(encoding="utf-8"))
items = raw["items"]
built_from = raw["_meta"]


def clean(line: str) -> str:
    return re.sub(r"\^[0-9a-fA-F]{6}", "", line).strip()


def lines(item: dict) -> list[str]:
    return [clean(x) for x in item.get("desc", [])]


# The trailing block every item ends with: type, weight, level, jobs. It is the
# same for a potion and a siege weapon, so it is stripped from the effect text.
TAIL = re.compile(r"^(ประเภท|น้ำหนัก|เลเวล|อาชีพ|พลัง|ใช้กับ|MATK|MaxHP|จำนวน)\s*:")


def effect_lines(item: dict) -> list[str]:
    out = []
    for line in lines(item):
        if TAIL.match(line):
            break
        if line in ("_", ""):
            continue
        out.append(line)
    return out


WOE_WORDS = ("สงครามกิลด์", "WoE", "GvG")


def mentions_woe(item: dict) -> bool:
    return any(w in line for line in lines(item) for w in WOE_WORDS)


def woe_lines(item: dict) -> list[str]:
    return [line for line in lines(item) if any(w in line for w in WOE_WORDS)]


hits = {int(k): v for k, v in items.items() if mentions_woe(v)}

force = []
gear = []
consumable_only = []
consumable_blocked = []
cards = []
other = []

for item_id, item in sorted(hits.items()):
    name = item["name"]
    ls = lines(item)
    text = " ".join(ls)
    # The client wraps one sentence over several short lines, so the line that
    # holds the word สงครามกิลด์ is usually half a sentence ("ของไอเทมได้ใน
    # สงครามกิลด์"). `full` is every line before the type/weight block joined
    # back into prose; `note` keeps the matched fragment for grouping only.
    entry = {
        "id": item_id,
        "name": name,
        "note": " · ".join(woe_lines(item)),
        "full": " ".join(x for x in effect_lines(item) if x != "_"),
    }

    if name.startswith("Force:") or name.startswith("Resist:"):
        # "※ ใช้ได้เฉพาะในสงครามกิลด์เท่านั้น" then the one line that matters.
        gain = [x for x in effect_lines(item) if not x.startswith("※")]
        force.append(
            {
                "id": item_id,
                "name": " ".join(name.split()),
                "kind": "force" if name.startswith("Force:") else "resist",
                "effect": " ".join(gain),
            }
        )
    elif "Guild Member's" in name or name == "Basic Guild Robe":
        tier = "advanced" if name.startswith("Advanced") else "lesser"
        body = [x for x in effect_lines(item) if not x.startswith("※")]
        # The client wraps a sentence over several short lines, so the first
        # line alone reads as a fragment. The headline is everything up to the
        # first percentage, which is where the one number a player wants sits.
        # The client wraps one sentence over several short lines and opens
        # armour with a line of flavour, so neither "first line" nor "first
        # line with a digit" gives a readable summary. The headline runs from
        # the first stat word to the first percentage.
        joined = " ".join(body)
        starts = [joined.find(w) for w in ("MaxHP", "เพิ่ม Damage", "ลด Damage", "เพิ่มผล", "MATK", "ATK")]
        starts = [i for i in starts if i >= 0]
        headline = ""
        if starts:
            rest = joined[min(starts) :]
            cut = rest.find("%")
            headline = rest[: cut + 1] if cut >= 0 else rest
        gear.append(
            {
                "id": item_id,
                "name": name,
                "tier": tier,
                "slots": item.get("slots", 0),
                "headline": headline,
                "effect": " ".join(body),
                "hiddenOutside": "ที่ไม่ใช่สงครามกิลด์" in text,
            }
        )
    elif "ประเภท : Card" in text or name.endswith(" Card"):
        cards.append(entry)
    # The client writes this refusal two ways -- "ไม่สามารถใช้ได้ในสงครามกิลด์"
    # on the mana potion, and "ไม่สามารถใช้หรือรับเอฟเฟกต์ของไอเทมได้ในสงครามกิลด์"
    # on the healing one -- so it is matched by both halves, not by one phrase.
    elif ("ไม่สามารถใช้" in text and "ในสงครามกิลด์" in text) or "ไม่มีผลในพื้นที่ WoE" in text:
        consumable_blocked.append(entry)
    elif "WoE และในเมืองเท่านั้น" in text or "เฉพาะ WoE" in text or "PVP" in text or "PvP" in text:
        consumable_only.append(entry)
    else:
        other.append(entry)

out = {
    "_meta": {
        "what": "Every item whose own Thai description names สงครามกิลด์ / WoE / GvG.",
        "why": "The WoE guide quotes the game, not a player's summary. Counts on the page are"
        " lengths of these lists, so they cannot drift from the client.",
        "source": built_from,
        "regenerate": "python scripts/build-woe-items.py",
        "total": len(hits),
    },
    "force": force,
    "gear": gear,
    "consumableOnly": consumable_only,
    "consumableBlocked": consumable_blocked,
    "cards": cards,
    "other": other,
}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(
    f"{len(hits)} items · force {len(force)} · gear {len(gear)} · only {len(consumable_only)}"
    f" · blocked {len(consumable_blocked)} · cards {len(cards)} · other {len(other)}"
)
