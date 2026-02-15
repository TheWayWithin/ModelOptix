-- ============================================================================
-- Migration 008: Fix model_provider_pricing unique constraint
-- ============================================================================
-- The model_provider_pricing table was missing a UNIQUE constraint on
-- (model_id, provider_id), which caused the sync upsert to fail silently.
-- This adds the required constraint.
-- ============================================================================

-- First, delete any duplicate rows (keep the most recently updated one)
DELETE FROM model_provider_pricing a
USING model_provider_pricing b
WHERE a.model_id = b.model_id
  AND a.provider_id = b.provider_id
  AND a.id < b.id;

-- Add the unique constraint
ALTER TABLE model_provider_pricing
ADD CONSTRAINT model_provider_pricing_model_provider_unique
UNIQUE (model_id, provider_id);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT model_provider_pricing_model_provider_unique ON model_provider_pricing
IS 'Each model can only have one pricing record per provider. Required for upsert operations.';
