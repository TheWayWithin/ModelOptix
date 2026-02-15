import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OpportunitiesContent } from './opportunities-content';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Opportunities | ModelOptix',
  description: 'View model optimization opportunities for your AI portfolio',
};

function OpportunitiesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between pt-2 border-t">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OpportunitiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's use cases for filter dropdown
  const { data: useCases } = await supabase
    .from('use_cases')
    .select(`
      id,
      name,
      products!inner (
        user_id
      )
    `)
    .eq('products.user_id', user.id)
    .order('name');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useCaseOptions = (useCases || []).map((uc: any) => ({
    id: uc.id,
    name: uc.name,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
        <p className="text-muted-foreground mt-1">
          Model optimization opportunities discovered for your AI portfolio
        </p>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<OpportunitiesLoading />}>
        <OpportunitiesContent useCases={useCaseOptions} />
      </Suspense>
    </div>
  );
}
