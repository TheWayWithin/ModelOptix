import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateFunctionInput } from '@/types/function';

// GET /api/products/[id]/functions - List all functions for a product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify product belongs to user (RLS will also enforce this)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch functions with model details and use case count
    const { data: functions, error } = await supabase
      .from('functions')
      .select(`
        *,
        model:models(
          id,
          name,
          provider_id
        ),
        use_cases(count)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching functions:', error);
      return NextResponse.json({ error: 'Failed to fetch functions' }, { status: 500 });
    }

    // Transform to include use_case_count
    const functionsWithCount = functions?.map((func) => {
      // Type assertion for the use_cases count aggregation
      const typedFunc = func as unknown as {
        id: string;
        product_id: string;
        name: string;
        description: string | null;
        current_model_id: string | null;
        created_at: string;
        updated_at: string;
        model: { id: string; name: string; provider_id: string } | null;
        use_cases: [{ count: number }];
      };
      return {
        ...func,
        model: typedFunc.model,
        use_case_count: typedFunc.use_cases?.[0]?.count ?? 0,
      };
    }) || [];

    return NextResponse.json({ functions: functionsWithCount });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products/[id]/functions - Create a new function
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify product belongs to user
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Parse request body
    const body: CreateFunctionInput = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Function name is required' }, { status: 400 });
    }

    // Create function
    const { data: newFunction, error } = await supabase
      .from('functions')
      .insert({
        product_id: productId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        current_model_id: body.current_model_id || null,
      })
      .select(`
        *,
        model:models(
          id,
          name,
          provider
        )
      `)
      .single();

    if (error) {
      console.error('Error creating function:', error);
      return NextResponse.json({ error: 'Failed to create function' }, { status: 500 });
    }

    return NextResponse.json({ function: newFunction }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
