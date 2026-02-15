import { Metadata } from 'next';
import { ProductList } from '@/components/products/product-list';

export const metadata: Metadata = {
  title: 'Products | ModelOptix',
  description: 'Manage your AI-enabled products and applications.',
};

export default function ProductsPage() {
  return (
    <div className="container py-6">
      <ProductList />
    </div>
  );
}
