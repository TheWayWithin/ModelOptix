'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, TrendingUp, X, Eye } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OpportunityWithDetails } from '@/types/opportunity';
import {
  getOpportunityTypeLabel,
  getOpportunityTypeColor,
  formatImprovement,
  formatSavings,
} from '@/types/opportunity';

interface OpportunityCardProps {
  opportunity: OpportunityWithDetails;
  onDismiss?: (opportunity: OpportunityWithDetails) => void;
}

export function OpportunityCard({ opportunity, onDismiss }: OpportunityCardProps) {
  const {
    useCase,
    currentModel,
    recommendedModel,
    opportunityType,
    improvementPercentage,
    estimatedMonthlySavings,
    recommendationReason,
    createdAt,
  } = opportunity;

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold truncate">
              <Link
                href={`/opportunities/${opportunity.id}`}
                className="hover:underline"
              >
                {useCase.name}
              </Link>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground truncate">
              {useCase.productName} / {useCase.functionName}
            </CardDescription>
          </div>
          <Badge className={getOpportunityTypeColor(opportunityType)}>
            {getOpportunityTypeLabel(opportunityType)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Improvement Badge - Prominent */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 px-3 py-2">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatImprovement(improvementPercentage)}
            </span>
          </div>
          {estimatedMonthlySavings && estimatedMonthlySavings > 0 && (
            <div className="text-sm text-muted-foreground">
              Save {formatSavings(estimatedMonthlySavings)}/mo
            </div>
          )}
        </div>

        {/* Model Comparison */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-1 min-w-0">
            <div className="text-muted-foreground text-xs mb-0.5">Current</div>
            <div className="font-medium truncate">
              {currentModel?.name || 'Not set'}
            </div>
            {currentModel && (
              <div className="text-xs text-muted-foreground truncate">
                {currentModel.providerName}
              </div>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-muted-foreground text-xs mb-0.5">Recommended</div>
            <div className="font-medium truncate text-emerald-600 dark:text-emerald-400">
              {recommendedModel?.name || 'Unknown'}
            </div>
            {recommendedModel && (
              <div className="text-xs text-muted-foreground truncate">
                {recommendedModel.providerName}
              </div>
            )}
          </div>
        </div>

        {/* Recommendation Reason */}
        {recommendationReason && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recommendationReason}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          <div className="flex gap-2">
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onDismiss(opportunity);
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/opportunities/${opportunity.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
