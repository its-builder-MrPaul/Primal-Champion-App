# Primal Champion: 28-Segment Implementation Map

## Phase 1
01 Foundation: Expo/TS/Router/NativeWind shell. DONE
02 Backend foundation: Supabase schema, RLS, Edge Function boundary. DONE
03 Auth: Supabase Auth client foundation. CORE DONE; Google/Apple provider configuration remains deployment-specific.
04 Onboarding: profile/goal schema ready. UI expansion remains.

## Phase 2
05 GPS running: location dependency and run route are scaffolded. Full background tracking/map UI remains.
06 Bodyweight tracker: exercise configuration and persistence are scaffolded.
07 Points engine: authoritative scoring formula implemented in mobile and Edge Function.
08 Nutrition: schema and client boundary ready.
09 Sleep/hydration: schema and scoring functions ready.

## Phase 3
10 AI food recognition: integration boundary required for Claude API secret.
11 AI Coach: integration boundary required for model API and notification scheduler.

## Phase 4
12 Achievements: schema + seed-ready.
13 RPG levels: profile XP/level fields ready.
14 Challenges: schema ready.
15 Seasons: schema ready.

## Phase 5
16 Communities: schema ready.
17 Leaderboard: daily/season score schema ready; realtime/Redis production layer remains.
18 Social feed: posts/follows/comments/likes schema ready.

## Phase 6
19 Home dashboard: basic shell.
20 Profile: profile schema ready.
21 Transformation Journey: transformation schema ready.
22 Workout complete: scoring response boundary ready.
23 Design system: token layer started; full component library remains.

## Phase 7
24 Notifications: notification schema + Expo dependency.
25 Admin: server-side privileged tooling boundary remains.
26 Scalability: indexes and service boundaries started; Redis/Cloudflare deployment remains.
27 Testing: scoring functions are deterministic and testable; full Jest/Detox suite remains.
28 Deployment: repository is local-run oriented; production credentials/store certificates remain deployment-specific.

### Engineering truth
This repository is a complete implementation base, not a claim that third-party production accounts, Apple/Google credentials, Claude credentials, Firebase credentials, Redis clusters, CDN settings, app-store certificates, and physical-device permissions can be fabricated. Those are deployment inputs.
