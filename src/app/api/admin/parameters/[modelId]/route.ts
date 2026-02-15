import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { COMMON_PARAMETERS } from '@/types/parameter';

interface RouteContext {
  params: Promise<{ modelId: string }>;
}

// Type for model with provider join
interface ModelWithProvider {
  id: string;
  name: string;
  providers: { name: string } | null;
}

/**
 * GET /api/admin/parameters/[modelId]
 *
 * Get all parameters for a specific model.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { modelId } = await context.params;

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

    const serviceClient = createServiceClient();

    // Get model info
    const { data: modelData, error: modelError } = await serviceClient
      .from('models')
      .select(
        `
        id,
        name,
        providers (
          name
        )
      `
      )
      .eq('id', modelId)
      .single();

    if (modelError || !modelData) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Cast to expected type
    const model = modelData as unknown as ModelWithProvider;

    // Get parameters for this model
    const { data: parameters, error: paramError } = await serviceClient
      .from('parameter_support')
      .select('*')
      .eq('model_id', modelId)
      .order('parameter_name', { ascending: true });

    if (paramError) {
      console.error('Error fetching parameters:', paramError);
      return NextResponse.json(
        { error: 'Failed to fetch parameters' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      model: {
        id: model.id,
        name: model.name,
        providerName: model.providers?.name || 'Unknown',
      },
      parameters: parameters || [],
    });
  } catch (error) {
    console.error('Admin parameters GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/parameters/[modelId]
 *
 * Bulk update/replace all parameters for a model.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { modelId } = await context.params;

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
    const { parameters } = body;

    if (!Array.isArray(parameters)) {
      return NextResponse.json(
        { error: 'parameters must be an array' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Verify model exists
    const { data: model, error: modelError } = await serviceClient
      .from('models')
      .select('id')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Delete existing parameters for this model
    await serviceClient
      .from('parameter_support')
      .delete()
      .eq('model_id', modelId);

    // Insert new parameters
    if (parameters.length > 0) {
      const validValueTypes = ['integer', 'float', 'boolean', 'string', 'array'];
      const parametersToInsert = parameters.map((param: Record<string, unknown>) => ({
        model_id: modelId,
        parameter_name: param.parameter_name as string,
        is_supported: (param.is_supported ?? true) as boolean,
        min_value: (param.min_value ?? null) as number | null,
        max_value: (param.max_value ?? null) as number | null,
        default_value: (param.default_value ?? null) as number | null,
        value_type: (validValueTypes.includes(param.value_type as string)
          ? param.value_type
          : 'float') as string,
        notes: (param.notes ?? null) as string | null,
      }));

      const { error: insertError } = await serviceClient
        .from('parameter_support')
        .insert(parametersToInsert as never);

      if (insertError) {
        console.error('Error inserting parameters:', insertError);
        return NextResponse.json(
          { error: 'Failed to update parameters' },
          { status: 500 }
        );
      }
    }

    // Fetch the updated parameters
    const { data: updatedParams } = await serviceClient
      .from('parameter_support')
      .select('*')
      .eq('model_id', modelId)
      .order('parameter_name', { ascending: true });

    return NextResponse.json({
      success: true,
      parameters: updatedParams || [],
    });
  } catch (error) {
    console.error('Admin parameters PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/parameters/[modelId]
 *
 * Add common parameters to a model (bulk add).
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { modelId } = await context.params;

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

    const serviceClient = createServiceClient();

    // Verify model exists
    const { data: model, error: modelError } = await serviceClient
      .from('models')
      .select('id')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Get existing parameters for this model
    const { data: existingParams } = await serviceClient
      .from('parameter_support')
      .select('parameter_name')
      .eq('model_id', modelId);

    const existingNames = new Set(
      (existingParams || []).map((p: { parameter_name: string }) => p.parameter_name)
    );

    // Filter out parameters that already exist
    const newParams = COMMON_PARAMETERS.filter(
      (p) => !existingNames.has(p.name)
    );

    if (newParams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All common parameters already exist',
        added: 0,
      });
    }

    // Insert new parameters
    const parametersToInsert = newParams.map((param) => ({
      model_id: modelId,
      parameter_name: param.name,
      is_supported: true,
      min_value: param.minValue,
      max_value: param.maxValue,
      default_value: param.defaultValue,
      value_type: param.valueType,
      notes: param.description,
    }));

    const { error: insertError } = await serviceClient
      .from('parameter_support')
      .insert(parametersToInsert as never);

    if (insertError) {
      console.error('Error inserting common parameters:', insertError);
      return NextResponse.json(
        { error: 'Failed to add common parameters' },
        { status: 500 }
      );
    }

    // Fetch the updated parameters
    const { data: updatedParams } = await serviceClient
      .from('parameter_support')
      .select('*')
      .eq('model_id', modelId)
      .order('parameter_name', { ascending: true });

    return NextResponse.json({
      success: true,
      message: `Added ${newParams.length} common parameters`,
      added: newParams.length,
      parameters: updatedParams || [],
    });
  } catch (error) {
    console.error('Admin parameters POST (bulk) error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
