create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  flag_url text,
  created_at timestamp with time zone default now()
);

alter table countries add column if not exists flag_url text;

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  name text not null,
  logo_url text,
  created_at timestamp with time zone default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  name text not null,
  short_name text,
  city text,
  stadium text,
  founded_year int,
  logo_url text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists leagues_country_id_idx on leagues(country_id);
create index if not exists teams_league_id_idx on teams(league_id);
create unique index if not exists countries_code_unique_idx on countries(code);
create unique index if not exists leagues_country_id_name_unique_idx on leagues(country_id, name);
create unique index if not exists teams_league_id_name_unique_idx on teams(league_id, name);

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_year int not null,
  end_year int not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint seasons_years_check check (end_year >= start_year)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  known_name text,
  nationality text,
  birth_date date,
  main_position text,
  overall int,
  potential int,
  photo_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint players_overall_check check (overall is null or (overall >= 1 and overall <= 99)),
  constraint players_potential_check check (potential is null or (potential >= 1 and potential <= 99))
);

create table if not exists squad_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  shirt_number int,
  joined_at date,
  left_at date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint squad_memberships_dates_check check (left_at is null or joined_at is null or left_at >= joined_at),
  constraint squad_memberships_shirt_number_check check (shirt_number is null or (shirt_number >= 1 and shirt_number <= 99))
);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  from_team_id uuid references teams(id) on delete set null,
  to_team_id uuid not null references teams(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  transfer_date date not null,
  fee numeric,
  transfer_type text not null,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint transfers_type_check check (transfer_type in ('permanent', 'loan', 'free', 'youth', 'release')),
  constraint transfers_fee_check check (fee is null or fee >= 0)
);

create index if not exists squad_memberships_player_id_idx on squad_memberships(player_id);
create index if not exists squad_memberships_team_id_idx on squad_memberships(team_id);
create index if not exists squad_memberships_season_id_idx on squad_memberships(season_id);
create index if not exists transfers_player_id_idx on transfers(player_id);
create index if not exists transfers_from_team_id_idx on transfers(from_team_id);
create index if not exists transfers_to_team_id_idx on transfers(to_team_id);
create index if not exists transfers_season_id_idx on transfers(season_id);
create index if not exists transfers_transfer_date_idx on transfers(transfer_date desc);
create unique index if not exists seasons_name_unique_idx on seasons(name);
create unique index if not exists squad_memberships_player_team_season_unique_idx
  on squad_memberships(player_id, team_id, season_id);
create unique index if not exists players_name_birth_date_unique_idx
  on players(name, birth_date)
  where birth_date is not null;

-- Diagnostic queries to run before applying unique indexes to an existing database:
-- select code, count(*) from countries where code is not null group by code having count(*) > 1;
-- select country_id, name, count(*) from leagues group by country_id, name having count(*) > 1;
-- select league_id, name, count(*) from teams group by league_id, name having count(*) > 1;
-- select name, count(*) from seasons group by name having count(*) > 1;
-- select player_id, team_id, season_id, count(*) from squad_memberships group by player_id, team_id, season_id having count(*) > 1;
-- select name, birth_date, count(*) from players where birth_date is not null group by name, birth_date having count(*) > 1;

insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('league-logos', 'league-logos', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read team logos'
  ) then
    create policy "Public read team logos"
    on storage.objects for select
    to anon
    using (bucket_id = 'team-logos');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon upload team logos'
  ) then
    create policy "Anon upload team logos"
    on storage.objects for insert
    to anon
    with check (bucket_id = 'team-logos');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read league logos'
  ) then
    create policy "Public read league logos"
    on storage.objects for select
    to anon
    using (bucket_id = 'league-logos');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon upload league logos'
  ) then
    create policy "Anon upload league logos"
    on storage.objects for insert
    to anon
    with check (bucket_id = 'league-logos');
  end if;
end $$;
