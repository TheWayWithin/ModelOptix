'use client';

import { UseCase, PRIORITY_NEED_LABELS } from '@/types/use-case';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, Eye, Wrench, Radio } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UseCaseCardProps {
  useCase: UseCase;
  onEdit: (useCase: UseCase) => void;
  onDelete: (useCase: UseCase) => void;
}

export function UseCaseCard({ useCase, onEdit, onDelete }: UseCaseCardProps) {
  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg truncate">{useCase.name}</CardTitle>
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
        <div className="flex flex-wrap gap-3 text-sm">
          {useCase.input_type && (
            <span className="text-muted-foreground">
              Input: <span className="capitalize">{useCase.input_type}</span>
            </span>
          )}
          {useCase.output_type && (
            <span className="text-muted-foreground">
              Output: <span className="capitalize">{useCase.output_type}</span>
            </span>
          )}
          {useCase.estimated_monthly_tokens && (
            <span className="text-muted-foreground">
              ~{formatNumber(useCase.estimated_monthly_tokens)} tokens/mo
            </span>
          )}
        </div>
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
              Tools
            </Badge>
          )}
          {useCase.requires_streaming && (
            <Badge variant="outline" className="text-xs">
              <Radio className="h-3 w-3 mr-1" />
              Streaming
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
