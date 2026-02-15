'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Shield,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { TrustQueueItem } from '@/types/trust';
import { TrustScoreEditor } from '@/components/admin/trust-score-editor';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminTrustQueuePage() {
  const [models, setModels] = useState<TrustQueueItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Editor modal state
  const [editingModel, setEditingModel] = useState<TrustQueueItem | null>(null);

  const fetchModels = useCallback(
    async (page: number = 1, showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });
        if (search) params.set('search', search);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const res = await fetch(`/api/admin/trust?${params}`);
        if (!res.ok) throw new Error('Failed to fetch models');

        const data = await res.json();
        setModels(data.models);
        setPagination(data.pagination);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [search, statusFilter, pagination.limit]
  );

  useEffect(() => {
    fetchModels(1);
  }, [fetchModels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchModels(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchModels(newPage);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const openEditor = (model: TrustQueueItem) => {
    setEditingModel(model);
  };

  const closeEditor = () => {
    setEditingModel(null);
  };

  const handleSaved = () => {
    // Refresh the list after saving
    fetchModels(pagination.page, true);
  };

  const getTrustTierBadge = (tier: string) => {
    switch (tier) {
      case 'A':
        return <Badge className="bg-green-500">Tier A</Badge>;
      case 'B':
        return <Badge className="bg-blue-500">Tier B</Badge>;
      case 'C':
        return <Badge className="bg-amber-500">Tier C</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCompletionBadge = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    }
    if (percentage > 0) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-300">
          <Clock className="h-3 w-3 mr-1" />
          {completed}/{total}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        Not Started
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate stats
  const completeModels = models.filter(
    (m) => m.scoresCompleted === m.totalDimensions
  ).length;
  const incompleteModels = models.filter(
    (m) => m.scoresCompleted > 0 && m.scoresCompleted < m.totalDimensions
  ).length;
  const notStartedModels = models.filter((m) => m.scoresCompleted === 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => fetchModels(1)}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Trust Score Queue
          </h1>
          <p className="text-muted-foreground">
            Review and assign trust scores for AI models ({pagination.total} total)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchModels(pagination.page, true)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Models</CardDescription>
            <CardTitle className="text-2xl">{pagination.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Complete</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {completeModels}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {incompleteModels}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Started</CardDescription>
            <CardTitle className="text-2xl text-gray-500">
              {notStartedModels}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="incomplete">Needs Review</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Models Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Scores Progress</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No models found</p>
                  </TableCell>
                </TableRow>
              ) : (
                models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <p className="font-medium">{model.name}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{model.providerName}</span>
                        {getTrustTierBadge(model.providerTrustTier)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 w-40">
                        <div className="flex items-center justify-between">
                          {getCompletionBadge(
                            model.scoresCompleted,
                            model.totalDimensions
                          )}
                        </div>
                        <Progress
                          value={
                            (model.scoresCompleted / model.totalDimensions) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {model.averageScore !== null ? (
                        <Badge
                          variant="outline"
                          className={
                            model.averageScore >= 80
                              ? 'border-green-500 text-green-600'
                              : model.averageScore >= 60
                                ? 'border-amber-500 text-amber-600'
                                : 'border-red-500 text-red-600'
                          }
                        >
                          {model.averageScore.toFixed(0)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(model.lastUpdated)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditor(model)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <CardContent className="border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Editor Modal */}
      {editingModel && (
        <TrustScoreEditor
          open={!!editingModel}
          onOpenChange={closeEditor}
          modelId={editingModel.id}
          modelName={editingModel.name}
          providerName={editingModel.providerName}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
