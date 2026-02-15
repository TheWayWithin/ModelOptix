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
  Building2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface AdminProvider {
  id: string;
  name: string;
  slug: string;
  hqCountry: string | null;
  apiBaseUrl: string | null;
  trustTier: 'A' | 'B' | 'C' | 'unknown';
  trustTierReason: string | null;
  logoUrl: string | null;
  documentationUrl: string | null;
  status: 'active' | 'deprecated' | 'beta';
  features: Record<string, unknown>;
  metadata: Record<string, unknown>;
  modelCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<AdminProvider[]>([]);
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
  const [editingProvider, setEditingProvider] = useState<AdminProvider | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    hq_country: '',
    trust_tier: 'unknown' as 'A' | 'B' | 'C' | 'unknown',
    trust_tier_reason: '',
    documentation_url: '',
    status: 'active' as 'active' | 'deprecated' | 'beta',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProviders = useCallback(
    async (page: number = 1, showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });
        if (search) params.set('search', search);

        const res = await fetch(`/api/admin/providers?${params}`);
        if (!res.ok) throw new Error('Failed to fetch providers');

        const data = await res.json();
        setProviders(data.providers);
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
    fetchProviders(1);
  }, [fetchProviders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProviders(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchProviders(newPage);
  };

  const openEditModal = (provider: AdminProvider) => {
    setEditingProvider(provider);
    setEditForm({
      name: provider.name,
      slug: provider.slug,
      hq_country: provider.hqCountry || '',
      trust_tier: provider.trustTier,
      trust_tier_reason: provider.trustTierReason || '',
      documentation_url: provider.documentationUrl || '',
      status: provider.status,
    });
  };

  const closeEditModal = () => {
    setEditingProvider(null);
  };

  const handleSave = async () => {
    if (!editingProvider) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProvider.id,
          name: editForm.name,
          slug: editForm.slug,
          hq_country: editForm.hq_country || null,
          trust_tier: editForm.trust_tier,
          trust_tier_reason: editForm.trust_tier_reason || null,
          documentation_url: editForm.documentation_url || null,
          status: editForm.status,
        }),
      });

      if (!res.ok) throw new Error('Failed to update provider');

      // Refresh the list
      await fetchProviders(pagination.page, true);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'beta':
        return <Badge className="bg-purple-500">Beta</Badge>;
      case 'deprecated':
        return <Badge variant="destructive">Deprecated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
          <Button onClick={() => fetchProviders(1)}>Retry</Button>
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
            <Building2 className="h-6 w-6" />
            Provider Management
          </h1>
          <p className="text-muted-foreground">
            Manage AI model providers ({pagination.total} total)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchProviders(pagination.page, true)}
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
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search providers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Trust Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HQ Country</TableHead>
                <TableHead>Models</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No providers found</p>
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getTrustTierBadge(provider.trustTier)}
                        {provider.trustTierReason && (
                          <span className="text-xs text-muted-foreground truncate max-w-32">
                            {provider.trustTierReason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(provider.status)}</TableCell>
                    <TableCell>
                      {provider.hqCountry || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.modelCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {provider.documentationUrl ? (
                        <a
                          href={provider.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Docs
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(provider)}
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
      <Dialog open={!!editingProvider} onOpenChange={closeEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
            <DialogDescription>
              Update provider details. Changes will be applied immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={editForm.slug}
                  onChange={(e) =>
                    setEditForm({ ...editForm, slug: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="trust_tier">Trust Tier</Label>
                <Select
                  value={editForm.trust_tier}
                  onValueChange={(value: 'A' | 'B' | 'C' | 'unknown') =>
                    setEditForm({ ...editForm, trust_tier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Tier A (Highest Trust)</SelectItem>
                    <SelectItem value="B">Tier B (Moderate Trust)</SelectItem>
                    <SelectItem value="C">Tier C (Lower Trust)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: 'active' | 'deprecated' | 'beta') =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trust_tier_reason">Trust Tier Reason</Label>
              <Textarea
                id="trust_tier_reason"
                value={editForm.trust_tier_reason}
                onChange={(e) =>
                  setEditForm({ ...editForm, trust_tier_reason: e.target.value })
                }
                rows={2}
                placeholder="Explain why this trust tier was assigned..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hq_country">HQ Country</Label>
                <Input
                  id="hq_country"
                  value={editForm.hq_country}
                  onChange={(e) =>
                    setEditForm({ ...editForm, hq_country: e.target.value })
                  }
                  placeholder="e.g., USA"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="documentation_url">Documentation URL</Label>
                <Input
                  id="documentation_url"
                  type="url"
                  value={editForm.documentation_url}
                  onChange={(e) =>
                    setEditForm({ ...editForm, documentation_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
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
