import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Type definitions for query results
interface ModelRow {
  id: string;
  name: string;
  provider_id: string;
  is_active: boolean;
  providers: {
    id: string;
    name: string;
    trust_tier: string;
  } | null;
}

/**
 * GET /api/admin/parameters
 *
 * List all models with their parameter counts.
 * Supports search and pagination.
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
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Build query for models
    let query = serviceClient
      .from('models')
      .select(
        `
        id,
        name,
        provider_id,
        is_active,
        providers (
          id,
          name,
          trust_tier
        )
      `,
        { count: 'exact' }
      )
      .order('name', { ascending: true });

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching models:', error);
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: 500 }
      );
    }

    const models = data as unknown as ModelRow[];

    // Get parameter counts for these models
    const modelIds = models?.map((m) => m.id) || [];
    const parameterCountMap: Record<string, number> = {};

    if (modelIds.length > 0) {
      const { data: paramCounts } = await serviceClient
        .from('parameter_support')
        .select('model_id')
        .in('model_id', modelIds);

      if (paramCounts) {
        // Count parameters per model
        (paramCounts as { model_id: string }[]).forEach((row) => {
          parameterCountMap[row.model_id] = (parameterCountMap[row.model_id] || 0) + 1;
        });
      }
    }

    // Format response
    const formattedModels = models?.map((model) => ({
      id: model.id,
      name: model.name,
      providerName: model.providers?.name || 'Unknown',
      providerTrustTier: model.providers?.trust_tier || 'unknown',
      parameterCount: parameterCountMap[model.id] || 0,
      isActive: model.is_active,
    }));

    return NextResponse.json({
      models: formattedModels,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin parameters API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/parameters
 *
 * Create a new parameter support entry.
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
      parameter_name,
      is_supported = true,
      min_value,
      max_value,
      default_value,
      value_type,
      notes,
    } = body;

    // Validation
    if (!model_id || !parameter_name || !value_type) {
      return NextResponse.json(
        { error: 'model_id, parameter_name, and value_type are required' },
        { status: 400 }
      );
    }

    const validValueTypes = ['integer', 'float', 'boolean', 'string', 'array'];
    if (!validValueTypes.includes(value_type)) {
      return NextResponse.json(
        { error: 'Invalid value_type' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Check if parameter already exists for this model
    const { data: existing } = await serviceClient
      .from('parameter_support')
      .select('id')
      .eq('model_id', model_id)
      .eq('parameter_name', parameter_name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Parameter already exists for this model' },
        { status: 409 }
      );
    }

    // Create the parameter
    const { data, error } = await serviceClient
      .from('parameter_support')
      .insert({
        model_id,
        parameter_name,
        is_supported,
        min_value,
        max_value,
        default_value,
        value_type,
        notes,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating parameter:', error);
      return NextResponse.json(
        { error: 'Failed to create parameter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ parameter: data }, { status: 201 });
  } catch (error) {
    console.error('Admin parameters POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/parameters
 *
 * Update a parameter support entry.
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
      return NextResponse.json({ error: 'Parameter ID is required' }, { status: 400 });
    }

    // Allowed fields for update
    const allowedFields = [
      'is_supported',
      'min_value',
      'max_value',
      'default_value',
      'value_type',
      'notes',
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

    // Validate value_type if provided
    if (filteredUpdates.value_type) {
      const validValueTypes = ['integer', 'float', 'boolean', 'string', 'array'];
      if (!validValueTypes.includes(filteredUpdates.value_type as string)) {
        return NextResponse.json(
          { error: 'Invalid value_type' },
          { status: 400 }
        );
      }
    }

    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
      .from('parameter_support')
      .update(filteredUpdates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating parameter:', error);
      return NextResponse.json(
        { error: 'Failed to update parameter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ parameter: data });
  } catch (error) {
    console.error('Admin parameters PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/parameters
 *
 * Delete a parameter support entry.
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
      return NextResponse.json({ error: 'Parameter ID is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { error } = await serviceClient
      .from('parameter_support')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting parameter:', error);
      return NextResponse.json(
        { error: 'Failed to delete parameter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin parameters DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
