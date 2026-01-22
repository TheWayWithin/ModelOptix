'use client';

import { useState, useEffect } from 'react';
import { UseCase, CreateUseCaseInput, TASK_TYPES, TASK_TYPE_LABELS, TaskType } from '@/types/use-case';
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

interface UseCaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useCase?: UseCase | null;
  onSubmit: (data: CreateUseCaseInput) => Promise<void>;
}

export function UseCaseForm({ open, onOpenChange, useCase, onSubmit }: UseCaseFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('other');
  const [currentMonthlyCalls, setCurrentMonthlyCalls] = useState('0');
  const [avgInputTokens, setAvgInputTokens] = useState('1000');
  const [avgOutputTokens, setAvgOutputTokens] = useState('500');
  const [qualityThreshold, setQualityThreshold] = useState('80');
  const [latencyRequirementMs, setLatencyRequirementMs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!useCase;

  useEffect(() => {
    if (useCase) {
      setName(useCase.name);
      setDescription(useCase.description || '');
      setTaskType(useCase.task_type);
      setCurrentMonthlyCalls(useCase.current_monthly_calls.toString());
      setAvgInputTokens(useCase.avg_input_tokens.toString());
      setAvgOutputTokens(useCase.avg_output_tokens.toString());
      setQualityThreshold((useCase.quality_threshold * 100).toString());
      setLatencyRequirementMs(useCase.latency_requirement_ms?.toString() || '');
    } else {
      setName('');
      setDescription('');
      setTaskType('other');
      setCurrentMonthlyCalls('0');
      setAvgInputTokens('1000');
      setAvgOutputTokens('500');
      setQualityThreshold('80');
      setLatencyRequirementMs('');
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
        task_type: taskType,
        current_monthly_calls: parseInt(currentMonthlyCalls) || 0,
        avg_input_tokens: parseInt(avgInputTokens) || 1000,
        avg_output_tokens: parseInt(avgOutputTokens) || 500,
        quality_threshold: (parseInt(qualityThreshold) || 80) / 100,
        latency_requirement_ms: latencyRequirementMs ? parseInt(latencyRequirementMs) : null,
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
                ? 'Update the use case details and metrics.'
                : 'Define a new AI use case with its usage patterns.'}
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
              <Label htmlFor="task-type">Task Type *</Label>
              <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task type" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {TASK_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="monthly-calls">Monthly Calls</Label>
                <Input
                  id="monthly-calls"
                  type="number"
                  min="0"
                  value={currentMonthlyCalls}
                  onChange={(e) => setCurrentMonthlyCalls(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quality">Quality Threshold (%)</Label>
                <Input
                  id="quality"
                  type="number"
                  min="0"
                  max="100"
                  value={qualityThreshold}
                  onChange={(e) => setQualityThreshold(e.target.value)}
                  placeholder="80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="input-tokens">Avg Input Tokens</Label>
                <Input
                  id="input-tokens"
                  type="number"
                  min="0"
                  value={avgInputTokens}
                  onChange={(e) => setAvgInputTokens(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="output-tokens">Avg Output Tokens</Label>
                <Input
                  id="output-tokens"
                  type="number"
                  min="0"
                  value={avgOutputTokens}
                  onChange={(e) => setAvgOutputTokens(e.target.value)}
                  placeholder="500"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="latency">Latency Requirement (ms)</Label>
              <Input
                id="latency"
                type="number"
                min="0"
                value={latencyRequirementMs}
                onChange={(e) => setLatencyRequirementMs(e.target.value)}
                placeholder="Optional - e.g., 500"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if latency is not critical for this use case.
              </p>
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
