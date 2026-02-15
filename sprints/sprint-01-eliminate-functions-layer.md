# Sprint: Eliminate Functions Layer - Simplify to Product → Use Cases

**Created:** 2026-01-25
**Status:** Ready for Implementation
**Assigned to:** Developer Agent
**Estimated Complexity:** Medium-High (database migration + API changes + UI overhaul)

---

## Sprint Goal

Simplify the data model from **Product → Function → Use Case** to **Product → Use Case** by eliminating the Functions table and merging its fields into Use Cases. This reduces cognitive overhead, speeds up data entry, and makes AI capabilities visible at a glance.

---

## Context & Background

### Problem Statement
The current three-tier structure creates unnecessary complexity:
- Users must navigate through an intermediate "Function" layer to see which LLMs they're using
- Data is duplicated between Functions and Use Cases (token counts, volume)
- The model assignment (`current_model_id`) is on Use Cases, not Functions, creating confusion
- Form burden: users must create a Function, then create Use Cases under it

### User Mental Model
Users think: "My Trading Bot has 5 AI capabilities"
- Trading Strategy (uses GPT-4)
- Sentiment Analysis (uses Claude)
- Trade Proposals (uses GPT-4)
- etc.

They do NOT think in terms of "Functions" that contain "Use Cases."

### Solution
Flatten to **Product → Use Cases** where each Use Case represents one AI capability with one assigned model.

### Analysis Documents
- [analysis-products-functions-usecases.md](analysis-products-functions-usecases.md) - Full problem analysis
- [simplified-structure-proposal.md](simplified-structure-proposal.md) - Detailed proposal with UI mockups

---

## Key Decisions Made

### 1. Capabilities Required (Simplified)
Based on LLM expert recommendations, we're keeping only 4 technical requirements:
- ✅ Vision / Image Analysis (checkbox)
- ✅ Function / Tool Calling (checkbox)
- ✅ Structured JSON Output (checkbox)
- ✅ Context Window (number field)

**Eliminated:**
- ❌ Input Type (text/code/structured/multimodal) - unnecessary, confusing
- ❌ Output Type (text/code/json/classification) - redundant
- ❌ Streaming checkbox - UX preference, not a selection criterion

### 2. Categories/Tags
**Skipped for now.** Can be added later if users request grouping for large use case lists.

### 3. Migration Strategy
- Merge Functions fields into Use Cases
- Keep old tables for 30 days post-migration (safety)
- Deprecate old API endpoints but keep functional for 90 days
- Full rollback plan included

---

## Database Schema Changes

### New use_cases Table Structure

```sql
-- Enhanced use_cases table (absorbs function fields)
CREATE TABLE use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Direct link to product (no intermediate function)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Model assignment
  current_model_id UUID REFERENCES models(id) ON DELETE SET NULL,

  -- Priority & Requirements (moved from functions)
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  latency_requirement_ms INTEGER,
  quality_requirement TEXT
    CHECK (quality_requirement IN ('best', 'good', 'acceptable')),

  -- What matters most for optimization
  primary_need TEXT NOT NULL
    CHECK (primary_need IN ('cost', 'speed', 'quality', 'trust', 'context')),
  secondary_need TEXT
    CHECK (secondary_need IN ('cost', 'speed', 'quality', 'trust', 'context')),
  tertiary_need TEXT
    CHECK (tertiary_need IN ('cost', 'speed', 'quality', 'trust', 'context')),
  use_equal_weights BOOLEAN DEFAULT FALSE,

  -- Usage patterns (moved from functions)
  monthly_volume INTEGER,
  avg_input_tokens INTEGER,
  avg_output_tokens INTEGER,

  -- Technical requirements (SIMPLIFIED)
  required_context INTEGER DEFAULT 4096,
  estimated_monthly_tokens BIGINT,
  estimated_monthly_spend DECIMAL(10,2),

  -- SIMPLIFIED capabilities (only what matters for model selection)
  requires_vision BOOLEAN NOT NULL DEFAULT FALSE,
  requires_function_calling BOOLEAN NOT NULL DEFAULT FALSE,
  requires_json_mode BOOLEAN NOT NULL DEFAULT FALSE,  -- NEW: replaces output_type

  -- REMOVED FIELDS (no longer needed):
  -- input_type (was: text/code/structured/multimodal)
  -- output_type (was: text/code/json/classification)
  -- requires_streaming (was: boolean, now removed)

  -- Optimization tracking
  monthly_cost_current DECIMAL(10,2),
  monthly_cost_optimized DECIMAL(10,2),
  last_analyzed_at TIMESTAMPTZ,

  -- Lifecycle
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'draft')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_use_cases_product_id ON use_cases(product_id) WHERE status = 'active';
CREATE INDEX idx_use_cases_current_model ON use_cases(current_model_id) WHERE current_model_id IS NOT NULL;
CREATE INDEX idx_use_cases_priority ON use_cases(priority);
CREATE INDEX idx_use_cases_primary_need ON use_cases(primary_need);

-- Trigger for updated_at
CREATE TRIGGER update_use_cases_updated_at
  BEFORE UPDATE ON use_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (same as before, just product_id instead of function_id)
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own use cases"
  ON use_cases FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own use cases"
  ON use_cases FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own use cases"
  ON use_cases FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own use cases"
  ON use_cases FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );
```

