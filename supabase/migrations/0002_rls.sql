-- 0002_rls.sql
--
-- Row Level Security. NEXT_PUBLIC_SUPABASE_ANON_KEY ships to every browser by
-- design, and with RLS off Supabase's default grants let the anon role run
-- arbitrary DML on every table. Enable RLS everywhere, then hand back exactly
-- the access the public site needs: read-only on the five content tables,
-- insert-only on feedback_reports.
--
-- Also adds the unique constraint monster_spawns was missing, so the monthly
-- re-import (spec §4) can upsert spawns instead of duplicating them.

alter table monsters enable row level security;
alter table items enable row level security;
alter table monster_drops enable row level security;
alter table monster_spawns enable row level security;
alter table skills enable row level security;
alter table feedback_reports enable row level security;

-- Content tables: public read only. No insert/update/delete policy exists for
-- anon/authenticated, so writes stay service-role only (the import script).
create policy "monsters public read"
  on monsters for select
  to anon, authenticated
  using (true);

create policy "items public read"
  on items for select
  to anon, authenticated
  using (true);

create policy "monster_drops public read"
  on monster_drops for select
  to anon, authenticated
  using (true);

create policy "monster_spawns public read"
  on monster_spawns for select
  to anon, authenticated
  using (true);

create policy "skills public read"
  on skills for select
  to anon, authenticated
  using (true);

-- Feedback: anyone may submit, nobody may read back. Deliberately no select,
-- update or delete policy, so one visitor cannot read or tamper with another
-- visitor's report. Admin review happens via the service-role key (out of v1).
create policy "feedback_reports public insert"
  on feedback_reports for insert
  to anon, authenticated
  with check (true);

-- Without security_invoker the view runs as its owner and bypasses the RLS
-- policies above on its underlying tables (Supabase's linter flags this).
alter view monster_farming_stats set (security_invoker = on);

-- Re-running the import must not duplicate spawn rows.
alter table monster_spawns
  add constraint monster_spawns_monster_map_unique unique (monster_id, map_code);
