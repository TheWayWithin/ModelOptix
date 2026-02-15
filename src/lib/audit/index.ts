/**
 * Audit Service
 * Task 5.13: Audit Log Infrastructure
 *
 * Service for creating and querying audit log entries.
 * Uses service role client for writes to bypass RLS.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  AuditLogRecord,
  AuditLogQueryParams,
  AuditLogResponse,
  CreateAuditLogParams,
} from '@/types/audit';

// ============================================================================
// Service Client (bypasses RLS for audit writes)
// ============================================================================

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for audit service');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// Core Audit Functions
// ============================================================================

/**
 * Create an audit log entry
 * This is the primary function for recording admin actions
 */
export async function logAuditEvent(params: CreateAuditLogParams): Promise<string> {
  const client = getServiceClient();

  const { data, error } = await client
    .from('audit_logs')
    .insert({
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName || null,
      user_id: params.userId || null,
      before_state: params.beforeState || null,
      after_state: params.afterState || null,
      description: params.description || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Audit] Failed to create audit log:', error);
    // Don't throw - audit failures shouldn't break the main operation
    // But log for monitoring
    return '';
  }

  return data.id;
}

/**
 * Query audit logs with filters and pagination
 */
export async function queryAuditLogs(
  params: AuditLogQueryParams
): Promise<AuditLogResponse> {
  const client = getServiceClient();
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = client
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.entityType) {
    query = query.eq('entity_type', params.entityType);
  }
  if (params.entityId) {
    query = query.eq('entity_id', params.entityId);
  }
  if (params.adminId) {
    query = query.eq('admin_id', params.adminId);
  }
  if (params.action) {
    query = query.eq('action', params.action);
  }
  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Audit] Failed to query audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: data as AuditLogRecord[],
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Get a single audit log entry by ID
 */
export async function getAuditLog(id: string): Promise<AuditLogRecord | null> {
  const client = getServiceClient();

  const { data, error } = await client
    .from('audit_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Audit] Failed to get audit log:', error);
    return null;
  }

  return data as AuditLogRecord;
}

// ============================================================================
// Convenience Functions for Common Actions
// ============================================================================

/**
 * Log a trust score update
 */
export async function logTrustScoreUpdate(
  adminId: string,
  adminEmail: string,
  modelId: string,
  modelName: string,
  beforeScore: number | null,
  afterScore: number,
  action: 'trust_score_updated' | 'trust_score_approved' | 'trust_score_rejected' = 'trust_score_updated',
  description?: string
): Promise<string> {
  return logAuditEvent({
    adminId,
    adminEmail,
    action,
    entityType: 'model',
    entityId: modelId,
    entityName: modelName,
    beforeState: { trust_score: beforeScore },
    afterState: { trust_score: afterScore },
    description: description || `Trust score changed from ${beforeScore ?? 'null'} to ${afterScore}`,
  });
}

/**
 * Log an editorial override action
 */
export async function logEditorialOverride(
  adminId: string,
  adminEmail: string,
  overrideId: string,
  modelName: string,
  action: 'editorial_override_created' | 'editorial_override_updated' | 'editorial_override_deleted',
  beforeState?: Record<string, unknown>,
  afterState?: Record<string, unknown>,
  description?: string
): Promise<string> {
  return logAuditEvent({
    adminId,
    adminEmail,
    action,
    entityType: 'editorial_override',
    entityId: overrideId,
    entityName: modelName,
    beforeState,
    afterState,
    description,
  });
}

/**
 * Log a model update
 */
export async function logModelUpdate(
  adminId: string,
  adminEmail: string,
  modelId: string,
  modelName: string,
  beforeState: Record<string, unknown>,
  afterState: Record<string, unknown>,
  description?: string
): Promise<string> {
  return logAuditEvent({
    adminId,
    adminEmail,
    action: 'model_updated',
    entityType: 'model',
    entityId: modelId,
    entityName: modelName,
    beforeState,
    afterState,
    description,
  });
}

/**
 * Log a provider update
 */
export async function logProviderUpdate(
  adminId: string,
  adminEmail: string,
  providerId: string,
  providerName: string,
  beforeState: Record<string, unknown>,
  afterState: Record<string, unknown>,
  description?: string
): Promise<string> {
  return logAuditEvent({
    adminId,
    adminEmail,
    action: 'provider_updated',
    entityType: 'provider',
    entityId: providerId,
    entityName: providerName,
    beforeState,
    afterState,
    description,
  });
}

/**
 * Log a subscription change
 */
export async function logSubscriptionChange(
  adminId: string,
  adminEmail: string,
  subscriptionId: string,
  userId: string,
  action: 'subscription_created' | 'subscription_modified' | 'subscription_cancelled',
  beforeState?: Record<string, unknown>,
  afterState?: Record<string, unknown>,
  description?: string
): Promise<string> {
  return logAuditEvent({
    adminId,
    adminEmail,
    action,
    entityType: 'subscription',
    entityId: subscriptionId,
    userId,
    beforeState,
    afterState,
    description,
  });
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Export audit logs to CSV format
 */
export function exportToCSV(logs: AuditLogRecord[]): string {
  const headers = [
    'ID',
    'Date',
    'Admin Email',
    'Action',
    'Entity Type',
    'Entity ID',
    'Entity Name',
    'Description',
    'User ID',
  ];

  const rows = logs.map((log) => [
    log.id,
    new Date(log.created_at).toISOString(),
    log.admin_email,
    log.action,
    log.entity_type,
    log.entity_id,
    log.entity_name || '',
    log.description || '',
    log.user_id || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Calculate changes between before and after state
 */
export function calculateChanges(
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null
): Array<{ field: string; oldValue: unknown; newValue: unknown }> {
  if (!beforeState && !afterState) return [];
  if (!beforeState) {
    return Object.entries(afterState!).map(([field, newValue]) => ({
      field,
      oldValue: null,
      newValue,
    }));
  }
  if (!afterState) {
    return Object.entries(beforeState).map(([field, oldValue]) => ({
      field,
      oldValue,
      newValue: null,
    }));
  }

  const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
  const allKeys = new Set([...Object.keys(beforeState), ...Object.keys(afterState)]);

  for (const key of allKeys) {
    const oldVal = beforeState[key];
    const newVal = afterState[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  }

  return changes;
}
