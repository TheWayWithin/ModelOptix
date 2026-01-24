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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Sliders,
  RefreshCw,
  Plus,
  Trash2,
  Wand2,
  ArrowLeft,
} from 'lucide-react';
import {
  ParameterSupportRecord,
  ModelParameterSummary,
  PARAMETER_VALUE_TYPES,
  getValueTypeLabel,
  formatValueRange,
  formatDefaultValue,
} from '@/types/parameter';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ModelInfo {
  id: string;
  name: string;
  providerName: string;
}

export default function AdminParametersPage() {
  // Model list state
  const [models, setModels] = useState<ModelParameterSummary[]>([]);
  const [modelPagination, setModelPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelSearch, setModelSearch] = useState('');

  // Selected model state
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [parameters, setParameters] = useState<ParameterSupportRecord[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add/Edit modal state
  const [editingParam, setEditingParam] = useState<ParameterSupportRecord | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [paramForm, setParamForm] = useState({
    parameter_name: '',
    is_supported: true,
    min_value: '',
    max_value: '',
    default_value: '',
    value_type: 'float' as string,
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [deletingParam, setDeletingParam] = useState<ParameterSupportRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk add state
  const [isAddingCommon, setIsAddingCommon] = useState(false);

  // Fetch models list
  const fetchModels = useCallback(
    async (page: number = 1, showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoadingModels(true);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: modelPagination.limit.toString(),
        });
        if (modelSearch) params.set('search', modelSearch);

        const res = await fetch(`/api/admin/parameters?${params}`);
        if (!res.ok) throw new Error('Failed to fetch models');

        const data = await res.json();
        setModels(data.models);
        setModelPagination(data.pagination);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoadingModels(false);
        setIsRefreshing(false);
      }
    },
    [modelSearch, modelPagination.limit]
  );

  // Fetch parameters for selected model
  const fetchParameters = useCallback(async (modelId: string) => {
    setIsLoadingParameters(true);
    try {
      const res = await fetch(`/api/admin/parameters/${modelId}`);
      if (!res.ok) throw new Error('Failed to fetch parameters');

      const data = await res.json();
      setSelectedModel(data.model);
      setParameters(data.parameters);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingParameters(false);
    }
  }, []);

  useEffect(() => {
    fetchModels(1);
  }, [fetchModels]);

  const handleModelSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchModels(1);
  };

  const handleModelPageChange = (newPage: number) => {
    fetchModels(newPage);
  };

  const selectModel = (model: ModelParameterSummary) => {
    fetchParameters(model.id);
  };

  const goBackToModels = () => {
    setSelectedModel(null);
    setParameters([]);
  };

  // Open add modal
  const openAddModal = () => {
    setEditingParam(null);
    setIsAddingNew(true);
    setParamForm({
      parameter_name: '',
      is_supported: true,
      min_value: '',
      max_value: '',
      default_value: '',
      value_type: 'float',
      notes: '',
    });
  };

  // Open edit modal
  const openEditModal = (param: ParameterSupportRecord) => {
    setEditingParam(param);
    setIsAddingNew(false);
    setParamForm({
      parameter_name: param.parameter_name,
      is_supported: param.is_supported,
      min_value: param.min_value?.toString() || '',
      max_value: param.max_value?.toString() || '',
      default_value: param.default_value?.toString() || '',
      value_type: param.value_type,
      notes: param.notes || '',
    });
  };

  const closeModal = () => {
    setEditingParam(null);
    setIsAddingNew(false);
  };

  // Save parameter (create or update)
  const handleSave = async () => {
    if (!selectedModel) return;

    setIsSaving(true);
    try {
      if (isAddingNew) {
        // Create new parameter
        const res = await fetch('/api/admin/parameters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: selectedModel.id,
            parameter_name: paramForm.parameter_name,
            is_supported: paramForm.is_supported,
            min_value: paramForm.min_value ? parseFloat(paramForm.min_value) : null,
            max_value: paramForm.max_value ? parseFloat(paramForm.max_value) : null,
            default_value: paramForm.default_value
              ? parseFloat(paramForm.default_value)
              : null,
            value_type: paramForm.value_type,
            notes: paramForm.notes || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create parameter');
        }
      } else if (editingParam) {
        // Update existing parameter
        const res = await fetch('/api/admin/parameters', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingParam.id,
            is_supported: paramForm.is_supported,
            min_value: paramForm.min_value ? parseFloat(paramForm.min_value) : null,
            max_value: paramForm.max_value ? parseFloat(paramForm.max_value) : null,
            default_value: paramForm.default_value
              ? parseFloat(paramForm.default_value)
              : null,
            value_type: paramForm.value_type,
            notes: paramForm.notes || null,
          }),
        });

        if (!res.ok) throw new Error('Failed to update parameter');
      }

      // Refresh parameters
      await fetchParameters(selectedModel.id);
      // Also refresh model list to update counts
      await fetchModels(modelPagination.page, true);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete parameter
  const handleDelete = async () => {
    if (!deletingParam || !selectedModel) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/parameters?id=${deletingParam.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete parameter');

      // Refresh parameters
      await fetchParameters(selectedModel.id);
      // Also refresh model list to update counts
      await fetchModels(modelPagination.page, true);
      setDeletingParam(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add common parameters
  const handleAddCommonParameters = async () => {
    if (!selectedModel) return;

    setIsAddingCommon(true);
    try {
      const res = await fetch(`/api/admin/parameters/${selectedModel.id}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to add common parameters');

      const data = await res.json();

      // Refresh parameters
      setParameters(data.parameters);
      // Also refresh model list to update counts
      await fetchModels(modelPagination.page, true);

      if (data.added === 0) {
        setError('All common parameters already exist for this model');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add common parameters');
    } finally {
      setIsAddingCommon(false);
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

  // Loading state
  if (isLoadingModels && !selectedModel) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error && !selectedModel && !isLoadingModels) {
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

  // Parameter detail view for selected model
  if (selectedModel) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={goBackToModels}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Models
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Sliders className="h-6 w-6" />
                {selectedModel.name}
              </h1>
              <p className="text-muted-foreground">
                {selectedModel.providerName} • {parameters.length} parameters
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCommonParameters}
              disabled={isAddingCommon}
            >
              {isAddingCommon ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Add Common Params
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Parameter
            </Button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="py-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Parameters Table */}
        <Card>
          <CardContent className="p-0">
            {isLoadingParameters ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Supported</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">
                          No parameters configured
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={handleAddCommonParameters}
                          disabled={isAddingCommon}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Add Common Parameters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    parameters.map((param) => (
                      <TableRow key={param.id}>
                        <TableCell className="font-mono text-sm">
                          {param.parameter_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getValueTypeLabel(param.value_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatValueRange(
                            param.min_value,
                            param.max_value,
                            param.value_type
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDefaultValue(param.default_value, param.value_type)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={param.is_supported ? 'default' : 'secondary'}
                          >
                            {param.is_supported ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {param.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(param)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingParam(param)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={isAddingNew || !!editingParam} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isAddingNew ? 'Add Parameter' : 'Edit Parameter'}
              </DialogTitle>
              <DialogDescription>
                {isAddingNew
                  ? 'Add a new parameter support entry for this model.'
                  : 'Update parameter details. Changes will be applied immediately.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {isAddingNew && (
                <div className="grid gap-2">
                  <Label htmlFor="parameter_name">Parameter Name</Label>
                  <Input
                    id="parameter_name"
                    value={paramForm.parameter_name}
                    onChange={(e) =>
                      setParamForm({ ...paramForm, parameter_name: e.target.value })
                    }
                    placeholder="e.g., temperature"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="value_type">Value Type</Label>
                <Select
                  value={paramForm.value_type}
                  onValueChange={(value) =>
                    setParamForm({ ...paramForm, value_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAMETER_VALUE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getValueTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(paramForm.value_type === 'integer' ||
                paramForm.value_type === 'float') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="min_value">Min Value</Label>
                      <Input
                        id="min_value"
                        type="number"
                        step={paramForm.value_type === 'float' ? '0.01' : '1'}
                        value={paramForm.min_value}
                        onChange={(e) =>
                          setParamForm({ ...paramForm, min_value: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max_value">Max Value</Label>
                      <Input
                        id="max_value"
                        type="number"
                        step={paramForm.value_type === 'float' ? '0.01' : '1'}
                        value={paramForm.max_value}
                        onChange={(e) =>
                          setParamForm({ ...paramForm, max_value: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="default_value">Default Value</Label>
                    <Input
                      id="default_value"
                      type="number"
                      step={paramForm.value_type === 'float' ? '0.01' : '1'}
                      value={paramForm.default_value}
                      onChange={(e) =>
                        setParamForm({ ...paramForm, default_value: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={paramForm.notes}
                  onChange={(e) =>
                    setParamForm({ ...paramForm, notes: e.target.value })
                  }
                  placeholder="Description or usage notes..."
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_supported">Supported</Label>
                <Switch
                  id="is_supported"
                  checked={paramForm.is_supported}
                  onCheckedChange={(checked) =>
                    setParamForm({ ...paramForm, is_supported: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || (isAddingNew && !paramForm.parameter_name)}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isAddingNew ? 'Add Parameter' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deletingParam}
          onOpenChange={() => setDeletingParam(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Parameter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the{' '}
                <span className="font-mono font-semibold">
                  {deletingParam?.parameter_name}
                </span>{' '}
                parameter? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Model list view (default)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sliders className="h-6 w-6" />
            Parameter Support
          </h1>
          <p className="text-muted-foreground">
            Manage API parameter compatibility matrix ({modelPagination.total} models)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchModels(modelPagination.page, true)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleModelSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models by name..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
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
                <TableHead>Parameters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
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
                      <Badge
                        variant={model.parameterCount > 0 ? 'default' : 'secondary'}
                      >
                        {model.parameterCount} params
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={model.isActive ? 'default' : 'secondary'}>
                        {model.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectModel(model)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {modelPagination.totalPages > 1 && (
          <CardContent className="border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {modelPagination.page} of {modelPagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModelPageChange(modelPagination.page - 1)}
                  disabled={modelPagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModelPageChange(modelPagination.page + 1)}
                  disabled={modelPagination.page >= modelPagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
