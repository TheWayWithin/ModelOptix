import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RecentItem {
  id: string
  name: string
  type: 'product' | 'use_case'
  createdAt: string
  parentName?: string
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get product count
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (productError) {
      console.error('Error fetching product count:', productError)
      return NextResponse.json(
        { error: 'Failed to fetch product count' },
        { status: 500 }
      )
    }

    // Get use case count (functions layer was eliminated)
    const { count: useCaseCount, error: useCaseError } = await supabase
      .from('use_cases')
      .select('*, products!inner(user_id)', { count: 'exact', head: true })
      .eq('products.user_id', user.id)

    if (useCaseError) {
      console.error('Error fetching use case count:', useCaseError)
    }

    // Get model catalog count (public data, no RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: modelCount } = await (supabase as any)
      .from('models')
      .select('*', { count: 'exact', head: true })

    // Get recent products (last 5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentProducts } = await (supabase as any)
      .from('products')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Get recent use cases with product names (functions layer was eliminated)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentUseCases } = await (supabase as any)
      .from('use_cases')
      .select('id, name, created_at, products!inner(name, user_id)')
      .eq('products.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Build recent activity list
    const recentActivity: RecentItem[] = []

    if (recentProducts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentProducts.forEach((p: any) => {
        recentActivity.push({
          id: p.id,
          name: p.name,
          type: 'product',
          createdAt: p.created_at,
        })
      })
    }

    if (recentUseCases) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentUseCases.forEach((uc: any) => {
        recentActivity.push({
          id: uc.id,
          name: uc.name,
          type: 'use_case',
          createdAt: uc.created_at,
          parentName: uc.products?.name,
        })
      })
    }

    // Sort by date and take top 5
    recentActivity.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const topActivity = recentActivity.slice(0, 5)

    // For now, return placeholder values for opportunities and savings
    // These will be calculated by the recommendation engine in future sprints
    const stats = {
      products: productCount || 0,
      useCases: useCaseCount || 0,
      activeOpportunities: 0, // Placeholder - will come from recommendations engine
      potentialSavings: 0, // Placeholder - will come from cost analysis
      sanityChecks: 0, // Placeholder - will come from validation engine
      isEmpty: (productCount || 0) === 0,
      modelCatalog: {
        totalModels: modelCount || 0,
      },
      recentActivity: topActivity,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
