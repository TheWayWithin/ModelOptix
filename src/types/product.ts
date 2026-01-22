export type ProductStatus = 'active' | 'paused' | 'deprecated';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  status?: ProductStatus;
}

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'deprecated', label: 'Deprecated' },
];

export const getStatusColor = (status: ProductStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'deprecated':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};
