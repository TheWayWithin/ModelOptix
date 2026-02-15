'use client';

import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  ArrowRight,
  Loader2,
  Download,
  Filter,
} from 'lucide-react';
import { SavingsSummary, SavingsRecordWithContext } from '@/types/savings';

export default function SavingsPage() {
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [records, setRecords] = useState<SavingsRecordWithContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>(
    []
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/savings?view=summary').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/api/savings?view=records').then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([summaryData, recordsData]) => {
        if (summaryData?.summary) {
          setSummary(summaryData.summary);
          setProducts(
            summaryData.summary.savings_by_product?.map(
              (p: { product_id: string; product_name: string }) => ({
                id: p.product_id,
                name: p.product_name,
              })
            ) || []
          );
        }
        if (recordsData?.records) {
          setRecords(recordsData.records);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const filteredRecords =
    selectedProduct === 'all'
      ? records
      : records.filter((r) => r.product_id === selectedProduct);

  const handleExport = () => {
    const csv = [
      ['Date', 'Product', 'Function', 'Old Model', 'New Model', 'Monthly Savings'].join(','),
      ...filteredRecords.map((r) =>
        [
          formatDate(r.switched_at),
          r.product_name || 'N/A',
          r.function_name || 'N/A',
          `${r.old_provider}/${r.old_model}`,
          `${r.new_provider}/${r.new_model}`,
          r.monthly_savings,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `savings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <h1 className="text-3xl font-bold tracking-tight">Savings</h1>
          <p className="text-muted-foreground">
            Track your cost savings from implemented optimizations
          </p>
        </div>
        {records.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.monthly_savings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">recurring per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.savings_this_month || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              from {summary?.switches_this_month || 0} new optimizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Optimizations
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_switches || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              model switches implemented
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products Optimized
            </CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.savings_by_product?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">products with savings</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Savings History</CardTitle>
              <CardDescription>
                All implemented optimization switches
              </CardDescription>
            </div>
            {products.length > 0 && (
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No savings recorded yet
              </h3>
              <p className="text-muted-foreground max-w-md">
                Implement optimization opportunities to start tracking savings.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product / Function</TableHead>
                  <TableHead>Model Switch</TableHead>
                  <TableHead className="text-right">Monthly Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {formatDate(r.switched_at)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {r.product_name || 'Unknown'}
                        </p>
                        {r.function_name && (
                          <p className="text-sm text-muted-foreground">
                            {r.function_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {r.old_provider}/{r.old_model}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium text-primary">
                          {r.new_provider}/{r.new_model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(r.monthly_savings)}
                      </span>
                      {r.savings_percentage && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          {r.savings_percentage.toFixed(1)}%
                        </Badge>
                      )}
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
