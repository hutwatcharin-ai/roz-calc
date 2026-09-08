-- 0010_monsters_unknown_stats.sql
--
-- Lets a monster row say "we do not know this number".
--
-- 0001 made hp, base_exp and job_exp NOT NULL, and 0004 made is_aggressive
-- NOT NULL DEFAULT false, because every monster in the first import carried
-- all four. The Nordfeld monsters imported on 8 Sep 2026 do not: both
-- independent sources print a dash for HP and EXP, and neither carries the
-- aggression flag at all.
--
-- The default is the danger here, not the null. `is_aggressive = false`
-- renders as "ไม่เข้าโจมตีก่อน" -- a promise that the monster will not attack
-- you while you are away from the keyboard, which is the one claim this site
-- must never make without evidence. `hp = 0` and `base_exp = 0` are the same
-- mistake in a smaller way: a made-up number the reader has no way to spot.
--
-- NULL is already what the application expects: every component that reads
-- is_aggressive is typed `boolean | null` and AggroBadge grades an unknown
-- flag as unknown rather than safe.

alter table monsters alter column hp drop not null;
alter table monsters alter column base_exp drop not null;
alter table monsters alter column base_exp drop default;
alter table monsters alter column job_exp drop not null;
alter table monsters alter column job_exp drop default;
alter table monsters alter column is_aggressive drop not null;
alter table monsters alter column is_aggressive drop default;
