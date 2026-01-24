'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  TrustDimension,
  TRUST_DIMENSIONS,
  getDimensionLabel,
  getDimensionDescription,
  ModelTrustScoreRecord,
  TrustConfidence,
  getConfidenceLevel,
  getConfidenceValue,
} from '@/types/trust';

interface DimensionScore {
  score: number | null;
  confidence: TrustConfidence;
  evidence: string;
  source_url: string;
  notes: string;
}

interface TrustScoreEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
  modelName: string;
  providerName: string;
  onSaved?: () => void;
}

const DEFAULT_SCORE: DimensionScore = {
  score: null,
  confidence: 'medium',
  evidence: '',
  source_url: '',
  notes: '',
};

export function TrustScoreEditor({
  open,
  onOpenChange,
  modelId,
  modelName,
  providerName,
  onSaved,
}: TrustScoreEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<TrustDimension, DimensionScore>>(() => {
    const initial: Record<string, DimensionScore> = {};
    TRUST_DIMENSIONS.forEach((dim) => {
      initial[dim] = { ...DEFAULT_SCORE };
    });
    return initial as Record<TrustDimension, DimensionScore>;
  });

  // Load existing scores when modal opens
  useEffect(() => {
    if (open && modelId) {
      loadScores();
    }
  }, [open, modelId]);

  const loadScores = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/trust/${modelId}`);
      if (!res.ok) throw new Error('Failed to load trust scores');

      const data = await res.json();
      const existingScores = data.scores as ModelTrustScoreRecord[];

      // Map existing scores to state
      const newScores: Record<string, DimensionScore> = {};
      TRUST_DIMENSIONS.forEach((dim) => {
        const existing = existingScores.find((s) => s.dimension === dim);
        if (existing) {
          newScores[dim] = {
            score: existing.score,
            confidence: getConfidenceLevel(existing.confidence),
            evidence: existing.evidence || '',
            source_url: existing.source_url || '',
            notes: existing.notes || '',
          };
        } else {
          newScores[dim] = { ...DEFAULT_SCORE };
        }
      });

      setScores(newScores as Record<TrustDimension, DimensionScore>);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (dimension: TrustDimension, value: number[]) => {
    setScores((prev) => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        score: value[0],
      },
    }));
  };

  const handleFieldChange = (
    dimension: TrustDimension,
    field: keyof DimensionScore,
    value: string | number | null
  ) => {
    setScores((prev) => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        [field]: value,
      },
    }));
  };

  const clearScore = (dimension: TrustDimension) => {
    setScores((prev) => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        score: null,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Convert to API format
      const scoresToSave = TRUST_DIMENSIONS.map((dimension) => ({
        dimension,
        score: scores[dimension].score,
        confidence: getConfidenceValue(scores[dimension].confidence),
        evidence: scores[dimension].evidence || null,
        source_url: scores[dimension].source_url || null,
        notes: scores[dimension].notes || null,
      }));

      const res = await fetch(`/api/admin/trust/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoresToSave }),
      });

      if (!res.ok) throw new Error('Failed to save trust scores');

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scores');
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = TRUST_DIMENSIONS.filter(
    (dim) => scores[dim].score !== null
  ).length;

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-500';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Trust Scores
            <Badge variant="outline" className="ml-2">
              {completedCount}/{TRUST_DIMENSIONS.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{modelName}</span>
            <span className="text-muted-foreground"> by {providerName}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive py-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadScores}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <Accordion type="single" collapsible className="w-full">
              {TRUST_DIMENSIONS.map((dimension) => (
                <AccordionItem key={dimension} value={dimension}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 w-full pr-4">
                      <span className="font-medium">
                        {getDimensionLabel(dimension)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getScoreBadgeColor(scores[dimension].score)}
                      >
                        {scores[dimension].score !== null ? (
                          <>
                            {scores[dimension].score}
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                          </>
                        ) : (
                          'Not Set'
                        )}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-sm text-muted-foreground">
                        {getDimensionDescription(dimension)}
                      </p>

                      {/* Score Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Score (0-100)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium w-8 text-right">
                              {scores[dimension].score ?? '-'}
                            </span>
                            {scores[dimension].score !== null && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => clearScore(dimension)}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                        <Slider
                          value={[scores[dimension].score ?? 50]}
                          onValueChange={(value) =>
                            handleScoreChange(dimension, value)
                          }
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Poor (0)</span>
                          <span>Good (50)</span>
                          <span>Excellent (100)</span>
                        </div>
                      </div>

                      {/* Confidence */}
                      <div className="space-y-2">
                        <Label>Confidence Level</Label>
                        <Select
                          value={scores[dimension].confidence}
                          onValueChange={(value: TrustConfidence) =>
                            handleFieldChange(dimension, 'confidence', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select confidence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              Low - Limited data or uncertain
                            </SelectItem>
                            <SelectItem value="medium">
                              Medium - Reasonable evidence
                            </SelectItem>
                            <SelectItem value="high">
                              High - Strong evidence, verified
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Evidence */}
                      <div className="space-y-2">
                        <Label>Evidence</Label>
                        <Textarea
                          value={scores[dimension].evidence}
                          onChange={(e) =>
                            handleFieldChange(
                              dimension,
                              'evidence',
                              e.target.value
                            )
                          }
                          placeholder="Describe the evidence supporting this score..."
                          rows={2}
                        />
                      </div>

                      {/* Source URL */}
                      <div className="space-y-2">
                        <Label>Source URL</Label>
                        <Input
                          type="url"
                          value={scores[dimension].source_url}
                          onChange={(e) =>
                            handleFieldChange(
                              dimension,
                              'source_url',
                              e.target.value
                            )
                          }
                          placeholder="https://..."
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={scores[dimension].notes}
                          onChange={(e) =>
                            handleFieldChange(dimension, 'notes', e.target.value)
                          }
                          placeholder="Additional notes for internal reference..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save All Scores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
