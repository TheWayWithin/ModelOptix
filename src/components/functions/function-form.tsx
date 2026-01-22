'use client';

import { useState, useEffect } from 'react';
import { FunctionWithModel, CreateFunctionInput, UpdateFunctionInput } from '@/types/function';
import { ModelOption } from '@/types/model';
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

interface FunctionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  func?: FunctionWithModel | null;
  productId: string;
  onSuccess: () => void;
}

export function FunctionForm({ open, onOpenChange, func, productId, onSuccess }: FunctionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!func;

  // Fetch models for dropdown
  useEffect(() => {
    async function fetchModels() {
      setIsLoadingModels(true);
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          setModels(data.models || []);
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
      } finally {
        setIsLoadingModels(false);
      }
    }
    if (open) {
      fetchModels();
    }
  }, [open]);

  // Reset form when opening/closing or when func changes
  useEffect(() => {
    if (open) {
      if (func) {
        setName(func.name);
        setDescription(func.description || '');
        setCurrentModelId(func.current_model_id || '');
      } else {
        setName('');
        setDescription('');
        setCurrentModelId('');
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
        current_model_id: currentModelId || undefined,
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
              : 'Add a new AI-powered function to your product.'}
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
          <div className="space-y-2">
            <Label htmlFor="model">Current Model</Label>
            <Select
              value={currentModelId}
              onValueChange={setCurrentModelId}
              disabled={isLoadingModels}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingModels ? 'Loading models...' : 'Select a model (optional)'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No model selected</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optionally assign the current AI model used for this function.
            </p>
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
