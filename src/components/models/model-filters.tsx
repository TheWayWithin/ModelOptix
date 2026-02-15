'use client';

import type { ProviderSummary, ModelFilters } from '@/types/model';
import { getTrustTierColor } from '@/types/model';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, X, Filter } from 'lucide-react';

interface ModelFiltersPanelProps {
  filters: ModelFilters;
  providers: ProviderSummary[];
  onFiltersChange: (filters: ModelFilters) => void;
  onReset: () => void;
}

const TRUST_TIERS = ['A', 'B', 'C', 'unknown'];
const AVAILABILITY_OPTIONS = ['available', 'limited', 'waitlist', 'deprecated'];
const CAPABILITY_OPTIONS = [
  { value: 'vision', label: 'Vision' },
  { value: 'function_calling', label: 'Function Calling' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'json_mode', label: 'JSON Mode' },
];
const CONTEXT_OPTIONS = [
  { value: 4096, label: '4K+' },
  { value: 8192, label: '8K+' },
  { value: 32768, label: '32K+' },
  { value: 128000, label: '128K+' },
  { value: 1000000, label: '1M+' },
];

export function ModelFiltersPanel({ filters, providers, onFiltersChange, onReset }: ModelFiltersPanelProps) {
  const activeFilterCount = [
    filters.search,
    filters.providers?.length,
    filters.capabilities?.length,
    filters.availability?.length,
    filters.trustTiers?.length,
    filters.minContext,
    filters.maxInputPrice,
  ].filter(Boolean).length;

  const toggleArrayFilter = (key: keyof ModelFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['providers', 'capabilities']} className="w-full">
        {/* Providers */}
        <AccordionItem value="providers">
          <AccordionTrigger className="text-sm font-medium">
            Providers ({providers.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`provider-${provider.slug}`}
                    checked={filters.providers?.includes(provider.slug) || false}
                    onCheckedChange={() => toggleArrayFilter('providers', provider.slug)}
                  />
                  <Label
                    htmlFor={`provider-${provider.slug}`}
                    className="flex items-center gap-2 text-sm font-normal cursor-pointer flex-1"
                  >
                    <span>{provider.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {provider.model_count}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Trust Tiers */}
        <AccordionItem value="trustTiers">
          <AccordionTrigger className="text-sm font-medium">
            Trust Tier
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {TRUST_TIERS.map((tier) => (
                <div key={tier} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tier-${tier}`}
                    checked={filters.trustTiers?.includes(tier) || false}
                    onCheckedChange={() => toggleArrayFilter('trustTiers', tier)}
                  />
                  <Label
                    htmlFor={`tier-${tier}`}
                    className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                  >
                    <Badge className={getTrustTierColor(tier)}>
                      {tier === 'unknown' ? 'Unknown' : `Tier ${tier}`}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Capabilities */}
        <AccordionItem value="capabilities">
          <AccordionTrigger className="text-sm font-medium">
            Capabilities
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {CAPABILITY_OPTIONS.map((cap) => (
                <div key={cap.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cap-${cap.value}`}
                    checked={filters.capabilities?.includes(cap.value) || false}
                    onCheckedChange={() => toggleArrayFilter('capabilities', cap.value)}
                  />
                  <Label
                    htmlFor={`cap-${cap.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {cap.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="availability">
          <AccordionTrigger className="text-sm font-medium">
            Availability
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map((avail) => (
                <div key={avail} className="flex items-center space-x-2">
                  <Checkbox
                    id={`avail-${avail}`}
                    checked={filters.availability?.includes(avail) || false}
                    onCheckedChange={() => toggleArrayFilter('availability', avail)}
                  />
                  <Label
                    htmlFor={`avail-${avail}`}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {avail}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Context Length */}
        <AccordionItem value="context">
          <AccordionTrigger className="text-sm font-medium">
            Min Context Length
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {CONTEXT_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ctx-${opt.value}`}
                    checked={filters.minContext === opt.value}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, minContext: checked ? opt.value : undefined })
                    }
                  />
                  <Label
                    htmlFor={`ctx-${opt.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
