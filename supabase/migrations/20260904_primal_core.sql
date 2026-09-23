-- Primal Champion core schema.
-- This migration is intentionally idempotent for local development.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '', age smallint, weight_kg numeric(6,2), height_cm numeric(6,2),
 gender text, goal text, avatar_url text, level integer not null default 1,
 xp bigint not null default 0, total_points bigint not null default 0,
 current_streak integer not null default 0, longest_streak integer not null default 0,
 champion_count integer not null default 0, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.workouts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 type text not null, started_at timestamptz, completed_at timestamptz, duration_seconds integer,
 distance_meters numeric(12,2), avg_pace_seconds numeric(10,2), calories numeric(10,2),
 effort numeric(6,3), intensity numeric(6,3), consistency numeric(6,3), recovery numeric(6,3),
 score numeric(12,2) not null default 0, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.exercise_logs (
 id uuid primary key default gen_random_uuid(), workout_id uuid references public.workouts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, exercise text not null, reps integer,
 duration_seconds integer, score numeric(12,2) not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.meals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, photo_url text, protein_g numeric(8,2), calories numeric(10,2),
 health_score numeric(6,2), points numeric(12,2) not null default 0, ai_confidence numeric(5,4),
 metadata jsonb not null default '{}', eaten_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.sleep_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 sleep_date date not null, duration_minutes integer not null, quality numeric(5,2),
 points numeric(12,2) not null default 0, source text not null default 'manual', unique(user_id,sleep_date)
);
create table if not exists public.hydration_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 log_date date not null, litres numeric(6,2) not null default 0, points numeric(12,2) not null default 0,
 unique(user_id,log_date)
);
create table if not exists public.point_ledger (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 source_type text not null, source_id uuid, points numeric(12,2) not null, multiplier numeric(8,4) not null default 1,
 reason text not null, occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'
);
create table if not exists public.daily_scores (
 user_id uuid not null references auth.users(id) on delete cascade, score_date date not null,
 workout_points numeric(12,2) not null default 0, nutrition_points numeric(12,2) not null default 0,
 sleep_points numeric(12,2) not null default 0, hydration_points numeric(12,2) not null default 0,
 consistency_points numeric(12,2) not null default 0, total_points numeric(12,2) not null default 0, rank integer,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(user_id,score_date)
);
create table if not exists public.communities(id uuid primary key default gen_random_uuid(),name text unique not null,description text,created_by uuid references auth.users(id),created_at timestamptz default now());
create table if not exists public.community_members(community_id uuid references public.communities(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,role text default 'member',joined_at timestamptz default now(),primary key(community_id,user_id));
create table if not exists public.achievements(id uuid primary key default gen_random_uuid(),code text unique not null,name text not null,description text not null,icon text,xp_reward int default 0,points_reward numeric default 0,active boolean default true);
create table if not exists public.user_achievements(user_id uuid references auth.users(id) on delete cascade,achievement_id uuid references public.achievements(id) on delete cascade,unlocked_at timestamptz default now(),primary key(user_id,achievement_id));
create table if not exists public.challenges(id uuid primary key default gen_random_uuid(),name text not null,description text,metric text not null,target numeric not null,starts_at timestamptz not null,ends_at timestamptz not null,status text default 'draft',reward_points numeric default 0,created_by uuid references auth.users(id));
create table if not exists public.challenge_participants(challenge_id uuid references public.challenges(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,progress numeric default 0,completed_at timestamptz,final_rank int,primary key(challenge_id,user_id));
create table if not exists public.seasons(id uuid primary key default gen_random_uuid(),name text not null,type text not null,starts_at timestamptz not null,ends_at timestamptz not null,active boolean default false);
create table if not exists public.season_scores(season_id uuid references public.seasons(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,points numeric default 0,rank int,primary key(season_id,user_id));
create table if not exists public.follows(follower_id uuid references auth.users(id) on delete cascade,following_id uuid references auth.users(id) on delete cascade,created_at timestamptz default now(),primary key(follower_id,following_id));
create table if not exists public.posts(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade,workout_id uuid references public.workouts(id),achievement_id uuid references public.achievements(id),body text,media_url text,created_at timestamptz default now());
create table if not exists public.post_likes(post_id uuid references public.posts(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,created_at timestamptz default now(),primary key(post_id,user_id));
create table if not exists public.post_comments(id uuid primary key default gen_random_uuid(),post_id uuid references public.posts(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,body text not null,created_at timestamptz default now());
create table if not exists public.transformations(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade,weight_kg numeric,photo_url text,note text,recorded_at timestamptz default now());
create table if not exists public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade,type text not null,title text not null,body text not null,data jsonb default '{}',read_at timestamptz,created_at timestamptz default now());

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.meals enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.point_ledger enable row level security;
alter table public.daily_scores enable row level security;

create policy if not exists profiles_self on public.profiles for all to authenticated using(auth.uid()=id) with check(auth.uid()=id);
create policy if not exists workouts_self on public.workouts for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy if not exists exercise_logs_self on public.exercise_logs for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy if not exists meals_self on public.meals for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy if not exists sleep_self on public.sleep_logs for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy if not exists hydration_self on public.hydration_logs for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy if not exists ledger_self on public.point_ledger for select to authenticated using(auth.uid()=user_id);
create policy if not exists daily_scores_public on public.daily_scores for select using(true);
