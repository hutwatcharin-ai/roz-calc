-- 0007_map_stats_search.sql
--
-- The list page originally searched with .or('map_code.ilike...,map_display_name.ilike...'),
-- which meant sanitising the user's query to fit PostgREST's .or() filter-string
-- syntax (commas and parens are separators there). That sanitising stripped
-- characters from the search needle but not from the column being matched, so
-- a map whose own display name contains a paren -- "Payon Cave 5F (Abandoned
-- Village)", one of ten such names -- could never be found by searching its
-- exact name.
--
-- search_text collapses both searchable columns into one, so the page can use
-- a single ilike() with no filter-string syntax to escape around in the first
-- place. That removes the comma/paren problem at its root instead of managing
-- it with sanitisation.
--
-- coalesce() is needed here (unlike map_display_name's own min(), which is
-- allowed to surface a null) because concatenating null with '||' would make
-- the whole search_text null, hiding the map_code half too.

create or replace view map_stats as
select
  s.map_code,
  min(s.map_display_name) as map_display_name,
  count(*)::integer as monster_count,
  s.map_code || ' ' || coalesce(min(s.map_display_name), '') as search_text
from monster_spawns s
group by s.map_code;

-- Re-stated rather than inherited: create or replace view rebuilds the view
-- definition, and this setting is security-relevant (it keeps the view
-- running under the querying role's RLS instead of the view owner's), so it
-- belongs in the migration that touches the view rather than left implicit.
alter view map_stats set (security_invoker = on);
