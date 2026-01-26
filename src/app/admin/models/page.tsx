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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Database,
  RefreshCw,
} from 'lucide-react';

interface AdminModel {
  id: string;
  name: string;
  description: string | null;
  providerId: string;
  providerName: string;
  providerTrustTier: string;
  contextLength: number | null;
  maxOutputTokens: number | null;
  inputModalities: string[] | null;
  outputModalities: string[] | null;
  capabilities: string[] | null;
  latencyP50: number | null;
  latencyP95: number | null;
  benchmarks: Record<string, number> | null;
  isActive: boolean;
  avgTrustScore: number | null;
  pricing: {
    id: string;
    input_price: number;
    output_price: number;
    is_primary: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<AdminModel[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit modal state
  const [editingModel, setEditingModel] = useState<AdminModel | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    context_length: '',
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

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

        const res = await fetch(`/api/admin/models?${params}`);
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
    [search, pagination.limit]
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

  const openEditModal = (model: AdminModel) => {
    setEditingModel(model);
    setEditForm({
      name: model.name,
      description: model.description || '',
      context_length: model.contextLength?.toString() || '',
      is_active: model.isActive,
    });
  };

  const closeEditModal = () => {
    setEditingModel(null);
  };

  const handleSave = async () => {
    if (!editingModel) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingModel.id,
          name: editForm.name,
          description: editForm.description || null,
          context_length: editForm.context_length
            ? parseInt(editForm.context_length, 10)
            : null,
          is_active: editForm.is_active,
        }),
      });

      if (!res.ok) throw new Error('Failed to update model');

      // Refresh the list
      await fetchModels(pagination.page, true);
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
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

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return '-';
    // Prices are stored per 1K tokens
    // Display with enough precision for small values
    if (price < 0.0001) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return '-';
    return num.toLocaleString();
  };

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
            <Database className="h-6 w-6" />
            Model Catalog
          </h1>
          <p className="text-muted-foreground">
            Manage AI models in the catalog ({pagination.total} total)
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
                <TableHead>Context</TableHead>
                <TableHead>Pricing (in/out)</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No models found</p>
                  </TableCell>
                </TableRow>
              ) : (
                models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{model.name}</p>
                        {model.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {model.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{model.providerName}</span>
                        {getTrustTierBadge(model.providerTrustTier)}
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(model.contextLength)}</TableCell>
                    <TableCell>
                      {model.pricing ? (
                        <span className="text-xs">
                          {formatPrice(model.pricing.input_price)} /{' '}
                          {formatPrice(model.pricing.output_price)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {model.avgTrustScore !== null ? (
                        <Badge
                          variant="outline"
                          className={
                            model.avgTrustScore >= 80
                              ? 'border-green-500 text-green-600'
                              : model.avgTrustScore >= 60
                                ? 'border-amber-500 text-amber-600'
                                : 'border-red-500 text-red-600'
                          }
                        >
                          {model.avgTrustScore.toFixed(0)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={model.isActive ? 'default' : 'secondary'}
                      >
                        {model.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(model)}
                      >
                        <Edit className="h-4 w-4" />
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

      {/* Edit Modal */}
      <Dialog open={!!editingModel} onOpenChange={closeEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update model details. Changes will be applied immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="context_length">Context Length</Label>
              <Input
                id="context_length"
                type="number"
                value={editForm.context_length}
                onChange={(e) =>
                  setEditForm({ ...editForm, context_length: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
