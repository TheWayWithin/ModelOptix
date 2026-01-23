'use client';

import { useState } from 'react';
import { OpportunityFilters, OpportunityList } from '@/components/opportunities';
import type { OpportunityWithDetails } from '@/types/opportunity';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface UseCaseOption {
  id: string;
  name: string;
}

interface OpportunitiesContentProps {
  useCases: UseCaseOption[];
}

export function OpportunitiesContent({ useCases }: OpportunitiesContentProps) {
  const { toast } = useToast();
  const [dismissTarget, setDismissTarget] = useState<OpportunityWithDetails | null>(null);
  const [dismissing, setDismissing] = useState(false);

  // Handle dismiss request - show confirmation
  const handleDismissRequest = (opportunity: OpportunityWithDetails) => {
    setDismissTarget(opportunity);
  };

  // Confirm dismiss
  const confirmDismiss = async () => {
    if (!dismissTarget) return;

    setDismissing(true);

    try {
      const response = await fetch(`/api/opportunities/${dismissTarget.id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User dismissed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss opportunity');
      }

      toast({
        title: 'Opportunity dismissed',
        description: 'The opportunity has been dismissed and won\'t appear again.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to dismiss opportunity. Please try again.',
      });
    } finally {
      setDismissing(false);
      setDismissTarget(null);
    }
  };

  return (
    <>
      {/* Filters */}
      <OpportunityFilters useCases={useCases} />

      {/* Opportunity List */}
      <OpportunityList onDismiss={handleDismissRequest} />

      {/* Dismiss Confirmation Dialog */}
      <AlertDialog open={!!dismissTarget} onOpenChange={(open) => !open && setDismissTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Opportunity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the opportunity for &quot;{dismissTarget?.useCase.name}&quot;.
              You can view dismissed opportunities by changing the status filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dismissing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDismiss} disabled={dismissing}>
              {dismissing ? 'Dismissing...' : 'Dismiss'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
