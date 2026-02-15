'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Info } from 'lucide-react';
import type {
  TrustOverviewResponse,
  TrustTier,
  ProviderWithTrust,
} from '@/types/trust';
import {
  getTrustTierColor,
  getTrustTierBgColor,
} from '@/types/trust';

export function TrustDashboardContent() {
  const [data, setData] = useState<TrustOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrustData() {
      try {
        const response = await fetch('/api/trust');
        if (!response.ok) {
          throw new Error('Failed to load trust data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadTrustData();
  }, []);

  if (isLoading) {
    return <TrustDashboardSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trust Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Independent trust assessments for AI model providers. Make informed decisions
          about which models to use in your applications.
        </p>
      </div>

      {/* Trust Philosophy Card */}
      <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 dark:border-teal-900 dark:from-teal-950/50 dark:to-emerald-950/50">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-teal-100 p-3 dark:bg-teal-900">
              <Shield className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold">Trust-First Philosophy</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                ModelOptix evaluates providers on data handling, transparency, security,
                compliance, reliability, and ethical AI practices. Our assessments are
                independent of marketing claims and pricing considerations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.tierStats.map((stat) => (
          <TierCard key={stat.tier} stat={stat} />
        ))}
      </div>

      {/* Provider Table */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Trust Tiers</CardTitle>
          <CardDescription>
            {data.providers.length} providers offering {data.totalModels} models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderTable providers={data.providers} />
        </CardContent>
      </Card>

      {/* Trust Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How We Evaluate Trust
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TrustFactorCard
              title="Data Handling"
              description="How providers handle, store, and process your data. We evaluate data retention policies, training data usage, and privacy controls."
            />
            <TrustFactorCard
              title="Transparency"
              description="Clarity about model capabilities, limitations, and training data. We look for honest documentation and clear communication."
            />
            <TrustFactorCard
              title="Security"
              description="Infrastructure security, encryption standards, and access controls. We verify security certifications and incident response."
            />
            <TrustFactorCard
              title="Compliance"
              description="Adherence to regulations like GDPR, SOC 2, HIPAA, and industry standards. We verify certifications and audit reports."
            />
            <TrustFactorCard
              title="Reliability"
              description="Uptime, consistency, and service level agreements. We track historical performance and incident handling."
            />
            <TrustFactorCard
              title="Ethics"
              description="Ethical AI practices, bias mitigation, and responsible development. We evaluate safety measures and content policies."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TierCard({ stat }: { stat: TrustOverviewResponse['tierStats'][0] }) {
  const Icon = getTierIcon(stat.tier);
  const bgColor = getTrustTierBgColor(stat.tier);
  const textColor = getTrustTierColor(stat.tier);

  return (
    <Card className={bgColor}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${textColor}`} />
          <div>
            <p className={`text-2xl font-bold ${textColor}`}>{stat.label}</p>
            <p className="text-sm text-muted-foreground">
              {stat.providerCount} {stat.providerCount === 1 ? 'provider' : 'providers'}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{stat.description}</p>
      </CardContent>
    </Card>
  );
}

function getTierIcon(tier: TrustTier) {
  const icons: Record<TrustTier, typeof Shield> = {
    A: ShieldCheck,
    B: Shield,
    C: ShieldAlert,
    unknown: ShieldQuestion,
  };
  return icons[tier];
}

function ProviderTable({ providers }: { providers: ProviderWithTrust[] }) {
  // Group by tier
  const byTier = providers.reduce(
    (acc, provider) => {
      const tier = provider.trustTier;
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(provider);
      return acc;
    },
    {} as Record<TrustTier, ProviderWithTrust[]>
  );

  // Sort order
  const tierOrder: TrustTier[] = ['A', 'B', 'C', 'unknown'];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Trust Tier</TableHead>
          <TableHead className="text-right">Models</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tierOrder.map((tier) =>
          (byTier[tier] || []).map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">{provider.name}</TableCell>
              <TableCell>
                <TierBadge tier={provider.trustTier} />
              </TableCell>
              <TableCell className="text-right">{provider.modelCount}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function TierBadge({ tier }: { tier: TrustTier }) {
  const variants: Record<TrustTier, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    A: 'default',
    B: 'secondary',
    C: 'destructive',
    unknown: 'outline',
  };

  const labels: Record<TrustTier, string> = {
    A: 'Tier A',
    B: 'Tier B',
    C: 'Tier C',
    unknown: 'Not Evaluated',
  };

  return (
    <Badge
      variant={variants[tier]}
      className={tier === 'A' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
    >
      {labels[tier]}
    </Badge>
  );
}

function TrustFactorCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TrustDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8" />
                <div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="mt-1 h-4 w-24" />
                </div>
              </div>
              <Skeleton className="mt-3 h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
