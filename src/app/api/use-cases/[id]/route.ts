import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { TASK_TYPES } from '@/types/use-case';

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

  const { data: useCase, error } = await supabase
    .from('use_cases')
    .select(`
      *,
      function:functions!inner(
        id,
        name,
        product_id,
        product:products!inner(user_id)
      )
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
    function: {
      id: string;
      name: string;
      product_id: string;
      product: { user_id: string };
    };
  };

  // Verify ownership through function -> product chain
  if (typedUseCase.function.product.user_id !== user.id) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  return NextResponse.json(useCase);
}

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

  // Verify ownership through function -> product chain
  const { data: existingUseCase, error: fetchError } = await supabase
    .from('use_cases')
    .select(`
      id,
      function:functions!inner(
        product:products!inner(user_id)
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError || !existingUseCase) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  const typedUseCase = existingUseCase as unknown as {
    id: string;
    function: { product: { user_id: string } };
  };

  if (typedUseCase.function.product.user_id !== user.id) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  const body = await request.json();
  const {
    name,
    description,
    task_type,
    current_monthly_calls,
    avg_input_tokens,
    avg_output_tokens,
    quality_threshold,
    latency_requirement_ms,
  } = body;

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  if (task_type !== undefined) {
    if (!TASK_TYPES.includes(task_type)) {
      return NextResponse.json(
        { error: `Invalid task type. Must be one of: ${TASK_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.task_type = task_type;
  }

  if (current_monthly_calls !== undefined) {
    updateData.current_monthly_calls = current_monthly_calls;
  }

  if (avg_input_tokens !== undefined) {
    updateData.avg_input_tokens = avg_input_tokens;
  }

  if (avg_output_tokens !== undefined) {
    updateData.avg_output_tokens = avg_output_tokens;
  }

  if (quality_threshold !== undefined) {
    updateData.quality_threshold = quality_threshold;
  }

  if (latency_requirement_ms !== undefined) {
    updateData.latency_requirement_ms = latency_requirement_ms;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updatedUseCase, error } = await supabase
    .from('use_cases')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updatedUseCase);
}

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

  // Verify ownership through function -> product chain
  const { data: existingUseCase, error: fetchError } = await supabase
    .from('use_cases')
    .select(`
      id,
      function:functions!inner(
        product:products!inner(user_id)
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError || !existingUseCase) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  const typedUseCase = existingUseCase as unknown as {
    id: string;
    function: { product: { user_id: string } };
  };

  if (typedUseCase.function.product.user_id !== user.id) {
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
