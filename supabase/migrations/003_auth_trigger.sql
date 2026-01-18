-- ============================================================================
-- Migration: 003_auth_trigger.sql
-- Description: Creates auth trigger to automatically create user_profiles
--              when users sign up via Supabase Auth
-- Created: 2026-01-18
-- ============================================================================

-- ============================================================================
-- FUNCTION: handle_new_user()
-- ============================================================================
-- This function is called by a trigger when a new user signs up.
-- It automatically creates a corresponding user_profiles record with:
--   - id: matches auth.users.id for easy joins
--   - email: from auth.users.email
--   - display_name: extracted from OAuth metadata or email prefix
--   - subscription_tier: 'free' (default for new users)
--   - subscription_status: 'active' (default)
--   - is_admin: FALSE (default)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _display_name TEXT;
BEGIN
  -- Extract display_name from OAuth metadata if available
  -- OAuth providers (Google, GitHub) store the user's name in raw_user_meta_data
  _display_name := COALESCE(
    -- Try 'full_name' (Google OAuth)
    NEW.raw_user_meta_data->>'full_name',
    -- Try 'name' (GitHub OAuth, some other providers)
    NEW.raw_user_meta_data->>'name',
    -- Try 'user_name' (GitHub OAuth fallback)
    NEW.raw_user_meta_data->>'user_name',
    -- Fallback: use email prefix (part before @)
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Insert new user_profile record
  -- Columns must match user_profiles table from 001_initial_schema.sql
  INSERT INTO public.user_profiles (
    id,
    email,
    display_name,
    subscription_tier,
    subscription_status,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,                  -- Match auth.users.id
    NEW.email,               -- User's email
    _display_name,           -- Extracted or fallback name
    'free',                  -- Default tier for new users
    'active',                -- Default status
    FALSE,                   -- Not admin by default
    NOW(),                   -- Created timestamp
    NOW()                    -- Updated timestamp
  );

  RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGER: on_auth_user_created
-- ============================================================================
-- Fires AFTER INSERT on auth.users table
-- Calls handle_new_user() to create the corresponding user_profile
-- ============================================================================

-- Drop existing trigger if it exists (idempotent migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- The trigger function needs to be owned by postgres and have SECURITY DEFINER
-- to bypass RLS when inserting into user_profiles
-- ============================================================================

-- Ensure the function is owned by postgres (service role)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user_profiles record when user signs up via Supabase Auth (Google OAuth, GitHub OAuth, or Email/Password)';

-- ============================================================================
-- NOTES: Manual Supabase Dashboard Configuration Required for Task 1.3
-- ============================================================================
-- The following settings CANNOT be configured via SQL migrations and must be
-- set manually in the Supabase Dashboard:
--
-- 1. SESSION COOKIE SETTINGS (Authentication > Settings > Session):
--    - SameSite: Lax (recommended for OAuth flows)
--    - Secure: true (HTTPS only)
--    - HttpOnly: true (prevents XSS access to session)
--
-- 2. EMAIL TEMPLATES (Authentication > Email Templates):
--    - Customize confirmation email with ModelOptix branding
--    - Customize password reset email
--    - Subject line: "Welcome to ModelOptix - Confirm Your Email"
--
-- 3. REDIRECT URLs (Authentication > URL Configuration):
--    - Site URL: https://modeloptix.com (production)
--    - Redirect URLs:
--      - https://modeloptix.com/auth/callback
--      - https://staging.modeloptix.com/auth/callback
--      - http://localhost:3000/auth/callback (development)
--
-- 4. OAUTH PROVIDERS (Authentication > Providers):
--    - Google OAuth: Enable, add Client ID and Secret
--    - GitHub OAuth: Enable, add Client ID and Secret
--    - Email/Password: Enable (already default)
--
-- 5. EMAIL RATE LIMITS (Authentication > Rate Limits):
--    - Configure appropriate limits to prevent abuse
-- ============================================================================
