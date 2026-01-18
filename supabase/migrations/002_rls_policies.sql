-- ============================================================================
-- ModelOptix Row Level Security (RLS) Policies
-- Migration: 002_rls_policies.sql
-- Created: 2026-01-18
--
-- This migration implements comprehensive RLS policies per architecture.md Section 6
--
-- Policy Categories:
-- 1. USER-OWNED TABLES - Full CRUD with auth.uid() checks
-- 2. PUBLIC READ TABLES - SELECT only for catalog data
-- 3. SERVER-ONLY TABLES - RLS enabled, no policies (deny all client access)
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- ============================================================================

-- User-owned tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanity_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Public read tables (catalog data)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_provider_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_overrides ENABLE ROW LEVEL SECURITY;

-- Server-only tables (deny all client access)
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: USER-OWNED TABLE POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- user_profiles: Users can read/update their own profile only (no INSERT/DELETE)
-- Note: INSERT handled by trigger on auth.users, DELETE not allowed
-- ----------------------------------------------------------------------------

CREATE POLICY user_profiles_select ON user_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY user_profiles_update ON user_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- products: Users can CRUD their own products
-- ----------------------------------------------------------------------------

CREATE POLICY products_select ON products
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY products_insert ON products
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY products_update ON products
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY products_delete ON products
  FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- functions: Users can CRUD functions for products they own (nested check)
-- ----------------------------------------------------------------------------

CREATE POLICY functions_select ON functions
  FOR SELECT
  USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

