'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Loader2, ThumbsUp, ThumbsDown, Equal, XCircle } from 'lucide-react';
import type { UserPreference, SanityCheckWithDetails } from '@/types/sanity-check';

interface SanityCheckEvaluationProps {
  sanityCheck: SanityCheckWithDetails;
  onSubmit: (preference: UserPreference, notes?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function SanityCheckEvaluation({
  sanityCheck,
  onSubmit,
  isSubmitting = false,
}: SanityCheckEvaluationProps) {
  const [preference, setPreference] = useState<UserPreference | null>(
    sanityCheck.userPreference
  );
  const [notes, setNotes] = useState(sanityCheck.userNotes || '');
  const [error, setError] = useState<string | null>(null);

  const hasEvaluated = sanityCheck.userPreference !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!preference) {
      setError('Please select which model performed better');
      return;
    }

    try {
      await onSubmit(preference, notes.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evaluation');
    }
  };

  const preferenceOptions = [
    {
      value: 'current' as const,
      label: 'Current Model',
      description: `${sanityCheck.currentModel?.name || 'Current'} performed better`,
      icon: ThumbsDown,
      iconClass: 'text-amber-500',
    },
    {
      value: 'recommended' as const,
      label: 'Recommended Model',
      description: `${sanityCheck.recommendedModel?.name || 'Recommended'} performed better`,
      icon: ThumbsUp,
      iconClass: 'text-teal-500',
    },
    {
      value: 'tie' as const,
      label: 'Both Equal',
      description: 'Both models performed similarly',
      icon: Equal,
      iconClass: 'text-blue-500',
    },
    {
      value: 'neither' as const,
      label: 'Neither',
      description: 'Neither model met expectations',
      icon: XCircle,
      iconClass: 'text-red-500',
    },
  ];

  if (hasEvaluated) {
    return (
      <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-base">Evaluation Submitted</CardTitle>
          </div>
          <CardDescription>
            Your feedback helps improve recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Your preference: </span>
              <span className="font-medium capitalize">
                {sanityCheck.userPreference === 'current'
                  ? `Current (${sanityCheck.currentModel?.name})`
                  : sanityCheck.userPreference === 'recommended'
                    ? `Recommended (${sanityCheck.recommendedModel?.name})`
                    : sanityCheck.userPreference}
              </span>
            </div>
            {sanityCheck.userNotes && (
              <div>
                <span className="text-sm text-muted-foreground">Notes: </span>
                <span className="text-sm">{sanityCheck.userNotes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evaluate the Results</CardTitle>
        <CardDescription>
          Which model performed better for this task? Your feedback improves future recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preference Selection */}
          <div className="space-y-3">
            <Label>Which model performed better?</Label>
            <RadioGroup
              value={preference || undefined}
              onValueChange={(value: string) => setPreference(value as UserPreference)}
              className="grid gap-3 sm:grid-cols-2"
              disabled={isSubmitting}
            >
              {preferenceOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      preference === option.value
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${option.iconClass}`} />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific observations about quality, accuracy, or relevance..."
              className="min-h-[80px] resize-y"
              disabled={isSubmitting}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !preference}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Evaluation'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
