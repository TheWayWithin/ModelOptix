'use client';

import { useState } from 'react';
import { Product, CreateProductInput, UpdateProductInput, PRODUCT_STATUS_OPTIONS } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
}

export function ProductForm({ product, open, onOpenChange, onSubmit }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [status, setStatus] = useState<Product['status']>(product?.status || 'active');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!product;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });
      onOpenChange(false);
      // Reset form
      setName('');
      setDescription('');
      setStatus('active');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when product changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && product) {
      setName(product.name);
      setDescription(product.description || '');
      setStatus(product.status);
    } else if (!newOpen) {
      setName('');
      setDescription('');
      setStatus('active');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Update your product details below.'
                : 'Add a new AI-enabled product to your portfolio.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My AI Application"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your product..."
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: Product['status']) => setStatus(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Product'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
