'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Package,
  DollarSign,
  Database,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  CloudDownload,
  Play,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  users: {
    total: number;
    byTier: {
      free: number;
      solo: number;
      growth: number;
      pro: number;
    };
    newThisWeek: number;
    admins: number;
  };
  content: {
    products: number;
    useCases: number;
  };
  opportunities: {
    active: number;
    accepted: number;
    dismissed: number;
    totalSavings: number;
  };
  sanityChecks: {
    today: number;
    thisWeek: number;
    total: number;
    guestChecks: number;
  };
  catalog: {
    models: number;
    providers: number;
    trustScores: number;
  };
  jobs: {
    running: number;
    failed: number;
    recentRuns: Array<{
      id: string;
      job_name: string;
      status: string;
      started_at: string;
      finished_at: string | null;
    }>;
  };
  overrides: {
    active: number;
  };
}

interface SyncStatus {
  status: {
    modelCatalog: {
      lastSync: string | null;
      modelCount: number;
    };
    pricing: {
      lastSync: string | null;
    };
    benchmarks: {
      lastSync: string | null;
    };
  };
  openrouterConfigured: boolean;
  aaConfigured: boolean;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncingJob, setSyncingJob] = useState<string | null>(null);
  const [isGeneratingOpportunities, setIsGeneratingOpportunities] = useState(false);
  const { toast } = useToast();

  const fetchStats = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [statsRes, syncRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/sync'),
      ]);

      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setSyncStatus(syncData);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const triggerSync = async (job: 'model-catalog' | 'pricing' | 'benchmarks' | 'all') => {
    setSyncingJob(job);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      // Format results for toast
      const results: string[] = [];
      if (data.results.modelCatalog) {
        const mc = data.results.modelCatalog.stats;
        results.push(`Models: ${mc.modelsUpdated} updated, ${mc.providersCreated} new providers`);
      }
      if (data.results.pricing) {
        results.push(`Pricing: ${data.results.pricing.stats.pricingUpdated} updated`);
      }
      if (data.results.benchmarks) {
        results.push(`Benchmarks: ${data.results.benchmarks.stats.benchmarksUpdated} updated`);
      }

      toast({
        title: data.success ? 'Sync Complete' : 'Sync Completed with Errors',
        description: results.join('. ') || `Completed in ${(data.totalDuration / 1000).toFixed(1)}s`,
        variant: data.success ? 'default' : 'destructive',
      });

      // Refresh stats
      await fetchStats(true);
    } catch (err) {
      toast({
        title: 'Sync Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSyncingJob(null);
    }
  };

  const triggerOpportunityGeneration = async () => {
    setIsGeneratingOpportunities(true);
    try {
      const res = await fetch('/api/admin/opportunities/generate', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Opportunity generation failed');
      }

      toast({
        title: data.success ? 'Opportunities Generated' : 'Generation Completed with Errors',
        description: `Processed ${data.result.processed} use cases, created ${data.result.opportunitiesCreated} opportunities in ${(data.result.duration / 1000).toFixed(1)}s`,
        variant: data.success ? 'default' : 'destructive',
      });

      // Refresh stats to show new opportunity counts
      await fetchStats(true);
    } catch (err) {
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingOpportunities(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchStats()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and administrative controls
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStats(true)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.users.newThisWeek || 0} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free</CardTitle>
              <Badge variant="secondary">Free</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.users.byTier.free || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solo</CardTitle>
              <Badge className="bg-blue-500">Solo</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.users.byTier.solo || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <Badge className="bg-purple-500">Growth</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.users.byTier.growth || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro</CardTitle>
              <Badge className="bg-amber-500">Pro</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.users.byTier.pro || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Content & Value */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Content Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Platform Content
            </CardTitle>
            <CardDescription>User-created content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.content.products || 0}
                </div>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.content.useCases || 0}
                </div>
                <p className="text-xs text-muted-foreground">Use Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Value Delivered */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Value Delivered
            </CardTitle>
            <CardDescription>Savings from accepted recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats?.opportunities.totalSavings || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              monthly recurring savings
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold">
                  {stats?.opportunities.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {stats?.opportunities.accepted || 0}
                </div>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-muted-foreground">
                  {stats?.opportunities.dismissed || 0}
                </div>
                <p className="text-xs text-muted-foreground">Dismissed</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                onClick={triggerOpportunityGeneration}
                disabled={isGeneratingOpportunities}
              >
                {isGeneratingOpportunities ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Opportunities Now
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Auto-runs daily at 5am UTC
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sanity Checks & Catalog */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sanity Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Sanity Checks
            </CardTitle>
            <CardDescription>Model comparison requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.sanityChecks.today || 0}
                </div>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.sanityChecks.thisWeek || 0}
                </div>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.sanityChecks.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {stats?.sanityChecks.guestChecks || 0}
                </div>
                <p className="text-xs text-muted-foreground">Guest</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Catalog */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Model Catalog
            </CardTitle>
            <CardDescription>Available models and providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.catalog.models || 0}
                </div>
                <p className="text-xs text-muted-foreground">Models</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.catalog.providers || 0}
                </div>
                <p className="text-xs text-muted-foreground">Providers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats?.catalog.trustScores || 0}
                </div>
                <p className="text-xs text-muted-foreground">Trust Scores</p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/models">
                  Manage Models
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudDownload className="h-5 w-5" />
            Data Sync
          </CardTitle>
          <CardDescription>
            Sync model catalog, pricing, and benchmarks from external sources
            {!syncStatus?.openrouterConfigured && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                OPENROUTER_API_KEY not configured
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Model Catalog Sync */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Model Catalog</h4>
                <Badge variant="outline" className="text-xs">
                  {syncStatus?.status.modelCatalog.modelCount || 0} models
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Last sync:{' '}
                {syncStatus?.status.modelCatalog.lastSync
                  ? formatRelativeTime(syncStatus.status.modelCatalog.lastSync)
                  : 'Never'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => triggerSync('model-catalog')}
                disabled={syncingJob !== null || !syncStatus?.openrouterConfigured}
              >
                {syncingJob === 'model-catalog' || syncingJob === 'all' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
            </div>

            {/* Pricing Sync */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Pricing</h4>
                <Badge variant="outline" className="text-xs">Daily 3am UTC</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Last sync:{' '}
                {syncStatus?.status.pricing.lastSync
                  ? formatRelativeTime(syncStatus.status.pricing.lastSync)
                  : 'Never'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => triggerSync('pricing')}
                disabled={syncingJob !== null || !syncStatus?.openrouterConfigured}
              >
                {syncingJob === 'pricing' || syncingJob === 'all' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
            </div>

            {/* Benchmarks Sync */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Benchmarks</h4>
                <Badge variant="outline" className="text-xs">Weekly Sun 4am</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Last sync:{' '}
                {syncStatus?.status.benchmarks.lastSync
                  ? formatRelativeTime(syncStatus.status.benchmarks.lastSync)
                  : 'Never'}
              </p>
              {!syncStatus?.aaConfigured && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  ARTIFICIAL_ANALYSIS_API_KEY not configured
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => triggerSync('benchmarks')}
                disabled={syncingJob !== null || !syncStatus?.aaConfigured}
              >
                {syncingJob === 'benchmarks' || syncingJob === 'all' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
            </div>
          </div>

          {/* Sync All Button */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="default"
              className="w-full"
              onClick={() => triggerSync('all')}
              disabled={syncingJob !== null || !syncStatus?.openrouterConfigured}
            >
              {syncingJob === 'all' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync All Data Sources
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs & Overrides */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Background Jobs
            </CardTitle>
            <CardDescription>
              {stats?.jobs.running || 0} running, {stats?.jobs.failed || 0} failed
              this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.jobs.recentRuns && stats.jobs.recentRuns.length > 0 ? (
              <div className="space-y-3">
                {stats.jobs.recentRuns.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">{job.job_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(job.started_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent jobs
              </p>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/jobs">
                  View All Jobs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editorial Overrides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Editorial Overrides
            </CardTitle>
            <CardDescription>Manual recommendation adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl font-bold">
                {stats?.overrides.active || 0}
              </div>
              <p className="text-sm text-muted-foreground">Active Overrides</p>
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/overrides">
                  Manage Overrides
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild>
              <Link href="/admin/models">
                <Database className="h-4 w-4 mr-2" />
                Manage Models
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/overrides">
                <Shield className="h-4 w-4 mr-2" />
                Editorial Overrides
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/jobs">
                <Activity className="h-4 w-4 mr-2" />
                View Jobs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
