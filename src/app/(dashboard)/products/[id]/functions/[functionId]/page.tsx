import { redirect } from 'next/navigation';

/**
 * DEPRECATED: This page has been eliminated along with the functions layer.
 *
 * Use cases now link directly to products.
 * This page redirects to the product detail page.
 *
 * Migration completed: 2026-01-25
 * Safe to delete this file after: 2026-04-25
 */

interface FunctionDetailPageProps {
  params: Promise<{
    id: string;
    functionId: string;
  }>;
}

export default async function FunctionDetailPage({ params }: FunctionDetailPageProps) {
  const { id: productId } = await params;

  // Redirect to the product page where use cases are now displayed
  redirect(`/products/${productId}`);
}
