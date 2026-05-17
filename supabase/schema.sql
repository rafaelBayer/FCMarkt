create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  created_at timestamp with time zone default now()
);

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

insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do update set public = true;

create policy "Public read team logos"
on storage.objects for select
to anon
using (bucket_id = 'team-logos');

create policy "Anon upload team logos"
on storage.objects for insert
to anon
with check (bucket_id = 'team-logos');
