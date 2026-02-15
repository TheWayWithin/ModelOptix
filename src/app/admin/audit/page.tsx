/**
 * Admin Audit Log Page
 * Task 5.13: Audit Log Infrastructure
 *
 * Displays filterable, paginated audit logs with export capability.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  AuditLogRecord,
  AuditLogResponse,
  AuditAction,
  AuditEntityType,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  AUDIT_ACTION_COLORS,
} from '@/types/audit';
import { calculateChanges } from '@/lib/audit';

// ============================================================================
// Types
// ============================================================================

interface Filters {
  entityType: AuditEntityType | '';
  action: AuditAction | '';
  startDate: string;
  endDate: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function ActionBadge({ action }: { action: AuditAction }) {
  const color = AUDIT_ACTION_COLORS[action];
  const colorClasses = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {AUDIT_ACTION_LABELS[action]}
    </span>
  );
}

function JsonViewer({ data, title }: { data: Record<string, unknown> | null; title: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return <span className="text-muted-foreground">-</span>;

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary hover:text-primary/80 text-sm font-medium"
      >
        {isExpanded ? 'Hide' : 'View'} {title}
      </button>
      {isExpanded && (
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ChangesDiff({ beforeState, afterState }: {
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}) {
  const changes = calculateChanges(beforeState, afterState);

  if (changes.length === 0) {
    return <span className="text-muted-foreground">No changes recorded</span>;
  }

  return (
    <div className="space-y-1">
      {changes.map((change, idx) => (
        <div key={idx} className="text-sm">
          <span className="font-medium text-foreground">{change.field}:</span>{' '}
          <span className="text-red-600 dark:text-red-400 line-through">
            {JSON.stringify(change.oldValue)}
          </span>
          {' → '}
          <span className="text-green-600 dark:text-green-400">
            {JSON.stringify(change.newValue)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<Filters>({
    entityType: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fetch audit logs
  const fetchLogs = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '50');

      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.action) params.set('action', filters.action);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const response = await fetch(`/api/admin/audit?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const result: AuditLogResponse = await response.json();
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial fetch and refetch on filter change
  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Handle export
  const handleExport = async () => {
    const params = new URLSearchParams();
    params.set('format', 'csv');

    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.action) params.set('action', filters.action);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);

    window.location.href = `/api/admin/audit?${params.toString()}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/admin" className="hover:text-foreground">Admin</Link>
          <span>/</span>
          <span>Audit Logs</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">
              Compliance-ready log of all admin actions. Retention: 2 years.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Entity Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value as AuditEntityType | '' })}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All Types</option>
              {Object.entries(AUDIT_ENTITY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value as AuditAction | '' })}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All Actions</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && logs.length === 0 && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium mb-1">No audit logs found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && logs.length > 0 && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {log.admin_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            {AUDIT_ENTITY_TYPE_LABELS[log.entity_type]}:
                          </span>{' '}
                          <span className="font-medium">
                            {log.entity_name || log.entity_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {log.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          {expandedRow === log.id ? 'Hide' : 'View Changes'}
                        </button>
                      </td>
                    </tr>
                    {/* Expanded row for changes */}
                    {expandedRow === log.id && (
                      <tr key={`${log.id}-expanded`} className="bg-muted/30">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Changes</h4>
                              <ChangesDiff
                                beforeState={log.before_state}
                                afterState={log.after_state}
                              />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Before State</h4>
                                <JsonViewer data={log.before_state} title="Before" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">After State</h4>
                                <JsonViewer data={log.after_state} title="After" />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-muted/50 px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm font-medium bg-background border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 text-sm font-medium bg-background border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
