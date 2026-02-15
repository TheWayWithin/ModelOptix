'use client';

import { useState, useEffect } from 'react';
import { Function, CreateFunctionInput, UpdateFunctionInput } from '@/types/function';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

interface FunctionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  func?: Function | null;
  productId: string;
  onSuccess: () => void;
}

export function FunctionForm({ open, onOpenChange, func, productId, onSuccess }: FunctionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!func;

  // Reset form when opening/closing or when func changes
  useEffect(() => {
    if (open) {
      if (func) {
        setName(func.name);
        setDescription(func.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setError(null);
    }
  }, [open, func]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = isEditing
        ? `/api/functions/${func.id}`
        : `/api/products/${productId}/functions`;

      const method = isEditing ? 'PATCH' : 'POST';

      const body: CreateFunctionInput | UpdateFunctionInput = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save function');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Function' : 'Add Function'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the function details below.'
              : 'Add a new AI-powered function to your product. You can add use cases with model assignments after creating the function.'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Content Generation"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this function do?"
              rows={3}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Function'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
