'use client'

import { QuickStartWizard } from '@/components/quick-start'
import { Sparkles } from 'lucide-react'

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to ModelOptix</h1>
        <p className="text-muted-foreground max-w-md">
          Get started by adding your first AI product. We&apos;ll help you track costs,
          find optimization opportunities, and ensure you&apos;re using the right models.
        </p>
      </div>
      <QuickStartWizard />
    </div>
  )
}