### Migration Script

**File:** `supabase/migrations/00X_eliminate_functions_layer.sql`

```sql
-- ============================================================================
-- Migration: Eliminate Functions Layer
-- Description: Merge functions table into use_cases, simplify capabilities
-- Date: 2026-01-25
-- ============================================================================

BEGIN;

-- Step 1: Create backup tables
CREATE TABLE functions_backup AS SELECT * FROM functions;
CREATE TABLE use_cases_backup AS SELECT * FROM use_cases;

-- Step 2: Disable triggers temporarily
ALTER TABLE use_cases DISABLE TRIGGER ALL;

-- Step 3: Add new columns to use_cases table
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('critical', 'high', 'medium', 'low'));
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS latency_requirement_ms INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS quality_requirement TEXT
  CHECK (quality_requirement IN ('best', 'good', 'acceptable'));
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS monthly_volume INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS avg_input_tokens INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS avg_output_tokens INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS requires_json_mode BOOLEAN DEFAULT FALSE;

-- Step 4: Migrate data from functions into use_cases
-- For each use case, pull in its parent function's data
UPDATE use_cases uc
SET
  product_id = f.product_id,
  priority = f.priority,
  latency_requirement_ms = f.latency_requirement_ms,
  quality_requirement = f.quality_requirement,
  monthly_volume = f.monthly_volume,
  avg_input_tokens = f.avg_input_tokens,
  avg_output_tokens = f.avg_output_tokens,
  -- If name is generic (like "Use Case 1"), use function name instead
  name = CASE
    WHEN uc.name ~ '^Use Case \d+$' THEN f.name
    ELSE uc.name
  END,
  -- Merge descriptions
  description = CASE
    WHEN uc.description IS NULL OR uc.description = '' THEN f.description
    WHEN f.description IS NULL OR f.description = '' THEN uc.description
    ELSE f.description || ' - ' || uc.description
  END
FROM functions f
WHERE uc.function_id = f.id;

-- Step 5: Handle orphaned functions (functions with no use cases)
-- Convert them to use cases
INSERT INTO use_cases (
  product_id,
  name,
  description,
  priority,
  latency_requirement_ms,
  quality_requirement,
  monthly_volume,
  avg_input_tokens,
  avg_output_tokens,
  primary_need,
  status,
  metadata,
  created_at,
  updated_at
)
SELECT
  f.product_id,
  f.name,
  f.description,
  f.priority,
  f.latency_requirement_ms,
  f.quality_requirement,
  f.monthly_volume,
  f.avg_input_tokens,
  f.avg_output_tokens,
  'quality' AS primary_need,  -- default
  'active' AS status,
  f.metadata,
  f.created_at,
  f.updated_at
FROM functions f
WHERE NOT EXISTS (
  SELECT 1 FROM use_cases uc WHERE uc.function_id = f.id
);

-- Step 6: Migrate capability flags (simplified)
-- Map old output_type='json' to new requires_json_mode flag
UPDATE use_cases
SET requires_json_mode = TRUE
WHERE output_type = 'json';

-- Step 7: Drop old columns from use_cases
ALTER TABLE use_cases DROP COLUMN IF EXISTS function_id;
ALTER TABLE use_cases DROP COLUMN IF EXISTS input_type;
ALTER TABLE use_cases DROP COLUMN IF EXISTS output_type;
ALTER TABLE use_cases DROP COLUMN IF EXISTS requires_streaming;

-- Step 8: Add NOT NULL constraint to product_id
ALTER TABLE use_cases ALTER COLUMN product_id SET NOT NULL;

-- Step 9: Add foreign key constraint
ALTER TABLE use_cases ADD CONSTRAINT use_cases_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Step 10: Recreate indexes
DROP INDEX IF EXISTS idx_use_cases_function_id;
CREATE INDEX idx_use_cases_product_id ON use_cases(product_id) WHERE status = 'active';
CREATE INDEX idx_use_cases_priority ON use_cases(priority);

-- Step 11: Re-enable triggers
ALTER TABLE use_cases ENABLE TRIGGER ALL;

-- Step 12: Drop RLS policies on functions table
DROP POLICY IF EXISTS "Users can view their own functions" ON functions;
DROP POLICY IF EXISTS "Users can insert their own functions" ON functions;
DROP POLICY IF EXISTS "Users can update their own functions" ON functions;
DROP POLICY IF EXISTS "Users can delete their own functions" ON functions;

-- Step 13: Rename functions table (don't drop yet, keep for 30 days)
ALTER TABLE functions RENAME TO functions_deprecated;

-- Step 14: Add comment
COMMENT ON TABLE functions_deprecated IS 'DEPRECATED: Merged into use_cases. Safe to drop after 2026-02-25';

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (in case of issues)
-- ============================================================================
-- BEGIN;
-- DROP TABLE use_cases;
-- ALTER TABLE use_cases_backup RENAME TO use_cases;
-- ALTER TABLE functions_deprecated RENAME TO functions;
-- DROP TABLE functions_backup;
-- DROP TABLE use_cases_backup;
-- COMMIT;
```

---

## Backend Changes

### 1. Update TypeScript Types

