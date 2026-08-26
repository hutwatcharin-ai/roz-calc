-- 0005_farming_stats_aggro.sql
--
-- monster_farming_stats (0001_init.sql) has a fixed column list that omits
-- is_aggressive and atk_max. app/page.tsx reads this view for the Farming
-- Finder, which the spec requires to carry the aggro badge on every row.
-- Worse than a missing feature: aggroLevel() treats an undefined
-- is_aggressive as falsy, so every monster would silently read "ปลอดภัย" --
-- wrong for all 286 aggressive ones, with no error anywhere.
--
-- create or replace view reuses the view's existing OID rather than dropping
-- and recreating it, appending new output columns at the end is allowed, and
-- reloptions (security_invoker, set in 0002_rls.sql via ALTER VIEW ... SET)
-- attach to that same pg_class row -- so they are not reset by this
-- replacement. Re-applying the ALTER VIEW below anyway: it is a one-line,
-- idempotent statement, and re-stating a security-relevant setting explicitly
-- in the same migration that touches the view is cheaper than trusting an
-- inference about reloption survival with no environment to verify it in.

create or replace view monster_farming_stats as
select
  m.id as monster_id,
  m.name_en,
  m.name_th,
  m.level,
  m.hp,
  m.base_exp,
  m.race,
  m.element,
  m.image_url,
  case when m.hp > 0 then round((m.base_exp::numeric / m.hp), 2) else 0 end as exp_per_hp,
  coalesce((
    select round(sum(i.sell_price * (d.rate / 100.0))::numeric, 2)
    from monster_drops d
    join items i on i.id = d.item_id
    where d.monster_id = m.id and i.sell_price is not null
  ), 0) as avg_zeny_per_kill,
  m.is_aggressive,
  m.atk_max
from monsters m;

alter view monster_farming_stats set (security_invoker = on);
