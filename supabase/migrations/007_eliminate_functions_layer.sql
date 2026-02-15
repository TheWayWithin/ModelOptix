-- ============================================================================
-- Migration: Eliminate Functions Layer
-- Description: Merge functions table into use_cases, simplify capabilities
-- Date: 2026-01-25
-- Sprint: sprint-01-eliminate-functions-layer.md
-- ============================================================================
--
-- WHAT THIS MIGRATION DOES:
-- 1. Adds new columns to use_cases (product_id, priority, latency_requirement_ms, etc.)
-- 2. Migrates data from functions into use_cases
-- 3. Converts orphaned functions (with no use cases) into use_cases
-- 4. Simplifies capabilities: removes input_type, output_type, requires_streaming
-- 5. Adds requires_json_mode (migrated from output_type='json')
-- 6. Updates RLS policies
-- 7. Deprecates functions table (keeps for 30 days for safety)
--
-- ROLLBACK: See end of file for rollback script
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Create backup tables (safety net)
-- ============================================================================

CREATE TABLE functions_backup AS SELECT * FROM functions;
CREATE TABLE use_cases_backup AS SELECT * FROM use_cases;

-- ============================================================================
-- Step 2: Add new columns to use_cases table
-- Note: Trigger disable removed - not allowed through Supabase pooler
-- ============================================================================

-- Add product_id column (will be populated from functions)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS product_id UUID;

-- Add priority and requirements columns (moved from functions)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS latency_requirement_ms INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS quality_requirement TEXT;

-- Add usage pattern columns (moved from functions)
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS monthly_volume INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS avg_input_tokens INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS avg_output_tokens INTEGER;

-- Add simplified capability column
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS requires_json_mode BOOLEAN DEFAULT FALSE;

-- Add check constraints for new columns
ALTER TABLE use_cases ADD CONSTRAINT use_cases_priority_check
  CHECK (priority IN ('critical', 'high', 'medium', 'low'));
ALTER TABLE use_cases ADD CONSTRAINT use_cases_quality_requirement_check
  CHECK (quality_requirement IS NULL OR quality_requirement IN ('best', 'good', 'acceptable'));

-- ============================================================================
-- Step 4: Migrate data from functions into use_cases
-- ============================================================================

-- For each use case, pull in its parent function's data
UPDATE use_cases uc
SET
  product_id = f.product_id,
  priority = f.priority,
  latency_requirement_ms = f.latency_requirement_ms,
  quality_requirement = f.quality_requirement,
  monthly_volume = f.monthly_volume,
  avg_input_tokens = f.avg_input_tokens,
  avg_output_tokens = f.avg_output_tokens,
  -- If use case name is generic (like "Use Case 1"), use function name instead
  name = CASE
    WHEN uc.name ~ '^Use Case \d+$' THEN f.name
    ELSE uc.name
  END,
  -- Merge descriptions
  description = CASE
    WHEN uc.description IS NULL OR uc.description = '' THEN f.description
    WHEN f.description IS NULL OR f.description = '' THEN uc.description
    ELSE f.description || ' - ' || uc.description
  END
FROM functions f
WHERE uc.function_id = f.id;

-- ============================================================================
-- Step 5: Handle orphaned functions (functions with no use cases)
-- Convert them to use cases so no data is lost
-- ============================================================================

INSERT INTO use_cases (
  product_id,
  function_id,  -- Keep temporarily for reference
  name,
  description,
  priority,
  latency_requirement_ms,
  quality_requirement,
  monthly_volume,
  avg_input_tokens,
  avg_output_tokens,
  primary_need,
  status,
  metadata,
  created_at,
  updated_at
)
SELECT
  f.product_id,
  f.id,  -- Keep function_id temporarily
  f.name,
  f.description,
  f.priority,
  f.latency_requirement_ms,
  f.quality_requirement,
  f.monthly_volume,
  f.avg_input_tokens,
  f.avg_output_tokens,
  'quality' AS primary_need,  -- Default primary need
  'active' AS status,
  f.metadata,
  f.created_at,
  f.updated_at
FROM functions f
WHERE NOT EXISTS (
  SELECT 1 FROM use_cases uc WHERE uc.function_id = f.id
);

-- ============================================================================
-- Step 6: Migrate capability flags (simplified)
-- Map old output_type='json' to new requires_json_mode flag
-- ============================================================================

UPDATE use_cases
SET requires_json_mode = TRUE
WHERE output_type = 'json';

-- ============================================================================
-- Step 7: Verify all use_cases have product_id before proceeding
-- ============================================================================

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count FROM use_cases WHERE product_id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % use_cases without product_id', orphan_count;
  END IF;
