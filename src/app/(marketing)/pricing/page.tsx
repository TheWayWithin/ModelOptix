'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Sparkles } from 'lucide-react';
import { PricingToggle } from '@/components/pricing/pricing-toggle';
import { PricingCard } from '@/components/pricing/pricing-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { tierConfigs, type SubscriptionTier, type BillingInterval } from '@/lib/stripe';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interval, setInterval] = useState<BillingInterval>('annual');
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);

  const canceled = searchParams.get('canceled') === 'true';
  const error = searchParams.get('error');

  const handleSelectTier = async (tier: SubscriptionTier) => {
    setLoadingTier(tier);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in - redirect to signup with return URL
          router.push(`/signup?redirect=/pricing&tier=${tier}&interval=${interval}`);
          return;
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoadingTier(null);
    }
  };

  const handleStartTrial = async () => {
    setLoadingTier('solo');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'solo', interval: 'monthly', trial: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signup?redirect=/pricing&trial=true');
          return;
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Trial error:', err);
      alert(err instanceof Error ? err.message : 'Failed to start trial');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <>
      {/* Alerts */}
      {canceled && (
        <Alert className="mx-auto mt-8 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Checkout was canceled. No charges were made.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mx-auto mt-8 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error === 'payment_incomplete'
              ? 'Payment was not completed. Please try again.'
              : 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Billing Toggle */}
      <div className="mt-10">
        <PricingToggle interval={interval} onChange={setInterval} />
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        <PricingCard
          tier={tierConfigs.solo}
          interval={interval}
          onSelect={() => handleSelectTier('solo')}
          isLoading={loadingTier === 'solo'}
          disabled={loadingTier !== null}
        />

        <PricingCard
          tier={tierConfigs.growth}
          interval={interval}
          isPopular
          onSelect={() => handleSelectTier('growth')}
          isLoading={loadingTier === 'growth'}
          disabled={loadingTier !== null}
        />

        <PricingCard
          tier={tierConfigs.pro}
          interval={interval}
          onSelect={() => handleSelectTier('pro')}
          isLoading={loadingTier === 'pro'}
          disabled={loadingTier !== null}
        />
      </div>

      {/* Trial CTA */}
      <div className="mt-10 text-center">
        <p className="text-sm text-muted-foreground">
          Not sure yet?{' '}
          <button
            onClick={handleStartTrial}
            disabled={loadingTier !== null}
            className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            Try 7 days free
          </button>
          {' '}with full Solo features. Card required.
        </p>
      </div>
    </>
  );
}

function PricingContentFallback() {
  return (
    <>
      {/* Billing Toggle Skeleton */}
      <div className="mt-10 flex justify-center">
        <div className="h-10 w-48 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Pricing Cards Skeleton */}
      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-10 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
            <div className="mt-6 h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function PricingPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            10x Better. 10x Cheaper. 1000x Return.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Most users recover their annual subscription in week one. After that, it&apos;s pure profit.
          </p>
        </div>

        {/* Content with Suspense for useSearchParams */}
        <Suspense fallback={<PricingContentFallback />}>
          <PricingContent />
        </Suspense>

        {/* Enterprise CTA */}
        <div className="mx-auto mt-16 max-w-2xl rounded-lg border bg-muted/30 p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-4 text-xl font-semibold">Need Enterprise features?</h3>
          <p className="mt-2 text-muted-foreground">
            Multiple users, SSO/SAML, audit logs, dedicated success manager, custom SLA.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="mailto:hello@modeloptix.com?subject=Enterprise%20Inquiry">
              Contact Sales
            </Link>
          </Button>
        </div>

        {/* ROI Section */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center text-2xl font-bold">Week 1 Payback Guarantee</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-primary">Week 1</p>
              <p className="mt-1 text-sm text-muted-foreground">Subscription paid for</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-primary">Month 1</p>
              <p className="mt-1 text-sm text-muted-foreground">Multiple returns</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-primary">Year 1</p>
              <p className="mt-1 text-sm text-muted-foreground">1000x for many users</p>
            </div>
          </div>
          <p className="mt-6 text-center text-muted-foreground">
            ModelOptix isn&apos;t a cost. It&apos;s a margin multiplier.
          </p>
        </div>

        {/* Trust Elements */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> 20% off first year + money-back guarantee
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Independent: No investors, no conflicts
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Every recommendation shows its reasoning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
