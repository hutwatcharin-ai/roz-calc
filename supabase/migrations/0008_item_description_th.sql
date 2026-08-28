-- 0008_item_description_th.sql
--
-- Thai translations for item descriptions, keyed by SOURCE TEXT rather than by
-- item. The same English line always gets the same Thai, so
-- "Can be sold to the Collector." is translated once and reused across the 142
-- items that carry it; correcting it later corrects all 142 at once.
--
-- Two tables, not one with a `kind` discriminator, because the keys are
-- different in kind. Prose is keyed by the whole line; a label or stat name is
-- keyed by the term alone. In one table `DEF : 5` and `DEF` would be two rows
-- that look alike and mean different things, and a lookup would collide.

-- Prose: stored whole, because there is no label/value structure to separate.
--
-- NOTE (28 Aug, after this migration was applied): this table is no longer
-- prose-only. compose() gives a whole-line translation priority over a term
-- translation, so a label- or stat-shaped line can be translated here too --
-- `During transformation : ATK +70` is a sentence that merely starts with a
-- seeded label. The `kind` check below still reads effect/flavour, which is
-- about what the line SAYS, not about its shape, so it needs no change.
-- The SQL is untouched; only this comment was corrected.
create table if not exists item_description_lines (
  source_line text primary key,
  thai_line text not null,
  kind text not null check (kind in ('effect', 'flavour')),
  reviewed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Labels and stat names: the term only. The value passes through untouched, so
-- an item with a new value is never new translation work -- which is the whole
-- reason this table is separate from the one above.
create table if not exists item_description_terms (
  source_term text primary key,
  -- NULL is meaningful and deliberate: ATK and DEF get rows with no translation
  -- because the glossary says they stay English. A row that exists with a null
  -- translation means "considered and left alone"; NO row means "not done yet",
  -- which is what the checker reports.
  thai_term text,
  kind text not null check (kind in ('label', 'stat')),
  updated_at timestamptz not null default now()
);

-- RLS in the same migration that creates the tables. v1 shipped tables with RLS
-- off, which left the public anon key with full DML rights on every row.
alter table item_description_lines enable row level security;
alter table item_description_terms enable row level security;

create policy "item_description_lines public read"
  on item_description_lines for select
  to anon, authenticated
  using (true);

create policy "item_description_terms public read"
  on item_description_terms for select
  to anon, authenticated
  using (true);
