/**
 * Admin Audit Logs API
 * Task 5.13: Audit Log Infrastructure
 *
 * GET /api/admin/audit - Query audit logs with filters
 *
 * Query parameters:
 * - entityType: Filter by entity type
 * - entityId: Filter by specific entity
 * - adminId: Filter by admin who performed action
 * - action: Filter by action type
 * - startDate: Filter from date (ISO string)
 * - endDate: Filter to date (ISO string)
 * - page: Page number (default 1)
 * - pageSize: Items per page (default 50, max 100)
 * - format: 'json' (default) or 'csv' for export
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queryAuditLogs, exportToCSV } from '@/lib/audit';
import type { AuditAction, AuditEntityType, AuditLogQueryParams } from '@/types/audit';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    const queryParams: AuditLogQueryParams = {
      entityType: searchParams.get('entityType') as AuditEntityType | undefined,
      entityId: searchParams.get('entityId') || undefined,
      adminId: searchParams.get('adminId') || undefined,
      action: searchParams.get('action') as AuditAction | undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 100),
    };

    // Query audit logs
    const result = await queryAuditLogs(queryParams);

    // Handle CSV export
    if (format === 'csv') {
      // For export, fetch all records (up to 10000)
      const exportParams = { ...queryParams, page: 1, pageSize: 10000 };
      const exportResult = await queryAuditLogs(exportParams);
      const csv = exportToCSV(exportResult.data);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Audit API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
