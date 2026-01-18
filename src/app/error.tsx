'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Global Error Boundary
 *
 * Catches errors in the app tree and displays a recovery UI.
 * Next.js automatically wraps page content with this boundary.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        {/* Error Message */}
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred. Please try again or return to the
          homepage.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-lg bg-muted p-4 text-left">
            <p className="mb-2 text-sm font-medium text-destructive">
              Error Details:
            </p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Go home
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
