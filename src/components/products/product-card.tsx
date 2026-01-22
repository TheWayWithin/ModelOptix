'use client';

import { Product, getStatusColor, PRODUCT_STATUS_OPTIONS } from '@/types/product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStatusChange: (product: Product, status: Product['status']) => void;
}

export function ProductCard({ product, onEdit, onDelete, onStatusChange }: ProductCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              <Link
                href={`/products/${product.id}`}
                className="hover:underline"
              >
                {product.name}
              </Link>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {PRODUCT_STATUS_OPTIONS.filter(opt => opt.value !== product.status).map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStatusChange(product, option.value)}
                >
                  Set as {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(product)}
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
        <div className="space-y-3">
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(product.status)}>
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
