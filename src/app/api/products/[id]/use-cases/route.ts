import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/products/:id/use-cases
 * List all use cases for a product
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify product ownership
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Fetch use cases directly (no function join needed anymore)
  const { data: useCases, error } = await supabase
    .from('use_cases')
    .select(`
      *,
      current_model:models(id, name, display_name)
    `)
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching use cases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(useCases);
}

/**
 * POST /api/products/:id/use-cases
 * Create a new use case directly under a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify product ownership
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!body.primary_need) {
    return NextResponse.json({ error: 'Primary need is required' }, { status: 400 });
  }

  // Insert use case directly under product (no function layer)
  const { data: useCase, error } = await supabase
    .from('use_cases')
    .insert({
      product_id: productId,
      name: body.name.trim(),
      description: body.description || null,
      current_model_id: body.current_model_id || null,

      // Priority & requirements
      priority: body.priority || 'medium',
      latency_requirement_ms: body.latency_requirement_ms || null,
      quality_requirement: body.quality_requirement || null,

      // Optimization priorities
      primary_need: body.primary_need,
      secondary_need: body.secondary_need || null,
      tertiary_need: body.tertiary_need || null,
      use_equal_weights: body.use_equal_weights || false,

      // Usage patterns
      monthly_volume: body.monthly_volume || null,
      avg_input_tokens: body.avg_input_tokens || null,
      avg_output_tokens: body.avg_output_tokens || null,

      // Technical requirements
      required_context: body.required_context || 4096,
      estimated_monthly_tokens: body.estimated_monthly_tokens || null,

      // Capabilities (simplified)
      requires_vision: body.requires_vision || false,
      requires_function_calling: body.requires_function_calling || false,
      requires_json_mode: body.requires_json_mode || false,
    })
    .select(`
      *,
      current_model:models(id, name, display_name)
    `)
    .single();

  if (error) {
    console.error('Error creating use case:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(useCase, { status: 201 });
}
