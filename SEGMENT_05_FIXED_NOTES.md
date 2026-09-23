# Segment 05 Fixed Integration

This package is based on the user's supplied project and preserves the existing screens and Supabase setup.

Changes made only to authentication resilience:
- sign-in now uses `maybeSingle()` for the profile lookup and sends authenticated users to onboarding when a profile row is missing/unavailable instead of trapping them on Sign In.
- auth store now stays synchronized with Supabase auth state.
- onboarding uses an idempotent profile upsert so an authenticated user can complete onboarding even if their profile row was not created by a trigger.

Segment 05 GPS files and configuration are preserved.
