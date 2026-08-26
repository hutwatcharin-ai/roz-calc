-- 0004_monster_details.sql
--
-- Every field below already exists in data/raw/monsters.json and was simply
-- never imported. is_aggressive is the one that matters most: the game ships a
-- free unlimited auto-hunt bot, so "will this monster walk over and kill me
-- while I am away" is the question players ask most, and no competing site
-- surfaces it (spec 3.15.1).
--
-- Additive only. Existing rows keep their values; the next import fills these.

alter table monsters add column if not exists is_aggressive boolean not null default false;
alter table monsters add column if not exists is_mvp boolean not null default false;
alter table monsters add column if not exists loots_items boolean not null default false;
alter table monsters add column if not exists matk_min integer;
alter table monsters add column if not exists matk_max integer;
alter table monsters add column if not exists str integer;
alter table monsters add column if not exists agi integer;
alter table monsters add column if not exists vit integer;
alter table monsters add column if not exists int_ integer;
alter table monsters add column if not exists dex integer;
alter table monsters add column if not exists luk integer;

-- Partial index: the AFK finder and the aggro filters always ask for the
-- non-aggressive subset, which is the minority of rows.
create index if not exists monsters_not_aggressive_idx
  on monsters (level)
  where is_aggressive = false;

-- One row per (monster, skill). skill_id is the game's numeric id; skill_name
-- is the internal constant (e.g. NPC_POISON) because the raw feed gives no
-- display name here and inventing one would be guessing.
create table if not exists monster_skills (
  monster_id integer not null references monsters (id) on delete cascade,
  skill_id integer not null,
  skill_name text not null,
  skill_lv integer,
  rate numeric,
  cast_time integer,
  delay integer,
  target text,
  state text,
  primary key (monster_id, skill_id, skill_name)
);

create index if not exists monster_skills_monster_idx on monster_skills (monster_id);

-- RLS in the same migration that creates the table. v1 shipped tables with RLS
-- off, which left the public anon key with full DML rights on every row.
alter table monster_skills enable row level security;

create policy "monster_skills public read"
  on monster_skills for select
  to anon, authenticated
  using (true);
