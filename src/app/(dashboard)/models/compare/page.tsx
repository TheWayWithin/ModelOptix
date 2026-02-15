import { Suspense } from 'react';
import { Metadata } from 'next';
import { ModelComparison } from '@/components/models';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compare Models | ModelOptix',
  description: 'Compare AI models side by side. Analyze pricing, capabilities, benchmarks, and provider information.',
};

function ComparisonFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function CompareModelsPage() {
  return (
    <Suspense fallback={<ComparisonFallback />}>
      <ModelComparison />
    </Suspense>
  );
}
