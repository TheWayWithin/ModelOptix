'use client';

import {
  UseCase,
  UseCaseWithModel,
  PRIORITY_NEED_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/use-case';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, Eye, Wrench, Braces, Cpu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface UseCaseCardProps {
  useCase: UseCase | UseCaseWithModel;
  onEdit: (useCase: UseCase) => void;
  onDelete: (useCase: UseCase) => void;
}

export function UseCaseCard({ useCase, onEdit, onDelete }: UseCaseCardProps) {
  const formatNumber = (num: number | null) => {
    if (num === null) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get current model info if available
  const currentModel = 'current_model' in useCase ? useCase.current_model : null;

  // Calculate estimated cost if we have usage data
  const hasUsageData = useCase.monthly_volume && useCase.avg_input_tokens && useCase.avg_output_tokens;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg truncate">{useCase.name}</CardTitle>
            {/* Priority badge with color */}
            <Badge
              variant="outline"
              className={cn('shrink-0 border', PRIORITY_COLORS[useCase.priority])}
            >
              {PRIORITY_LABELS[useCase.priority]}
            </Badge>
            {/* Primary need badge */}
            <Badge variant="secondary" className="shrink-0">
              {PRIORITY_NEED_LABELS[useCase.primary_need]}
            </Badge>
          </div>
          {useCase.description && (
            <CardDescription className="line-clamp-2">
              {useCase.description}
            </CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(useCase)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(useCase)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {/* Current model info */}
        {currentModel && (
          <div className="flex items-center gap-2 text-sm mb-3 pb-3 border-b">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Current:</span>
            <span className="font-medium">{currentModel.display_name || currentModel.name}</span>
          </div>
        )}

        {/* Usage stats */}
        <div className="flex flex-wrap gap-3 text-sm">
          {useCase.monthly_volume && (
            <span className="text-muted-foreground">
              {formatNumber(useCase.monthly_volume)} calls/mo
            </span>
          )}
          {hasUsageData && (
            <span className="text-muted-foreground">
              ~{formatNumber((useCase.avg_input_tokens || 0) + (useCase.avg_output_tokens || 0))} tokens/call
            </span>
          )}
          {useCase.latency_requirement_ms && (
            <span className="text-muted-foreground">
              &lt;{useCase.latency_requirement_ms}ms latency
            </span>
          )}
          {useCase.estimated_monthly_tokens && (
            <span className="text-muted-foreground">
              ~{formatNumber(useCase.estimated_monthly_tokens)} tokens/mo
            </span>
          )}
        </div>

        {/* Capabilities badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {useCase.requires_vision && (
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Vision
            </Badge>
          )}
          {useCase.requires_function_calling && (
            <Badge variant="outline" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              Functions
            </Badge>
          )}
          {useCase.requires_json_mode && (
            <Badge variant="outline" className="text-xs">
              <Braces className="h-3 w-3 mr-1" />
              JSON
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
