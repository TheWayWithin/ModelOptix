'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Coins, Hash, AlertCircle } from 'lucide-react';
import type {
  SanityCheckWithDetails,
  SanityCheckModelResult,
  SanityCheckModelSummary,
} from '@/types/sanity-check';

interface SanityCheckResultsProps {
  sanityCheck: SanityCheckWithDetails;
}

export function SanityCheckResults({ sanityCheck }: SanityCheckResultsProps) {
  const { currentModel, recommendedModel, currentResult, recommendedResult, prompt } =
    sanityCheck;

  return (
    <div className="space-y-6">
      {/* Prompt Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Test Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{prompt}</p>
        </CardContent>
      </Card>

      {/* Side-by-Side Results */}
      <div className="grid gap-6 md:grid-cols-2">
        <ModelResultCard
          title="Current Model"
          model={currentModel}
          result={currentResult}
          variant="current"
        />
        <ModelResultCard
          title="Recommended Model"
          model={recommendedModel}
          result={recommendedResult}
          variant="recommended"
        />
      </div>

      {/* Comparison Metrics */}
      <ComparisonMetrics
        currentResult={currentResult}
        recommendedResult={recommendedResult}
      />
    </div>
  );
}

interface ModelResultCardProps {
  title: string;
  model: SanityCheckModelSummary | null;
  result: SanityCheckModelResult;
  variant: 'current' | 'recommended';
}

function ModelResultCard({ title, model, result, variant }: ModelResultCardProps) {
  const hasError = !!result.error || !result.response;
  const borderColor =
    variant === 'recommended'
      ? 'border-teal-200 dark:border-teal-900'
      : 'border-border';
  const headerBg =
    variant === 'recommended'
      ? 'bg-teal-50 dark:bg-teal-950'
      : 'bg-muted/30';

  return (
    <Card className={`overflow-hidden ${borderColor}`}>
      <CardHeader className={`pb-3 ${headerBg}`}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {model && (
              <p className="mt-1 text-sm text-muted-foreground">
                {model.name} ({model.providerName})
              </p>
            )}
          </div>
          {hasError && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Error
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Metrics Row */}
        {!hasError && (
          <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
            {result.latencyMs !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {(result.latencyMs / 1000).toFixed(2)}s
              </span>
            )}
            {result.tokensUsed !== null && (
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                {result.tokensUsed.toLocaleString()} tokens
              </span>
            )}
            {result.cost !== null && result.cost > 0 && (
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" />
                ${result.cost.toFixed(6)}
              </span>
            )}
          </div>
        )}

        {/* Response or Error */}
        {hasError ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {result.error || 'No response received'}
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto rounded-md bg-muted/30 p-4">
            <p className="whitespace-pre-wrap text-sm">{result.response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ComparisonMetricsProps {
  currentResult: SanityCheckModelResult;
  recommendedResult: SanityCheckModelResult;
}

function ComparisonMetrics({ currentResult, recommendedResult }: ComparisonMetricsProps) {
  // Only show comparison if both have valid results
  if (
    currentResult.error ||
    recommendedResult.error ||
    currentResult.latencyMs === null ||
    recommendedResult.latencyMs === null
  ) {
    return null;
  }

  const latencyDiff =
    currentResult.latencyMs - recommendedResult.latencyMs;
  const latencyPercent =
    currentResult.latencyMs > 0
      ? Math.round((latencyDiff / currentResult.latencyMs) * 100)
      : 0;

  const costDiff =
    (currentResult.cost ?? 0) - (recommendedResult.cost ?? 0);
  const costPercent =
    (currentResult.cost ?? 0) > 0
      ? Math.round((costDiff / (currentResult.cost ?? 1)) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Latency Comparison */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Response Time</div>
            <div className="flex items-baseline gap-2">
              {latencyDiff > 0 ? (
                <>
                  <span className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                    {latencyPercent}% faster
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({(latencyDiff / 1000).toFixed(2)}s saved)
                  </span>
                </>
              ) : latencyDiff < 0 ? (
                <>
                  <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {Math.abs(latencyPercent)}% slower
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({(Math.abs(latencyDiff) / 1000).toFixed(2)}s longer)
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  Same speed
                </span>
              )}
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Cost Per Request</div>
            <div className="flex items-baseline gap-2">
              {costDiff > 0 ? (
                <>
                  <span className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                    {costPercent}% cheaper
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (${costDiff.toFixed(6)} saved)
                  </span>
                </>
              ) : costDiff < 0 ? (
                <>
                  <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {Math.abs(costPercent)}% more expensive
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (+${Math.abs(costDiff).toFixed(6)})
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  Same cost
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
