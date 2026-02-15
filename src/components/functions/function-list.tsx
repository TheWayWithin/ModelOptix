'use client';

import { useState, useEffect, useCallback } from 'react';
import { Function, FunctionWithUseCaseCount } from '@/types/function';
import { FunctionCard } from './function-card';
import { FunctionForm } from './function-form';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface FunctionListProps {
  productId: string;
}

export function FunctionList({ productId }: FunctionListProps) {
  const [functions, setFunctions] = useState<FunctionWithUseCaseCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFunction, setEditingFunction] = useState<Function | null>(null);
  const [deletingFunction, setDeletingFunction] = useState<Function | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchFunctions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}/functions`);
      if (!response.ok) {
        throw new Error('Failed to fetch functions');
      }
      const data = await response.json();
      setFunctions(data.functions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Mount-only effect to prevent infinite loop from toast dependency
  useEffect(() => {
    fetchFunctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setEditingFunction(null);
    setFormOpen(true);
  };

  const handleEdit = (func: Function) => {
    setEditingFunction(func);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFunction) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/functions/${deletingFunction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete function');
      }

      toast({
        title: 'Function deleted',
        description: `"${deletingFunction.name}" has been deleted.`,
      });

      fetchFunctions();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete function',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeletingFunction(null);
    }
  };

  const handleFormSuccess = () => {
    toast({
      title: editingFunction ? 'Function updated' : 'Function created',
      description: editingFunction
        ? 'Your changes have been saved.'
        : 'Your new function has been added.',
    });
    fetchFunctions();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchFunctions} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Functions</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Function
        </Button>
      </div>

      {functions.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            No functions yet. Add your first AI-powered function.
          </p>
          <Button onClick={handleAdd} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Function
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {functions.map((func) => (
            <FunctionCard
              key={func.id}
              func={func}
              productId={productId}
              onEdit={handleEdit}
              onDelete={setDeletingFunction}
            />
          ))}
        </div>
      )}

      <FunctionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        func={editingFunction}
        productId={productId}
        onSuccess={handleFormSuccess}
      />

      <AlertDialog open={!!deletingFunction} onOpenChange={() => setDeletingFunction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Function</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingFunction?.name}&quot;? This action cannot be
              undone.
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
