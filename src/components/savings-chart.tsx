'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';

interface HistoryDataPoint {
  month: string;
  monthLabel: string;
  savings: number;
  switches: number;
  cumulative: number;
}

interface SavingsChartProps {
  months?: number;
  showCumulative?: boolean;
}

export function SavingsChart({ months = 6, showCumulative = true }: SavingsChartProps) {
  const [data, setData] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/savings?view=history&months=${months}`);
        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }
        const result = await response.json();
        setData(result.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [months]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  const totalSavings = data.reduce((sum, d) => sum + d.savings, 0);
  const totalSwitches = data.reduce((sum, d) => sum + d.switches, 0);
  const lastCumulative = data[data.length - 1]?.cumulative || 0;

  // Format currency for tooltip
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Savings Over Time
            </CardTitle>
            <CardDescription>
              {showCumulative ? 'Cumulative' : 'Monthly'} savings from model optimizations
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(lastCumulative)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalSwitches} switches in {months} months
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalSavings === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No savings recorded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Implement an opportunity to start tracking savings
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {showCumulative ? (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as HistoryDataPoint;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{data.monthLabel}</p>
                            <p className="text-sm text-green-600">
                              Cumulative: {formatCurrency(data.cumulative)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              This month: {formatCurrency(data.savings)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {data.switches} switch{data.switches !== 1 ? 'es' : ''}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#savingsGradient)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as HistoryDataPoint;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{data.monthLabel}</p>
                            <p className="text-sm text-green-600">
                              Savings: {formatCurrency(data.savings)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {data.switches} switch{data.switches !== 1 ? 'es' : ''}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ fill: '#059669', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