**File:** `src/types/use-case.ts`

```typescript
export interface UseCase {
  id: string;
  product_id: string;  // CHANGED: was function_id
  name: string;
  description: string | null;
  current_model_id: string | null;

  // Priority & requirements (moved from Function)
  priority: 'critical' | 'high' | 'medium' | 'low';
  latency_requirement_ms: number | null;
  quality_requirement: 'best' | 'good' | 'acceptable' | null;

  // Optimization priorities
  primary_need: PriorityNeed;
  secondary_need: PriorityNeed | null;
  tertiary_need: PriorityNeed | null;
  use_equal_weights: boolean;

  // Usage patterns (moved from Function)
  monthly_volume: number | null;
  avg_input_tokens: number | null;
  avg_output_tokens: number | null;

  // Technical requirements (SIMPLIFIED)
  required_context: number;
  estimated_monthly_tokens: number | null;
  estimated_monthly_spend: number | null;

  // Capabilities (SIMPLIFIED - removed input_type, output_type, requires_streaming)
  requires_vision: boolean;
  requires_function_calling: boolean;
  requires_json_mode: boolean;  // NEW

  // Optimization tracking
  monthly_cost_current: number | null;
  monthly_cost_optimized: number | null;
  last_analyzed_at: string | null;

  // Lifecycle
  status: 'active' | 'archived' | 'draft';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateUseCaseInput {
  name: string;
  description?: string | null;
  current_model_id?: string | null;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  latency_requirement_ms?: number | null;
  quality_requirement?: 'best' | 'good' | 'acceptable' | null;
  primary_need: PriorityNeed;
  secondary_need?: PriorityNeed | null;
  tertiary_need?: PriorityNeed | null;
  use_equal_weights?: boolean;
  monthly_volume?: number | null;
  avg_input_tokens?: number | null;
  avg_output_tokens?: number | null;
  required_context?: number;
  estimated_monthly_tokens?: number | null;
  requires_vision?: boolean;
  requires_function_calling?: boolean;
  requires_json_mode?: boolean;
}

// DELETED: src/types/function.ts (entire file)
```

### 2. API Endpoints

#### New/Updated Endpoints

**File:** `src/app/api/products/[id]/use-cases/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify product ownership
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Fetch use cases directly (no function join needed)
  const { data: useCases, error } = await supabase
    .from('use_cases')
    .select(`
      *,
      current_model:models(id, name, display_name)
    `)
    .eq('product_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(useCases);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify product ownership
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const body = await request.json();

  // Insert use case directly under product (no function)
  const { data: useCase, error } = await supabase
    .from('use_cases')
    .insert({
      product_id: productId,
      name: body.name,
      description: body.description,
      current_model_id: body.current_model_id,
      priority: body.priority || 'medium',
      latency_requirement_ms: body.latency_requirement_ms,
      quality_requirement: body.quality_requirement,
      primary_need: body.primary_need,
      secondary_need: body.secondary_need,
      tertiary_need: body.tertiary_need,
      use_equal_weights: body.use_equal_weights || false,
      monthly_volume: body.monthly_volume,
      avg_input_tokens: body.avg_input_tokens,
      avg_output_tokens: body.avg_output_tokens,
      required_context: body.required_context || 4096,
      estimated_monthly_tokens: body.estimated_monthly_tokens,
      requires_vision: body.requires_vision || false,
      requires_function_calling: body.requires_function_calling || false,
      requires_json_mode: body.requires_json_mode || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(useCase, { status: 201 });
}
```

**File:** `src/app/api/use-cases/[id]/route.ts` (update existing)

```typescript
// Update PATCH to handle new fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Update use case (now includes function fields)
  const { data: useCase, error } = await supabase
    .from('use_cases')
    .update({
      name: body.name,
      description: body.description,
      current_model_id: body.current_model_id,
      priority: body.priority,
      latency_requirement_ms: body.latency_requirement_ms,
      quality_requirement: body.quality_requirement,
      primary_need: body.primary_need,
      secondary_need: body.secondary_need,
      tertiary_need: body.tertiary_need,
      use_equal_weights: body.use_equal_weights,
      monthly_volume: body.monthly_volume,
      avg_input_tokens: body.avg_input_tokens,
      avg_output_tokens: body.avg_output_tokens,
      required_context: body.required_context,
      estimated_monthly_tokens: body.estimated_monthly_tokens,
      requires_vision: body.requires_vision,
      requires_function_calling: body.requires_function_calling,
      requires_json_mode: body.requires_json_mode,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(useCase);
}
```

#### Deprecated Endpoints (Keep for 90 Days)

**File:** `src/app/api/products/[id]/functions/route.ts`

```typescript
// DEPRECATED: This endpoint is maintained for backwards compatibility
// Will be removed on 2026-04-25 (90 days from launch)
// Use /api/products/[id]/use-cases instead

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Add deprecation header
  const response = NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/products/[id]/use-cases instead.' },
    {
      status: 410,
      headers: {
        'X-Deprecated': 'true',
        'X-Deprecation-Date': '2026-01-25',
        'X-Sunset-Date': '2026-04-25',
        'X-Replacement': '/api/products/[id]/use-cases'
      }
    }
  );

  return response;
}
```

