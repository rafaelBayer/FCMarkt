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
