# Primal Champion

Train. Eat. Recover. Dominate.

This repository is the local implementation base for the 28-segment Primal Champion roadmap.

## Architecture
- Mobile: React Native + Expo + TypeScript
- Navigation: Expo Router
- Styling: NativeWind
- Backend data/auth: Supabase PostgreSQL + Auth + Storage + Realtime
- Authoritative scoring: Supabase Edge Function
- Optional backend: Node/Express for jobs or integrations that should not run in the client
- Redis/Firebase/Cloudflare/AI integrations are isolated behind service boundaries for later production deployment.

## Local setup
1. Install Node.js 20+.
2. `cd mobile && npm install`
3. Copy `.env.example` to `.env` and add your Supabase project URL and publishable key.
4. `npx expo start`
5. For local Supabase development, install the Supabase CLI and run `supabase start` from the repository root.
6. Apply the SQL migration with `supabase db reset` for a local database, or `supabase db push` for a linked remote project.

## Important
Never place Supabase secret/service-role keys, Claude keys, Firebase server credentials, or AWS secret keys in the mobile `.env` or client bundle.

The repository contains the implementation skeleton for all 28 roadmap segments, plus working core data/scoring primitives. External provider credentials and platform-specific configuration are intentionally left as environment/deployment configuration.
