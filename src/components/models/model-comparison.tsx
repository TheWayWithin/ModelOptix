'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ModelWithProvider } from '@/types/model';
import {
  getTrustTierColor,
  getAvailabilityColor,
  formatPrice,
  formatContextLength,
  CAPABILITY_LABELS,
} from '@/types/model';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  X,
  Plus,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

const CAPABILITY_KEYS = [
  'supports_vision',
  'supports_function_calling',
  'supports_streaming',
  'supports_json_mode',
  'supports_system_prompt',
] as const;

const BENCHMARK_KEYS = [
  'quality_score',
  'speed_score',
  'mmlu',
  'humaneval',
  'gsm8k',
] as const;

interface ComparisonRowProps {
  label: string;
  values: (string | React.ReactNode)[];
  highlight?: 'lowest' | 'highest' | 'none';
}

function ComparisonRow({ label, values, highlight = 'none' }: ComparisonRowProps) {
  // Find best value for highlighting
  let bestIndex = -1;
  if (highlight !== 'none') {
    const numericValues = values.map(v => {
      if (typeof v === 'string') {
        const num = parseFloat(v.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? null : num;
      }
      return null;
    });

    const validValues = numericValues.filter(v => v !== null) as number[];
    if (validValues.length > 0) {
      const target = highlight === 'lowest' ? Math.min(...validValues) : Math.max(...validValues);
      bestIndex = numericValues.findIndex(v => v === target);
    }
  }

  return (
    <tr className="border-b">
      <td className="py-3 px-4 font-medium text-muted-foreground bg-muted/30 whitespace-nowrap">
        {label}
      </td>
      {values.map((value, index) => (
        <td
          key={index}
          className={`py-3 px-4 text-center ${
            bestIndex === index ? 'bg-green-50 dark:bg-green-900/20 font-medium' : ''
          }`}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

export function ModelComparison() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [models, setModels] = useState<ModelWithProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const modelIds = searchParams.get('models')?.split(',').filter(Boolean) || [];
  const modelIdsStr = modelIds.join(',');

  const fetchModels = useCallback(async () => {
    if (modelIds.length < 2) {
      setIsLoading(false);
      return { success: true, skipped: true };
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/models/compare?ids=${modelIdsStr}`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      setModels(data.models);
      return { success: true };
    } catch (error) {
      console.error('Error fetching models:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [modelIds.length, modelIdsStr]);

  useEffect(() => {
    let mounted = true;

    fetchModels().then((result) => {
      if (mounted && !result.success) {
        toast({
          title: 'Error',
          description: 'Failed to load models for comparison.',
          variant: 'destructive',
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [fetchModels, toast]);

  const removeModel = (modelId: string) => {
    const newIds = modelIds.filter(id => id !== modelId);
    if (newIds.length < 2) {
      router.push('/models');
    } else {
      router.push(`${pathname}?models=${newIds.join(',')}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (modelIds.length < 2) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/models">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Models
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No Models Selected</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Select at least 2 models from the catalog to compare them side by side.
            </p>
            <Button asChild>
              <Link href="/models">
                <Plus className="h-4 w-4 mr-2" />
                Browse Models
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/models">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Compare Models</h1>
        </div>
        {modelIds.length < 4 && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/models">
              <Plus className="h-4 w-4 mr-2" />
              Add Model
            </Link>
          </Button>
        )}
      </div>

      {/* Comparison Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-4 px-4 text-left font-medium text-muted-foreground w-48">
                  Property
                </th>
                {models.map((model) => (
                  <th key={model.id} className="py-4 px-4 text-center min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Badge className={getTrustTierColor(model.provider.trust_tier)}>
                          Tier {model.provider.trust_tier}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeModel(model.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="font-semibold">
                        <Link href={`/models/${model.id}`} className="hover:underline">
                          {model.display_name || model.name}
                        </Link>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {model.provider.name}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Availability */}
              <ComparisonRow
                label="Availability"
                values={models.map((m) =>
                  m.pricing?.availability ? (
                    <Badge key={m.id} className={getAvailabilityColor(m.pricing.availability)}>
                      {m.pricing.availability.charAt(0).toUpperCase() + m.pricing.availability.slice(1)}
                    </Badge>
                  ) : (
                    'N/A'
                  )
                )}
              />

              {/* Pricing Section */}
              <tr className="bg-muted/30">
                <td colSpan={models.length + 1} className="py-2 px-4 font-semibold text-sm">
                  Pricing (per 1K tokens)
                </td>
              </tr>
              <ComparisonRow
                label="Input Price"
                values={models.map((m) => formatPrice(m.pricing?.input_price ?? null))}
                highlight="lowest"
              />
              <ComparisonRow
                label="Output Price"
                values={models.map((m) => formatPrice(m.pricing?.output_price ?? null))}
                highlight="lowest"
              />
              <ComparisonRow
                label="Cached Input"
                values={models.map((m) => formatPrice(m.pricing?.cached_input_price ?? null))}
                highlight="lowest"
              />

              {/* Context & Limits Section */}
              <tr className="bg-muted/30">
                <td colSpan={models.length + 1} className="py-2 px-4 font-semibold text-sm">
                  Context & Limits
                </td>
              </tr>
              <ComparisonRow
                label="Context Length"
                values={models.map((m) => formatContextLength(m.context_length))}
                highlight="highest"
              />
              <ComparisonRow
                label="Max Output"
                values={models.map((m) =>
                  m.max_output_tokens ? formatContextLength(m.max_output_tokens) : 'N/A'
                )}
                highlight="highest"
              />

              {/* Latency Section */}
              <tr className="bg-muted/30">
                <td colSpan={models.length + 1} className="py-2 px-4 font-semibold text-sm">
                  Latency
                </td>
              </tr>
              <ComparisonRow
                label="P50 Latency"
                values={models.map((m) => (m.latency_p50 ? `${m.latency_p50}ms` : 'N/A'))}
                highlight="lowest"
              />
              <ComparisonRow
                label="P95 Latency"
                values={models.map((m) => (m.latency_p95 ? `${m.latency_p95}ms` : 'N/A'))}
                highlight="lowest"
              />

              {/* Capabilities Section */}
              <tr className="bg-muted/30">
                <td colSpan={models.length + 1} className="py-2 px-4 font-semibold text-sm">
                  Capabilities
                </td>
              </tr>
              {CAPABILITY_KEYS.map((key) => (
                <ComparisonRow
                  key={key}
                  label={CAPABILITY_LABELS[key] ?? key}
                  values={models.map((m) =>
                    m[key] ? (
                      <CheckCircle2 key={m.id} className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : (
                      <XCircle key={m.id} className="h-5 w-5 text-muted-foreground mx-auto" />
                    )
                  )}
                />
              ))}

              {/* Benchmarks Section */}
              <tr className="bg-muted/30">
                <td colSpan={models.length + 1} className="py-2 px-4 font-semibold text-sm">
                  Benchmarks
                </td>
              </tr>
              {BENCHMARK_KEYS.map((key) => (
                <ComparisonRow
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  values={models.map((m) =>
                    m.benchmarks?.[key] !== undefined
                      ? m.benchmarks[key]!.toFixed(2)
                      : 'N/A'
                  )}
                  highlight="highest"
                />
              ))}

              {/* Provider Section */}
              <tr className="bg-muted/30">
                <td colSpan={models.length + 1} className="py-2 px-4 font-semibold text-sm">
                  Provider Info
                </td>
              </tr>
              <ComparisonRow
                label="Provider"
                values={models.map((m) => m.provider.name)}
              />
              <ComparisonRow
                label="Trust Tier"
                values={models.map((m) => (
                  <Badge key={m.id} className={getTrustTierColor(m.provider.trust_tier)}>
                    Tier {m.provider.trust_tier}
                  </Badge>
                ))}
              />
              <ComparisonRow
                label="HQ Country"
                values={models.map((m) => m.provider.hq_country || 'N/A')}
              />
              <ComparisonRow
                label="Status"
                values={models.map((m) => (
                  <span key={m.id} className="capitalize">{m.provider.status}</span>
                ))}
              />
              <ComparisonRow
                label="Documentation"
                values={models.map((m) =>
                  m.provider.documentation_url ? (
                    <a
                      key={m.id}
                      href={m.provider.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    'N/A'
                  )
                )}
              />

              {/* API Reference */}
              <tr className="bg-muted/30">
                <td colSpan={models.length + 1} className="py-2 px-4 font-semibold text-sm">
                  API Reference
                </td>
              </tr>
              <ComparisonRow
                label="Model ID"
                values={models.map((m) => (
                  <code key={m.id} className="text-xs bg-muted px-2 py-1 rounded">
                    {m.openrouter_id}
                  </code>
                ))}
              />
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
