'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, PenLine, ArrowRight, Sparkles } from 'lucide-react';
import { OpenRouterImport } from './openrouter-import';
import { QuickStartWizard } from './quick-start-wizard';

type OnboardingPath = 'choice' | 'openrouter' | 'manual';

export function OnboardingChoice() {
  const [path, setPath] = useState<OnboardingPath>('choice');

  if (path === 'openrouter') {
    return <OpenRouterImport onCancel={() => setPath('choice')} />;
  }

  if (path === 'manual') {
    return <QuickStartWizard />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to ModelOptix!</h1>
        <p className="text-muted-foreground">
          Let&apos;s set up your AI portfolio. Choose how you&apos;d like to get started.
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* OpenRouter Option */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors relative"
          onClick={() => setPath('openrouter')}
        >
          <Badge className="absolute top-3 right-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Recommended
          </Badge>
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Connect OpenRouter</CardTitle>
            <CardDescription>
              Import your existing AI usage and get instant recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Auto-detect models you&apos;re using
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Import usage patterns instantly
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Get recommendations in minutes
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Connect OpenRouter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Manual Option */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setPath('manual')}
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <PenLine className="w-5 h-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Set Up Manually</CardTitle>
            <CardDescription>
              Add your AI products and models step by step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span>•</span>
                Perfect if you&apos;re not using OpenRouter
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                Full control over your setup
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                Add models from any provider
              </li>
            </ul>
            <Button className="w-full" variant="outline">
              Set Up Manually
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom note */}
      <p className="text-xs text-center text-muted-foreground">
        Don&apos;t have an OpenRouter account?{' '}
        <a
          href="https://openrouter.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Create one for free
        </a>{' '}
        or set up manually.
      </p>
    </div>
  );
}
