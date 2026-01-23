'use client'

import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { DashboardEmptyState } from '@/components/dashboard'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Cpu, Target, TrendingUp, AlertTriangle, DollarSign, Brain, Plus, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { SavingsSummaryCard } from '@/components/savings/SavingsSummaryCard'
import { SavingsChart } from '@/components/savings-chart'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function DashboardContent() {
  const { stats, isLoading, error } = useDashboardStats()

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Empty state - show quick start wizard
  if (stats?.isEmpty) {
    return <DashboardEmptyState />
  }

  // Normal dashboard with stats
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your AI portfolio and optimization opportunities.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI-powered products in your portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Functions</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.functions || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI functions being tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Use Cases</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.useCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              Defined use cases for optimization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOpportunities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Optimization recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.potentialSavings?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sanity Checks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sanityChecks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Configuration issues to review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link href="/products">
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link href="/models">
              <Brain className="h-5 w-5" />
              <span>Browse Models</span>
              {stats?.modelCatalog?.totalModels ? (
                <span className="text-xs text-muted-foreground">
                  {stats.modelCatalog.totalModels.toLocaleString()} available
                </span>
              ) : null}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link href="/models/compare">
              <TrendingUp className="h-5 w-5" />
              <span>Compare Models</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link href="/products">
              <Package className="h-5 w-5" />
              <span>View Portfolio</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Savings Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Your Savings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SavingsSummaryCard compact={false} showViewAll={true} />
          <SavingsChart months={6} showCumulative={true} />
        </div>
      </div>

      {/* Recent Activity and Model Insights */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates to your AI portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {item.type === 'product' ? (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.parentName && (
                          <span className="text-muted-foreground ml-1">
                            in {item.parentName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity. Add your first product to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Model Catalog
            </CardTitle>
            <CardDescription>
              AI models available for your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Models</span>
                <span className="text-2xl font-bold">
                  {stats?.modelCatalog?.totalModels?.toLocaleString() || '0'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse our catalog of AI models from leading providers like OpenAI, Anthropic, Google, and more.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/models">
                  Browse Model Catalog
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
