import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PRIORITY_NEEDS } from '@/types/use-case';

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
    console.error('Error fetching use cases:', error);
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
    primary_need,
    secondary_need,
    tertiary_need,
    use_equal_weights,
    required_context,
    estimated_monthly_tokens,
    input_type,
    output_type,
    requires_vision,
    requires_function_calling,
    requires_streaming,
    current_model_id,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!primary_need || !PRIORITY_NEEDS.includes(primary_need)) {
    return NextResponse.json(
      { error: `Invalid primary need. Must be one of: ${PRIORITY_NEEDS.join(', ')}` },
      { status: 400 }
    );
  }

  const { data: newUseCase, error } = await supabase
    .from('use_cases')
    .insert({
      function_id: functionId,
      name: name.trim(),
      description: description?.trim() || null,
      primary_need,
      secondary_need: secondary_need || null,
      tertiary_need: tertiary_need || null,
      use_equal_weights: use_equal_weights ?? false,
      required_context: required_context ?? 4096,
      estimated_monthly_tokens: estimated_monthly_tokens ?? null,
      input_type: input_type || null,
      output_type: output_type || null,
      requires_vision: requires_vision ?? false,
      requires_function_calling: requires_function_calling ?? false,
      requires_streaming: requires_streaming ?? false,
      current_model_id: current_model_id || null,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating use case:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(newUseCase, { status: 201 });
}
