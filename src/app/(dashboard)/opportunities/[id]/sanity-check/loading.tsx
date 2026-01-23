import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SanityCheckLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>

        {/* Context Card */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-1 h-4 w-64" />
              </div>
              <div className="text-right">
                <Skeleton className="ml-auto h-4 w-32" />
                <Skeleton className="ml-auto mt-1 h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Model Comparison */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Skeleton className="mx-auto h-5 w-32" />
                <Skeleton className="mx-auto mt-1 h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-8" />
              <div className="text-center">
                <Skeleton className="mx-auto h-5 w-32" />
                <Skeleton className="mx-auto mt-1 h-4 w-24" />
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Advanced Options */}
            <Skeleton className="h-8 w-36" />

            {/* Submit Button */}
            <Skeleton className="h-11 w-full" />

            {/* Info */}
            <Skeleton className="mx-auto h-3 w-80" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
