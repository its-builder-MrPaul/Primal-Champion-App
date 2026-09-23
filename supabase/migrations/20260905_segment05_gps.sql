-- Segment 05: raw GPS route storage.
-- Client may submit raw route facts for the authenticated user.
-- Final activity score remains server-authoritative and is handled later by Segment 07.

create table if not exists public.gps_points (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  altitude double precision,
  accuracy double precision check (accuracy is null or accuracy >= 0),
  speed double precision check (speed is null or speed >= 0),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists gps_points_workout_recorded_idx
  on public.gps_points(workout_id, recorded_at);

create index if not exists gps_points_user_recorded_idx
  on public.gps_points(user_id, recorded_at);

alter table public.gps_points enable row level security;

drop policy if exists gps_points_self on public.gps_points;
create policy gps_points_self on public.gps_points
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
