'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Key,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react';
import type { ImportPreview, DetectedUsagePattern, CatalogModel } from '@/lib/openrouter/types';

interface OpenRouterImportProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type Step = 'key' | 'preview' | 'select' | 'importing' | 'success';

export function OpenRouterImport({ onComplete, onCancel }: OpenRouterImportProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('key');
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [productName, setProductName] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [importResult, setImportResult] = useState<{
    productId: string;
    useCasesCreated: number;
  } | null>(null);

  // Validate API key and get preview
  const handleValidate = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API key required',
        description: 'Please enter your OpenRouter API key.',
        variant: 'destructive',
      });
      return;
    }

    if (!apiKey.startsWith('sk-or-')) {
      toast({
        title: 'Invalid key format',
        description: 'OpenRouter API keys start with "sk-or-".',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);

    try {
      const res = await fetch('/api/portfolio/import?mode=preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to validate key');
      }

      setPreview(data.preview);
      setProductName(data.preview.suggestedProduct?.name || 'My AI Portfolio');

      // If no generation history, show model selection step
      if (data.preview.requiresSelection) {
        setStep('select');
      } else {
        setStep('preview');
      }
    } catch (error) {
      toast({
        title: 'Validation failed',
        description: error instanceof Error ? error.message : 'Failed to validate API key',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Import the portfolio
  const handleImport = async () => {
    // Validate selection if in selection mode
    if (preview?.requiresSelection && selectedModels.length === 0) {
      toast({
        title: 'No models selected',
        description: 'Please select at least one model to import.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setStep('importing');

    try {
      const res = await fetch('/api/portfolio/import?mode=import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          productName,
          selectedModels: preview?.requiresSelection ? selectedModels : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data.result);
      setStep('success');

      toast({
        title: 'Import successful!',
        description: `Created ${data.result.useCasesCreated} use cases from your OpenRouter data.`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import portfolio',
        variant: 'destructive',
      });
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else if (importResult?.productId) {
      router.push(`/products/${importResult.productId}`);
      router.refresh();
    } else {
      router.push('/products');
      router.refresh();
    }
  };

  // Step 1: API Key Input
  const KeyStep = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Key className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Connect OpenRouter</CardTitle>
        <CardDescription>
          Import your AI usage data to get personalized recommendations instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">OpenRouter API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Get your key at{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              openrouter.ai/keys
            </a>
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <span>Verifies your OpenRouter account is active</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <span>Your API key is never stored</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <span>Select models you use from our 300+ model catalog</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Set up manually
          </Button>
        ) : (
          <div />
        )}
        <Button onClick={handleValidate} disabled={isValidating || !apiKey.trim()}>
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              Connect
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardFooter>
    </>
  );

  // Toggle model selection
  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  // Group models by provider for display
  const groupedModels = preview?.catalogModels?.reduce(
    (acc, model) => {
      const provider = model.providers?.name || 'Other';
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, CatalogModel[]>
  ) || {};

  // Filter models by search
  const filterModels = (models: CatalogModel[]) => {
    if (!modelSearch.trim()) return models;
    const search = modelSearch.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        (m.providers?.name || '').toLowerCase().includes(search)
    );
  };

  // Step 2a: Model Selection (when no generation history)
  const SelectStep = () => {
    if (!preview) return null;

    return (
      <>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>API Key Verified!</CardTitle>
          <CardDescription>
            Select the models you commonly use. We&apos;ll create use cases for each.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search models..."
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
          />

          {/* Selected count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
            </span>
            {selectedModels.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModels([])}
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Models grouped by provider */}
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {Object.entries(groupedModels).map(([provider, models]) => {
              const filteredModels = filterModels(models);
              if (filteredModels.length === 0) return null;

              return (
                <div key={provider}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {provider}
                  </div>
                  <div className="space-y-1">
                    {filteredModels.map((model) => (
                      <label
                        key={model.id}
                        className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${
                          selectedModels.includes(model.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => toggleModel(model.id)}
                          className="rounded border-muted-foreground"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {model.name}
                          </div>
                          {model.context_length && (
                            <div className="text-xs text-muted-foreground">
                              {(model.context_length / 1000).toFixed(0)}K context
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Product name */}
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="product-name">Portfolio Name</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="My AI Portfolio"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep('key')}>
            Back
          </Button>
          <Button onClick={handleImport} disabled={selectedModels.length === 0}>
            <Zap className="w-4 h-4 mr-2" />
            Create {selectedModels.length} Use Case{selectedModels.length !== 1 ? 's' : ''}
          </Button>
        </CardFooter>
      </>
    );
  };

  // Step 2b: Preview (when generation history is available)
  const PreviewStep = () => {
    if (!preview) return null;

    const topModels = preview.modelsDetected.slice(0, 5);
    const hasMoreModels = preview.modelsDetected.length > 5;

    return (
      <>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Review Your AI Usage</CardTitle>
          <CardDescription>
            We detected {preview.modelsDetected.length} model{preview.modelsDetected.length !== 1 ? 's' : ''} in your OpenRouter history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{preview.modelsDetected.length}</div>
              <div className="text-xs text-muted-foreground">Models Used</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">
                {preview.modelsDetected.reduce((sum, m) => sum + m.totalCalls, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Requests</div>
            </div>
          </div>

          {/* Top models */}
          {topModels.length > 0 ? (
            <div className="space-y-2">
              <Label>Top Models</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {topModels.map((model, idx) => (
                  <ModelUsageCard key={model.modelId} model={model} rank={idx + 1} />
                ))}
                {hasMoreModels && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{preview.modelsDetected.length - 5} more models
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No usage data found. You can still create a portfolio manually.</p>
            </div>
          )}

          {/* Product name */}
          <div className="space-y-2">
            <Label htmlFor="product-name">Portfolio Name</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="My AI Portfolio"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep('key')}>
            Back
          </Button>
          <Button onClick={handleImport} disabled={preview.modelsDetected.length === 0}>
            <Zap className="w-4 h-4 mr-2" />
            Import {preview.modelsDetected.length > 0 ? preview.modelsDetected.slice(0, 10).length : 0} Use Cases
          </Button>
        </CardFooter>
      </>
    );
  };

  // Step 3: Importing
  const ImportingStep = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <CardTitle>Importing Your Data</CardTitle>
        <CardDescription>
          Creating your portfolio from OpenRouter usage data...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <ImportStep label="Analyzing usage patterns" done />
          <ImportStep label="Matching models to our catalog" done={isImporting} />
          <ImportStep label="Creating use cases" done={false} active={isImporting} />
          <ImportStep label="Generating recommendations" done={false} />
        </div>
      </CardContent>
      <CardFooter />
    </>
  );

  // Step 4: Success
  const SuccessStep = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle>Import Complete!</CardTitle>
        <CardDescription>
          Your AI portfolio is ready. We&apos;re analyzing your usage to find optimization opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm">Portfolio: {productName}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm">
              {importResult?.useCasesCreated} use cases imported
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Recommendations generating...</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleFinish}>
          View Portfolio
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </>
  );

  return (
    <Card className="w-full max-w-lg mx-auto">
      {step === 'key' && <KeyStep />}
      {step === 'select' && <SelectStep />}
      {step === 'preview' && <PreviewStep />}
      {step === 'importing' && <ImportingStep />}
      {step === 'success' && <SuccessStep />}
    </Card>
  );
}

// Helper component for model usage display
function ModelUsageCard({ model, rank }: { model: DetectedUsagePattern; rank: number }) {
  const formatCost = (cost: number) => {
    if (cost < 0.01) return '<$0.01';
    if (cost < 1) return `$${cost.toFixed(2)}`;
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="flex items-center justify-between p-2 bg-background rounded border">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
          {rank}
        </Badge>
        <div>
          <div className="font-medium text-sm truncate max-w-[180px]">{model.modelName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {model.totalCalls} calls
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatCost(model.totalCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for import progress
function ImportStep({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : active ? (
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-muted" />
      )}
      <span className={done ? 'text-muted-foreground' : active ? 'font-medium' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}
