import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ModelRow {
  id: string;
  name: string;
  provider_id: string;
  providers: {
    name: string;
  } | null;
}

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
      .select(`
        id,
        name,
        provider_id,
        providers (
          name
        )
      `)
      .eq('is_available', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching models:', error);
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }

    // Transform to include displayName
    const typedModels = models as unknown as ModelRow[];
    const modelOptions = typedModels?.map((model) => ({
      id: model.id,
      name: model.name,
      providerName: model.providers?.name || 'Unknown',
      displayName: `${model.providers?.name || 'Unknown'} - ${model.name}`,
    })) || [];

    return NextResponse.json({ models: modelOptions });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
