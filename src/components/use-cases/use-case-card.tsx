'use client';

import { UseCase, TASK_TYPE_LABELS } from '@/types/use-case';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, Zap, Clock } from 'lucide-react';
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
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalTokens = useCase.avg_input_tokens + useCase.avg_output_tokens;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg truncate">{useCase.name}</CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {TASK_TYPE_LABELS[useCase.task_type]}
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
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>{formatNumber(useCase.current_monthly_calls)} calls/mo</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-mono text-xs">{formatNumber(totalTokens)} tokens</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Quality: {(useCase.quality_threshold * 100).toFixed(0)}%</span>
          </div>
          {useCase.latency_requirement_ms && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{useCase.latency_requirement_ms}ms</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
