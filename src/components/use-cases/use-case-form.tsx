'use client';

import { useState, useEffect } from 'react';
import {
  UseCase,
  CreateUseCaseInput,
  PRIORITY_NEEDS,
  PRIORITY_NEED_LABELS,
  PriorityNeed,
  PRIORITIES,
  PRIORITY_LABELS,
  Priority,
  QUALITY_REQUIREMENTS,
  QUALITY_REQUIREMENT_LABELS,
  QualityRequirement,
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

export function UseCaseForm({ open, onOpenChange, useCase, onSubmit }: UseCaseFormProps) {
  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentModelId, setCurrentModelId] = useState<string>('__none__');

  // Priority & requirements (NEW - moved from functions)
  const [priority, setPriority] = useState<Priority>('medium');
  const [latencyRequirementMs, setLatencyRequirementMs] = useState('');
  const [qualityRequirement, setQualityRequirement] = useState<string>('__none__');

  // Optimization priorities
  const [primaryNeed, setPrimaryNeed] = useState<PriorityNeed>('quality');
  const [secondaryNeed, setSecondaryNeed] = useState<string>('__none__');

  // Usage patterns (NEW - moved from functions)
  const [monthlyVolume, setMonthlyVolume] = useState('');
  const [avgInputTokens, setAvgInputTokens] = useState('');
  const [avgOutputTokens, setAvgOutputTokens] = useState('');

  // Technical requirements
  const [requiredContext, setRequiredContext] = useState('4096');
  const [estimatedMonthlyTokens, setEstimatedMonthlyTokens] = useState('');

  // Capabilities (SIMPLIFIED - removed input_type, output_type, requires_streaming)
  const [requiresVision, setRequiresVision] = useState(false);
  const [requiresFunctionCalling, setRequiresFunctionCalling] = useState(false);
  const [requiresJsonMode, setRequiresJsonMode] = useState(false);

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
      setCurrentModelId(useCase.current_model_id || '__none__');
      setPriority(useCase.priority || 'medium');
      setLatencyRequirementMs(useCase.latency_requirement_ms?.toString() || '');
      setQualityRequirement(useCase.quality_requirement || '__none__');
      setPrimaryNeed(useCase.primary_need);
      setSecondaryNeed(useCase.secondary_need || '__none__');
      setMonthlyVolume(useCase.monthly_volume?.toString() || '');
      setAvgInputTokens(useCase.avg_input_tokens?.toString() || '');
      setAvgOutputTokens(useCase.avg_output_tokens?.toString() || '');
      setRequiredContext(useCase.required_context?.toString() || '4096');
      setEstimatedMonthlyTokens(useCase.estimated_monthly_tokens?.toString() || '');
      setRequiresVision(useCase.requires_vision);
      setRequiresFunctionCalling(useCase.requires_function_calling);
      setRequiresJsonMode(useCase.requires_json_mode);
    } else {
      setName('');
      setDescription('');
      setCurrentModelId('__none__');
      setPriority('medium');
      setLatencyRequirementMs('');
      setQualityRequirement('__none__');
      setPrimaryNeed('quality');
      setSecondaryNeed('__none__');
      setMonthlyVolume('');
      setAvgInputTokens('');
      setAvgOutputTokens('');
      setRequiredContext('4096');
      setEstimatedMonthlyTokens('');
      setRequiresVision(false);
      setRequiresFunctionCalling(false);
      setRequiresJsonMode(false);
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
        current_model_id: currentModelId && currentModelId !== '__none__' ? currentModelId : null,
        priority,
        latency_requirement_ms: latencyRequirementMs ? parseInt(latencyRequirementMs) : null,
        quality_requirement: qualityRequirement && qualityRequirement !== '__none__' ? qualityRequirement as QualityRequirement : null,
        primary_need: primaryNeed,
        secondary_need: secondaryNeed && secondaryNeed !== '__none__' ? secondaryNeed as PriorityNeed : null,
        monthly_volume: monthlyVolume ? parseInt(monthlyVolume) : null,
        avg_input_tokens: avgInputTokens ? parseInt(avgInputTokens) : null,
        avg_output_tokens: avgOutputTokens ? parseInt(avgOutputTokens) : null,
        required_context: parseInt(requiredContext) || 4096,
        estimated_monthly_tokens: estimatedMonthlyTokens ? parseInt(estimatedMonthlyTokens) : null,
        requires_vision: requiresVision,
        requires_function_calling: requiresFunctionCalling,
        requires_json_mode: requiresJsonMode,
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
            {/* Basic Info */}
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
                  <SelectItem value="__none__">No model selected</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Which AI model are you currently using? This helps us find alternatives.
              </p>
            </div>

            {/* Priority & Requirements */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Business Priority</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority Level *</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quality-requirement">Quality Requirement</Label>
                  <Select value={qualityRequirement} onValueChange={setQualityRequirement}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {QUALITY_REQUIREMENTS.map((q) => (
                        <SelectItem key={q} value={q}>
                          {QUALITY_REQUIREMENT_LABELS[q]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="latency">Latency Requirement (ms)</Label>
                <Input
                  id="latency"
                  type="number"
                  min="0"
                  value={latencyRequirementMs}
                  onChange={(e) => setLatencyRequirementMs(e.target.value)}
                  placeholder="e.g., 2000 for real-time, leave empty if flexible"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum acceptable response time in milliseconds
                </p>
              </div>
            </div>

            {/* Optimization Priorities */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Optimization Priorities</h4>

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
                  What&apos;s most important for model selection?
                </p>
              </div>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="secondary-need">Secondary Need</Label>
                <Select value={secondaryNeed} onValueChange={(value) => setSecondaryNeed(value as PriorityNeed | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional - second priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {PRIORITY_NEEDS.filter(n => n !== primaryNeed).map((need) => (
                      <SelectItem key={need} value={need}>
                        {PRIORITY_NEED_LABELS[need]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Usage Patterns */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Usage Patterns</h4>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="monthly-volume">Monthly Calls</Label>
                  <Input
                    id="monthly-volume"
                    type="number"
                    min="0"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(e.target.value)}
                    placeholder="e.g., 10000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avg-input">Avg Input Tokens</Label>
                  <Input
                    id="avg-input"
                    type="number"
                    min="0"
                    value={avgInputTokens}
                    onChange={(e) => setAvgInputTokens(e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avg-output">Avg Output Tokens</Label>
                  <Input
                    id="avg-output"
                    type="number"
                    min="0"
                    value={avgOutputTokens}
                    onChange={(e) => setAvgOutputTokens(e.target.value)}
                    placeholder="e.g., 200"
                  />
                </div>
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Technical Requirements</h4>

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
                  <Label htmlFor="monthly-tokens">Est. Total Monthly Tokens</Label>
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
            </div>

            {/* Capabilities */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Required Capabilities</h4>

              <div className="space-y-3">
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
                    id="json-mode"
                    checked={requiresJsonMode}
                    onCheckedChange={(checked) => setRequiresJsonMode(checked === true)}
                  />
                  <label htmlFor="json-mode" className="text-sm">
                    JSON Mode (structured output)
                  </label>
                </div>
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
