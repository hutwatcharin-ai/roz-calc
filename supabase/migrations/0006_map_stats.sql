-- 0006_map_stats.sql
--
-- monster_spawns holds 3,032 rows and Supabase caps a request at 1,000, so a
-- map list built from the raw table has to page. Paging needs an ORDER BY, and
-- the only useful column, map_code, has ties -- about six rows per map.
-- Postgres does not guarantee a stable order among tied rows across separate
-- queries, so a row can be returned twice or skipped between pages, and a map
-- shows a wrong monster count with no error anywhere.
--
-- Aggregating here removes the question rather than managing it: 497 rows, one
-- per map, one request, no pagination and so no ordering to be unstable.
--
-- min(map_display_name) is safe: no map in the data carries two different
-- display names, and only 245 of 497 carry one at all -- the rest stay null and
-- the page shows the code instead of guessing a name.

create or replace view map_stats as
select
  s.map_code,
  min(s.map_display_name) as map_display_name,
  count(*)::integer as monster_count
from monster_spawns s
group by s.map_code;

-- Without security_invoker a view runs as its owner and bypasses the RLS
-- policies on the table beneath it. monster_spawns is public-read anyway, but
-- the setting is stated explicitly so the next view added here inherits the
-- habit rather than the omission.
alter view map_stats set (security_invoker = on);
