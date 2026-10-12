-- close-anon-reads.sql (owner, 12 Oct 2026)
--
-- Stops anyone with the old public anon key from reading or writing the
-- database over REST. Since this date the site reads only on the server with
-- the service-role key (lib/supabase.ts supabaseRead, plus /api/search,
-- /api/monster/<id> and /api/feedback), and the service role ignores both
-- RLS and these grants, so the site keeps working.
--
-- Run ONLY after the deploy that ships those routes is live and verified,
-- and after SUPABASE_SERVICE_ROLE_KEY is set in Coolify (build and runtime).
-- Run in the Supabase SQL Editor, as one script. To undo: reopen-anon-reads.sql.
--
-- Why grants and not just policies: RLS policies only guard tables that have
-- RLS on. Views and materialized views (map_stats, monster_farming_stats)
-- and any table created later without RLS are readable through the anon
-- grant alone. Taking the grant away closes all of them at once.

-- 1. What anon/authenticated can do right now (read it before step 2).
select table_name, string_agg(distinct privilege_type, ', ') as privileges, grantee
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

-- 2. Take every table, view and sequence privilege in public away from the
--    two public roles.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- 3. Tables created later by the postgres role (the SQL Editor) start closed.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

-- 4. Check: this should return no rows.
select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated');
