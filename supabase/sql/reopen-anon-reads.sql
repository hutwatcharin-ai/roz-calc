-- reopen-anon-reads.sql: undo close-anon-reads.sql (owner, 12 Oct 2026).
--
-- Gives the public roles back what the site used to need from the browser:
-- read on every table and view in public, and insert on feedback_reports.
-- The RLS policies from 0002_rls.sql were never dropped, so tables with RLS
-- on are back to exactly their old rules once the grants return.
-- Run in the Supabase SQL Editor only if the site breaks after closing.

grant select on all tables in schema public to anon, authenticated;
grant insert on feedback_reports to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges for role postgres in schema public
  grant select on tables to anon, authenticated;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated;
