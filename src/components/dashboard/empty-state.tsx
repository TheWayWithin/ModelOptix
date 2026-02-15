'use client';

import { OnboardingChoice } from '@/components/quick-start';

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <OnboardingChoice />
    </div>
  );
}
