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

// ============================================================================
// V2 Data Sources (from Calculator v2 Developer Specification)
// ============================================================================

// Pricing data with January 2026 market rates
const pricingData = {
  models: [
    { model: "Claude Sonnet 4.5", provider: "Anthropic", input_pm: 3.00, output_pm: 15.00, context_k: 1000, tier: "Premium" },
    { model: "Claude Opus 4.5", provider: "Anthropic", input_pm: 5.00, output_pm: 25.00, context_k: 200, tier: "Frontier" },
    { model: "Claude Haiku 4.5", provider: "Anthropic", input_pm: 1.00, output_pm: 5.00, context_k: 200, tier: "Fast" },
    { model: "GPT-5.2", provider: "OpenAI", input_pm: 1.75, output_pm: 14.00, context_k: 400, tier: "Frontier" },
    { model: "GPT-5", provider: "OpenAI", input_pm: 1.25, output_pm: 10.00, context_k: 400, tier: "Premium" },
    { model: "GPT-5 Mini", provider: "OpenAI", input_pm: 0.25, output_pm: 2.00, context_k: 400, tier: "Mid" },
    { model: "GPT-4.1", provider: "OpenAI", input_pm: 2.00, output_pm: 8.00, context_k: 1050, tier: "Premium" },
    { model: "GPT-4o-mini", provider: "OpenAI", input_pm: 0.15, output_pm: 0.60, context_k: 128, tier: "Budget" },
    { model: "Gemini 3 Pro Preview", provider: "Google", input_pm: 2.00, output_pm: 12.00, context_k: 1050, tier: "Frontier" },
    { model: "Gemini 3 Flash Preview", provider: "Google", input_pm: 0.50, output_pm: 3.00, context_k: 1050, tier: "Mid" },
    { model: "Gemini 2.5 Pro", provider: "Google", input_pm: 1.25, output_pm: 10.00, context_k: 1050, tier: "Premium" },
    { model: "Gemini 2.5 Flash", provider: "Google", input_pm: 0.30, output_pm: 2.50, context_k: 1050, tier: "Mid" },
    { model: "Gemini 2.5 Flash Lite", provider: "Google", input_pm: 0.10, output_pm: 0.40, context_k: 1050, tier: "Budget" },
    { model: "DeepSeek V3.2", provider: "DeepSeek", input_pm: 0.25, output_pm: 0.38, context_k: 164, tier: "Budget" },
    { model: "MiniMax M2.1", provider: "MiniMax", input_pm: 0.27, output_pm: 1.12, context_k: 197, tier: "Budget" },
  ]
};

// Recommendation matrix: use_case → priority → model
const recommendationMatrix: Record<string, Record<string, string>> = {
  "Code Generation / Programming": {
    "Quality First": "Claude Sonnet 4.5",
    "Balanced": "Gemini 3 Flash Preview",
    "Cost First": "DeepSeek V3.2"
  },
  "Reasoning / Complex Analysis": {
    "Quality First": "Claude Opus 4.5",
    "Balanced": "Gemini 2.5 Pro",
    "Cost First": "DeepSeek V3.2"
  },
  "Text Generation / Content": {
    "Quality First": "Claude Sonnet 4.5",
    "Balanced": "GPT-5",
    "Cost First": "Gemini 2.5 Flash Lite"
  },
  "Data Processing / Analysis": {
    "Quality First": "Gemini 2.5 Pro",
    "Balanced": "Gemini 2.5 Flash",
    "Cost First": "Gemini 2.5 Flash Lite"
  },
  "Chat / Conversational": {
    "Quality First": "Claude Sonnet 4.5",
    "Balanced": "GPT-5 Mini",
    "Cost First": "GPT-4o-mini"
  },
  "Agentic / Tool Use": {
    "Quality First": "Claude Opus 4.5",
    "Balanced": "Gemini 3 Flash Preview",
    "Cost First": "MiniMax M2.1"
  }
};

// Use case options
const useCases = [
  "Code Generation / Programming",
  "Reasoning / Complex Analysis",
  "Text Generation / Content",
  "Data Processing / Analysis",
  "Chat / Conversational",
  "Agentic / Tool Use"
];

// Priority options (for reference)
// "Quality First", "Balanced", "Cost First"

// Models available for "Current Model" dropdown
const currentModelOptions = [
  "Claude Sonnet 4.5",
  "Claude Opus 4.5",
  "GPT-5.2",
  "GPT-5",
  "GPT-4.1",
  "GPT-4o-mini",
  "Gemini 3 Pro Preview",
  "Gemini 2.5 Pro",
  "DeepSeek V3.2"
];

// ============================================================================
// Helper Functions
// ============================================================================

function getModelPricing(modelName: string) {
  return pricingData.models.find(m => m.model === modelName);
}

function calculateCost(monthlyCalls: number, inputPm: number, outputPm: number): number {
  // 50/50 split between input and output tokens
  // Prices are per million tokens
  return (monthlyCalls / 1_000_000) * (inputPm * 0.5 + outputPm * 0.5);
}

function getPerformanceGain(priority: string): number {
  // Placeholder performance metric based on priority
  switch (priority) {
    case "Quality First":
      return Math.floor(Math.random() * (25 - 15 + 1)) + 15; // 15-25%
    case "Balanced":
      return Math.floor(Math.random() * (12 - 8 + 1)) + 8; // 8-12%
    case "Cost First":
      return Math.floor(Math.random() * (5 - 2 + 1)) + 2; // 2-5%
    default:
      return 10;
  }
}

// ============================================================================
// Component
// ============================================================================

