'use client';

import * as React from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Savings multipliers by use case (percentage of cost that can be saved)
const useCaseSavings: Record<string, { multiplier: number; label: string }> = {
  'code-generation': { multiplier: 0.35, label: 'Code Generation' },
  'content-writing': { multiplier: 0.45, label: 'Content Writing' },
  'data-extraction': { multiplier: 0.55, label: 'Data Extraction' },
  summarization: { multiplier: 0.5, label: 'Summarization' },
  classification: { multiplier: 0.6, label: 'Classification' },
  'chat-support': { multiplier: 0.4, label: 'Chat Support' },
};

// Model costs per 1K tokens (input + output averaged)
const modelCosts: Record<string, { cost: number; label: string }> = {
  'gpt-4o': { cost: 0.005, label: 'GPT-4o' },
  'gpt-4-turbo': { cost: 0.01, label: 'GPT-4 Turbo' },
  'gpt-4': { cost: 0.03, label: 'GPT-4' },
  'claude-3-opus': { cost: 0.015, label: 'Claude 3 Opus' },
  'claude-3.5-sonnet': { cost: 0.003, label: 'Claude 3.5 Sonnet' },
  'claude-3-sonnet': { cost: 0.003, label: 'Claude 3 Sonnet' },
  'gemini-1.5-pro': { cost: 0.00125, label: 'Gemini 1.5 Pro' },
  'gemini-1.5-flash': { cost: 0.000075, label: 'Gemini 1.5 Flash' },
  'llama-3.1-405b': { cost: 0.005, label: 'Llama 3.1 405B' },
  'mistral-large': { cost: 0.002, label: 'Mistral Large' },
};

// Average tokens per API call (varies by use case)
const tokensPerCall: Record<string, number> = {
  'code-generation': 2500,
  'content-writing': 3000,
  'data-extraction': 1500,
  summarization: 2000,
  classification: 500,
  'chat-support': 1200,
};

interface SavingsCalculatorProps {
  onCtaClick?: () => void;
}

export function SavingsCalculator({ onCtaClick }: SavingsCalculatorProps) {
  const [monthlyApiCalls, setMonthlyApiCalls] = React.useState(100000);
  const [useCase, setUseCase] = React.useState('code-generation');
  const [currentModel, setCurrentModel] = React.useState('gpt-4o');
  const [hasInteracted, setHasInteracted] = React.useState(false);

  // Track interaction for analytics
  React.useEffect(() => {
    if (hasInteracted && typeof window !== 'undefined') {
      // PostHog event for calculator interaction
      const posthog = (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
      if (posthog?.capture) {
        posthog.capture('calculator_interaction', {
          api_calls: monthlyApiCalls,
          use_case: useCase,
          current_model: currentModel,
        });
      }
    }
  }, [hasInteracted, monthlyApiCalls, useCase, currentModel]);

  // Calculate savings
  const calculateSavings = () => {
    const model = modelCosts[currentModel] ?? { cost: 0.005, label: 'GPT-4o' };
    const useCaseData = useCaseSavings[useCase] ?? { multiplier: 0.35, label: 'Code Generation' };
    const avgTokens = tokensPerCall[useCase] ?? 2500;

    // Current monthly cost
    const currentMonthlyCost =
      monthlyApiCalls * (avgTokens / 1000) * model.cost;

    // Potential savings (based on use case optimization potential)
    const potentialSavings = currentMonthlyCost * useCaseData.multiplier;

    // Optimized cost
    const optimizedCost = currentMonthlyCost - potentialSavings;

    return {
      currentCost: currentMonthlyCost,
      savings: potentialSavings,
      optimizedCost,
      percentageSaved: useCaseData.multiplier * 100,
    };
  };

  const savings = calculateSavings();

  // Format numbers with specific decimal places for credibility
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatApiCalls = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const handleSliderChange = (value: number[]) => {
    setHasInteracted(true);
    if (value[0] !== undefined) {
      setMonthlyApiCalls(value[0]);
    }
  };

  const handleUseCaseChange = (value: string) => {
    setHasInteracted(true);
    setUseCase(value);
  };

  const handleModelChange = (value: string) => {
    setHasInteracted(true);
    setCurrentModel(value);
  };

  const handleCtaClick = () => {
    // Track CTA click
    if (typeof window !== 'undefined') {
      const posthog = (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
      if (posthog?.capture) {
        posthog.capture('calculator_cta_clicked', {
          monthly_savings: savings.savings,
          yearly_savings: savings.savings * 12,
        });
      }
    }

    if (onCtaClick) {
      onCtaClick();
    } else {
      // Scroll to waitlist form
      const waitlistForm = document.querySelector('#waitlist-form');
      if (waitlistForm) {
        waitlistForm.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-accent/20 bg-card/50 backdrop-blur">
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6">
          {/* API Calls Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Monthly API Calls
              </label>
              <Badge variant="secondary" className="font-mono">
                {formatApiCalls(monthlyApiCalls)}
              </Badge>
            </div>
            <Slider
              value={[monthlyApiCalls]}
              onValueChange={handleSliderChange}
              min={10000}
              max={1000000}
              step={10000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10K</span>
              <span>250K</span>
              <span>500K</span>
              <span>1M</span>
            </div>
          </div>

          {/* Use Case Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Primary Use Case
            </label>
            <Select value={useCase} onValueChange={handleUseCaseChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select use case" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(useCaseSavings).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Model Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Current Model
            </label>
            <Select value={currentModel} onValueChange={handleModelChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modelCosts).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Savings Display */}
          <div className="mt-8 p-6 rounded-lg bg-accent/5 border border-accent/20">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Your estimated savings
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-accent">
                  {formatCurrency(savings.savings)}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-lg text-foreground font-medium">
                {formatCurrency(savings.savings * 12)}/year
              </p>
              <Badge
                variant="outline"
                className="mt-2 border-accent/30 text-accent"
              >
                {savings.percentageSaved.toFixed(0)}% cost reduction
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <p className="text-muted-foreground">Current cost</p>
                <p className="font-semibold text-foreground">
                  {formatCurrency(savings.currentCost)}/mo
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Optimized cost</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(savings.optimizedCost)}/mo
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleCtaClick}
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-white"
          >
            Get Personalized Recommendations
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Based on{' '}
            {formatApiCalls(monthlyApiCalls)} calls using{' '}
            {modelCosts[currentModel]?.label ?? 'GPT-4o'} for {(useCaseSavings[useCase]?.label ?? 'Code Generation').toLowerCase()}.
            Actual savings depend on your specific usage patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
