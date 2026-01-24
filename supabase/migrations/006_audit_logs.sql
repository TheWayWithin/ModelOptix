-- ============================================================================
-- Migration: Audit Logs Infrastructure
-- Task: 5.13 - Audit Log Infrastructure
-- Purpose: Compliance-ready audit logging for all admin actions
-- Retention: 2 years per PRD compliance requirements
-- ============================================================================

-- Create audit action enum
CREATE TYPE audit_action AS ENUM (
  'trust_score_updated',
  'trust_score_approved',
  'trust_score_rejected',
  'subscription_created',
  'subscription_modified',
  'subscription_cancelled',
  'editorial_override_created',
  'editorial_override_updated',
  'editorial_override_deleted',
  'model_created',
  'model_updated',
  'model_deleted',
  'provider_created',
  'provider_updated',
  'provider_deleted',
  'user_role_changed',
  'user_suspended',
  'user_reactivated',
  'pricing_updated',
  'system_config_changed'
);

-- Create entity type enum
CREATE TYPE audit_entity_type AS ENUM (
  'model',
  'provider',
  'user',
  'subscription',
  'editorial_override',
  'pricing',
  'system_config'
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action (admin user)
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,

  -- Target user (if action affects a specific user, nullable for system-wide actions)
  user_id UUID REFERENCES auth.users(id),

  -- Action details
  action audit_action NOT NULL,
  entity_type audit_entity_type NOT NULL,
  entity_id TEXT NOT NULL,  -- Can be UUID or other identifier
  entity_name TEXT,         -- Human-readable name for display

  -- State tracking for change auditing
  before_state JSONB,
  after_state JSONB,

  -- Additional context
  description TEXT,         -- Human-readable description of what changed
  ip_address INET,          -- For security auditing
  user_agent TEXT,          -- Browser/client info

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete for compliance (we never hard delete audit logs)
  -- Retention handled by separate archival process
  archived_at TIMESTAMPTZ
);

-- ============================================================================
-- Indexes for common query patterns
-- ============================================================================

-- Primary time-range index (most common filter)
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Entity lookups ("show all changes to model X")
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Admin accountability ("show all actions by admin Y")
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id, created_at DESC);

-- Action type filtering
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- User impact tracking ("show all admin actions affecting user Z")
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Composite index for common admin panel queries
CREATE INDEX idx_audit_logs_composite ON audit_logs(entity_type, action, created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs (required for admin panel)
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- No direct insert/update/delete from client - only via service role
-- This ensures audit log integrity
-- Insertions happen via service role client in API routes

-- ============================================================================
-- Retention Policy Comments
-- ============================================================================

COMMENT ON TABLE audit_logs IS '
Compliance audit log for all admin actions.
Retention: 2 years per PRD requirements.

Archival Strategy:
- Logs older than 2 years should be archived to cold storage
- Use archived_at timestamp to mark archived records
- Consider partitioning by month for large-scale deployments

Security:
- RLS prevents client-side writes
- Only service role can insert
- Admins can read for compliance review
';
