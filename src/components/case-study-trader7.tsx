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

// Case study data based on project-plan.md specifications
const caseStudyData = [
  {
    useCase: 'Strategy Analysis',
    currentModel: 'GPT-4o',
    recommendedModel: 'Claude 3.5 Sonnet',
    monthlySavings: 127,
    percentSaved: 32,
  },
  {
    useCase: 'Sentiment Analysis',
    currentModel: 'GPT-4 Turbo',
    recommendedModel: 'Llama 3.1 70B',
    monthlySavings: 89,
    percentSaved: 67,
  },
  {
    useCase: 'Signal Generator',
    currentModel: 'Claude 3 Opus',
    recommendedModel: 'GPT-4o mini',
    monthlySavings: 203,
    percentSaved: 71,
  },
  {
    useCase: 'Trade Validator',
    currentModel: 'GPT-4o',
    recommendedModel: 'Mistral Large',
    monthlySavings: 156,
    percentSaved: 84,
  },
  {
    useCase: 'Risk Management',
    currentModel: 'Claude 3 Opus',
    recommendedModel: 'Claude 3.5 Sonnet',
    monthlySavings: 94,
    percentSaved: 41,
  },
  {
    useCase: 'Execution',
    currentModel: 'GPT-4 Turbo',
    recommendedModel: 'GPT-4o mini',
    monthlySavings: 78,
    percentSaved: 52,
  },
];

const totalSavings = caseStudyData.reduce(
  (sum, item) => sum + item.monthlySavings,
  0
);

export function CaseStudyTrader7() {
  React.useEffect(() => {
    // Track case study view
    if (typeof window !== 'undefined') {
      const posthog = (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
      if (posthog?.capture) {
        posthog.capture('case_study_viewed', {
          case_study: 'trader7',
          total_savings: totalSavings,
        });
      }
    }
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto border border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <Badge variant="secondary" className="w-fit mx-auto mb-3">
          Case Study
        </Badge>
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
          How a Trading Platform Saves ${totalSavings}/month
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Trader7 optimized their AI stack across 6 use cases without sacrificing quality
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Use Case</TableHead>
                <TableHead className="w-[20%]">Before</TableHead>
                <TableHead className="w-[20%]">After</TableHead>
                <TableHead className="w-[20%] text-right">Monthly Savings</TableHead>
                <TableHead className="w-[15%] text-right">% Saved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caseStudyData.map((row) => (
                <TableRow key={row.useCase}>
                  <TableCell className="font-medium">{row.useCase}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.currentModel}
                  </TableCell>
                  <TableCell className="text-accent font-medium">
                    {row.recommendedModel}
                  </TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                    ${row.monthlySavings}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className="border-green-500/30 text-green-600 dark:text-green-400"
                    >
                      {row.percentSaved}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Total Monthly Savings
                </TableCell>
                <TableCell className="text-right text-green-600 dark:text-green-400 font-bold text-lg">
                  ${totalSavings}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className="bg-green-600 hover:bg-green-600">
                    40% avg
                  </Badge>
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
                <span className="font-medium text-foreground">
                  {row.useCase}
                </span>
                <Badge
                  variant="outline"
                  className="border-green-500/30 text-green-600 dark:text-green-400"
                >
                  -{row.percentSaved}%
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Before:</span>
                  <span className="text-muted-foreground">
                    {row.currentModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After:</span>
                  <span className="text-accent font-medium">
                    {row.recommendedModel}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Savings:</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    ${row.monthlySavings}/mo
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Mobile Total */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Total Savings</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${totalSavings}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Quality Note */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="font-medium text-foreground">
              Quality maintained:
            </span>
            <Badge variant="secondary" className="font-mono">
              96.2%
            </Badge>
            <span className="text-muted-foreground">
              average task success rate
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ModelOptix validates recommendations with automated testing before suggesting changes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
