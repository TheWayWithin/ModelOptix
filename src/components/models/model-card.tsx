'use client';

import type { ModelWithProvider } from '@/types/model';
import { getTrustTierColor, getAvailabilityColor, formatPrice, formatContextLength, CAPABILITY_LABELS } from '@/types/model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Zap, Brain, MessageSquare, Braces, Settings2, GitCompareArrows } from 'lucide-react';
import Link from 'next/link';

interface ModelCardProps {
  model: ModelWithProvider;
  isSelected?: boolean;
  onSelectChange?: (modelId: string, selected: boolean) => void;
  showCompareCheckbox?: boolean;
}

const capabilityIcons: Record<string, React.ReactNode> = {
  supports_vision: <Eye className="h-3 w-3" />,
  supports_function_calling: <Settings2 className="h-3 w-3" />,
  supports_streaming: <Zap className="h-3 w-3" />,
  supports_json_mode: <Braces className="h-3 w-3" />,
  supports_system_prompt: <MessageSquare className="h-3 w-3" />,
};

export function ModelCard({ model, isSelected = false, onSelectChange, showCompareCheckbox = true }: ModelCardProps) {
  const capabilities = Object.entries(CAPABILITY_LABELS).filter(
    ([key]) => model[key as keyof typeof model] === true
  );

  return (
    <Card className={`group relative transition-shadow hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getTrustTierColor(model.provider.trust_tier)}>
                Tier {model.provider.trust_tier}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {model.provider.name}
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold truncate">
              <Link
                href={`/models/${model.id}`}
                className="hover:underline"
              >
                {model.display_name || model.name}
              </Link>
            </CardTitle>
            {model.description && (
              <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                {model.description}
              </CardDescription>
            )}
          </div>
          {showCompareCheckbox && onSelectChange && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`compare-${model.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onSelectChange(model.id, checked === true)}
              />
              <label
                htmlFor={`compare-${model.id}`}
                className="text-xs text-muted-foreground cursor-pointer"
              >
                <GitCompareArrows className="h-4 w-4" />
              </label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Input</p>
              <p className="font-medium">{formatPrice(model.pricing?.input_price ?? null)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Output</p>
              <p className="font-medium">{formatPrice(model.pricing?.output_price ?? null)}</p>
            </div>
          </div>

          {/* Context & Availability */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span>{formatContextLength(model.context_length)} context</span>
            </div>
            {model.pricing?.availability && (
              <Badge className={getAvailabilityColor(model.pricing.availability)}>
                {model.pricing.availability.charAt(0).toUpperCase() + model.pricing.availability.slice(1)}
              </Badge>
            )}
          </div>

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {capabilities.map(([key, label]) => (
                <Badge key={key} variant="secondary" className="text-xs gap-1">
                  {capabilityIcons[key]}
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Benchmarks (if available) */}
          {model.benchmarks?.quality_score && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quality Score</span>
                <span className="font-medium">{model.benchmarks.quality_score.toFixed(1)}</span>
              </div>
              {model.benchmarks.speed_score && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Speed Score</span>
                  <span className="font-medium">{model.benchmarks.speed_score.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action */}
          <Button asChild variant="outline" className="w-full mt-2">
            <Link href={`/models/${model.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
