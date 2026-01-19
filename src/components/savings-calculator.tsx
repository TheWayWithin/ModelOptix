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
import { Input } from '@/components/ui/input';

// Optimization priority types
type OptimizationPriority = 'balanced' | 'performance' | 'cost';

// Model data with performance and cost characteristics
const modelData: Record<string, {
  cost: number;
  label: string;
  tier: 'premium' | 'standard' | 'economy';
  strengths: string[];
}> = {
  'gpt-4': { cost: 0.03, label: 'GPT-4', tier: 'premium', strengths: ['reasoning', 'coding'] },
  'gpt-4o': { cost: 0.005, label: 'GPT-4o', tier: 'standard', strengths: ['general', 'fast'] },
  'claude-opus-4.5': { cost: 0.045, label: 'Claude Opus 4.5', tier: 'premium', strengths: ['reasoning', 'analysis'] },
  'claude-3.5-sonnet': { cost: 0.003, label: 'Claude 3.5 Sonnet', tier: 'standard', strengths: ['coding', 'accuracy'] },
  'gemini-1.5-pro': { cost: 0.00125, label: 'Gemini 1.5 Pro', tier: 'standard', strengths: ['data', 'context'] },
  'gemini-1.5-flash': { cost: 0.000075, label: 'Gemini 1.5 Flash', tier: 'economy', strengths: ['speed', 'volume'] },
  'deepseek-v3': { cost: 0.0014, label: 'DeepSeek V3', tier: 'economy', strengths: ['patterns', 'cost'] },
  'llama-3.1-405b': { cost: 0.005, label: 'Llama 3.1 405B', tier: 'standard', strengths: ['open', 'customizable'] },
  'mistral-large': { cost: 0.002, label: 'Mistral Large', tier: 'standard', strengths: ['european', 'efficient'] },
};

// Use case optimization data
const useCaseOptimization: Record<string, {
  label: string;
  avgTokens: number;
  criticalTasks: boolean;
  recommendations: {
    balanced: { model: string; performanceGain: number; costChange: number };
    performance: { model: string; performanceGain: number; costChange: number };
    cost: { model: string; performanceGain: number; costChange: number };
  };
}> = {
  'code-generation': {
    label: 'Code Generation',
    avgTokens: 2500,
    criticalTasks: true,
    recommendations: {
      balanced: { model: 'claude-3.5-sonnet', performanceGain: 15, costChange: -40 },
      performance: { model: 'claude-opus-4.5', performanceGain: 25, costChange: 50 },
      cost: { model: 'deepseek-v3', performanceGain: 5, costChange: -72 },
    },
  },
  'content-writing': {
    label: 'Content Writing',
    avgTokens: 3000,
    criticalTasks: false,
    recommendations: {
      balanced: { model: 'claude-3.5-sonnet', performanceGain: 12, costChange: -40 },
      performance: { model: 'claude-opus-4.5', performanceGain: 20, costChange: 50 },
      cost: { model: 'gemini-1.5-flash', performanceGain: -5, costChange: -98 },
    },
  },
  'data-extraction': {
    label: 'Data Extraction',
    avgTokens: 1500,
    criticalTasks: false,
    recommendations: {
      balanced: { model: 'gemini-1.5-pro', performanceGain: 18, costChange: -75 },
      performance: { model: 'claude-opus-4.5', performanceGain: 28, costChange: 50 },
      cost: { model: 'gemini-1.5-flash', performanceGain: 8, costChange: -98 },
    },
  },
  'summarization': {
    label: 'Summarization',
    avgTokens: 2000,
    criticalTasks: false,
    recommendations: {
      balanced: { model: 'gemini-1.5-pro', performanceGain: 15, costChange: -75 },
      performance: { model: 'claude-3.5-sonnet', performanceGain: 22, costChange: -40 },
      cost: { model: 'gemini-1.5-flash', performanceGain: 5, costChange: -98 },
    },
  },
  'classification': {
    label: 'Classification',
    avgTokens: 500,
    criticalTasks: false,
    recommendations: {
      balanced: { model: 'gemini-1.5-flash', performanceGain: 12, costChange: -98 },
      performance: { model: 'gemini-1.5-pro', performanceGain: 20, costChange: -75 },
      cost: { model: 'deepseek-v3', performanceGain: 8, costChange: -72 },
    },
  },
  'chat-support': {
    label: 'Chat Support',
    avgTokens: 1200,
    criticalTasks: false,
    recommendations: {
      balanced: { model: 'claude-3.5-sonnet', performanceGain: 18, costChange: -40 },
      performance: { model: 'claude-opus-4.5', performanceGain: 30, costChange: 50 },
      cost: { model: 'mistral-large', performanceGain: 10, costChange: -60 },
    },
  },
};

