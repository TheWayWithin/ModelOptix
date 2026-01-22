import { Suspense } from 'react';
import { Metadata } from 'next';
import { ModelList } from '@/components/models';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Model Catalog | ModelOptix',
  description: 'Browse and compare AI models from leading providers. Filter by capabilities, pricing, and trust tier.',
};

function ModelListFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ModelsPage() {
  return (
    <Suspense fallback={<ModelListFallback />}>
      <ModelList />
    </Suspense>
  );
}
