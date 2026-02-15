'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { OpportunityCard } from './opportunity-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Inbox, RefreshCw } from 'lucide-react';
import type { OpportunityWithDetails, OpportunitiesResponse } from '@/types/opportunity';

interface OpportunityListProps {
  onDismiss?: (opportunity: OpportunityWithDetails) => void;
}

export function OpportunityList({ onDismiss }: OpportunityListProps) {
  const searchParams = useSearchParams();
  const [opportunities, setOpportunities] = useState<OpportunityWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Fetch opportunities from API
  const fetchOpportunities = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', pageNum.toString());

      const response = await fetch(`/api/opportunities?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch opportunities');
      }

      const data: OpportunitiesResponse = await response.json();

      if (append) {
        setOpportunities((prev) => [...prev, ...data.opportunities]);
      } else {
        setOpportunities(data.opportunities);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Fetch on mount and when search params change
  useEffect(() => {
    fetchOpportunities(1, false);
  }, [fetchOpportunities]);

  // Load more handler
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchOpportunities(page + 1, true);
    }
  };

  // Refresh handler
  const refresh = () => {
    fetchOpportunities(1, false);
  };

  // Handle dismiss callback
  const handleDismiss = (opportunity: OpportunityWithDetails) => {
    // Remove from local state optimistically
    setOpportunities((prev) => prev.filter((o) => o.id !== opportunity.id));
    setTotal((prev) => Math.max(0, prev - 1));
    // Call parent handler
    onDismiss?.(opportunity);
  };

  // Loading skeleton
  if (loading && opportunities.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between pt-2 border-t">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive mb-4">Error: {error}</div>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
        <p className="text-muted-foreground max-w-sm mb-4">
          We haven&apos;t found any model optimization opportunities yet.
          Make sure you have use cases configured with current models.
        </p>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {opportunities.length} of {total} opportunities
        </p>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Opportunities grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