END $$;

-- ============================================================================
-- Step 8: Drop old RLS policies that depend on function_id
-- ============================================================================

-- Drop existing use_cases policies (they reference function_id through functions join)
DROP POLICY IF EXISTS use_cases_select ON use_cases;
DROP POLICY IF EXISTS use_cases_insert ON use_cases;
DROP POLICY IF EXISTS use_cases_update ON use_cases;
DROP POLICY IF EXISTS use_cases_delete ON use_cases;
DROP POLICY IF EXISTS "Users can view their own use cases" ON use_cases;
DROP POLICY IF EXISTS "Users can insert their own use cases" ON use_cases;
DROP POLICY IF EXISTS "Users can update their own use cases" ON use_cases;
DROP POLICY IF EXISTS "Users can delete their own use cases" ON use_cases;

-- Drop opportunities policy that depends on use_cases.function_id
DROP POLICY IF EXISTS opportunities_select ON opportunities;

-- ============================================================================
-- Step 9: Drop old columns from use_cases
-- ============================================================================

-- Drop foreign key to functions first
ALTER TABLE use_cases DROP CONSTRAINT IF EXISTS use_cases_function_id_fkey;

-- Drop old columns
ALTER TABLE use_cases DROP COLUMN IF EXISTS function_id;
ALTER TABLE use_cases DROP COLUMN IF EXISTS input_type;
ALTER TABLE use_cases DROP COLUMN IF EXISTS output_type;
ALTER TABLE use_cases DROP COLUMN IF EXISTS requires_streaming;

-- ============================================================================
-- Step 9: Add NOT NULL constraint and foreign key to product_id
-- ============================================================================

ALTER TABLE use_cases ALTER COLUMN product_id SET NOT NULL;

ALTER TABLE use_cases ADD CONSTRAINT use_cases_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- ============================================================================
-- Step 10: Recreate indexes (drop old, create new)
-- ============================================================================

DROP INDEX IF EXISTS idx_use_cases_function_id;

CREATE INDEX idx_use_cases_product_id ON use_cases(product_id) WHERE status = 'active';
CREATE INDEX idx_use_cases_priority ON use_cases(priority);
CREATE INDEX idx_use_cases_primary_need ON use_cases(primary_need);

-- ============================================================================
-- Step 12: Create new RLS policies for use_cases (using product_id)
-- ============================================================================

-- Create new policies (directly reference product_id → products)
CREATE POLICY "Users can view their own use cases"
  ON use_cases FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own use cases"
  ON use_cases FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own use cases"
  ON use_cases FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own use cases"
  ON use_cases FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

-- Recreate opportunities_select policy (now uses product_id through use_cases)
CREATE POLICY opportunities_select
  ON opportunities FOR SELECT
  USING (
    use_case_id IN (
      SELECT uc.id FROM use_cases uc
      JOIN products p ON uc.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Step 13: Handle functions table - deprecate but keep for 30 days
-- ============================================================================

-- Drop RLS policies on functions table (no longer needed)
DROP POLICY IF EXISTS "Users can view their own functions" ON functions;
DROP POLICY IF EXISTS "Users can insert their own functions" ON functions;
DROP POLICY IF EXISTS "Users can update their own functions" ON functions;
DROP POLICY IF EXISTS "Users can delete their own functions" ON functions;

-- Rename functions table (keep for safety)
ALTER TABLE functions RENAME TO functions_deprecated;

-- Add deprecation comment
COMMENT ON TABLE functions_deprecated IS 'DEPRECATED: Merged into use_cases on 2026-01-25. Safe to drop after 2026-02-25. See migration 007_eliminate_functions_layer.sql';

-- ============================================================================
-- Step 14: Clean up backup tables comment (keep them for 30 days)
-- ============================================================================

COMMENT ON TABLE functions_backup IS 'Backup created during 007 migration. Safe to drop after 2026-02-25.';
COMMENT ON TABLE use_cases_backup IS 'Backup created during 007 migration. Safe to drop after 2026-02-25.';

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (in case of issues)
-- Run this script manually if you need to rollback
-- ============================================================================
/*
BEGIN;

-- Restore use_cases table from backup
DROP TABLE IF EXISTS use_cases;
ALTER TABLE use_cases_backup RENAME TO use_cases;

-- Restore functions table
ALTER TABLE functions_deprecated RENAME TO functions;

-- Drop backups
DROP TABLE IF EXISTS functions_backup;

-- Re-enable RLS policies (from 002_rls_policies.sql)
-- Note: You'll need to re-run the relevant parts of 002_rls_policies.sql

COMMIT;
*/
