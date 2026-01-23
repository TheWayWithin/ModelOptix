'use client';

import { useCallback, useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuotaStatus } from '@/lib/sanity-check/quota';

interface QuotaDisplayProps {
  guestSessionId?: string;
  className?: string;
  compact?: boolean;
  onUpgradeClick?: () => void;
}

interface QuotaResponse {
  isAuthenticated: boolean;
  isGuest?: boolean;
  status: QuotaStatus;
  rateLimit: {
    allowed: boolean;
    retryAfter: number;
  };
}

export function QuotaDisplay({
  guestSessionId,
  className,
  compact = false,
  onUpgradeClick,
}: QuotaDisplayProps) {
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    async function fetchQuota() {
      try {
        const params = new URLSearchParams();
        if (guestSessionId) {
          params.set('guestSessionId', guestSessionId);
        }
        const response = await fetch(`/api/sanity-checks/quota?${params}`);
        if (response.ok) {
          const data = await response.json();
          setQuota(data);
          if (!data.rateLimit.allowed && data.rateLimit.retryAfter > 0) {
            setRateLimitCountdown(data.rateLimit.retryAfter);
          }
        }
      } catch (error) {
        console.error('Failed to fetch quota:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuota();
  }, [guestSessionId]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;

    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          // Refresh quota status when countdown finishes
          setQuota((q) =>
            q
              ? {
                  ...q,
                  rateLimit: { allowed: true, retryAfter: 0 },
                }
              : q
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const { status, isAuthenticated } = quota;
  const usagePercent = status.limit > 0 ? (status.used / status.limit) * 100 : 0;
  const isWarning = usagePercent >= 80;
  const isExceeded = status.isExceeded;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge
          variant={isExceeded ? 'destructive' : isWarning ? 'secondary' : 'outline'}
          className="text-xs"
        >
          {status.remaining} / {status.limit} checks
        </Badge>
        {rateLimitCountdown > 0 && (
          <Badge variant="outline" className="text-xs">
            <Clock className="mr-1 h-3 w-3" />
            {rateLimitCountdown}s
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 rounded-lg border p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {isAuthenticated ? 'Monthly Quota' : 'Guest Quota'}
          </span>
        </div>
        <Badge
          variant={isExceeded ? 'destructive' : isWarning ? 'secondary' : 'outline'}
        >
          {status.remaining} remaining
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress
          value={usagePercent}
          className={cn(
            'h-2',
            isExceeded && '[&>div]:bg-destructive',
            isWarning && !isExceeded && '[&>div]:bg-yellow-500'
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {status.used} of {status.limit} checks used
          </span>
          {status.resetAt && (
            <span>
              Resets {new Date(status.resetAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {rateLimitCountdown > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            Wait {rateLimitCountdown}s before next check
          </span>
        </div>
      )}

      {isExceeded && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {isAuthenticated
                ? 'You\'ve reached your monthly limit. Upgrade for more checks.'
                : 'You\'ve used all 3 free checks. Sign up to continue!'}
            </span>
          </div>
          {onUpgradeClick && (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={onUpgradeClick}
            >
              {isAuthenticated ? 'Upgrade Plan' : 'Create Free Account'}
            </Button>
          )}
        </div>
      )}

      {isWarning && !isExceeded && (
        <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 p-2 text-sm text-yellow-700 dark:text-yellow-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Running low on checks. {status.remaining} remaining this month.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to check quota status and rate limiting.
 */
export function useQuotaStatus(guestSessionId?: string) {
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (guestSessionId) {
        params.set('guestSessionId', guestSessionId);
      }
      const response = await fetch(`/api/sanity-checks/quota?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQuota(data);
        setError(null);
      } else {
        setError('Failed to fetch quota');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [guestSessionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    quota,
    isLoading,
    error,
    refetch,
    canRunCheck: quota?.status.remaining ? quota.status.remaining > 0 : false,
    isRateLimited: quota?.rateLimit ? !quota.rateLimit.allowed : false,
    retryAfter: quota?.rateLimit?.retryAfter || 0,
  };
}
