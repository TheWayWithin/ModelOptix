'use client';

import { useEffect, useState } from 'react';
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
  DollarSign,
  TrendingUp,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { SavingsSummary } from '@/types/savings';

interface SavingsSummaryCardProps {
  compact?: boolean;
  showViewAll?: boolean;
}

export function SavingsSummaryCard({
  compact = false,
  showViewAll = true,
}: SavingsSummaryCardProps) {
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/savings?view=summary')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSummary(data.summary))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.total_switches === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No Savings Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Implement optimization opportunities to start tracking your savings
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/opportunities">
              View Opportunities
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Savings</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.monthly_savings)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Your Savings
            </CardTitle>
            <CardDescription>
              Total savings from implemented optimizations
            </CardDescription>
          </div>
          {summary.switches_this_month > 0 && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {summary.switches_this_month} this month
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Monthly Savings
            </p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(summary.monthly_savings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Optimizations
            </p>
            <p className="text-3xl font-bold">{summary.total_switches}</p>
          </div>
        </div>

        {summary.savings_by_product.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              By Product
            </p>
            <div className="space-y-2">
              {summary.savings_by_product.slice(0, 3).map((p) => (
                <div
                  key={p.product_id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate flex-1">{p.product_name}</span>
                  <span className="font-medium text-green-600 ml-2">
                    {formatCurrency(p.total_savings)}/mo
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showViewAll && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/savings">
                View All Savings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
