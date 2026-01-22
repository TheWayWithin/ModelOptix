'use client';

import { FunctionWithModel } from '@/types/function';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Cpu, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface FunctionWithUseCaseCount extends FunctionWithModel {
  use_case_count?: number;
}

interface FunctionCardProps {
  func: FunctionWithUseCaseCount;
  productId: string;
  onEdit: (func: FunctionWithModel) => void;
  onDelete: (func: FunctionWithModel) => void;
}

export function FunctionCard({ func, productId, onEdit, onDelete }: FunctionCardProps) {
  const useCaseCount = func.use_case_count ?? 0;

  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <Link
        href={`/products/${productId}/functions/${func.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${func.name} use cases`}
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {func.name}
            </CardTitle>
            {func.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {func.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 relative z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(func);
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(func);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            {func.model ? (
              <Badge variant="secondary" className="text-xs">
                {func.model.provider} - {func.model.name}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">No model assigned</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {useCaseCount} use case{useCaseCount !== 1 ? 's' : ''}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
