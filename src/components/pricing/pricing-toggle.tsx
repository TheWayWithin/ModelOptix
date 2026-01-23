'use client';

import { cn } from '@/lib/utils';

interface PricingToggleProps {
  interval: 'monthly' | 'annual';
  onChange: (interval: 'monthly' | 'annual') => void;
}

export function PricingToggle({ interval, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange('monthly')}
        className={cn(
          'text-sm font-medium transition-colors',
          interval === 'monthly'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Monthly
      </button>

      <button
        onClick={() => onChange(interval === 'monthly' ? 'annual' : 'monthly')}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          interval === 'annual' ? 'bg-primary' : 'bg-muted'
        )}
        aria-label="Toggle billing interval"
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
            interval === 'annual' ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('annual')}
          className={cn(
            'text-sm font-medium transition-colors',
            interval === 'annual'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Annual
        </button>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          20% off first year
        </span>
      </div>
    </div>
  );
}
