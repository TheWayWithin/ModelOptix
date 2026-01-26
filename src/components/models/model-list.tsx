'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ModelWithProvider, ModelFilters, ProviderSummary, ModelCatalogResponse } from '@/types/model';
import { ModelCard } from './model-card';
import { ModelFiltersPanel } from './model-filters';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LayoutGrid, List, Brain, ChevronLeft, ChevronRight, SlidersHorizontal, GitCompareArrows, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'context_length' | 'created_at';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'context_length', label: 'Context Length' },
  { value: 'created_at', label: 'Newest' },
];

const MAX_COMPARE = 4;

export function ModelList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Parse initial state from URL
  const parseFiltersFromURL = useCallback((): ModelFilters => {
    return {
      search: searchParams.get('search') || undefined,
      providers: searchParams.get('providers')?.split(',').filter(Boolean) || undefined,
      capabilities: searchParams.get('capabilities')?.split(',').filter(Boolean) || undefined,
      availability: searchParams.get('availability')?.split(',').filter(Boolean) || undefined,
      trustTiers: searchParams.get('trustTiers')?.split(',').filter(Boolean) || undefined,
      minContext: searchParams.get('minContext') ? parseInt(searchParams.get('minContext')!, 10) : undefined,
      maxInputPrice: searchParams.get('maxInputPrice') ? parseFloat(searchParams.get('maxInputPrice')!) : undefined,
    };
  }, [searchParams]);

  // State
  const [models, setModels] = useState<ModelWithProvider[]>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ModelFilters>(parseFiltersFromURL);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sortBy') as SortOption) || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Sync URL with filters
  const updateURL = useCallback((newFilters: ModelFilters, newPage: number, newSortBy: SortOption, newSortOrder: 'asc' | 'desc') => {
    const params = new URLSearchParams();

    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.providers?.length) params.set('providers', newFilters.providers.join(','));
    if (newFilters.capabilities?.length) params.set('capabilities', newFilters.capabilities.join(','));
    if (newFilters.availability?.length) params.set('availability', newFilters.availability.join(','));
    if (newFilters.trustTiers?.length) params.set('trustTiers', newFilters.trustTiers.join(','));
    if (newFilters.minContext) params.set('minContext', newFilters.minContext.toString());
    if (newFilters.maxInputPrice) params.set('maxInputPrice', newFilters.maxInputPrice.toString());
    if (newPage > 1) params.set('page', newPage.toString());
    if (newSortBy !== 'name') params.set('sortBy', newSortBy);
    if (newSortOrder !== 'asc') params.set('sortOrder', newSortOrder);

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [pathname, router]);

  // Fetch models
  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.search) params.set('search', filters.search);
      if (filters.providers?.length) params.set('providers', filters.providers.join(','));
      if (filters.capabilities?.length) params.set('capabilities', filters.capabilities.join(','));
      if (filters.availability?.length) params.set('availability', filters.availability.join(','));
      if (filters.trustTiers?.length) params.set('trustTiers', filters.trustTiers.join(','));
      if (filters.minContext) params.set('minContext', filters.minContext.toString());
      if (filters.maxInputPrice) params.set('maxInputPrice', filters.maxInputPrice.toString());
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/models/catalog?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data: ModelCatalogResponse = await response.json();
      setModels(data.models);
      setTotal(data.total);
      setProviders(data.providers);
      return { success: true };
    } catch (error) {
      console.error('Error fetching models:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, pageSize, sortBy, sortOrder]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    let mounted = true;

    fetchModels().then((result) => {
      if (mounted && !result.success) {
        toast({
          title: 'Error',
          description: 'Failed to load models. Please try again.',
          variant: 'destructive',
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [fetchModels, toast]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: ModelFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
    updateURL(newFilters, 1, sortBy, sortOrder);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    const emptyFilters: ModelFilters = {};
    setFilters(emptyFilters);
    setPage(1);
    updateURL(emptyFilters, 1, sortBy, sortOrder);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: SortOption) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    updateURL(filters, page, newSortBy, newSortOrder);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL(filters, newPage, sortBy, sortOrder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle comparison selection
  const handleCompareSelect = (modelId: string, selected: boolean) => {
    if (selected) {
      if (selectedForComparison.length >= MAX_COMPARE) {
        toast({
          title: 'Maximum reached',
          description: `You can compare up to ${MAX_COMPARE} models at a time.`,
          variant: 'destructive',
        });
        return;
      }
      setSelectedForComparison([...selectedForComparison, modelId]);
    } else {
      setSelectedForComparison(selectedForComparison.filter(id => id !== modelId));
    }
  };

  // Get selected model names for display
  const getSelectedModelName = (modelId: string): string => {
    const model = models.find(m => m.id === modelId);
    return model?.display_name || model?.name || 'Unknown';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Model Catalog</h1>
          <p className="text-muted-foreground">
            Browse and compare AI models from leading providers.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <ModelFiltersPanel
              filters={filters}
              providers={providers}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-2">
              {/* Mobile Filters */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Narrow down your model search
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <ModelFiltersPanel
                      filters={filters}
                      providers={providers}
                      onFiltersChange={(newFilters) => {
                        handleFiltersChange(newFilters);
                        setMobileFiltersOpen(false);
                      }}
                      onReset={() => {
                        handleResetFilters();
                        setMobileFiltersOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <span className="text-sm text-muted-foreground">
                {total} model{total !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Brain className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No models found</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                Try adjusting your filters or search query to find models.
              </p>
              <Button onClick={handleResetFilters} variant="outline" className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
                  : 'space-y-4'
              }>
                {models.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedForComparison.includes(model.id)}
                    onSelectChange={handleCompareSelect}
                    showCompareCheckbox={true}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Sticky Comparison Bar */}
      {selectedForComparison.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <GitCompareArrows className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedForComparison.map(id => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                    >
                      <span className="truncate max-w-[120px]">{getSelectedModelName(id)}</span>
                      <button
                        onClick={() => handleCompareSelect(id, false)}
                        className="hover:bg-muted-foreground/20 rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground flex-shrink-0">
                  {selectedForComparison.length}/{MAX_COMPARE}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedForComparison([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  disabled={selectedForComparison.length < 2}
                  asChild
                >
                  <Link href={`/models/compare?models=${selectedForComparison.join(',')}`}>
                    Compare {selectedForComparison.length} Models
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