---

## Frontend Changes

### 1. Product Detail View

**File:** `src/components/products/product-detail-view.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import { ProductForm } from './product-form';
import { UseCaseList } from '@/components/use-cases';  // CHANGED: was FunctionList
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// ... rest of imports

export function ProductDetailView({ product: initialProduct }: ProductDetailViewProps) {
  // ... existing state and handlers

  return (
    <div className="space-y-6">
      {/* Header - unchanged */}

      {/* Product Details */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Basic information about this product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ... existing details */}
          </CardContent>
        </Card>

        {/* CHANGED: Use Cases (was Functions) */}
        <Card>
          <CardHeader>
            <CardTitle>AI Use Cases</CardTitle>
            <CardDescription>
              AI capabilities and models used in this product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UseCaseList productId={product.id} />
          </CardContent>
        </Card>
      </div>

      {/* Forms - unchanged */}
    </div>
  );
}
```

### 2. Use Case List Component

**File:** `src/components/use-cases/use-case-list.tsx`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { UseCase, CreateUseCaseInput } from '@/types/use-case';
import { UseCaseCard } from './use-case-card';
import { UseCaseForm } from './use-case-form';
// ... rest of imports

interface UseCaseListProps {
  productId: string;  // CHANGED: was functionId
}

export function UseCaseList({ productId }: UseCaseListProps) {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  // ... rest of state

  const fetchUseCases = useCallback(async () => {
    try {
      // CHANGED: API endpoint
      const response = await fetch(`/api/products/${productId}/use-cases`);
      if (!response.ok) throw new Error('Failed to fetch use cases');
      const data = await response.json();
      setUseCases(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load use cases',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [productId, toast]);

  // ... rest of component

  const handleCreate = async (data: CreateUseCaseInput) => {
    // CHANGED: API endpoint
    const response = await fetch(`/api/products/${productId}/use-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create use case');
    }

    toast({
      title: 'Success',
      description: 'Use case created successfully',
    });
    fetchUseCases();
  };

  // ... rest of handlers and render
}
```

### 3. Use Case Form

**File:** `src/components/use-cases/use-case-form.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  UseCase,
  CreateUseCaseInput,
  PRIORITY_NEEDS,
  PRIORITY_NEED_LABELS,
  PriorityNeed,
} from '@/types/use-case';
// ... rest of imports

export function UseCaseForm({ open, onOpenChange, useCase, onSubmit }: UseCaseFormProps) {
  // Existing state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentModelId, setCurrentModelId] = useState<string>('__none__');

  // NEW: Priority fields (moved from function)
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [latencyRequirement, setLatencyRequirement] = useState('');
  const [qualityRequirement, setQualityRequirement] = useState<string>('__none__');

  // Existing optimization fields
  const [primaryNeed, setPrimaryNeed] = useState<PriorityNeed>('quality');
  const [secondaryNeed, setSecondaryNeed] = useState<string>('__none__');

  // NEW: Usage fields (moved from function)
  const [monthlyVolume, setMonthlyVolume] = useState('');
  const [avgInputTokens, setAvgInputTokens] = useState('');
  const [avgOutputTokens, setAvgOutputTokens] = useState('');

  // Existing technical fields
  const [requiredContext, setRequiredContext] = useState('4096');
  const [estimatedMonthlyTokens, setEstimatedMonthlyTokens] = useState('');

  // SIMPLIFIED: Capabilities (removed input_type, output_type, requires_streaming)
  const [requiresVision, setRequiresVision] = useState(false);
  const [requiresFunctionCalling, setRequiresFunctionCalling] = useState(false);
  const [requiresJsonMode, setRequiresJsonMode] = useState(false);  // NEW

  // ... rest of state

  useEffect(() => {
    if (useCase) {
      setName(useCase.name);
      setDescription(useCase.description || '');
      setCurrentModelId(useCase.current_model_id || '__none__');
      setPriority(useCase.priority);
      setLatencyRequirement(useCase.latency_requirement_ms?.toString() || '');
      setQualityRequirement(useCase.quality_requirement || '__none__');
      setPrimaryNeed(useCase.primary_need);
      setSecondaryNeed(useCase.secondary_need || '__none__');
      setMonthlyVolume(useCase.monthly_volume?.toString() || '');
      setAvgInputTokens(useCase.avg_input_tokens?.toString() || '');
      setAvgOutputTokens(useCase.avg_output_tokens?.toString() || '');
      setRequiredContext(useCase.required_context?.toString() || '4096');
      setEstimatedMonthlyTokens(useCase.estimated_monthly_tokens?.toString() || '');
      setRequiresVision(useCase.requires_vision);
      setRequiresFunctionCalling(useCase.requires_function_calling);
      setRequiresJsonMode(useCase.requires_json_mode || false);
    } else {
      // Reset all fields
      setName('');
      setDescription('');
      setCurrentModelId('__none__');
      setPriority('medium');
      setLatencyRequirement('');
      setQualityRequirement('__none__');
      setPrimaryNeed('quality');
      setSecondaryNeed('__none__');
      setMonthlyVolume('');
      setAvgInputTokens('');
      setAvgOutputTokens('');
      setRequiredContext('4096');
      setEstimatedMonthlyTokens('');
      setRequiresVision(false);
      setRequiresFunctionCalling(false);
      setRequiresJsonMode(false);
    }
  }, [useCase, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        description: description || null,
        current_model_id: currentModelId && currentModelId !== '__none__' ? currentModelId : null,
        priority,
        latency_requirement_ms: latencyRequirement ? parseInt(latencyRequirement) : null,
        quality_requirement: qualityRequirement && qualityRequirement !== '__none__'
          ? qualityRequirement as 'best' | 'good' | 'acceptable'
          : null,
        primary_need: primaryNeed,
        secondary_need: secondaryNeed && secondaryNeed !== '__none__' ? secondaryNeed as PriorityNeed : null,
        monthly_volume: monthlyVolume ? parseInt(monthlyVolume) : null,
        avg_input_tokens: avgInputTokens ? parseInt(avgInputTokens) : null,
        avg_output_tokens: avgOutputTokens ? parseInt(avgOutputTokens) : null,
        required_context: parseInt(requiredContext) || 4096,
        estimated_monthly_tokens: estimatedMonthlyTokens ? parseInt(estimatedMonthlyTokens) : null,
        requires_vision: requiresVision,
        requires_function_calling: requiresFunctionCalling,
        requires_json_mode: requiresJsonMode,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Use Case' : 'Add Use Case'}</SheetTitle>
            <SheetDescription>
              Define an AI capability with its requirements and current model.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Trading Strategy Generation"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this AI capability do?"
                rows={3}
              />
            </div>

            {/* Priority & Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quality">Quality Level</Label>
                <Select value={qualityRequirement} onValueChange={setQualityRequirement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="best">Best</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="acceptable">Acceptable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Model Selection */}
            <div className="grid gap-2">
              <Label htmlFor="current-model">Current Model</Label>
              <Select
                value={currentModelId}
                onValueChange={setCurrentModelId}
                disabled={isLoadingModels}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingModels ? 'Loading...' : 'Select model'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No model selected</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Which model are you currently using?
              </p>
            </div>

            {/* What Matters Most */}
            <div className="grid gap-2">
              <Label htmlFor="primary-need">What Matters Most *</Label>
              <Select value={primaryNeed} onValueChange={(value) => setPrimaryNeed(value as PriorityNeed)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_NEEDS.map((need) => (
                    <SelectItem key={need} value={need}>
                      {PRIORITY_NEED_LABELS[need]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="secondary-need">Second Priority (Optional)</Label>
              <Select value={secondaryNeed} onValueChange={setSecondaryNeed}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {PRIORITY_NEEDS.filter(n => n !== primaryNeed).map((need) => (
                    <SelectItem key={need} value={need}>
                      {PRIORITY_NEED_LABELS[need]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usage Patterns */}
            <div className="grid gap-2">
              <Label>Usage Patterns</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Help us estimate costs and find optimizations
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="volume" className="text-xs">Monthly Requests</Label>
                  <Input
                    id="volume"
                    type="number"
                    min="0"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(e.target.value)}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label htmlFor="input-tokens" className="text-xs">Avg Input Tokens</Label>
                  <Input
                    id="input-tokens"
                    type="number"
                    min="0"
                    value={avgInputTokens}
                    onChange={(e) => setAvgInputTokens(e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="output-tokens" className="text-xs">Avg Output Tokens</Label>
                  <Input
                    id="output-tokens"
                    type="number"
                    min="0"
                    value={avgOutputTokens}
                    onChange={(e) => setAvgOutputTokens(e.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="context">Max Context (tokens)</Label>
                <Input
                  id="context"
                  type="number"
                  min="0"
                  value={requiredContext}
                  onChange={(e) => setRequiredContext(e.target.value)}
                  placeholder="4096"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="latency">Max Latency (ms)</Label>
                <Input
                  id="latency"
                  type="number"
                  min="0"
                  value={latencyRequirement}
                  onChange={(e) => setLatencyRequirement(e.target.value)}
                  placeholder="2000"
                />
              </div>
            </div>

            {/* SIMPLIFIED Capabilities */}
            <div className="space-y-3">
              <Label>Required Capabilities</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vision"
                  checked={requiresVision}
                  onCheckedChange={(checked) => setRequiresVision(checked === true)}
                />
                <label htmlFor="vision" className="text-sm">
                  Vision / Image Analysis
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="function-calling"
                  checked={requiresFunctionCalling}
                  onCheckedChange={(checked) => setRequiresFunctionCalling(checked === true)}
                />
                <label htmlFor="function-calling" className="text-sm">
                  Function / Tool Calling
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="json-mode"
                  checked={requiresJsonMode}
                  onCheckedChange={(checked) => setRequiresJsonMode(checked === true)}
                />
                <label htmlFor="json-mode" className="text-sm">
                  Structured JSON Output
                </label>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Use Case'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

### 4. Use Case Card (Enhanced)

**File:** `src/components/use-cases/use-case-card.tsx`

```typescript
'use client';

import { UseCase } from '@/types/use-case';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, TrendingDown, CheckCircle } from 'lucide-react';
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

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function UseCaseCard({ useCase, onEdit, onDelete }: UseCaseCardProps) {
  const hasOptimization = useCase.monthly_cost_optimized
    && useCase.monthly_cost_current
    && useCase.monthly_cost_optimized < useCase.monthly_cost_current;

  const monthlySavings = hasOptimization
    ? useCase.monthly_cost_current! - useCase.monthly_cost_optimized!
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">{useCase.name}</CardTitle>
              <Badge className={PRIORITY_COLORS[useCase.priority]} variant="outline">
                {useCase.priority}
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
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Model & Cost */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {useCase.current_model?.display_name || 'No model selected'}
              </p>
              {useCase.monthly_cost_current && (
                <p className="text-sm text-muted-foreground">
                  ${useCase.monthly_cost_current.toFixed(2)}/mo
                </p>
              )}
            </div>
            {hasOptimization && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span>Save ${monthlySavings.toFixed(2)}/mo</span>
              </div>
            )}
            {!hasOptimization && useCase.monthly_cost_current && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Optimized</span>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          {(useCase.monthly_volume || useCase.avg_input_tokens || useCase.avg_output_tokens) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {useCase.monthly_volume && (
                <div>• {useCase.monthly_volume.toLocaleString()} requests/mo</div>
              )}
              {(useCase.avg_input_tokens || useCase.avg_output_tokens) && (
                <div>
                  • Avg {useCase.avg_input_tokens || 0}→{useCase.avg_output_tokens || 0} tokens
                </div>
              )}
              {useCase.latency_requirement_ms && (
                <div>• Latency: &lt;{useCase.latency_requirement_ms}ms</div>
              )}
            </div>
          )}

          {/* Capabilities */}
          {(useCase.requires_vision || useCase.requires_function_calling || useCase.requires_json_mode) && (
            <div className="flex flex-wrap gap-1">
              {useCase.requires_vision && (
                <Badge variant="secondary" className="text-xs">Vision</Badge>
              )}
              {useCase.requires_function_calling && (
                <Badge variant="secondary" className="text-xs">Functions</Badge>
              )}
              {useCase.requires_json_mode && (
                <Badge variant="secondary" className="text-xs">JSON</Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. Delete Old Components

**Files to DELETE:**
- `src/components/functions/function-list.tsx`
- `src/components/functions/function-card.tsx`
- `src/components/functions/function-form.tsx`
- `src/components/functions/index.ts`
- `src/types/function.ts`
- `src/app/(dashboard)/products/[id]/functions/[functionId]/page.tsx` (entire route)
- `src/app/api/products/[id]/functions/route.ts` (mark deprecated, but keep for 90 days)
- `src/app/api/functions/[id]/route.ts` (mark deprecated, but keep for 90 days)

---

## Documentation Updates

### 1. Update Architecture Documentation

**File:** `architecture.md` or `docs/architecture.md`

Find and update section about data model:

```markdown
## Data Model

### Core Entities

#### Products
User's AI applications or services being optimized.

**Fields:** name, description, icon, category, status

#### Use Cases (formerly Functions + Use Cases)
AI capabilities within a product. Each use case represents one specific AI task with an assigned model.

**Key Fields:**
- `product_id` - Direct link to product
- `current_model_id` - LLM currently being used
- `priority` - Business importance (critical/high/medium/low)
- `primary_need` - What matters most (cost/speed/quality/trust/context)
- `monthly_volume`, `avg_input_tokens`, `avg_output_tokens` - Usage patterns
- `requires_vision`, `requires_function_calling`, `requires_json_mode` - Capabilities
- `required_context` - Maximum context window needed
- `latency_requirement_ms` - Maximum acceptable latency

**Relationship:**
```
Product (1) → (many) Use Cases
```

**Note:** Previously, there was an intermediate "Functions" layer between Products and Use Cases. This was eliminated in January 2026 to simplify the data model and improve UX.

#### Models
Catalog of available LLMs with pricing, capabilities, and benchmarks.

#### Opportunities
Optimization recommendations linking use cases to alternative models.

**Relationship:**
```
Use Case (1) → (many) Opportunities
```
```

### 2. Update README

**File:** `README.md`

Find quick start section and update:

```markdown
## Quick Start

1. **Create a Product** - Your AI application (e.g., "Trading Bot")
2. **Add Use Cases** - AI capabilities within your product:
   - Trading Strategy Generation (GPT-4)
   - Sentiment Analysis (Claude Sonnet)
   - Risk Management (Claude Haiku)
3. **Get Recommendations** - ModelOptix analyzes your use cases and suggests cheaper alternatives
4. **Test Alternatives** - Side-by-side sanity checks before switching
5. **Save Money** - Switch to optimized models with confidence

### Data Structure

```
Product
├─ Use Case 1 (Trading Strategy → GPT-4)
├─ Use Case 2 (Sentiment Analysis → Claude Sonnet)
└─ Use Case 3 (Risk Management → Claude Haiku)
```

Each use case tracks:
- Current model and costs
- Usage patterns (volume, tokens)
- Requirements (latency, capabilities)
- Optimization opportunities
```

### 3. Create Migration Guide for Users

**File:** `docs/migration-guide-functions-to-use-cases.md`

```markdown
# Migration Guide: Functions → Use Cases

**Date:** January 2026
**Affects:** All users

## What Changed

We've simplified ModelOptix by eliminating the "Functions" layer. Now you work directly with **Use Cases** under each Product.

### Before
```
Product → Function → Use Case (with model)
```

### After
```
Product → Use Case (with model)
```

## What This Means for You

### Your Data is Safe
All your existing data has been automatically migrated:
- Your Functions became Use Cases
- All settings, models, and optimizations preserved
- No action required on your part

### Improved Workflow
- **Faster setup:** Create use cases directly under products
- **Better visibility:** See all your AI capabilities and their costs at a glance
- **Simpler navigation:** No intermediate function pages to click through

## Example

**Before:**
1. Create Product: "Trading Bot"
2. Create Function: "Trading Strategy"
3. Create Use Case: "Generate Strategy" (select GPT-4)
4. Create Function: "Sentiment Analysis"
5. Create Use Case: "Analyze News" (select Claude)

**After:**
1. Create Product: "Trading Bot"
2. Create Use Case: "Trading Strategy" (select GPT-4)
3. Create Use Case: "Sentiment Analysis" (select Claude)

## FAQ

**Q: What happened to my Functions?**
A: They were automatically converted to Use Cases. All your data is preserved.

**Q: Do I need to update anything?**
A: No. Everything has been migrated automatically.

**Q: Can I still access the old Function pages?**
A: Old URLs redirect to the new structure. Update your bookmarks if needed.

**Q: What if I used the API?**
A: Old API endpoints work but are deprecated. Update to new endpoints by April 2026.
```

---

## Testing Checklist

### Database Migration Testing

- [ ] **Backup verification**
  - [ ] Full production database backup created
  - [ ] Backup verified and downloadable

- [ ] **Staging migration**
  - [ ] Run migration on staging database
  - [ ] Verify all use_cases have product_id populated
  - [ ] Verify function fields merged correctly
  - [ ] Verify orphaned functions converted to use cases
  - [ ] Verify capabilities migrated (output_type='json' → requires_json_mode)
  - [ ] Check no data loss (row counts match)

- [ ] **RLS policies**
  - [ ] Test user can only see their own use cases
  - [ ] Test user cannot access other users' use cases
  - [ ] Test insert/update/delete permissions work correctly

### Backend Testing

- [ ] **API endpoints**
  - [ ] GET `/api/products/:id/use-cases` returns use cases
  - [ ] POST `/api/products/:id/use-cases` creates use case with all new fields
  - [ ] PATCH `/api/use-cases/:id` updates all fields correctly
  - [ ] DELETE `/api/use-cases/:id` works
  - [ ] Old function endpoints return 410 deprecation responses

- [ ] **Data validation**
  - [ ] priority field validates enum values
  - [ ] primary_need field validates enum values
  - [ ] requires_* booleans default to false
  - [ ] product_id is required and validated

### Frontend Testing

- [ ] **Product detail page**
  - [ ] Shows use cases (not functions)
  - [ ] Use case cards display correctly with new fields
  - [ ] Cost information shows correctly
  - [ ] Optimization indicators show correctly

- [ ] **Use case form**
  - [ ] All new fields (priority, usage patterns) display
  - [ ] Simplified capabilities checkboxes work
  - [ ] Form validation works
  - [ ] Create use case succeeds
  - [ ] Edit use case preserves all fields

- [ ] **Use case list**
  - [ ] Fetches from correct endpoint
  - [ ] Displays all use cases
  - [ ] Edit/delete work correctly
  - [ ] Empty state shows correctly

### Production Migration Testing

- [ ] **Pre-migration**
  - [ ] Full production backup created and verified
  - [ ] Rollback script tested on staging
  - [ ] Maintenance mode enabled (optional)

- [ ] **Post-migration**
  - [ ] Verify row counts (use_cases count = old use_cases + orphaned functions)
  - [ ] Spot check 10 random use cases for data integrity
  - [ ] Test critical user journeys (create/edit/delete use case)
  - [ ] Monitor error logs for 24 hours

- [ ] **User communication**
  - [ ] Migration announcement sent
  - [ ] Migration guide published
  - [ ] Support team briefed

---

## Deployment Sequence

### Pre-Deployment

1. **Notify users** (48 hours before)
   - Email announcement of improvement
   - Link to migration guide
   - Expected downtime (if any)

2. **Prepare backups**
   - Full production database backup
   - Verify backup integrity
   - Test restore on staging

3. **Final staging test**
   - Run complete migration on staging
   - Full regression test
   - Performance test

### Deployment Day

**Staging Environment:**
1. ✅ Deploy backend changes (API updates)
2. ✅ Deploy frontend changes (UI updates)
3. ✅ Run database migration
4. ✅ Smoke test (create/edit/delete use case)
5. ✅ Verify with QA

**Production Environment:**
1. Enable maintenance mode (optional, 5-10 min downtime)
2. Create production database backup
3. Run database migration script
4. Verify migration success (row counts, spot checks)
5. Deploy backend changes
6. Deploy frontend changes
7. Disable maintenance mode
8. Monitor logs for errors
9. Test critical paths (create/edit use case)

### Post-Deployment

1. **Monitor** (24 hours)
   - Error logs
   - User feedback
   - Support tickets

2. **Communicate success**
   - Email users: migration complete
   - Update status page

3. **Cleanup schedule**
   - Day 30: Remove old tables (functions_deprecated)
   - Day 90: Remove deprecated API endpoints

---

## Rollback Plan

### If Migration Fails

```sql
BEGIN;

-- Restore from backup tables
DROP TABLE use_cases;
ALTER TABLE use_cases_backup RENAME TO use_cases;
ALTER TABLE functions_deprecated RENAME TO functions;

-- Restore indexes
CREATE INDEX idx_use_cases_function_id ON use_cases(function_id);
-- ... other indexes

-- Restore RLS policies
-- ... restore old policies

COMMIT;
```

### If Issues Found After Deployment

1. **Minor issues (UI bugs, missing fields):**
   - Hotfix and deploy
   - No rollback needed

2. **Major issues (data loss, broken workflows):**
   - Enable maintenance mode
   - Run rollback script
   - Deploy previous frontend version
   - Restore from backup if needed
   - Investigate and fix
   - Re-attempt migration after fix

---

## Success Criteria

### Technical
- ✅ Zero data loss (all functions and use cases preserved)
- ✅ All RLS policies working correctly
- ✅ API endpoints responding correctly
- ✅ UI fully functional
- ✅ No critical errors in logs

### User Experience
- ✅ Users can create use cases without confusion
- ✅ Product detail page shows all use cases clearly
- ✅ Form is easier to complete (< 3 minutes)
- ✅ Cost visibility improved

### Business
- ✅ Support tickets about "where do I enter X" reduced by 40%
- ✅ Form abandonment reduced by 30%
- ✅ User satisfaction with data entry improved

---

## Support Considerations

### Common User Questions

**Q: Where did my Functions go?**
A: They're now called Use Cases and are directly under your Products. All your data is safe.

**Q: I can't find the Function page.**
A: We simplified the structure. Use Cases are now on the Product detail page.

**Q: Do I need to re-enter my data?**
A: No, everything was automatically migrated.

**Q: The form looks different.**
A: We combined Function and Use Case forms into one simpler form.

### Support Documentation Updates

- [ ] Update help docs with new screenshots
- [ ] Update onboarding flow
- [ ] Create "What's New" announcement
- [ ] Brief support team on changes
- [ ] Prepare canned responses for common questions

---

## Timeline (Sequence Only)

**Phase 1: Database**
1. Create migration script
2. Test on staging
3. Create rollback script
4. Verify RLS policies

**Phase 2: Backend**
1. Update TypeScript types
2. Update API endpoints
3. Add deprecation warnings to old endpoints
4. Test API integration

**Phase 3: Frontend**
1. Update ProductDetailView
2. Update UseCaseList component
3. Update UseCaseForm
4. Update UseCaseCard
5. Delete old Function components
6. Delete old Function routes

**Phase 4: Documentation**
1. Update architecture docs
2. Update README
3. Create migration guide
4. Update API docs
5. Update help center

**Phase 5: Testing**
1. Database migration testing
2. Backend integration testing
3. Frontend E2E testing
4. UAT (user acceptance testing)

**Phase 6: Deployment**
1. Notify users (48h before)
2. Deploy to staging
3. Final staging verification
4. Deploy to production
5. Monitor and verify

**Phase 7: Cleanup**
1. Monitor for 1 week
2. Drop old tables (after 30 days)
3. Remove deprecated endpoints (after 90 days)

---

## Contact & Questions

**Sprint Owner:** [User's name]
**Developer:** [Agent executing this sprint]
**Start Date:** [When sprint begins]
**Target Completion:** [Based on actual work, not made-up timeline]

For questions during implementation:
- Check analysis documents first
- Review this sprint doc thoroughly
- Ask clarifying questions before proceeding

---

## Appendix: Key Files Reference

### Database
- `supabase/migrations/00X_eliminate_functions_layer.sql` - Migration script
- `supabase/migrations/001_initial_schema.sql` - Original schema (for reference)

### Types
- `src/types/use-case.ts` - Enhanced UseCase type
- `src/types/function.ts` - DELETE this file

### API Routes
- `src/app/api/products/[id]/use-cases/route.ts` - New endpoint
- `src/app/api/use-cases/[id]/route.ts` - Enhanced endpoint
- `src/app/api/products/[id]/functions/route.ts` - DEPRECATE (keep 90 days)

### Components
- `src/components/use-cases/use-case-list.tsx` - Updated
- `src/components/use-cases/use-case-form.tsx` - Updated (enhanced)
- `src/components/use-cases/use-case-card.tsx` - Updated (enhanced)
- `src/components/functions/*` - DELETE all

### Pages
- `src/app/(dashboard)/products/[id]/page.tsx` - Updated
- `src/app/(dashboard)/products/[id]/functions/[functionId]/page.tsx` - DELETE

### Documentation
- `analysis-products-functions-usecases.md` - Original analysis
- `simplified-structure-proposal.md` - Detailed proposal
- `docs/migration-guide-functions-to-use-cases.md` - User guide (create)
- `README.md` - Update quick start
- `architecture.md` - Update data model section

---

**End of Sprint Document**

*This sprint eliminates unnecessary complexity and aligns ModelOptix's data structure with how users actually think about their AI capabilities. The result is a faster, clearer, and more intuitive experience.*
