'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ModelWithProvider } from '@/types/model';
import {
  getTrustTierColor,
  getAvailabilityColor,
  formatPrice,
  formatContextLength,
  CAPABILITY_LABELS,
} from '@/types/model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Brain,
  Zap,
  Clock,
  DollarSign,
  Shield,
  Eye,
  Settings2,
  Braces,
  MessageSquare,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';

interface ModelDetailProps {
  modelId: string;
}

const capabilityIcons: Record<string, React.ReactNode> = {
  supports_vision: <Eye className="h-4 w-4" />,
  supports_function_calling: <Settings2 className="h-4 w-4" />,
  supports_streaming: <Zap className="h-4 w-4" />,
  supports_json_mode: <Braces className="h-4 w-4" />,
  supports_system_prompt: <MessageSquare className="h-4 w-4" />,
};

export function ModelDetail({ modelId }: ModelDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [model, setModel] = useState<ModelWithProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchModel() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/models/${modelId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: 'Model not found',
              description: 'The requested model does not exist.',
              variant: 'destructive',
            });
            router.push('/models');
            return;
          }
          throw new Error('Failed to fetch model');
        }
        const data = await response.json();
        setModel(data.model);
      } catch (error) {
        console.error('Error fetching model:', error);
        toast({
          title: 'Error',
          description: 'Failed to load model details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchModel();
  }, [modelId, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!model) {
    return null;
  }

  const capabilities = Object.entries(CAPABILITY_LABELS).map(([key, label]) => ({
    key,
    label,
    supported: model[key as keyof typeof model] === true,
  }));

  const benchmarkEntries = model.benchmarks
    ? Object.entries(model.benchmarks).filter(([_, value]) => value !== undefined && value !== null)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={getTrustTierColor(model.provider.trust_tier)}>
              Tier {model.provider.trust_tier}
            </Badge>
            <Badge variant="outline">{model.provider.name}</Badge>
            {model.pricing?.availability && (
              <Badge className={getAvailabilityColor(model.pricing.availability)}>
                {model.pricing.availability.charAt(0).toUpperCase() + model.pricing.availability.slice(1)}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            {model.display_name || model.name}
          </h1>
          {model.description && (
            <p className="text-muted-foreground max-w-2xl">{model.description}</p>
          )}
        </div>
        {model.provider.documentation_url && (
          <Button variant="outline" asChild>
            <a href={model.provider.documentation_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Docs
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pricing Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              Pricing
            </CardTitle>
            <CardDescription>Per 1,000 tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Input</span>
                <span className="font-medium">{formatPrice(model.pricing?.input_price ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output</span>
                <span className="font-medium">{formatPrice(model.pricing?.output_price ?? null)}</span>
              </div>
              {model.pricing?.cached_input_price !== null && model.pricing?.cached_input_price !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cached Input</span>
                  <span className="font-medium">{formatPrice(model.pricing.cached_input_price)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Context & Limits Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-muted-foreground" />
              Context & Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Context Length</span>
                <span className="font-medium">{formatContextLength(model.context_length)} tokens</span>
              </div>
              {model.max_output_tokens && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Output</span>
                  <span className="font-medium">{formatContextLength(model.max_output_tokens)} tokens</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latency Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Latency
            </CardTitle>
            <CardDescription>Response time metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">P50</span>
                <span className="font-medium">
                  {model.latency_p50 ? `${model.latency_p50}ms` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">P95</span>
                <span className="font-medium">
                  {model.latency_p95 ? `${model.latency_p95}ms` : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-muted-foreground" />
              Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {capabilities.map(({ key, label, supported }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {capabilityIcons[key]}
                    <span className="text-sm">{label}</span>
                  </div>
                  {supported ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Provider Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{model.provider.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trust Tier</span>
                <Badge className={getTrustTierColor(model.provider.trust_tier)}>
                  Tier {model.provider.trust_tier}
                </Badge>
              </div>
              {model.provider.hq_country && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HQ</span>
                  <span className="font-medium">{model.provider.hq_country}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{model.provider.status}</span>
              </div>
              {model.provider.trust_tier_reason && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">{model.provider.trust_tier_reason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benchmarks Card */}
        {benchmarkEntries.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {benchmarkEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground text-sm capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium text-sm">
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Model ID for developers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">API Reference</CardTitle>
          <CardDescription>Use this identifier when calling the model via API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
              {model.openrouter_id}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(model.openrouter_id);
                toast({ title: 'Copied!', description: 'Model ID copied to clipboard.' });
              }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
