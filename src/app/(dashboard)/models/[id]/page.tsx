import { Metadata } from 'next';
import { ModelDetail } from '@/components/models';

interface ModelDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(_props: ModelDetailPageProps): Promise<Metadata> {
  return {
    title: `Model Details | ModelOptix`,
    description: `View detailed information about this AI model including pricing, capabilities, and benchmarks.`,
  };
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id } = await params;
  return <ModelDetail modelId={id} />;
}
