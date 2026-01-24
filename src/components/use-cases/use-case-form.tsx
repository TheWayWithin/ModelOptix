'use client';

import { useState, useEffect } from 'react';
import {
  UseCase,
  CreateUseCaseInput,
  PRIORITY_NEEDS,
  PRIORITY_NEED_LABELS,
  PriorityNeed,
  INPUT_TYPES,
  OUTPUT_TYPES,
  InputType,
  OutputType,
} from '@/types/use-case';
import { ModelOption } from '@/types/model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

interface UseCaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useCase?: UseCase | null;
  onSubmit: (data: CreateUseCaseInput) => Promise<void>;
}

const INPUT_TYPE_LABELS: Record<InputType, string> = {
  text: 'Text',
  code: 'Code',
  structured: 'Structured Data',
  multimodal: 'Multimodal (Images)',
};

const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  text: 'Text',
  code: 'Code',
  json: 'JSON',
  classification: 'Classification',
};

export function UseCaseForm({ open, onOpenChange, useCase, onSubmit }: UseCaseFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [primaryNeed, setPrimaryNeed] = useState<PriorityNeed>('quality');
  const [secondaryNeed, setSecondaryNeed] = useState<PriorityNeed | ''>('');
  const [inputType, setInputType] = useState<InputType | ''>('text');
  const [outputType, setOutputType] = useState<OutputType | ''>('text');
  const [requiredContext, setRequiredContext] = useState('4096');
  const [estimatedMonthlyTokens, setEstimatedMonthlyTokens] = useState('');
  const [requiresVision, setRequiresVision] = useState(false);
  const [requiresFunctionCalling, setRequiresFunctionCalling] = useState(false);
  const [requiresStreaming, setRequiresStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Model selection
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const isEditing = !!useCase;

  // Fetch models when form opens
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

  useEffect(() => {
    if (useCase) {
      setName(useCase.name);
      setDescription(useCase.description || '');
      setCurrentModelId(useCase.current_model_id || '');
      setPrimaryNeed(useCase.primary_need);
      setSecondaryNeed(useCase.secondary_need || '');
      setInputType(useCase.input_type || '');
      setOutputType(useCase.output_type || '');
      setRequiredContext(useCase.required_context?.toString() || '4096');
      setEstimatedMonthlyTokens(useCase.estimated_monthly_tokens?.toString() || '');
      setRequiresVision(useCase.requires_vision);
      setRequiresFunctionCalling(useCase.requires_function_calling);
      setRequiresStreaming(useCase.requires_streaming);
    } else {
      setName('');
      setDescription('');
      setCurrentModelId('');
      setPrimaryNeed('quality');
      setSecondaryNeed('');
      setInputType('text');
      setOutputType('text');
      setRequiredContext('4096');
      setEstimatedMonthlyTokens('');
      setRequiresVision(false);
      setRequiresFunctionCalling(false);
      setRequiresStreaming(false);
    }
  }, [useCase, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        description: description || null,
        current_model_id: currentModelId || null,
        primary_need: primaryNeed,
        secondary_need: secondaryNeed || null,
        input_type: inputType || null,
        output_type: outputType || null,
        required_context: parseInt(requiredContext) || 4096,
        estimated_monthly_tokens: estimatedMonthlyTokens ? parseInt(estimatedMonthlyTokens) : null,
        requires_vision: requiresVision,
        requires_function_calling: requiresFunctionCalling,
        requires_streaming: requiresStreaming,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Use Case' : 'Add Use Case'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Update the use case details and requirements.'
                : 'Define a new AI use case with its requirements.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Generate code review comments"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this use case does..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="current-model">Current Model</Label>
              <Select
                value={currentModelId}
                onValueChange={setCurrentModelId}
                disabled={isLoadingModels}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingModels ? 'Loading models...' : 'Select your current model'} />
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
                Which AI model are you currently using for this use case? This helps us find cheaper alternatives.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primary-need">Primary Need *</Label>
              <Select value={primaryNeed} onValueChange={(value) => setPrimaryNeed(value as PriorityNeed)}>
                <SelectTrigger>
                  <SelectValue placeholder="What matters most?" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_NEEDS.map((need) => (
                    <SelectItem key={need} value={need}>
                      {PRIORITY_NEED_LABELS[need]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                What&apos;s most important for this use case?
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="secondary-need">Secondary Need</Label>
              <Select value={secondaryNeed} onValueChange={(value) => setSecondaryNeed(value as PriorityNeed | '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional - second priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {PRIORITY_NEEDS.filter(n => n !== primaryNeed).map((need) => (
                    <SelectItem key={need} value={need}>
                      {PRIORITY_NEED_LABELS[need]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="input-type">Input Type</Label>
                <Select value={inputType} onValueChange={(value) => setInputType(value as InputType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INPUT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {INPUT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="output-type">Output Type</Label>
                <Select value={outputType} onValueChange={(value) => setOutputType(value as OutputType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {OUTPUT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="context">Required Context (tokens)</Label>
                <Input
                  id="context"
                  type="number"
                  min="0"
                  value={requiredContext}
                  onChange={(e) => setRequiredContext(e.target.value)}
                  placeholder="4096"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly-tokens">Est. Monthly Tokens</Label>
                <Input
                  id="monthly-tokens"
                  type="number"
                  min="0"
                  value={estimatedMonthlyTokens}
                  onChange={(e) => setEstimatedMonthlyTokens(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Capabilities Required</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vision"
                  checked={requiresVision}
                  onCheckedChange={(checked) => setRequiresVision(checked === true)}
                />
                <label htmlFor="vision" className="text-sm">
                  Vision (image input)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="function-calling"
                  checked={requiresFunctionCalling}
                  onCheckedChange={(checked) => setRequiresFunctionCalling(checked === true)}
                />
                <label htmlFor="function-calling" className="text-sm">
                  Function/Tool Calling
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="streaming"
                  checked={requiresStreaming}
                  onCheckedChange={(checked) => setRequiresStreaming(checked === true)}
                />
                <label htmlFor="streaming" className="text-sm">
                  Streaming Response
                </label>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Use Case'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
