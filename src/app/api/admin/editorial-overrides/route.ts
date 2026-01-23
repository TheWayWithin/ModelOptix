import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Type definitions
interface OverrideRow {
  id: string;
  model_id: string;
  override_type: 'exclude' | 'downrank' | 'flag';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  warning_message: string | null;
  downrank_factor: number | null;
  active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  models: {
    id: string;
    name: string;
    providers: {
      name: string;
    } | null;
  } | null;
  user_profiles: {
    display_name: string | null;
    email: string;
  } | null;
}

/**
 * GET /api/admin/editorial-overrides
 *
 * List all editorial overrides with model and creator info.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';
    const overrideType = searchParams.get('override_type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const serviceClient = createServiceClient();

    // Build query
    let query = serviceClient
      .from('editorial_overrides')
      .select(
        `
        *,
        models (
          id,
          name,
          providers (
            name
          )
        ),
        user_profiles!editorial_overrides_created_by_fkey (
          display_name,
          email
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (activeOnly) {
      query = query.eq('active', true);
    }
    if (overrideType) {
      query = query.eq('override_type', overrideType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching editorial overrides:', error);
      return NextResponse.json(
        { error: 'Failed to fetch overrides' },
        { status: 500 }
      );
    }

    const overrides = data as unknown as OverrideRow[];

    // Format response
    const formattedOverrides = overrides?.map((override) => ({
      id: override.id,
      modelId: override.model_id,
      modelName: override.models?.name || 'Unknown',
      providerName: override.models?.providers?.name || 'Unknown',
      overrideType: override.override_type,
      reason: override.reason,
      severity: override.severity,
      warningMessage: override.warning_message,
      downrankFactor: override.downrank_factor,
      active: override.active,
      expiresAt: override.expires_at,
      createdBy: override.user_profiles?.display_name || override.user_profiles?.email || 'System',
      createdAt: override.created_at,
      updatedAt: override.updated_at,
    }));

    return NextResponse.json({
      overrides: formattedOverrides,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin editorial overrides API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/editorial-overrides
 *
 * Create a new editorial override.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      model_id,
      override_type,
      reason,
      severity = 'medium',
      warning_message,
      downrank_factor,
      expires_at,
    } = body;

    // Validate required fields
    if (!model_id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }
    if (!override_type || !['exclude', 'downrank', 'flag'].includes(override_type)) {
      return NextResponse.json(
        { error: 'Valid override type is required (exclude, downrank, flag)' },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const insertData: Record<string, unknown> = {
      model_id,
      override_type,
      reason,
      severity,
      warning_message: warning_message || null,
      downrank_factor: override_type === 'downrank' ? (downrank_factor || 1.5) : null,
      expires_at: expires_at || null,
      created_by: user.id,
      active: true,
    };

    const { data, error } = await serviceClient
      .from('editorial_overrides')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating editorial override:', error);
      return NextResponse.json(
        { error: 'Failed to create override' },
        { status: 500 }
      );
    }

    return NextResponse.json({ override: data }, { status: 201 });
  } catch (error) {
    console.error('Admin editorial overrides POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/editorial-overrides
 *
 * Update an editorial override.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Override ID is required' }, { status: 400 });
    }

    // Allowed fields for update
    const allowedFields = [
      'override_type',
      'reason',
      'severity',
      'warning_message',
      'downrank_factor',
      'active',
      'expires_at',
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
      .from('editorial_overrides')
      .update(filteredUpdates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating editorial override:', error);
      return NextResponse.json(
        { error: 'Failed to update override' },
        { status: 500 }
      );
    }

    return NextResponse.json({ override: data });
  } catch (error) {
    console.error('Admin editorial overrides PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/editorial-overrides
 *
 * Delete an editorial override.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Override ID is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { error } = await serviceClient
      .from('editorial_overrides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting editorial override:', error);
      return NextResponse.json(
        { error: 'Failed to delete override' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin editorial overrides DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
