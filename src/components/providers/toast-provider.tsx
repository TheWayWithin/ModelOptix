'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Toast Provider Component
 *
 * Wraps the sonner Toaster with theme-aware styling.
 * Uses the current theme (light/dark) for toast appearance.
 *
 * @example
 * // Show a toast from anywhere in your app:
 * import { toast } from 'sonner';
 *
 * toast.success('Settings saved!');
 * toast.error('Failed to save');
 * toast.info('New update available');
 * toast.warning('Your session will expire soon');
 */
export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="bottom-right"
      toastOptions={{
        className: 'font-sans',
        duration: 4000,
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--card-foreground))',
        },
      }}
      closeButton
      richColors
    />
  );
}
