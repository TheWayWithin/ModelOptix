'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { TierConfig } from '@/lib/stripe';

interface PricingCardProps {
  tier: TierConfig;
  interval: 'monthly' | 'annual';
  isPopular?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PricingCard({
  tier,
  interval,
  isPopular = false,
  onSelect,
  isLoading = false,
  disabled = false,
}: PricingCardProps) {
  const price = interval === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  const originalAnnualTotal = tier.annualTotal;
  const discountedAnnualTotal = tier.firstYearDiscount;

  // Feature list based on tier
  const features = [
    `${tier.features.products === 'unlimited' ? 'Unlimited' : tier.features.products} products`,
    `${tier.features.sanityChecksPerMonth === 'unlimited' ? 'Unlimited' : tier.features.sanityChecksPerMonth} sanity checks/month`,
    `${tier.features.testHistory} test history`,
    tier.features.emailAlerts && 'Email alerts',
    tier.features.slackDiscord && 'Slack/Discord alerts',
    tier.features.webhooks && 'Webhooks',
    tier.features.customAlertRules && 'Custom alert rules',
    tier.features.apiAccess && 'API access',
    tier.features.roiDashboard && 'ROI dashboard',
    tier.features.support !== 'none' && `${tier.features.support.charAt(0).toUpperCase() + tier.features.support.slice(1)} support`,
  ].filter(Boolean) as string[];

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        isPopular && 'border-primary shadow-lg'
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            Best Value
          </span>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-xl">{tier.name}</CardTitle>
        <CardDescription className="text-sm">{tier.description}</CardDescription>

        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${price.toFixed(2)}</span>
            <span className="text-muted-foreground">/mo</span>
          </div>

          {interval === 'annual' && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="line-through">${originalAnnualTotal.toFixed(2)}</span>
                {' '}
                <span className="font-medium text-green-600 dark:text-green-400">
                  ${discountedAnnualTotal.toFixed(2)}/year
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                First year only, then ${originalAnnualTotal.toFixed(2)}/year
              </p>
            </div>
          )}

          {interval === 'monthly' && (
            <p className="mt-2 text-sm text-muted-foreground">
              Billed monthly
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          onClick={onSelect}
          disabled={disabled || isLoading}
        >
          {isLoading ? 'Loading...' : `Get ${tier.name}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
