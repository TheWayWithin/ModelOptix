'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { OpportunityWithDetails, OpportunityEvidence } from '@/types/opportunity';
import {
  getOpportunityTypeLabel,
  getOpportunityTypeColor,
  getOpportunityStatusColor,
  formatImprovement,
  formatSavings,
} from '@/types/opportunity';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Zap,
  Star,
  Shield,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Scale,
  ExternalLink,
  Beaker,
} from 'lucide-react';

interface OpportunityDetailProps {
  opportunity: OpportunityWithDetails;
}

type FactorKey = 'cost' | 'speed' | 'quality' | 'trust' | 'context';

const factorIcons: Record<FactorKey, typeof DollarSign> = {
  cost: DollarSign,
  speed: Zap,
  quality: Star,
  trust: Shield,
  context: Layers,
};

const factorLabels: Record<FactorKey, string> = {
  cost: 'Cost Efficiency',
  speed: 'Speed',
  quality: 'Quality',
  trust: 'Trust & Reliability',
  context: 'Context Handling',
};

export function OpportunityDetail({ opportunity }: OpportunityDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const evidence = opportunity.evidence as OpportunityEvidence | null;
  const { useCase, currentModel, recommendedModel } = opportunity;

  const formatPrice = (price: number | null): string => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(4)}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculatePriceDiff = (
    current: number | null,
    recommended: number | null
  ): { diff: number; isLower: boolean } | null => {
    if (current === null || recommended === null || current === 0) return null;
    const diff = ((recommended - current) / current) * 100;
    return { diff, isLower: recommended < current };
  };

  const handleStatusUpdate = async (newStatus: string, reason?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      if (response.ok) {
        const data = await response.json();

        // Show appropriate toast based on action
        if (newStatus === 'accepted') {
          toast({
            title: 'Recommendation Accepted!',
            description: `Your use case now uses ${recommendedModel?.name || 'the recommended model'}. ${opportunity.estimatedMonthlySavings ? `Estimated savings: $${opportunity.estimatedMonthlySavings.toFixed(2)}/month` : ''}`,
          });
        } else if (newStatus === 'dismissed') {
          toast({
            title: 'Opportunity Dismissed',
            description: 'You can restore this from your opportunities list.',
          });
        } else {
          toast({
            title: 'Status Updated',
            description: data.message || `Opportunity marked as ${newStatus}`,
          });
        }

        router.refresh();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update opportunity status',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const inputPriceDiff = calculatePriceDiff(
    currentModel?.inputPrice ?? null,
    recommendedModel?.inputPrice ?? null
  );
  const outputPriceDiff = calculatePriceDiff(
    currentModel?.outputPrice ?? null,
    recommendedModel?.outputPrice ?? null
  );

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/opportunities">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Link>
      </Button>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl">{useCase.name}</CardTitle>
                <Badge className={getOpportunityStatusColor(opportunity.status)}>
                  {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
                </Badge>
                <Badge className={getOpportunityTypeColor(opportunity.opportunityType)}>
                  {getOpportunityTypeLabel(opportunity.opportunityType)}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {useCase.productName}
              </CardDescription>
            </div>

            {/* Improvement Display */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatImprovement(opportunity.improvementPercentage)}
              </span>
            </div>
          </div>
        </CardHeader>
        {opportunity.estimatedMonthlySavings && opportunity.estimatedMonthlySavings > 0 && (
          <CardContent className="pt-0">
            <p className="text-muted-foreground">
              Estimated savings: <span className="font-semibold text-emerald-600">
                {formatSavings(opportunity.estimatedMonthlySavings)}/month
              </span>
            </p>
          </CardContent>
        )}
      </Card>

      {/* Model Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Model */}
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Model</p>
                <CardTitle className="text-lg">
                  {currentModel?.name || 'Not Set'}
                </CardTitle>
              </div>
              {currentModel && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/models/${currentModel.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            <CardDescription>{currentModel?.providerName || 'N/A'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentModel ? (
              <>
                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Input / 1K tokens</p>
                    <p className="text-lg font-semibold">{formatPrice(currentModel.inputPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Output / 1K tokens</p>
                    <p className="text-lg font-semibold">{formatPrice(currentModel.outputPrice)}</p>
                  </div>
                </div>
                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Context</p>
                    <p className="font-medium">{currentModel.contextLength?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Latency</p>
                    <p className="font-medium">{currentModel.latencyP50 || 'N/A'} ms</p>
                  </div>
                </div>
                {/* FitScore */}
                {evidence?.currentModel && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">FitScore</p>
                      <span className="text-2xl font-bold text-muted-foreground">
                        {(evidence.currentModel.fitScore * 100).toFixed(0)}
                      </span>
                    </div>
                    <FactorScoreBar scores={evidence.currentModel.factorScores} variant="muted" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No current model assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Recommended Model */}
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Recommended</p>
                <CardTitle className="text-lg text-emerald-700 dark:text-emerald-300">
                  {recommendedModel?.name || 'Unknown'}
                </CardTitle>
              </div>
              {recommendedModel && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/models/${recommendedModel.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            <CardDescription>{recommendedModel?.providerName || 'N/A'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedModel ? (
              <>
                {/* Pricing with diff */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Input / 1K tokens</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{formatPrice(recommendedModel.inputPrice)}</p>
                      {inputPriceDiff && (
                        <Badge variant={inputPriceDiff.isLower ? 'default' : 'destructive'} className="text-xs">
                          {inputPriceDiff.isLower ? '' : '+'}{inputPriceDiff.diff.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Output / 1K tokens</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{formatPrice(recommendedModel.outputPrice)}</p>
                      {outputPriceDiff && (
                        <Badge variant={outputPriceDiff.isLower ? 'default' : 'destructive'} className="text-xs">
                          {outputPriceDiff.isLower ? '' : '+'}{outputPriceDiff.diff.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Context</p>
                    <p className="font-medium">{recommendedModel.contextLength?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Latency</p>
                    <p className="font-medium">{recommendedModel.latencyP50 || 'N/A'} ms</p>
                  </div>
                </div>
                {/* FitScore */}
                {evidence?.recommendedModel && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">FitScore</p>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {(evidence.recommendedModel.fitScore * 100).toFixed(0)}
                      </span>
                    </div>
                    <FactorScoreBar scores={evidence.recommendedModel.factorScores} variant="primary" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Model details unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Factor Comparison */}
      {evidence?.currentModel && evidence?.recommendedModel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Factor Score Comparison
            </CardTitle>
            <CardDescription>How the recommended model compares across evaluation factors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Object.keys(factorLabels) as FactorKey[]).map((factor) => {
                const currentScore = (evidence.currentModel?.factorScores[factor] ?? 0) * 100;
                const recommendedScore = (evidence.recommendedModel?.factorScores[factor] ?? 0) * 100;
                const diff = recommendedScore - currentScore;
                const Icon = factorIcons[factor];

                return (
                  <div key={factor} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{factorLabels[factor]}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground w-12 text-right">{currentScore.toFixed(0)}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold w-12">{recommendedScore.toFixed(0)}</span>
                        <Badge
                          variant={diff > 0 ? 'default' : diff < 0 ? 'destructive' : 'secondary'}
                          className="w-16 justify-center"
                        >
                          {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div
                        className="bg-muted rounded-l"
                        style={{ width: `${currentScore}%` }}
                      />
                      {diff !== 0 && (
                        <div
                          className={`rounded-r ${diff >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.abs(diff)}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reasons and Trade-offs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recommendation Reasons */}
        {evidence?.reasons && evidence.reasons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Why This Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {evidence.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{reason}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Trade-offs */}
        {opportunity.tradeOffs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Trade-offs to Consider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {opportunity.tradeOffs.map((tradeOff, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{tradeOff}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendation Reason (if no evidence reasons) */}
      {(!evidence?.reasons || evidence.reasons.length === 0) && opportunity.recommendationReason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommendation Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{opportunity.recommendationReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Timestamps */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Created: {formatDate(opportunity.createdAt)}</span>
              </div>
              {opportunity.expiresAt && (
                <div className="text-amber-600 dark:text-amber-400">
                  Expires: {formatDate(opportunity.expiresAt)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {opportunity.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate('dismissed')}
                    disabled={isUpdating}
                  >
                    Dismiss
                  </Button>
                  <Link href={`/opportunities/${opportunity.id}/sanity-check`}>
                    <Button variant="outline" size="sm">
                      <Beaker className="mr-2 h-4 w-4" />
                      Run Sanity Check
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={isUpdating}
                  >
                    Accept Recommendation
                  </Button>
                </>
              )}
              {opportunity.status === 'dismissed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('active')}
                  disabled={isUpdating}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Factor Score Bar Component
function FactorScoreBar({
  scores,
  variant = 'primary',
}: {
  scores: Record<FactorKey, number>;
  variant?: 'primary' | 'muted';
}) {
  const colorClass = variant === 'primary' ? 'bg-emerald-500' : 'bg-muted-foreground/50';

  return (
    <div className="space-y-2">
      {(Object.keys(factorLabels) as FactorKey[]).map((factor) => {
        const score = (scores[factor] ?? 0) * 100;
        const Icon = factorIcons[factor];

        return (
          <div key={factor} className="flex items-center gap-2">
            <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${colorClass} rounded-full transition-all`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">{score.toFixed(0)}</span>
          </div>
        );
      })}
    </div>
  );
}
