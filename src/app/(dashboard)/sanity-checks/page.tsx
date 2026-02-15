'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FlaskConical,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface SanityCheck {
  id: string;
  opportunity_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: 'pass' | 'fail' | 'inconclusive' | null;
  created_at: string;
  completed_at: string | null;
  opportunity?: {
    use_case_name?: string;
    current_model_name?: string;
    recommended_model_name?: string;
  };
}

export default function SanityChecksPage() {
  const [checks, setChecks] = useState<SanityCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sanity-checks')
      .then((r) => (r.ok ? r.json() : { checks: [] }))
      .then((data) => setChecks(data.checks || []))
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusIcon = (status: string, result: string | null) => {
    if (status === 'completed') {
      if (result === 'pass') {
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      } else if (result === 'fail') {
        return <XCircle className="h-5 w-5 text-red-500" />;
      }
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
    if (status === 'running') {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    if (status === 'failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    const variants: Record<string, string> = {
      pass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      fail: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      inconclusive: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return (
      <Badge className={variants[result] || ''}>
        {result.charAt(0).toUpperCase() + result.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sanity Checks</h1>
          <p className="text-muted-foreground">
            Test model recommendations before switching
          </p>
        </div>
        <Button asChild>
          <Link href="/opportunities">
            <Lightbulb className="h-4 w-4 mr-2" />
            View Opportunities
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check History</CardTitle>
          <CardDescription>
            All sanity checks run on model recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sanity checks yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Run a sanity check from any opportunity to test the recommended
                model before switching.
              </p>
              <Button asChild variant="outline">
                <Link href="/opportunities">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Opportunities
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Use Case</TableHead>
                  <TableHead>Model Comparison</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      {getStatusIcon(check.status, check.result)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {check.opportunity?.use_case_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {check.opportunity?.current_model_name || 'Current'}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium text-primary">
                          {check.opportunity?.recommended_model_name || 'Recommended'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getResultBadge(check.result)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(check.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/opportunities/${check.opportunity_id}/sanity-check`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
