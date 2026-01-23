'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Play, Loader2 } from 'lucide-react';
import { QuotaDisplay } from './quota-display';
import type { SanityCheckParameters } from '@/types/sanity-check';

interface SanityCheckFormProps {
  currentModelId: string;
  currentModelName: string;
  recommendedModelId: string;
  recommendedModelName: string;
  useCaseId?: string;
  suggestedPrompt?: string;
  isGuest?: boolean;
  guestSessionId?: string;
  onSubmit: (prompt: string, parameters?: SanityCheckParameters) => Promise<void>;
  isLoading?: boolean;
  showQuota?: boolean;
}

export function SanityCheckForm({
  currentModelName,
  recommendedModelName,
  suggestedPrompt,
  isGuest,
  guestSessionId,
  onSubmit,
  isLoading = false,
  showQuota = true,
}: SanityCheckFormProps) {
  const [prompt, setPrompt] = useState(suggestedPrompt || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prompt.trim()) {
      setError('Please enter a prompt to test');
      return;
    }

    if (prompt.length > 10000) {
      setError('Prompt is too long (max 10,000 characters)');
      return;
    }

    const parameters: SanityCheckParameters = {};
    if (systemPrompt.trim()) {
      parameters.systemPrompt = systemPrompt.trim();
    }
    if (maxTokens !== undefined && maxTokens > 0) {
      parameters.maxTokens = maxTokens;
    }
    if (temperature !== undefined) {
      parameters.temperature = temperature;
    }

    try {
      await onSubmit(prompt.trim(), Object.keys(parameters).length > 0 ? parameters : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run sanity check');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quota Display */}
      {showQuota && (
        <QuotaDisplay
          guestSessionId={isGuest ? guestSessionId : undefined}
          onUpgradeClick={() => {
            // Navigate to pricing or signup
            window.location.href = isGuest ? '/sign-up' : '/pricing';
          }}
        />
      )}

      {/* Model Comparison Header */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <div className="text-center">
          <div className="font-medium text-foreground">{currentModelName}</div>
          <div>Current Model</div>
        </div>
        <div className="text-2xl font-light text-muted-foreground/50">vs</div>
        <div className="text-center">
          <div className="font-medium text-teal-600 dark:text-teal-400">{recommendedModelName}</div>
          <div>Recommended Model</div>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="prompt">Test Prompt</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt that represents a typical task for this use case..."
          className="min-h-[120px] resize-y"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Enter a prompt that both models will respond to</span>
          <span>{prompt.length.toLocaleString()} / 10,000</span>
        </div>
      </div>

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <span>Advanced Options</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt (optional)</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system prompt to set context..."
              className="min-h-[80px] resize-y"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Define the AI&apos;s role or behavior for both models
            </p>
          </div>

          {/* Max Tokens and Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={1}
                max={4096}
                value={maxTokens ?? ''}
                onChange={(e) =>
                  setMaxTokens(e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                placeholder="1024"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Max response length (1-4096)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature ?? ''}
                onChange={(e) =>
                  setTemperature(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="0.7"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Response randomness (0-2)
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !prompt.trim()}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Sanity Check...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Sanity Check
          </>
        )}
      </Button>

      {/* Info */}
      <p className="text-center text-xs text-muted-foreground">
        Both models will receive the same prompt. Compare their responses to validate the recommendation.
      </p>
    </form>
  );
}
