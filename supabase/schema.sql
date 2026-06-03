-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Matches
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  home_team text not null,
  away_team text not null,
  home_team_code text not null,
  away_team_code text not null,
  match_date timestamptz not null,
  stage text not null default 'GROUP',
  group_name text,
  home_score integer,
  away_score integer,
  status text not null default 'SCHEDULED',
  api_match_id text,
  created_at timestamptz default now()
);

alter table public.matches enable row level security;
create policy "Matches are viewable by everyone" on public.matches for select using (true);
create policy "Only admins can insert matches" on public.matches for insert using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Only admins can update matches" on public.matches for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Predictions
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  home_score integer not null,
  away_score integer not null,
  points integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);

alter table public.predictions enable row level security;
create policy "Users can view all predictions" on public.predictions for select using (true);
create policy "Users can insert own predictions" on public.predictions for insert with check (auth.uid() = user_id);
create policy "Users can update own predictions" on public.predictions for update using (auth.uid() = user_id);

-- Leaderboard view
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.username,
  p.display_name,
  coalesce(sum(pr.points), 0) as total_points,
  count(case when pr.points = 3 then 1 end) as correct_results,
  count(case when pr.points = 1 then 1 end) as correct_winners,
  rank() over (order by coalesce(sum(pr.points), 0) desc) as rank
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.username, p.display_name
order by total_points desc;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at on predictions
create or replace function public.handle_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger predictions_updated_at
  before update on public.predictions
  for each row execute procedure public.handle_updated_at();
