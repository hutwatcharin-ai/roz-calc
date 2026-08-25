-- 0001_init.sql

create table monsters (
  id integer primary key,
  name_en text not null,
  name_th text,
  level integer not null,
  element text,
  element_level integer,
  race text,
  size text,
  hp integer not null,
  atk_min integer,
  atk_max integer,
  def integer,
  mdef integer,
  flee integer,
  hit integer,
  base_exp bigint not null default 0,
  job_exp bigint not null default 0,
  image_url text
);

create table items (
  id integer primary key,
  name_en text not null,
  name_th text,
  category text,
  weapon_type text,
  atk integer,
  required_level integer,
  weapon_level integer,
  equippable_classes text[] not null default '{}',
  buy_price integer,
  sell_price integer,
  icon_url text
);

create table monster_drops (
  id bigserial primary key,
  monster_id integer not null references monsters(id) on delete cascade,
  item_id integer not null references items(id) on delete cascade,
  rate numeric not null,
  unique (monster_id, item_id)
);

create table monster_spawns (
  id bigserial primary key,
  monster_id integer not null references monsters(id) on delete cascade,
  map_code text not null,
  map_display_name text
);

create table skills (
  slug text primary key,
  name text not null,
  type text,
  max_level integer,
  element text,
  classes text[] not null default '{}',
  icon_url text
);

create table feedback_reports (
  id bigserial primary key,
  page_type text not null,
  entity_id text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index monster_drops_item_id_idx on monster_drops(item_id);
create index monster_drops_monster_id_idx on monster_drops(monster_id);
create index monster_spawns_monster_id_idx on monster_spawns(monster_id);
create index monsters_level_idx on monsters(level);

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
  ), 0) as avg_zeny_per_kill
from monsters m;
