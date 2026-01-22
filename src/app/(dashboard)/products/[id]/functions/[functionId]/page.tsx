import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UseCaseList } from '@/components/use-cases';

interface FunctionDetailPageProps {
  params: Promise<{
    id: string;
    functionId: string;
  }>;
}

export default async function FunctionDetailPage({ params }: FunctionDetailPageProps) {
  const { id: productId, functionId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch function with product for verification and breadcrumb
  const { data: func, error } = await supabase
    .from('functions')
    .select(`
      *,
      product:products!inner(id, name, user_id)
    `)
    .eq('id', functionId)
    .single();

  if (error || !func) {
    notFound();
  }

  const typedFunc = func as unknown as {
    id: string;
    name: string;
    description: string | null;
    product_id: string;
    created_at: string;
    updated_at: string;
    product: { id: string; name: string; user_id: string };
  };

  // Verify ownership
  if (typedFunc.product.user_id !== user.id) {
    notFound();
  }

  // Verify product ID matches
  if (typedFunc.product.id !== productId) {
    notFound();
  }

  return (
    <div className="container max-w-5xl py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/products/${productId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {typedFunc.product.name}
          </Link>
        </Button>
      </div>

      {/* Function Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{typedFunc.name}</h1>
        {typedFunc.description && (
          <p className="mt-2 text-muted-foreground">{typedFunc.description}</p>
        )}
      </div>

      {/* Use Cases */}
      <UseCaseList functionId={functionId} />
    </div>
  );
}
