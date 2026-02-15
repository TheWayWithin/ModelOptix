-- Migration: Admin Stats Function
-- Description: Single function to fetch all admin dashboard stats in one round-trip
-- Performance: Replaces 22 separate queries with 1 database call
-- Created: 2026-02-15

-- Drop if exists (for idempotency)
DROP FUNCTION IF EXISTS get_admin_stats();

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    start_of_today timestamptz;
    start_of_week timestamptz;
    recent_jobs jsonb;
BEGIN
    -- Calculate date boundaries (using UTC)
    start_of_today := date_trunc('day', now() AT TIME ZONE 'UTC');
    start_of_week := date_trunc('week', now() AT TIME ZONE 'UTC');
    
    -- Get recent job runs (separate query for the array)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id::text,
            'job_name', job_name,
            'status', status,
            'started_at', started_at,
            'finished_at', finished_at
        ) ORDER BY started_at DESC
    ), '[]'::jsonb)
    INTO recent_jobs
    FROM (
        SELECT id, job_name, status, started_at, finished_at
        FROM job_runs
        ORDER BY started_at DESC
        LIMIT 5
    ) jr;
    
    -- Build the complete stats object in one query
    SELECT jsonb_build_object(
        'users', jsonb_build_object(
            'total', (SELECT COUNT(*) FROM user_profiles),
            'byTier', jsonb_build_object(
                'free', (SELECT COUNT(*) FROM user_profiles WHERE subscription_tier = 'free'),
                'solo', (SELECT COUNT(*) FROM user_profiles WHERE subscription_tier = 'solo'),
                'growth', (SELECT COUNT(*) FROM user_profiles WHERE subscription_tier = 'growth'),
                'pro', (SELECT COUNT(*) FROM user_profiles WHERE subscription_tier = 'pro')
            ),
            'newThisWeek', (SELECT COUNT(*) FROM user_profiles WHERE created_at >= start_of_week),
            'admins', (SELECT COUNT(*) FROM user_profiles WHERE is_admin = true)
        ),
        'content', jsonb_build_object(
            'products', (SELECT COUNT(*) FROM products),
            'functions', (SELECT COUNT(*) FROM functions),
            'useCases', (SELECT COUNT(*) FROM use_cases)
        ),
        'opportunities', jsonb_build_object(
            'active', (SELECT COUNT(*) FROM opportunities WHERE status = 'active'),
            'accepted', (SELECT COUNT(*) FROM opportunities WHERE status = 'accepted'),
            'dismissed', (SELECT COUNT(*) FROM opportunities WHERE status = 'dismissed'),
            'totalSavings', COALESCE((SELECT SUM(monthly_savings) FROM savings_records), 0)
        ),
        'sanityChecks', jsonb_build_object(
            'today', (SELECT COUNT(*) FROM sanity_checks WHERE created_at >= start_of_today),
            'thisWeek', (SELECT COUNT(*) FROM sanity_checks WHERE created_at >= start_of_week),
            'total', (SELECT COUNT(*) FROM sanity_checks),
            'guestChecks', (SELECT COUNT(*) FROM sanity_checks WHERE is_guest = true)
        ),
        'catalog', jsonb_build_object(
            'models', (SELECT COUNT(*) FROM models),
            'providers', (SELECT COUNT(*) FROM providers),
            'trustScores', (SELECT COUNT(*) FROM model_trust_scores)
        ),
        'jobs', jsonb_build_object(
            'running', (SELECT COUNT(*) FROM job_runs WHERE status = 'running'),
            'failed', (SELECT COUNT(*) FROM job_runs WHERE status = 'failed' AND started_at >= start_of_week),
            'recentRuns', recent_jobs
        ),
        'overrides', jsonb_build_object(
            'active', (SELECT COUNT(*) FROM editorial_overrides WHERE is_active = true)
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant execute to authenticated users and service_role (auth check happens in API route)
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_admin_stats() IS 'Returns all admin dashboard statistics in a single call. Used by /api/admin/stats endpoint.';
