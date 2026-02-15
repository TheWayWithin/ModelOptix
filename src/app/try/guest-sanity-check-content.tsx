'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Beaker, ArrowRight, Loader2, Sparkles, Shield, Zap } from 'lucide-react';
import {
  SanityCheckForm,
  SanityCheckResults,
  SanityCheckEvaluation,
} from '@/components/sanity-check';
import {
  getOrCreateGuestToken,
  saveGuestToken,
  hashToken,
} from '@/lib/guest-session';
import type {
  SanityCheckWithDetails,
  SanityCheckParameters,
  UserPreference,
} from '@/types/sanity-check';

interface PublicModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  providerTrustTier: string;
  contextLength: number;
  inputPrice: number;
  outputPrice: number;
}

type Stage = 'select' | 'form' | 'results' | 'complete';

const GUEST_LIMIT = 3;

export function GuestSanityCheckContent() {
  const [stage, setStage] = useState<Stage>('select');
  const [models, setModels] = useState<PublicModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sanityCheck, setSanityCheck] = useState<SanityCheckWithDetails | null>(null);
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [recommendedModelId, setRecommendedModelId] = useState<string>('');
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [checksRemaining, setChecksRemaining] = useState<number>(GUEST_LIMIT);

  // Load models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const response = await fetch('/api/public/models');
        if (!response.ok) {
          throw new Error('Failed to load models');
        }
        const data = await response.json();
        setModels(data.models || []);
      } catch (err) {
        setError('Failed to load available models');
        console.error(err);
      } finally {
        setIsLoadingModels(false);
      }
    }

    loadModels();
  }, []);

  // Initialize guest session
  useEffect(() => {
    const token = getOrCreateGuestToken();
    setGuestSessionId(token);
    saveGuestToken(token);
  }, []);

  const currentModel = models.find((m) => m.id === currentModelId);
  const recommendedModel = models.find((m) => m.id === recommendedModelId);

  const handleCompare = () => {
    if (!currentModelId || !recommendedModelId) {
      setError('Please select both models to compare');
      return;
    }
    if (currentModelId === recommendedModelId) {
      setError('Please select different models to compare');
      return;
    }
    setError(null);
    setStage('form');
  };

  const handleRunSanityCheck = async (
    prompt: string,
    parameters?: SanityCheckParameters
  ) => {
    if (!guestSessionId) {
      setError('Session error. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Hash the token for secure storage
      const hashedSessionId = await hashToken(guestSessionId);

      const response = await fetch('/api/sanity-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentModelId,
          recommendedModelId,
          parameters,
          isGuest: true,
          guestSessionId: hashedSessionId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run sanity check');
      }

      const data = await response.json();
      setSanityCheck(data.sanityCheck);
      setChecksRemaining((prev) => Math.max(0, prev - 1));
      setStage('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run sanity check');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEvaluation = async (
    preference: UserPreference,
    notes?: string
  ) => {
    if (!sanityCheck || !guestSessionId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const hashedSessionId = await hashToken(guestSessionId);

      const response = await fetch(
        `/api/sanity-checks/${sanityCheck.id}?guest_session_id=${encodeURIComponent(hashedSessionId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preference, notes }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit evaluation');
      }

      const data = await response.json();
      setSanityCheck(data.sanityCheck);
      setStage('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evaluation');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunAnother = () => {
    if (checksRemaining <= 0) {
      setError('You have used all free sanity checks. Sign up for more!');
      return;
    }
    setSanityCheck(null);
    setStage('select');
  };

  const formatPrice = (price: number): string => {
    if (price === 0) return 'Free';
    if (price < 0.0001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-teal-100 p-3 dark:bg-teal-900">
            <Beaker className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Compare AI Models Side-by-Side
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Test how different AI models respond to your prompts. Compare quality, speed,
          and cost &mdash; all without signing up.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {checksRemaining} free {checksRemaining === 1 ? 'check' : 'checks'} remaining
          </Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stage: Select Models */}
      {stage === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Models to Compare</CardTitle>
            <CardDescription>
              Choose two AI models to see how they respond to the same prompt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingModels ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Model A */}
                  <div className="space-y-2">
                    <Label>Model A (Current)</Label>
                    <Select
                      value={currentModelId}
                      onValueChange={setCurrentModelId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem
                            key={model.id}
                            value={model.id}
                            disabled={model.id === recommendedModelId}
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{model.displayName}</span>
                              <span className="text-xs text-muted-foreground">
                                ({model.provider})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentModel && (
                      <ModelInfoCard model={currentModel} formatPrice={formatPrice} />
                    )}
                  </div>

                  {/* Model B */}
                  <div className="space-y-2">
                    <Label>Model B (Comparison)</Label>
                    <Select
                      value={recommendedModelId}
                      onValueChange={setRecommendedModelId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem
                            key={model.id}
                            value={model.id}
                            disabled={model.id === currentModelId}
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{model.displayName}</span>
                              <span className="text-xs text-muted-foreground">
                                ({model.provider})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {recommendedModel && (
                      <ModelInfoCard model={recommendedModel} formatPrice={formatPrice} />
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCompare}
                  disabled={!currentModelId || !recommendedModelId}
                  className="w-full"
                  size="lg"
                >
                  Compare These Models
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stage: Form */}
      {stage === 'form' && currentModel && recommendedModel && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Test Prompt</CardTitle>
            <CardDescription>
              Both models will respond to the same prompt so you can compare their outputs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SanityCheckForm
              currentModelId={currentModelId}
              currentModelName={currentModel.displayName}
              recommendedModelId={recommendedModelId}
              recommendedModelName={recommendedModel.displayName}
              isGuest={true}
              guestSessionId={guestSessionId || undefined}
              onSubmit={handleRunSanityCheck}
              isLoading={isLoading}
            />
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={() => setStage('select')}
                disabled={isLoading}
              >
                ← Change Models
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage: Results */}
      {stage === 'results' && sanityCheck && (
        <>
          <SanityCheckResults sanityCheck={sanityCheck} />
          <SanityCheckEvaluation
            sanityCheck={sanityCheck}
            onSubmit={handleSubmitEvaluation}
            isSubmitting={isSubmitting}
          />
        </>
      )}

      {/* Stage: Complete */}
      {stage === 'complete' && sanityCheck && (
        <>
          <SanityCheckResults sanityCheck={sanityCheck} />
          <SanityCheckEvaluation
            sanityCheck={sanityCheck}
            onSubmit={handleSubmitEvaluation}
            isSubmitting={false}
          />

          {/* CTA Card */}
          <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 dark:border-teal-900 dark:from-teal-950 dark:to-emerald-950">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold">
                {checksRemaining > 0
                  ? 'Ready to optimize your AI costs?'
                  : 'Want unlimited comparisons?'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {checksRemaining > 0
                  ? `Sign up for free to track your AI usage, get personalized recommendations, and save up to 40% on model costs.`
                  : `You've used all ${GUEST_LIMIT} free comparisons. Create an account to unlock more tests and start saving.`}
              </p>
              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                {checksRemaining > 0 && (
                  <Button variant="outline" onClick={handleRunAnother}>
                    Run Another Test ({checksRemaining} left)
                  </Button>
                )}
                <Link href="/signup">
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Features */}
      {stage === 'select' && (
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={Zap}
            title="Real-time Comparison"
            description="See how models respond to your actual prompts, not synthetic benchmarks."
          />
          <FeatureCard
            icon={Shield}
            title="Trust-First Recommendations"
            description="We consider provider reliability, not just marketing claims."
          />
          <FeatureCard
            icon={Sparkles}
            title="Cost Transparency"
            description="Know exactly what you'll pay before switching models."
          />
        </div>
      )}
    </div>
  );
}

function ModelInfoCard({
  model,
  formatPrice,
}: {
  model: PublicModel;
  formatPrice: (price: number) => string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Provider</span>
        <span className="font-medium">{model.provider}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-muted-foreground">Context</span>
        <span className="font-medium">{model.contextLength.toLocaleString()} tokens</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-muted-foreground">Input</span>
        <span className="font-medium">{formatPrice(model.inputPrice)}/1K tokens</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-muted-foreground">Output</span>
        <span className="font-medium">{formatPrice(model.outputPrice)}/1K tokens</span>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
          <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
