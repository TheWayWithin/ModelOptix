'use client';

import { useState, useEffect, useCallback } from 'react';
import { UseCase, CreateUseCaseInput } from '@/types/use-case';
import { UseCaseCard } from './use-case-card';
import { UseCaseForm } from './use-case-form';
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

interface UseCaseListProps {
  functionId: string;
}

export function UseCaseList({ functionId }: UseCaseListProps) {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [deletingUseCase, setDeletingUseCase] = useState<UseCase | null>(null);
  const { toast } = useToast();

  const fetchUseCases = useCallback(async () => {
    try {
      const response = await fetch(`/api/functions/${functionId}/use-cases`);
      if (!response.ok) throw new Error('Failed to fetch use cases');
      const data = await response.json();
      setUseCases(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load use cases',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [functionId, toast]);

  useEffect(() => {
    fetchUseCases();
  }, [fetchUseCases]);

  const handleCreate = async (data: CreateUseCaseInput) => {
    const response = await fetch(`/api/functions/${functionId}/use-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create use case');
    }

    toast({
      title: 'Success',
      description: 'Use case created successfully',
    });
    fetchUseCases();
  };

  const handleUpdate = async (data: CreateUseCaseInput) => {
    if (!editingUseCase) return;

    const response = await fetch(`/api/use-cases/${editingUseCase.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update use case');
    }

    toast({
      title: 'Success',
      description: 'Use case updated successfully',
    });
    setEditingUseCase(null);
    fetchUseCases();
  };

  const handleDelete = async () => {
    if (!deletingUseCase) return;

    try {
      const response = await fetch(`/api/use-cases/${deletingUseCase.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete use case');
      }

      toast({
        title: 'Success',
        description: 'Use case deleted successfully',
      });
      fetchUseCases();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete use case',
        variant: 'destructive',
      });
    } finally {
      setDeletingUseCase(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Use Cases</h3>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Use Case
        </Button>
      </div>

      {useCases.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No use cases yet. Add your first use case to start optimizing.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {useCases.map((useCase) => (
            <UseCaseCard
              key={useCase.id}
              useCase={useCase}
              onEdit={setEditingUseCase}
              onDelete={setDeletingUseCase}
            />
          ))}
        </div>
      )}

      <UseCaseForm
        open={isFormOpen || !!editingUseCase}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingUseCase(null);
          }
        }}
        useCase={editingUseCase}
        onSubmit={editingUseCase ? handleUpdate : handleCreate}
      />

      <AlertDialog open={!!deletingUseCase} onOpenChange={() => setDeletingUseCase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Use Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingUseCase?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
