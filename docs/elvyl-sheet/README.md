# Encyclop'Elvyl spreadsheet mirror, 8 Sep 2026

A public Google Sheet a Zero player keeps ("Encyclop'Elvyl", French), pulled
at the user's request on 8 Sep 2026. Every one of its 17 tabs is exported to
`csv/`; `tabs.json` maps tab name to gid so it can be refreshed.

Sheet: https://docs.google.com/spreadsheets/d/1nK2jFgMEKa6IYGszbRtAcIp06VhM2sfsUf4kv46gKzI

What is in it that we do not have:

- **Formules** — the full ATK and M.ATK damage chain for Zero, step by step,
  with the author's own confidence note ("validated 95-99%, unsure of the
  order of some multipliers"). Our damage tool works from a simpler model.
- **Refine** — refine odds per weapon level including the cumulative
  "+0 → +X" chance, and it cites the official Gnjoy guide page
  (roz.mygnjoy.com/en/intro/guide/20) as its source, which is a primary
  source we can read ourselves.
- **Forge / Potion %** — success rates per weapon level and per potion.
- **Card** — cards grouped by what a player wants (change armour element,
  resist an element, resist a status, cut damage from a race, add damage to
  a race/element/size, HP/SP, stats, ATK, FLEE) with the slot each one goes
  in, and a marker for the ones not obtainable yet because their dungeon is
  not in Zero.
- **Enchant**, **Craft**, **Stuff craft 60**, **Egg (taming ring)**,
  **Elem / Size**, **Zeny Ex.**, plus per-monster notes.

Same rule as every other outside source here: this is one person's working
notes, and several cells say outright that a number still needs checking in
game. Nothing goes on the site from this alone -- it gets checked against
our own tables, the prontera crawl, the rozerodb export, rAthena or the
official guide, and it gets written in our own words.
