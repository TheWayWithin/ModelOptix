/**
 * DEPRECATED: The functions layer has been eliminated.
 *
 * Use cases now link directly to products.
 * Import from '@/components/use-cases' instead.
 *
 * Migration completed: 2026-01-25
 * Safe to delete this directory after: 2026-04-25
 */

export { FunctionCard } from './function-card';
export { FunctionForm } from './function-form';
export { FunctionList } from './function-list';

// Re-export use-case components for backwards compatibility
export { UseCaseList as UseCaseList_Preferred } from '@/components/use-cases';
