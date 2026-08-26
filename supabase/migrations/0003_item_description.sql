-- 0003_item_description.sql
--
-- items.description was never created, though the raw feed carries a
-- description for every item. Without it the item detail page shows stats with
-- no effect text, and the Cards browser (spec §3.3) has nothing to list --
-- a card's entire value is its effect line.
--
-- Additive only: existing rows get NULL and the next import fills them in.

alter table items add column if not exists description text;