export function SavingsCalculator() {
  const [monthlyApiCalls, setMonthlyApiCalls] = React.useState(100000);
  const [useCase, setUseCase] = React.useState("Code Generation / Programming");
  const [currentModel, setCurrentModel] = React.useState("Claude Sonnet 4.5");
  const [priority, setPriority] = React.useState("Balanced");
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [showEmailCapture, setShowEmailCapture] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  // Memoize performance gain so it doesn't change on every render
  const [performanceGain, setPerformanceGain] = React.useState(() => getPerformanceGain(priority));

  // Update performance gain when priority changes
  React.useEffect(() => {
    setPerformanceGain(getPerformanceGain(priority));
  }, [priority]);

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
    // Get recommended model from matrix
    const recommendedModelName = recommendationMatrix[useCase]?.[priority] ?? "Claude Sonnet 4.5";

    // Check if already optimized
    const isAlreadyOptimized = currentModel === recommendedModelName;

    // Get pricing for both models
    const currentPricing = getModelPricing(currentModel);
    const recommendedPricing = getModelPricing(recommendedModelName);

    if (!currentPricing || !recommendedPricing) {
      return {
        recommendedModel: recommendedModelName,
        monthlySavings: 0,
        currentCost: 0,
        recommendedCost: 0,
        performanceGain: 0,
        isAlreadyOptimized: false,
        savingsPercent: 0,
      };
    }

    // Calculate costs
    const currentCost = calculateCost(monthlyApiCalls, currentPricing.input_pm, currentPricing.output_pm);
    const recommendedCost = calculateCost(monthlyApiCalls, recommendedPricing.input_pm, recommendedPricing.output_pm);
    const monthlySavings = currentCost - recommendedCost;
    const savingsPercent = currentCost > 0 ? (monthlySavings / currentCost) * 100 : 0;

    return {
      recommendedModel: recommendedModelName,
      monthlySavings: isAlreadyOptimized ? 0 : monthlySavings,
      currentCost,
      recommendedCost: isAlreadyOptimized ? currentCost : recommendedCost,
      performanceGain: isAlreadyOptimized ? 0 : performanceGain,
      isAlreadyOptimized,
      savingsPercent: isAlreadyOptimized ? 0 : savingsPercent,
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
    setPriority(value);
  };

  // Determine if this is a cost increase scenario (recommending more expensive model)
  const isInvestment = results.monthlySavings < 0;

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
                {useCases.map((uc) => (
                  <SelectItem key={uc} value={uc}>
                    {uc}
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
                {currentModelOptions.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
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
                <SelectItem value="Quality First">
                  Quality First — Best results
                </SelectItem>
                <SelectItem value="Balanced">
                  Balanced — Best of both
                </SelectItem>
                <SelectItem value="Cost First">
                  Cost First — Maximum savings
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Display */}
          <div className="mt-8 p-6 rounded-lg bg-accent/5 border border-accent/20">
            {results.isAlreadyOptimized ? (
              // Already optimized state
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
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
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    You&apos;re already optimized!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">{currentModel}</span> is our top recommendation
                    for <span className="font-medium">{useCase.toLowerCase()}</span> with{' '}
                    <span className="font-medium">{priority.toLowerCase()}</span> priority.
                  </p>
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400">
                  $0 savings — you&apos;re using the best option
                </Badge>
              </div>
            ) : (
              // Normal results
              <>
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
                    <p className="text-xs text-muted-foreground mb-1">
                      {isInvestment ? 'Investment' : 'Savings'}
                    </p>
                    <p className={`text-2xl sm:text-3xl font-bold ${
                      isInvestment
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {isInvestment ? '+' : ''}{formatCurrency(Math.abs(results.monthlySavings))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">/month</p>
                  </div>
                </div>

                {/* Context Badge */}
                <div className="flex justify-center">
                  {isInvestment ? (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Investment for higher quality results
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400">
                      {Math.abs(results.savingsPercent).toFixed(0)}% cost reduction
                    </Badge>
                  )}
                </div>

                {/* Summary Text */}
                <p className="text-xs text-center text-muted-foreground mt-4">
                  {isInvestment ? (
                    <>
                      For <span className="font-medium">{useCase.toLowerCase()}</span>, we recommend investing in better quality.
                      You&apos;ll see <span className="text-green-600 dark:text-green-400 font-medium">+{results.performanceGain}% better results</span>.
                    </>
                  ) : (
                    <>
                      Switching to <span className="font-medium">{results.recommendedModel}</span> saves{' '}
                      <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(Math.abs(results.monthlySavings) * 12)}/year</span>{' '}
                      while improving performance by <span className="font-medium">{results.performanceGain}%</span>.
                    </>
                  )}
                </p>
              </>
            )}
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
                      monthly_savings: results.monthlySavings,
                      priority: priority,
                      is_already_optimized: results.isAlreadyOptimized,
                    });
                  }
                }
              }}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-white"
            >
              Join Waitlist for Real Results
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
                You&apos;re on the waitlist!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                We&apos;ll notify you when ModelOptix launches with real, personalized recommendations.
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
                        monthly_savings: results.monthlySavings,
                        savings_percent: results.savingsPercent,
                        recommended_model: results.recommendedModel,
                        current_model: currentModel,
                        use_case: useCase,
                        priority: priority,
                        monthly_api_calls: monthlyApiCalls,
                        is_already_optimized: results.isAlreadyOptimized,
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
                          monthly_savings: results.monthlySavings,
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
            Illustrative savings based on current market pricing.
            Actual results depend on your specific usage patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
