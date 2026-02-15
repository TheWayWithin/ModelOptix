import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PRIORITY_NEEDS, PRIORITIES, QUALITY_REQUIREMENTS } from '@/types/use-case';

/**
 * GET /api/use-cases/:id
 * Get a single use case by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // New query: use_cases now directly reference products
  const { data: useCase, error } = await supabase
    .from('use_cases')
    .select(`
      *,
      current_model:models(id, name, display_name),
      product:products!inner(id, name, user_id)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!useCase) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  // Type assertion for nested relations
  const typedUseCase = useCase as unknown as {
    id: string;
    product: { id: string; name: string; user_id: string };
  };

  // Verify ownership directly through product
  if (typedUseCase.product.user_id !== user.id) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  return NextResponse.json(useCase);
}

/**
 * PATCH /api/use-cases/:id
 * Update a use case
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership directly through product
  const { data: existingUseCase, error: fetchError } = await supabase
    .from('use_cases')
    .select(`
      id,
      product:products!inner(user_id)
    `)
    .eq('id', id)
    .single();

  if (fetchError || !existingUseCase) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  const typedUseCase = existingUseCase as unknown as {
    id: string;
    product: { user_id: string };
  };

  if (typedUseCase.product.user_id !== user.id) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  // Basic info
  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    updateData.name = body.name.trim();
  }

  if (body.description !== undefined) {
    updateData.description = body.description?.trim() || null;
  }

  if (body.current_model_id !== undefined) {
    updateData.current_model_id = body.current_model_id || null;
  }

  // Priority & requirements
  if (body.priority !== undefined) {
    if (body.priority && !PRIORITIES.includes(body.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${PRIORITIES.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.priority = body.priority;
  }

  if (body.latency_requirement_ms !== undefined) {
    updateData.latency_requirement_ms = body.latency_requirement_ms;
  }

  if (body.quality_requirement !== undefined) {
    if (body.quality_requirement && !QUALITY_REQUIREMENTS.includes(body.quality_requirement)) {
      return NextResponse.json(
        { error: `Invalid quality requirement. Must be one of: ${QUALITY_REQUIREMENTS.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.quality_requirement = body.quality_requirement || null;
  }

  // Optimization priorities
  if (body.primary_need !== undefined) {
    if (!PRIORITY_NEEDS.includes(body.primary_need)) {
      return NextResponse.json(
        { error: `Invalid primary need. Must be one of: ${PRIORITY_NEEDS.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.primary_need = body.primary_need;
  }

  if (body.secondary_need !== undefined) {
    if (body.secondary_need && !PRIORITY_NEEDS.includes(body.secondary_need)) {
      return NextResponse.json(
        { error: `Invalid secondary need. Must be one of: ${PRIORITY_NEEDS.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.secondary_need = body.secondary_need || null;
  }

  if (body.tertiary_need !== undefined) {
    if (body.tertiary_need && !PRIORITY_NEEDS.includes(body.tertiary_need)) {
      return NextResponse.json(
        { error: `Invalid tertiary need. Must be one of: ${PRIORITY_NEEDS.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.tertiary_need = body.tertiary_need || null;
  }

  if (body.use_equal_weights !== undefined) {
    updateData.use_equal_weights = body.use_equal_weights;
  }

  // Usage patterns
  if (body.monthly_volume !== undefined) {
    updateData.monthly_volume = body.monthly_volume;
  }

  if (body.avg_input_tokens !== undefined) {
    updateData.avg_input_tokens = body.avg_input_tokens;
  }

  if (body.avg_output_tokens !== undefined) {
    updateData.avg_output_tokens = body.avg_output_tokens;
  }

  // Technical requirements
  if (body.required_context !== undefined) {
    updateData.required_context = body.required_context;
  }

  if (body.estimated_monthly_tokens !== undefined) {
    updateData.estimated_monthly_tokens = body.estimated_monthly_tokens;
  }

  // Capabilities (simplified)
  if (body.requires_vision !== undefined) {
    updateData.requires_vision = body.requires_vision;
  }

  if (body.requires_function_calling !== undefined) {
    updateData.requires_function_calling = body.requires_function_calling;
  }

  if (body.requires_json_mode !== undefined) {
    updateData.requires_json_mode = body.requires_json_mode;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updatedUseCase, error } = await supabase
    .from('use_cases')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      current_model:models(id, name, display_name)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updatedUseCase);
}

/**
 * DELETE /api/use-cases/:id
 * Delete a use case
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership directly through product
  const { data: existingUseCase, error: fetchError } = await supabase
    .from('use_cases')
    .select(`
      id,
      product:products!inner(user_id)
    `)
    .eq('id', id)
    .single();

  if (fetchError || !existingUseCase) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  const typedUseCase = existingUseCase as unknown as {
    id: string;
    product: { user_id: string };
  };

  if (typedUseCase.product.user_id !== user.id) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('use_cases')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
