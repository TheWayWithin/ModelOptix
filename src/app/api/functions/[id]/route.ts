import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateFunctionInput } from '@/types/function';

// GET /api/functions/[id] - Get a single function
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch function with model details
    // RLS will enforce that user can only access functions through their products
    const { data: func, error } = await supabase
      .from('functions')
      .select(`
        *,
        model:models(
          id,
          name,
          provider
        ),
        product:products!inner(
          id,
          name,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (error || !func) {
      return NextResponse.json({ error: 'Function not found' }, { status: 404 });
    }

    // Verify ownership through product - cast for TypeScript (Supabase types relations as arrays)
    const product = func.product as unknown as { id: string; name: string; user_id: string } | null;
    if (product?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ function: func });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/functions/[id] - Update a function
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify the function exists and user owns it through product
    const { data: existingFunc, error: fetchError } = await supabase
      .from('functions')
      .select(`
        id,
        product:products!inner(
          id,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingFunc) {
      return NextResponse.json({ error: 'Function not found' }, { status: 404 });
    }

    // Product is an object due to !inner join - cast for TypeScript (Supabase types relations as arrays)
    const product = existingFunc.product as unknown as { id: string; user_id: string } | null;
    if (product?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body: UpdateFunctionInput = await request.json();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      if (body.name.trim() === '') {
        return NextResponse.json({ error: 'Function name cannot be empty' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.current_model_id !== undefined) {
      updateData.current_model_id = body.current_model_id || null;
    }

    // Update function
    const { data: updatedFunc, error } = await supabase
      .from('functions')
      .update(updateData)
      .eq('id', id)
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
      console.error('Error updating function:', error);
      return NextResponse.json({ error: 'Failed to update function' }, { status: 500 });
    }

    return NextResponse.json({ function: updatedFunc });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/functions/[id] - Delete a function
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify the function exists and user owns it through product
    const { data: existingFunc, error: fetchError } = await supabase
      .from('functions')
      .select(`
        id,
        product:products!inner(
          id,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingFunc) {
      return NextResponse.json({ error: 'Function not found' }, { status: 404 });
    }

    // Product is an object due to !inner join - cast for TypeScript (Supabase types relations as arrays)
    const product = existingFunc.product as unknown as { id: string; user_id: string } | null;
    if (product?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete function
    const { error } = await supabase
      .from('functions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting function:', error);
      return NextResponse.json({ error: 'Failed to delete function' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
