'use client'

import { useState, useEffect } from 'react'

interface RecentItem {
  id: string
  name: string
  type: 'product' | 'function' | 'use_case'
  createdAt: string
  parentName?: string
}

interface DashboardStats {
  products: number
  functions: number
  useCases: number
  activeOpportunities: number
  potentialSavings: number
  sanityChecks: number
  isEmpty: boolean
  modelCatalog?: {
    totalModels: number
  }
  recentActivity?: RecentItem[]
}

interface UseDashboardStatsResult {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/stats')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}
