'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Case study data - GPT-4 baseline optimized for each use case
// Key insight: Right-size models to tasks - sometimes pay MORE for critical tasks,
// use specialized models for high-volume tasks
const caseStudyData = [
  {
    useCase: 'Strategy Analysis',
    baseline: 'GPT-4',
    optimizedModel: 'Claude Opus 4.5',
    performanceGain: 18,
    performanceNote: 'reasoning quality',
    costChange: 47, // positive = costs more
    priority: 'critical',
  },
  {
    useCase: 'Sentiment Analysis',
    baseline: 'GPT-4',
    optimizedModel: 'Gemini 1.5 Pro',
    performanceGain: 22,
    performanceNote: 'data processing',
    costChange: -89, // negative = saves money
    priority: 'high-volume',
  },
  {
    useCase: 'Signal Generator',
    baseline: 'GPT-4',
    optimizedModel: 'DeepSeek V3',
    performanceGain: 15,
    performanceNote: 'pattern recognition',
    costChange: -156,
    priority: 'high-volume',
  },
  {
    useCase: 'Trade Validator',
    baseline: 'GPT-4',
    optimizedModel: 'Gemini 1.5 Flash',
    performanceGain: 20,
    performanceNote: 'throughput',
    costChange: -134,
    priority: 'high-volume',
  },
  {
    useCase: 'Risk Management',
    baseline: 'GPT-4',
    optimizedModel: 'Claude Opus 4.5',
    performanceGain: 25,
    performanceNote: 'scenario analysis',
    costChange: 31,
    priority: 'critical',
  },
  {
    useCase: 'Execution',
    baseline: 'GPT-4',
    optimizedModel: 'Claude 3.5 Sonnet',
    performanceGain: 12,
    performanceNote: 'accuracy',
    costChange: -78,
    priority: 'balanced',
  },
];

// Calculate totals
const totalCostChange = caseStudyData.reduce(
  (sum, item) => sum + item.costChange,
  0
);
const avgPerformanceGain = Math.round(
  caseStudyData.reduce((sum, item) => sum + item.performanceGain, 0) /
    caseStudyData.length
);
const netSavings = Math.abs(totalCostChange);

export function CaseStudyTrader7() {
  React.useEffect(() => {
    // Track case study view
    if (typeof window !== 'undefined') {
      const posthog = (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
      if (posthog?.capture) {
        posthog.capture('case_study_viewed', {
          case_study: 'trader7',
          net_savings: netSavings,
          avg_performance_gain: avgPerformanceGain,
        });
      }
    }
  }, []);

  const formatCost = (cost: number) => {
    if (cost > 0) return `+$${cost}`;
    if (cost < 0) return `-$${Math.abs(cost)}`;
    return '$0';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <Badge variant="secondary" className="w-fit mx-auto mb-3">
          Case Study
        </Badge>
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
          How a Trading Platform Optimized Their AI Stack
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Trader7 moved from GPT-4 everywhere to task-optimized models — investing more in critical tasks, saving on high-volume operations
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Key Insight Banner */}
        <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-sm text-center text-foreground">
            <span className="font-semibold">Key insight:</span> For trading, performance often matters more than cost.
            We recommend <span className="text-accent font-medium">investing in top models for critical decisions</span> while
            using <span className="text-accent font-medium">specialized models for high-volume tasks</span>.
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Use Case</TableHead>
                <TableHead className="w-[15%]">Baseline</TableHead>
                <TableHead className="w-[20%]">Optimized</TableHead>
                <TableHead className="w-[25%] text-center">Performance</TableHead>
                <TableHead className="w-[20%] text-right">Cost/mo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caseStudyData.map((row) => (
                <TableRow key={row.useCase}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{row.useCase}</span>
                      {row.priority === 'critical' && (
                        <Badge variant="outline" className="w-fit text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                          Critical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.baseline}
                  </TableCell>
                  <TableCell className="text-accent font-medium">
                    {row.optimizedModel}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge className="bg-green-600 hover:bg-green-600">
                        +{row.performanceGain}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {row.performanceNote}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={row.costChange > 0
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-green-600 dark:text-green-400 font-semibold'}>
                      {formatCost(row.costChange)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Net Result
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-600 hover:bg-green-600 text-base px-3 py-1">
                    +{avgPerformanceGain}% avg
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-green-600 dark:text-green-400 font-bold text-lg">
                  -${netSavings}/mo
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3">
          {caseStudyData.map((row) => (
            <div
              key={row.useCase}
              className="p-4 rounded-lg border border-border/50 bg-muted/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {row.useCase}
                  </span>
                  {row.priority === 'critical' && (
                    <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Critical
                    </Badge>
                  )}
                </div>
                <Badge className="bg-green-600 hover:bg-green-600">
                  +{row.performanceGain}%
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Before:</span>
                  <span className="text-muted-foreground">
                    {row.baseline}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After:</span>
                  <span className="text-accent font-medium">
                    {row.optimizedModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Improves:</span>
                  <span className="text-foreground">
                    {row.performanceNote}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className={row.costChange > 0
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-green-600 dark:text-green-400 font-semibold'}>
                    {formatCost(row.costChange)}/mo
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Mobile Total */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-foreground">Net Result</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Performance</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  +{avgPerformanceGain}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  -${netSavings}/mo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Critical Tasks</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Invested +$78/mo for +21% better decisions
            </p>
          </div>

          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">High-Volume Tasks</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Saved $457/mo with +19% better performance
            </p>
          </div>

          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-accent">Quality Maintained</span>
            </div>
            <p className="text-xs text-muted-foreground">
              97.8% task success rate
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          ModelOptix validates recommendations with automated testing before suggesting changes.
          Critical task investments are flagged for your review.
        </p>
      </CardContent>
    </Card>
  );
}