export function SavingsCalculator() {
  const [monthlyApiCalls, setMonthlyApiCalls] = React.useState(100000);
  const [useCase, setUseCase] = React.useState('code-generation');
  const [currentModel, setCurrentModel] = React.useState('gpt-4o');
  const [priority, setPriority] = React.useState<OptimizationPriority>('balanced');
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [showEmailCapture, setShowEmailCapture] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  // Track interaction for analytics
  React.useEffect(() => {
    if (hasInteracted && typeof window !== 'undefined') {
      const posthog = (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
      if (posthog?.capture) {
        posthog.capture('calculator_interaction', {
          api_calls: monthlyApiCalls,
          use_case: useCase,
          current_model: currentModel,
          priority: priority,
        });
      }
    }
  }, [hasInteracted, monthlyApiCalls, useCase, currentModel, priority]);

  // Calculate optimization results
  const calculateOptimization = () => {
    const model = modelData[currentModel] ?? { cost: 0.005, label: 'GPT-4o', tier: 'standard' as const, strengths: [] };
    const useCaseData = useCaseOptimization[useCase] ?? useCaseOptimization['code-generation']!;
    const recommendation = useCaseData.recommendations[priority];
    const recommendedModel = modelData[recommendation.model] ?? model;

    // Current monthly cost
    const currentMonthlyCost = monthlyApiCalls * (useCaseData.avgTokens / 1000) * model.cost;

    // Calculate cost change
    const costChangePercent = recommendation.costChange;
    const costDelta = currentMonthlyCost * (costChangePercent / 100);
    const optimizedCost = currentMonthlyCost + costDelta;

    return {
      currentCost: currentMonthlyCost,
      optimizedCost: optimizedCost,
      costChange: costDelta,
      costChangePercent: costChangePercent,
      performanceGain: recommendation.performanceGain,
      recommendedModel: recommendedModel.label,
      isCritical: useCaseData.criticalTasks,
    };
  };

  const results = calculateOptimization();

  // Format numbers
  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) {
      return `$${absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }
    return `$${absAmount.toLocaleString('en-US', {
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

  const handlePriorityChange = (value: string) => {
    setHasInteracted(true);
    setPriority(value as OptimizationPriority);
  };

  // Determine if this is a "invest more" or "save money" scenario
  const isInvestment = results.costChangePercent > 0;

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
                {Object.entries(useCaseOptimization).map(([key, { label }]) => (
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
                {Object.entries(modelData).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optimization Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Optimization Priority
            </label>
            <Select value={priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">
                  Balanced — Best of both
                </SelectItem>
                <SelectItem value="performance">
                  Performance First — Quality over cost
                </SelectItem>
                <SelectItem value="cost">
                  Cost First — Maximum savings
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Display */}
          <div className="mt-8 p-6 rounded-lg bg-accent/5 border border-accent/20">
            <div className="text-center space-y-1 mb-4">
              <p className="text-sm text-muted-foreground">
                Your estimated optimization
              </p>
              <p className="text-sm font-medium text-accent">
                Recommended: {results.recommendedModel}
              </p>
            </div>

            {/* Dual Metrics Display */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Performance Gain */}
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">Performance</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                  +{results.performanceGain}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">improvement</p>
              </div>

              {/* Cost Change */}
              <div className={`p-4 rounded-lg text-center ${
                isInvestment
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'bg-green-500/10 border border-green-500/20'
              }`}>
                <p className="text-xs text-muted-foreground mb-1">Cost</p>
                <p className={`text-2xl sm:text-3xl font-bold ${
                  isInvestment
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {isInvestment ? '+' : '-'}{formatCurrency(results.costChange)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">/month</p>
              </div>
            </div>

            {/* Context Badge */}
            <div className="flex justify-center">
              {isInvestment ? (
                <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
                  Investment for {Math.abs(results.costChangePercent)}% higher quality
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400">
                  {Math.abs(results.costChangePercent)}% cost reduction
                </Badge>
              )}
            </div>

            {/* Summary Text */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              {isInvestment ? (
                <>
                  For <span className="font-medium">{useCaseOptimization[useCase]?.label ?? 'this use case'}</span>, we recommend investing in better quality.
                  You&apos;ll see <span className="text-green-600 dark:text-green-400 font-medium">+{results.performanceGain}% better results</span>.
                </>
              ) : (
                <>
                  Switching to <span className="font-medium">{results.recommendedModel}</span> saves{' '}
                  <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(Math.abs(results.costChange) * 12)}/year</span>{' '}
                  while improving performance by <span className="font-medium">{results.performanceGain}%</span>.
                </>
              )}
            </p>
          </div>

          {/* CTA Section with Email Capture */}
          {!showEmailCapture ? (
            <Button
              onClick={() => {
                setShowEmailCapture(true);
                // Track CTA click
                if (typeof window !== 'undefined') {
                  const posthog = (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
                  if (posthog?.capture) {
                    posthog.capture('calculator_email_cta_clicked', {
                      performance_gain: results.performanceGain,
                      cost_change: results.costChange,
                      priority: priority,
                    });
                  }
                }
              }}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-white"
            >
              Email Me My Results
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </Button>
          ) : submitStatus === 'success' ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <svg
                className="mx-auto h-8 w-8 text-green-600 dark:text-green-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                You&apos;re on the list!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                I&apos;ll send your personalized recommendations soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email || isSubmitting) return;

                setIsSubmitting(true);
                setSubmitStatus('idle');

                try {
                  const response = await fetch('/api/waitlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email,
                      source: 'calculator',
                      metadata: {
                        performance_gain: results.performanceGain,
                        cost_change: results.costChange,
                        cost_change_percent: results.costChangePercent,
                        recommended_model: results.recommendedModel,
                        current_model: modelData[currentModel]?.label,
                        use_case: useCaseOptimization[useCase]?.label,
                        priority: priority,
                        monthly_api_calls: monthlyApiCalls,
                      },
                    }),
                  });

                  if (response.ok) {
                    setSubmitStatus('success');
                    // Track successful submission
                    if (typeof window !== 'undefined') {
                      const posthog = (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
                      if (posthog?.capture) {
                        posthog.capture('calculator_email_submitted', {
                          performance_gain: results.performanceGain,
                          cost_change: results.costChange,
                          priority: priority,
                        });
                      }
                    }
                  } else {
                    setSubmitStatus('error');
                  }
                } catch {
                  setSubmitStatus('error');
                }

                setIsSubmitting(false);
              }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  size="default"
                  className="bg-accent hover:bg-accent/90 text-white px-6"
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
              {submitStatus === 'error' && (
                <p className="text-xs text-red-500 text-center">
                  Something went wrong. Please try again.
                </p>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Join 500+ developers. No spam, ever.
              </p>
            </form>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Based on {formatApiCalls(monthlyApiCalls)} calls using{' '}
            {modelData[currentModel]?.label ?? 'GPT-4o'} for {(useCaseOptimization[useCase]?.label ?? 'code generation').toLowerCase()}.
            I validate recommendations with automated testing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
