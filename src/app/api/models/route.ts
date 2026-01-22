import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/models - List all active models for dropdown selection
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active models for dropdown selection
    const { data: models, error } = await supabase
      .from('models')
      .select('id, name, provider')
      .eq('is_active', true)
      .order('provider', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching models:', error);
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }

    // Transform to include displayName
    const modelOptions = models?.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      displayName: `${model.provider} - ${model.name}`,
    })) || [];

    return NextResponse.json({ models: modelOptions });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
