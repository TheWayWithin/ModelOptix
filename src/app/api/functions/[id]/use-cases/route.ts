import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { TASK_TYPES } from '@/types/use-case';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: functionId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify function ownership through product
  const { data: func, error: funcError } = await supabase
    .from('functions')
    .select(`
      id,
      product:products!inner(user_id)
    `)
    .eq('id', functionId)
    .single();

  if (funcError || !func) {
    return NextResponse.json({ error: 'Function not found' }, { status: 404 });
  }

  const typedFunc = func as unknown as {
    id: string;
    product: { user_id: string };
  };

  if (typedFunc.product.user_id !== user.id) {
    return NextResponse.json({ error: 'Function not found' }, { status: 404 });
  }

  const { data: useCases, error } = await supabase
    .from('use_cases')
    .select('*')
    .eq('function_id', functionId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(useCases);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: functionId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify function ownership through product
  const { data: func, error: funcError } = await supabase
    .from('functions')
    .select(`
      id,
      product:products!inner(user_id)
    `)
    .eq('id', functionId)
    .single();

  if (funcError || !func) {
    return NextResponse.json({ error: 'Function not found' }, { status: 404 });
  }

  const typedFunc = func as unknown as {
    id: string;
    product: { user_id: string };
  };

  if (typedFunc.product.user_id !== user.id) {
    return NextResponse.json({ error: 'Function not found' }, { status: 404 });
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

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!task_type || !TASK_TYPES.includes(task_type)) {
    return NextResponse.json(
      { error: `Invalid task type. Must be one of: ${TASK_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const { data: newUseCase, error } = await supabase
    .from('use_cases')
    .insert({
      function_id: functionId,
      name: name.trim(),
      description: description?.trim() || null,
      task_type,
      current_monthly_calls: current_monthly_calls ?? 0,
      avg_input_tokens: avg_input_tokens ?? 1000,
      avg_output_tokens: avg_output_tokens ?? 500,
      quality_threshold: quality_threshold ?? 0.80,
      latency_requirement_ms: latency_requirement_ms ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(newUseCase, { status: 201 });
}
