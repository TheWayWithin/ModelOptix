'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Shield,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Ban,
  TrendingDown,
  Flag,
} from 'lucide-react';

interface Override {
  id: string;
  modelId: string;
  modelName: string;
  providerName: string;
  overrideType: 'exclude' | 'downrank' | 'flag';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  warningMessage: string | null;
  downrankFactor: number | null;
  active: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Model {
  id: string;
  name: string;
  providerName: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminEditorialOverridesPage() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  // Create/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<Override | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [form, setForm] = useState({
    model_id: '',
    override_type: 'flag' as 'exclude' | 'downrank' | 'flag',
    reason: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    warning_message: '',
    downrank_factor: '1.5',
    active: true,
    expires_at: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOverrides = useCallback(
    async (page: number = 1, showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          active_only: activeOnly.toString(),
        });

        const res = await fetch(`/api/admin/editorial-overrides?${params}`);
        if (!res.ok) throw new Error('Failed to fetch overrides');

        const data = await res.json();
        setOverrides(data.overrides);
        setPagination(data.pagination);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [pagination.limit, activeOnly]
  );

  const fetchModels = async (search: string) => {
    if (!search || search.length < 2) {
      setModels([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/models?search=${encodeURIComponent(search)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setModels(
          data.models.map((m: { id: string; name: string; providerName: string }) => ({
            id: m.id,
            name: m.name,
            providerName: m.providerName,
          }))
        );
      }
    } catch {
      // Silently fail model search
    }
  };

  useEffect(() => {
    fetchOverrides(1);
  }, [fetchOverrides]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchModels(modelSearch);
    }, 300);
    return () => clearTimeout(debounce);
  }, [modelSearch]);

  const handlePageChange = (newPage: number) => {
    fetchOverrides(newPage);
  };

  const openCreateModal = () => {
    setEditingOverride(null);
    setForm({
      model_id: '',
      override_type: 'flag',
      reason: '',
      severity: 'medium',
      warning_message: '',
      downrank_factor: '1.5',
      active: true,
      expires_at: '',
    });
    setModelSearch('');
    setModels([]);
    setIsModalOpen(true);
  };

  const openEditModal = (override: Override) => {
    setEditingOverride(override);
    setForm({
      model_id: override.modelId,
      override_type: override.overrideType,
      reason: override.reason,
      severity: override.severity,
      warning_message: override.warningMessage || '',
      downrank_factor: override.downrankFactor?.toString() || '1.5',
      active: override.active,
      expires_at: override.expiresAt ? (override.expiresAt.split('T')[0] ?? '') : '',
    });
    setModelSearch(override.modelName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOverride(null);
  };

  const handleSave = async () => {
    if (!form.model_id || !form.reason) {
      setError('Model and reason are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        model_id: form.model_id,
        override_type: form.override_type,
        reason: form.reason,
        severity: form.severity,
        warning_message: form.warning_message || null,
        downrank_factor: form.override_type === 'downrank' ? parseFloat(form.downrank_factor) : null,
        active: form.active,
        expires_at: form.expires_at || null,
      };

      if (editingOverride) {
        payload.id = editingOverride.id;
        const res = await fetch('/api/admin/editorial-overrides', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update override');
      } else {
        const res = await fetch('/api/admin/editorial-overrides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create override');
      }

      await fetchOverrides(pagination.page, true);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/editorial-overrides?id=${deletingId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete override');

      await fetchOverrides(pagination.page, true);
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const getOverrideIcon = (type: string) => {
    switch (type) {
      case 'exclude':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'downrank':
        return <TrendingDown className="h-4 w-4 text-amber-500" />;
      case 'flag':
        return <Flag className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Editorial Overrides
          </h1>
          <p className="text-muted-foreground">
            Control model recommendations with exclusions, downranking, and warnings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOverrides(pagination.page, true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Override
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader className="py-3">
            <CardTitle className="text-destructive flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="active-only"
                checked={activeOnly}
                onCheckedChange={setActiveOnly}
              />
              <Label htmlFor="active-only">Active only</Label>
            </div>
            <Badge variant="outline">{pagination.total} override{pagination.total !== 1 ? 's' : ''}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Overrides Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No overrides found</p>
                  </TableCell>
                </TableRow>
              ) : (
                overrides.map((override) => (
                  <TableRow key={override.id} className={!override.active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{override.modelName}</p>
                        <p className="text-xs text-muted-foreground">{override.providerName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getOverrideIcon(override.overrideType)}
                        <span className="capitalize">{override.overrideType}</span>
                        {override.overrideType === 'downrank' && override.downrankFactor && (
                          <Badge variant="outline" className="text-xs">
                            ×{override.downrankFactor}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(override.severity)}</TableCell>
                    <TableCell>
                      <p className="truncate max-w-xs" title={override.reason}>
                        {override.reason}
                      </p>
                      {override.warningMessage && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          Warning: {override.warningMessage}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={override.active ? 'default' : 'secondary'}>
                        {override.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {override.expiresAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(override.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs">{new Date(override.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{override.createdBy}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(override)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingId(override.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOverride ? 'Edit Override' : 'Add Override'}</DialogTitle>
            <DialogDescription>
              {editingOverride
                ? 'Update this editorial override.'
                : 'Create a new editorial override for a model.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Model Search */}
            {!editingOverride && (
              <div className="grid gap-2">
                <Label>Model</Label>
                <Input
                  placeholder="Search for a model..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                />
                {models.length > 0 && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                        onClick={() => {
                          setForm({ ...form, model_id: model.id });
                          setModelSearch(model.name);
                          setModels([]);
                        }}
                      >
                        <span className="font-medium">{model.name}</span>
                        <span className="text-muted-foreground ml-2">({model.providerName})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Override Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Override Type</Label>
                <Select
                  value={form.override_type}
                  onValueChange={(v: 'exclude' | 'downrank' | 'flag') =>
                    setForm({ ...form, override_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclude">Exclude (hide completely)</SelectItem>
                    <SelectItem value="downrank">Downrank (lower in results)</SelectItem>
                    <SelectItem value="flag">Flag (show warning)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v: 'low' | 'medium' | 'high' | 'critical') =>
                    setForm({ ...form, severity: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Downrank Factor (only for downrank type) */}
            {form.override_type === 'downrank' && (
              <div className="grid gap-2">
                <Label>Downrank Factor (1.0 = no change, 2.0 = max)</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={form.downrank_factor}
                  onChange={(e) => setForm({ ...form, downrank_factor: e.target.value })}
                />
              </div>
            )}

            {/* Reason */}
            <div className="grid gap-2">
              <Label>Reason (internal)</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={2}
                placeholder="Why is this override being applied?"
              />
            </div>

            {/* Warning Message (for flag type) */}
            {form.override_type === 'flag' && (
              <div className="grid gap-2">
                <Label>Warning Message (shown to users)</Label>
                <Textarea
                  value={form.warning_message}
                  onChange={(e) => setForm({ ...form, warning_message: e.target.value })}
                  rows={2}
                  placeholder="Warning message displayed to users..."
                />
              </div>
            )}

            {/* Expires At */}
            <div className="grid gap-2">
              <Label>Expires At (optional)</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingOverride ? 'Save Changes' : 'Create Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Override</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this override? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
