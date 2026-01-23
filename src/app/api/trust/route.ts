import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TrustTier, TrustTierStats, ProviderWithTrust, TrustOverviewResponse } from '@/types/trust';
import { getTrustTierDescription } from '@/types/trust';

/**
 * GET /api/trust
 *
 * Get trust overview data including provider trust tiers and statistics.
 * Public endpoint - no authentication required for viewing trust data.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch providers with their trust tiers and model counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: providers, error: providersError } = await (supabase as any)
      .from('providers')
      .select(`
        id,
        name,
        slug,
        trust_tier,
        models (
          id
        )
      `)
      .order('name', { ascending: true });

    if (providersError) {
      console.error('Error fetching providers:', providersError);
      return NextResponse.json(
        { error: 'Failed to fetch trust data' },
        { status: 500 }
      );
    }

    // Transform providers data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedProviders: ProviderWithTrust[] = (providers || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      trustTier: (p.trust_tier || 'unknown') as TrustTier,
      modelCount: Array.isArray(p.models) ? p.models.length : 0,
    }));

    // Calculate tier statistics
    const tierCounts: Record<TrustTier, { providers: number; models: number }> = {
      A: { providers: 0, models: 0 },
      B: { providers: 0, models: 0 },
      C: { providers: 0, models: 0 },
      unknown: { providers: 0, models: 0 },
    };

    for (const provider of transformedProviders) {
      const tier = provider.trustTier;
      tierCounts[tier].providers++;
      tierCounts[tier].models += provider.modelCount;
    }

    const tierStats: TrustTierStats[] = [
      {
        tier: 'A',
        label: 'Tier A',
        description: getTrustTierDescription('A'),
        providerCount: tierCounts.A.providers,
        modelCount: tierCounts.A.models,
        color: 'emerald',
      },
      {
        tier: 'B',
        label: 'Tier B',
        description: getTrustTierDescription('B'),
        providerCount: tierCounts.B.providers,
        modelCount: tierCounts.B.models,
        color: 'blue',
      },
      {
        tier: 'C',
        label: 'Tier C',
        description: getTrustTierDescription('C'),
        providerCount: tierCounts.C.providers,
        modelCount: tierCounts.C.models,
        color: 'amber',
      },
      {
        tier: 'unknown',
        label: 'Not Evaluated',
        description: getTrustTierDescription('unknown'),
        providerCount: tierCounts.unknown.providers,
        modelCount: tierCounts.unknown.models,
        color: 'gray',
      },
    ];

    const totalModels = transformedProviders.reduce((sum, p) => sum + p.modelCount, 0);

    const response: TrustOverviewResponse = {
      tierStats,
      providers: transformedProviders,
      totalModels,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Trust API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
