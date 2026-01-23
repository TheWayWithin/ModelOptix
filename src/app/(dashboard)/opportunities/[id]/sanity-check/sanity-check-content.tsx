'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Beaker, CheckCircle } from 'lucide-react';
import {
  SanityCheckForm,
  SanityCheckResults,
  SanityCheckEvaluation,
} from '@/components/sanity-check';
import type { OpportunityWithDetails } from '@/types/opportunity';
import type {
  SanityCheckWithDetails,
  SanityCheckParameters,
  UserPreference,
} from '@/types/sanity-check';

interface SanityCheckContentProps {
  opportunity: OpportunityWithDetails;
  userId: string;
}

type Stage = 'form' | 'results' | 'complete';

export function SanityCheckContent({ opportunity, userId: _userId }: SanityCheckContentProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sanityCheck, setSanityCheck] = useState<SanityCheckWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentModel = opportunity.currentModel;
  const recommendedModel = opportunity.recommendedModel;

  if (!currentModel || !recommendedModel) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Model information not available for this opportunity.
          </p>
          <Link href={`/opportunities/${opportunity.id}`}>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Opportunity
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleRunSanityCheck = async (
    prompt: string,
    parameters?: SanityCheckParameters
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sanity-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentModelId: currentModel.id,
          recommendedModelId: recommendedModel.id,
          useCaseId: opportunity.useCaseId,
          parameters,
          isGuest: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run sanity check');
      }

      const data = await response.json();
      setSanityCheck(data.sanityCheck);
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
    if (!sanityCheck) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sanity-checks/${sanityCheck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preference, notes }),
      });

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

  const handleAcceptRecommendation = async () => {
    // Navigate back to opportunity detail to accept
    router.push(`/opportunities/${opportunity.id}?action=accept`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunity
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Sanity Check</h1>
          <p className="text-muted-foreground">
            Compare model responses side-by-side before accepting this recommendation
          </p>
        </div>
        <Beaker className="h-8 w-8 text-teal-600" />
      </div>

      {/* Context Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Testing For
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{opportunity.useCase?.name || 'Use Case'}</p>
              <p className="text-sm text-muted-foreground">
                {opportunity.useCase?.functionName} &bull; {opportunity.useCase?.productName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Potential Improvement</p>
              <p className="text-lg font-semibold text-teal-600">
                {opportunity.improvementPercentage
                  ? `${opportunity.improvementPercentage.toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && stage === 'form' && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stage: Form */}
      {stage === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle>Run a Test</CardTitle>
            <CardDescription>
              Enter a prompt that represents a typical task for this use case. Both models
              will respond to the same prompt so you can compare quality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SanityCheckForm
              currentModelId={currentModel.id}
              currentModelName={currentModel.name}
              recommendedModelId={recommendedModel.id}
              recommendedModelName={recommendedModel.name}
              useCaseId={opportunity.useCaseId}
              suggestedPrompt={undefined}
              onSubmit={handleRunSanityCheck}
              isLoading={isLoading}
            />
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

          {/* Next Steps Card */}
          <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-teal-600" />
                <CardTitle className="text-base">Sanity Check Complete</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {sanityCheck.userPreference === 'recommended'
                  ? 'Great! The recommended model performed better. Ready to make the switch?'
                  : sanityCheck.userPreference === 'current'
                    ? "The current model performed better for this test. You may want to try different prompts or keep your current setup."
                    : sanityCheck.userPreference === 'tie'
                      ? 'Both models performed similarly. Consider the cost savings when making your decision.'
                      : 'Neither model met expectations. Consider adjusting your use case requirements.'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {sanityCheck.userPreference === 'recommended' && (
                  <Button onClick={handleAcceptRecommendation}>
                    Accept Recommendation
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSanityCheck(null);
                    setStage('form');
                  }}
                >
                  Run Another Test
                </Button>
                <Link href={`/opportunities/${opportunity.id}`}>
                  <Button variant="ghost">Back to Opportunity</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
