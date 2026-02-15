/**
 * Audit Log Types
 * Task 5.13: Audit Log Infrastructure
 *
 * Type definitions for the audit logging system.
 * These types mirror the database enums and table structure.
 */

// ============================================================================
// Enums (mirror database enums)
// ============================================================================

export type AuditAction =
  | 'trust_score_updated'
  | 'trust_score_approved'
  | 'trust_score_rejected'
  | 'subscription_created'
  | 'subscription_modified'
  | 'subscription_cancelled'
  | 'editorial_override_created'
  | 'editorial_override_updated'
  | 'editorial_override_deleted'
  | 'model_created'
  | 'model_updated'
  | 'model_deleted'
  | 'provider_created'
  | 'provider_updated'
  | 'provider_deleted'
  | 'user_role_changed'
  | 'user_suspended'
  | 'user_reactivated'
  | 'pricing_updated'
  | 'system_config_changed';

export type AuditEntityType =
  | 'model'
  | 'provider'
  | 'user'
  | 'subscription'
  | 'editorial_override'
  | 'pricing'
  | 'system_config';

// ============================================================================
// Database Record Types
// ============================================================================

/**
 * Raw audit log record as stored in database
 */
export interface AuditLogRecord {
  id: string;
  admin_id: string;
  admin_email: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  archived_at: string | null;
}

/**
 * Audit log for display in admin UI (with computed fields)
 */
export interface AuditLogDisplay extends AuditLogRecord {
  // Computed fields for UI
  changes: AuditChange[];
  formattedAction: string;
  formattedDate: string;
}

/**
 * Individual change within an audit entry
 */
export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Parameters for creating an audit log entry
 */
export interface CreateAuditLogParams {
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  userId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Query parameters for fetching audit logs
 */
export interface AuditLogQueryParams {
  entityType?: AuditEntityType;
  entityId?: string;
  adminId?: string;
  action?: AuditAction;
  startDate?: string;  // ISO date string
  endDate?: string;    // ISO date string
  page?: number;
  pageSize?: number;
}

/**
 * Paginated response for audit log queries
 */
export interface AuditLogResponse {
  data: AuditLogRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Export format options
 */
export type AuditExportFormat = 'json' | 'csv';

// ============================================================================
// Helper Constants
// ============================================================================

/**
 * Human-readable labels for audit actions
 */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  trust_score_updated: 'Trust Score Updated',
  trust_score_approved: 'Trust Score Approved',
  trust_score_rejected: 'Trust Score Rejected',
  subscription_created: 'Subscription Created',
  subscription_modified: 'Subscription Modified',
  subscription_cancelled: 'Subscription Cancelled',
  editorial_override_created: 'Editorial Override Created',
  editorial_override_updated: 'Editorial Override Updated',
  editorial_override_deleted: 'Editorial Override Deleted',
  model_created: 'Model Created',
  model_updated: 'Model Updated',
  model_deleted: 'Model Deleted',
  provider_created: 'Provider Created',
  provider_updated: 'Provider Updated',
  provider_deleted: 'Provider Deleted',
  user_role_changed: 'User Role Changed',
  user_suspended: 'User Suspended',
  user_reactivated: 'User Reactivated',
  pricing_updated: 'Pricing Updated',
  system_config_changed: 'System Config Changed',
};

/**
 * Human-readable labels for entity types
 */
export const AUDIT_ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  model: 'Model',
  provider: 'Provider',
  user: 'User',
  subscription: 'Subscription',
  editorial_override: 'Editorial Override',
  pricing: 'Pricing',
  system_config: 'System Config',
};

/**
 * Color coding for different action categories
 */
export const AUDIT_ACTION_COLORS: Record<AuditAction, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
  trust_score_updated: 'blue',
  trust_score_approved: 'green',
  trust_score_rejected: 'red',
  subscription_created: 'green',
  subscription_modified: 'yellow',
  subscription_cancelled: 'red',
  editorial_override_created: 'green',
  editorial_override_updated: 'yellow',
  editorial_override_deleted: 'red',
  model_created: 'green',
  model_updated: 'yellow',
  model_deleted: 'red',
  provider_created: 'green',
  provider_updated: 'yellow',
  provider_deleted: 'red',
  user_role_changed: 'yellow',
  user_suspended: 'red',
  user_reactivated: 'green',
  pricing_updated: 'yellow',
  system_config_changed: 'yellow',
};
