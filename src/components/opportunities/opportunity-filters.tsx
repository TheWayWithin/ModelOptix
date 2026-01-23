'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { OpportunityFilters as Filters, OpportunityStatus, OpportunityType, OpportunitySortBy } from '@/types/opportunity';

interface UseCaseOption {
  id: string;
  name: string;
}

interface OpportunityFiltersProps {
  useCases?: UseCaseOption[];
  onFiltersChange?: (filters: Filters) => void;
}

export function OpportunityFilters({ useCases = [], onFiltersChange }: OpportunityFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for controlled inputs
  const [minImprovement, setMinImprovement] = useState(
    searchParams.get('min_improvement') || ''
  );

  // Parse current filters from URL
  const currentFilters: Filters = {
    status: (searchParams.get('status') as OpportunityStatus | 'all') || 'active',
    useCaseId: searchParams.get('use_case_id') || undefined,
    opportunityType: (searchParams.get('opportunity_type') as OpportunityType | 'all') || 'all',
    minImprovement: searchParams.get('min_improvement') ? parseFloat(searchParams.get('min_improvement')!) : undefined,
    sortBy: (searchParams.get('sort_by') as OpportunitySortBy) || 'improvement',
    sortOrder: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
  };

  // Update URL with new filter value
  const updateFilter = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== 'all' && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page when filters change
    params.delete('page');

    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
  }, [router, pathname, searchParams]);

  // Debounced min improvement update
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentValue = searchParams.get('min_improvement') || '';
      if (minImprovement !== currentValue) {
        updateFilter('min_improvement', minImprovement || undefined);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [minImprovement, searchParams, updateFilter]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(currentFilters);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear all filters
  const clearFilters = () => {
    router.push(pathname);
    setMinImprovement('');
  };

  const hasActiveFilters =
    currentFilters.status !== 'active' ||
    currentFilters.useCaseId ||
    currentFilters.opportunityType !== 'all' ||
    currentFilters.minImprovement ||
    currentFilters.sortBy !== 'improvement';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={currentFilters.status || 'active'}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger id="status-filter" className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type-filter">Type</Label>
          <Select
            value={currentFilters.opportunityType || 'all'}
            onValueChange={(value) => updateFilter('opportunity_type', value)}
          >
            <SelectTrigger id="type-filter" className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cost_saving">Cost Saving</SelectItem>
              <SelectItem value="speed_improvement">Speed Improvement</SelectItem>
              <SelectItem value="quality_upgrade">Quality Upgrade</SelectItem>
              <SelectItem value="trust_upgrade">Trust Upgrade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Use Case Filter */}
        {useCases.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="usecase-filter">Use Case</Label>
            <Select
              value={currentFilters.useCaseId || 'all'}
              onValueChange={(value) => updateFilter('use_case_id', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="usecase-filter" className="w-[200px]">
                <SelectValue placeholder="All Use Cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Use Cases</SelectItem>
                {useCases.map((uc) => (
                  <SelectItem key={uc.id} value={uc.id}>
                    {uc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Min Improvement Filter */}
        <div className="space-y-2">
          <Label htmlFor="min-improvement">Min Improvement %</Label>
          <Input
            id="min-improvement"
            type="number"
            placeholder="e.g., 10"
            value={minImprovement}
            onChange={(e) => setMinImprovement(e.target.value)}
            className="w-[120px]"
            min={0}
            max={100}
          />
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sort-filter">Sort By</Label>
          <Select
            value={currentFilters.sortBy || 'improvement'}
            onValueChange={(value) => updateFilter('sort_by', value)}
          >
            <SelectTrigger id="sort-filter" className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="improvement">Improvement %</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="order-filter">Order</Label>
          <Select
            value={currentFilters.sortOrder || 'desc'}
            onValueChange={(value) => updateFilter('sort_order', value)}
          >
            <SelectTrigger id="order-filter" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Highest First</SelectItem>
              <SelectItem value="asc">Lowest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="h-10">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