CREATE POLICY functions_insert ON functions
  FOR INSERT
  WITH CHECK (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

CREATE POLICY functions_update ON functions
  FOR UPDATE
  USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  )
  WITH CHECK (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

CREATE POLICY functions_delete ON functions
  FOR DELETE
  USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- use_cases: Users can CRUD use cases for functions they own (nested check)
-- ----------------------------------------------------------------------------

CREATE POLICY use_cases_select ON use_cases
  FOR SELECT
  USING (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY use_cases_insert ON use_cases
  FOR INSERT
  WITH CHECK (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY use_cases_update ON use_cases
  FOR UPDATE
  USING (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY use_cases_delete ON use_cases
  FOR DELETE
  USING (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- opportunities: Users can SELECT only (system-generated via jobs)
-- Nested check through use_cases -> functions -> products
-- ----------------------------------------------------------------------------

CREATE POLICY opportunities_select ON opportunities
  FOR SELECT
  USING (
    use_case_id IN (
      SELECT uc.id FROM use_cases uc
      JOIN functions f ON uc.function_id = f.id
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies - opportunities are system-generated only

-- ----------------------------------------------------------------------------
-- sanity_checks: Users can SELECT/INSERT their own (immutable, no UPDATE/DELETE)
-- Special handling: Guest checks (is_guest = TRUE) written via service role only
-- ----------------------------------------------------------------------------

CREATE POLICY sanity_checks_select ON sanity_checks
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY sanity_checks_insert ON sanity_checks
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_guest = FALSE
  );

-- No UPDATE/DELETE policies - sanity checks are immutable audit records
-- Guest sanity checks (is_guest = TRUE) are written via service role only

-- ----------------------------------------------------------------------------
-- alerts: Users can SELECT/UPDATE their own (for marking as read)
-- No INSERT (system-generated), no DELETE (audit trail)
-- ----------------------------------------------------------------------------

CREATE POLICY alerts_select ON alerts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY alerts_update ON alerts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No INSERT/DELETE policies - alerts are system-generated and preserved

-- ----------------------------------------------------------------------------
-- notification_preferences: Users can full CRUD their own
-- ----------------------------------------------------------------------------

CREATE POLICY notification_preferences_select ON notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY notification_preferences_insert ON notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_update ON notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_delete ON notification_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- usage_tracking: Users can SELECT only (system-managed)
-- ----------------------------------------------------------------------------

CREATE POLICY usage_tracking_select ON usage_tracking
  FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies - usage tracking is system-managed

-- ============================================================================
-- SECTION 3: PUBLIC READ TABLE POLICIES (Catalog Data)
-- These tables are visible to all authenticated users (read-only)
-- No INSERT/UPDATE/DELETE - managed by admin/system processes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- models: Public read for all (including unauthenticated for landing page)
-- ----------------------------------------------------------------------------

CREATE POLICY models_select ON models
  FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- providers: Public read for all
-- ----------------------------------------------------------------------------

CREATE POLICY providers_select ON providers
  FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- model_provider_pricing: Public read for all
-- ----------------------------------------------------------------------------

CREATE POLICY model_provider_pricing_select ON model_provider_pricing
  FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- parameter_support: Public read for all
-- ----------------------------------------------------------------------------

CREATE POLICY parameter_support_select ON parameter_support
  FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- model_trust_scores: Public read for all
-- ----------------------------------------------------------------------------

CREATE POLICY model_trust_scores_select ON model_trust_scores
  FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- editorial_overrides: Public read for all
-- ----------------------------------------------------------------------------

CREATE POLICY editorial_overrides_select ON editorial_overrides
  FOR SELECT
  USING (true);

-- ============================================================================
-- SECTION 4: SERVER-ONLY TABLES (No Client Access)
-- RLS is enabled but NO policies defined = deny all client access
-- These tables are only accessible via service role (backend jobs)
-- ============================================================================

-- job_runs: No policies - deny all client access
-- Access via service role only for background job processing

-- webhook_events: No policies - deny all client access
-- Access via service role only for webhook processing

-- ============================================================================
-- SECTION 5: HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if user owns a product
CREATE OR REPLACE FUNCTION user_owns_product(product_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM products
    WHERE id = product_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a function (via product ownership)
CREATE OR REPLACE FUNCTION user_owns_function(function_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM functions f
    JOIN products p ON f.product_id = p.id
    WHERE f.id = function_uuid
    AND p.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a use case (via function -> product ownership)
CREATE OR REPLACE FUNCTION user_owns_use_case(use_case_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM use_cases uc
    JOIN functions f ON uc.function_id = f.id
    JOIN products p ON f.product_id = p.id
    WHERE uc.id = use_case_uuid
    AND p.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 6: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY user_profiles_select ON user_profiles IS 'Users can only read their own profile';
COMMENT ON POLICY user_profiles_update ON user_profiles IS 'Users can only update their own profile';

COMMENT ON POLICY products_select ON products IS 'Users can only see their own products';
COMMENT ON POLICY products_insert ON products IS 'Users can only create products for themselves';
COMMENT ON POLICY products_update ON products IS 'Users can only update their own products';
COMMENT ON POLICY products_delete ON products IS 'Users can only delete their own products';

COMMENT ON POLICY functions_select ON functions IS 'Users can only see functions for products they own';
COMMENT ON POLICY functions_insert ON functions IS 'Users can only create functions for products they own';
COMMENT ON POLICY functions_update ON functions IS 'Users can only update functions for products they own';
COMMENT ON POLICY functions_delete ON functions IS 'Users can only delete functions for products they own';

COMMENT ON POLICY use_cases_select ON use_cases IS 'Users can only see use cases for functions they own';
COMMENT ON POLICY use_cases_insert ON use_cases IS 'Users can only create use cases for functions they own';
COMMENT ON POLICY use_cases_update ON use_cases IS 'Users can only update use cases for functions they own';
COMMENT ON POLICY use_cases_delete ON use_cases IS 'Users can only delete use cases for functions they own';

COMMENT ON POLICY opportunities_select ON opportunities IS 'Users can only see opportunities for use cases they own';

COMMENT ON POLICY sanity_checks_select ON sanity_checks IS 'Users can only see their own sanity checks';
COMMENT ON POLICY sanity_checks_insert ON sanity_checks IS 'Users can only create sanity checks for themselves (non-guest)';

COMMENT ON POLICY alerts_select ON alerts IS 'Users can only see their own alerts';
COMMENT ON POLICY alerts_update ON alerts IS 'Users can only update their own alerts (mark as read)';

COMMENT ON POLICY notification_preferences_select ON notification_preferences IS 'Users can only see their own preferences';
COMMENT ON POLICY notification_preferences_insert ON notification_preferences IS 'Users can only create preferences for themselves';
COMMENT ON POLICY notification_preferences_update ON notification_preferences IS 'Users can only update their own preferences';
COMMENT ON POLICY notification_preferences_delete ON notification_preferences IS 'Users can only delete their own preferences';

COMMENT ON POLICY usage_tracking_select ON usage_tracking IS 'Users can only see their own usage data';

COMMENT ON POLICY models_select ON models IS 'All users can read model catalog';
COMMENT ON POLICY providers_select ON providers IS 'All users can read provider catalog';
COMMENT ON POLICY model_provider_pricing_select ON model_provider_pricing IS 'All users can read pricing data';
COMMENT ON POLICY parameter_support_select ON parameter_support IS 'All users can read parameter support data';
COMMENT ON POLICY model_trust_scores_select ON model_trust_scores IS 'All users can read trust scores';
COMMENT ON POLICY editorial_overrides_select ON editorial_overrides IS 'All users can read editorial overrides';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
