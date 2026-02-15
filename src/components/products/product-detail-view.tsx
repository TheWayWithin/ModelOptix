'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, getStatusColor, PRODUCT_STATUS_OPTIONS } from '@/types/product';
import { ProductForm } from './product-form';
import { UseCaseList } from '@/components/use-cases';  // CHANGED: was FunctionList
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Loader2, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface ProductDetailViewProps {
  product: Product;
}

export function ProductDetailView({ product: initialProduct }: ProductDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState(initialProduct);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (data: Partial<Product>) => {
    const response = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }

    const { product: updatedProduct } = await response.json();
    setProduct(updatedProduct);

    toast({
      title: 'Success',
      description: 'Product updated successfully.',
    });
  };

  const handleStatusChange = async (newStatus: Product['status']) => {
    try {
      await handleUpdate({ status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      });
      router.push('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to products</span>
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <Badge className={getStatusColor(product.status)}>
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Product
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {PRODUCT_STATUS_OPTIONS.filter(opt => opt.value !== product.status).map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
              >
                Set as {option.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Product Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Basic information about this product.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="mt-1 text-sm">
              {product.description || 'No description provided.'}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(product.created_at), 'MMM d, yyyy')}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {format(new Date(product.updated_at), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases - now directly under product (functions layer eliminated) */}
      <Card>
        <CardHeader>
          <CardTitle>AI Use Cases</CardTitle>
          <CardDescription>
            Define how AI is used in this product. Each use case can be optimized independently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UseCaseList productId={product.id} />
        </CardContent>
      </Card>

      {/* Edit Form Sheet */}
      <ProductForm
        product={product}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be
              undone and will also delete all associated use cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
