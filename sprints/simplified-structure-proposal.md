# Simplified Structure: Product → Use Cases

**Decision:** Eliminate Functions layer entirely
**Date:** 2026-01-25

---

## New Data Structure

### Database Schema Changes

#### use_cases table (enhanced)
```sql
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

  -- What matters most for this use case
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

  -- Technical requirements
  required_context INTEGER DEFAULT 4096,
  estimated_monthly_tokens BIGINT,
  estimated_monthly_spend DECIMAL(10,2),
  input_type TEXT
    CHECK (input_type IN ('text', 'code', 'structured', 'multimodal')),
  output_type TEXT
    CHECK (output_type IN ('text', 'code', 'json', 'classification')),
  requires_vision BOOLEAN NOT NULL DEFAULT FALSE,
  requires_function_calling BOOLEAN NOT NULL DEFAULT FALSE,
  requires_streaming BOOLEAN NOT NULL DEFAULT FALSE,

  -- Optimization tracking
  monthly_cost_current DECIMAL(10,2),
  monthly_cost_optimized DECIMAL(10,2),
  last_analyzed_at TIMESTAMPTZ,

  -- Lifecycle
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'draft')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional: Grouping/categorization within product
  category TEXT,  -- e.g., 'customer-facing', 'internal', 'analytics'
  tags TEXT[]     -- e.g., ['high-volume', 'critical-path']
);

-- Indexes
CREATE INDEX idx_use_cases_product_id ON use_cases(product_id) WHERE status = 'active';
CREATE INDEX idx_use_cases_current_model ON use_cases(current_model_id) WHERE current_model_id IS NOT NULL;
CREATE INDEX idx_use_cases_category ON use_cases(category) WHERE category IS NOT NULL;
```

#### functions table
```sql
-- TO BE DELETED after migration
DROP TABLE functions CASCADE;
```

---

## UI Mockup: Product Detail Page

### Before (Current - 3 levels)
```
┌─────────────────────────────────────────────────────────────┐
│ Trading Bot                                        [Active] │
├─────────────────────────────────────────────────────────────┤
│ Description: Automated trading system                       │
│ Created: Jan 15, 2026                                       │
└─────────────────────────────────────────────────────────────┘

Functions (3)
┌──────────────────────────────┐ ┌──────────────────────────┐
│ Trading Strategy        [>]  │ │ Sentiment Analysis  [>]  │
│ Generate trading strategies  │ │ Analyze market news      │
│                              │ │                          │
│ 1 use case                   │ │ 1 use case               │
└──────────────────────────────┘ └──────────────────────────┘

(User must click [>] to see which models are used)
```

### After (Simplified - 2 levels)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Trading Bot                                                      [Active]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Description: Automated trading system                                       │
│ Created: Jan 15, 2026                                                       │
│                                                                             │
│ Monthly AI Costs: $280  |  Potential Savings: $35/mo (12%)                │
└─────────────────────────────────────────────────────────────────────────────┘

AI Use Cases (5)                                          [+ Add Use Case]
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ Trading Strategy Generation                         [Critical]      [...] │
│ GPT-4                                   $120/mo  |  🔍 Save $15/mo          │
│ Generates trading strategies based on market data                           │
│ • 50K requests/mo  • Avg 2K→500 tokens  • Latency: <2s                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Sentiment Analysis                                 [High]          [...] │
│ Claude Sonnet                            $45/mo  |  ✅ Optimized            │
│ Analyzes news sentiment for trading signals                                 │
│ • 100K requests/mo  • Avg 1K→200 tokens  • Latency: <1s                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 💼 Trade Proposals                                    [High]          [...] │
│ GPT-4                                    $80/mo  |  🔍 Save $12/mo          │
│ Proposes specific trades based on strategy                                  │
│ • 30K requests/mo  • Avg 1.5K→300 tokens                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ✓ Trade Validation                                    [Medium]        [...] │
│ GPT-3.5 Turbo                            $20/mo  |  ✅ Optimized            │
│ Validates proposed trades for risk                                          │
│ • 30K requests/mo  • Avg 800→150 tokens                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ Risk Management                                    [Critical]      [...] │
│ Claude Haiku                             $15/mo  |  ✅ Optimized            │
│ Continuous risk assessment and portfolio rebalancing                        │
│ • 200K requests/mo  • Avg 500→100 tokens  • Latency: <500ms                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key improvements:**
- Everything visible at a glance (no clicking to see models)
- Immediate cost visibility
- Optimization opportunities inline
- Usage stats visible
- Icons for quick scanning
- Priority badges visible

---

## UI Mockup: Add/Edit Use Case Form

### Simplified Single Form
```
┌─────────────────────────────────────────────────────────────────┐
│ Add Use Case                                               [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Basic Information                                               │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Name *                                                  │    │
│ │ e.g., "Trading Strategy Generation"                     │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Description                                             │    │
│ │ What does this AI capability do?                        │    │
│ │                                                         │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ ┌───────────────────────┐  ┌───────────────────────────────┐  │
│ │ Priority *        [v] │  │ Category (optional)      [v] │  │
│ │ Critical              │  │ Customer-facing              │  │
│ └───────────────────────┘  └───────────────────────────────┘  │
│                                                                 │
│ Current Model                                                   │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Which model are you currently using? *             [v] │    │
│ │ GPT-4                                                   │    │
│ └─────────────────────────────────────────────────────────┘    │
│ This helps us find cheaper alternatives                        │
│                                                                 │
│ What Matters Most                                               │
│ ┌───────────────────────┐  ┌───────────────────────────────┐  │
│ │ Primary Need *    [v] │  │ Secondary Need (opt)     [v] │  │
│ │ Cost Savings          │  │ Speed                        │  │
│ └───────────────────────┘  └───────────────────────────────┘  │
│                                                                 │
│ [ ] Use equal weights (instead of prioritizing)                │
│                                                                 │
│ Usage Patterns                                                  │
│ ┌───────────────────────┐  ┌───────────────────────────────┐  │
│ │ Monthly Requests      │  │ Avg Input Tokens             │  │
│ │ 50000                 │  │ 2000                         │  │
│ └───────────────────────┘  └───────────────────────────────┘  │
│                                                                 │
│ ┌───────────────────────┐  ┌───────────────────────────────┐  │
│ │ Avg Output Tokens     │  │ Max Context Needed           │  │
│ │ 500                   │  │ 4096                         │  │
│ └───────────────────────┘  └───────────────────────────────┘  │
│                                                                 │
│ Estimated Monthly Cost: $120                                   │
│ (Based on GPT-4 pricing: $0.03/1K input, $0.06/1K output)     │
│                                                                 │
│ Technical Requirements                                          │
│ ┌───────────────────────┐  ┌───────────────────────────────┐  │
│ │ Input Type        [v] │  │ Output Type              [v] │  │
│ │ Structured Data       │  │ JSON                         │  │
│ └───────────────────────┘  └───────────────────────────────┘  │
│                                                                 │
│ ┌───────────────────────┐                                      │
│ │ Latency Requirement   │  (optional)                         │
│ │ 2000 ms               │                                      │
│ └───────────────────────┘                                      │
│                                                                 │
│ Capabilities Required                                           │
│ [ ] Vision (image input)                                       │
│ [ ] Function/Tool Calling                                      │
│ [x] Streaming Response                                         │
│                                                                 │
│ Quality Requirements (optional)                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Quality Level                                       [v] │    │
│ │ Best (highest quality models only)                      │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                                              [Cancel] [Save]   │
└─────────────────────────────────────────────────────────────────┘
```

**Form sections:**
1. **Basic Info** - Name, description, priority, category
2. **Model** - Current model selection
3. **Optimization Goals** - What matters most
4. **Usage** - Volume, tokens (for cost estimation)
5. **Technical** - Input/output types, latency, capabilities
6. **Quality** - Quality requirements

**Auto-calculations:**
- Estimated monthly cost calculated as user enters data
- Shows pricing breakdown
- Updates in real-time

---

## Products List Page (Enhanced)

### Current
```
Products (3)
┌──────────────────────┐ ┌──────────────────────┐
│ Trading Bot     [>]  │ │ Chat Assistant  [>]  │
│ 3 functions          │ │ 2 functions          │
└──────────────────────┘ └──────────────────────┘
```

### Simplified
```
Products (3)                                    [+ Add Product]
┌───────────────────────────────────────────────────────────────┐
│ Trading Bot                                        [Active]   │
│ 5 AI use cases  •  $280/mo  •  2 optimizations available     │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Chat Assistant                                     [Active]   │
│ 2 AI use cases  •  $45/mo  •  ✅ Fully optimized              │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Email Classifier                                   [Draft]    │
│ 1 AI use case  •  Not yet deployed                            │
└───────────────────────────────────────────────────────────────┘
```

**Shows immediately:**
- Number of use cases
- Total monthly cost
- Optimization status

---

## Migration Strategy

### Step 1: Database Migration
```sql
-- Create new use_cases table structure
CREATE TABLE use_cases_new (
  -- ... new schema as defined above
);

-- Migrate data
INSERT INTO use_cases_new (
  product_id,
  name,
  description,
  current_model_id,
  priority,
  latency_requirement_ms,
  quality_requirement,
  monthly_volume,
  avg_input_tokens,
  avg_output_tokens,
  primary_need,
  secondary_need,
  tertiary_need,
  use_equal_weights,
  required_context,
  estimated_monthly_tokens,
  estimated_monthly_spend,
  input_type,
  output_type,
  requires_vision,
  requires_function_calling,
  requires_streaming,
  monthly_cost_current,
  monthly_cost_optimized,
  last_analyzed_at,
  status,
  metadata,
  created_at,
  updated_at
)
SELECT
  f.product_id,
  COALESCE(uc.name, f.name) AS name,
  COALESCE(uc.description, f.description) AS description,
  uc.current_model_id,
  f.priority,
  f.latency_requirement_ms,
  f.quality_requirement,
  f.monthly_volume,
  f.avg_input_tokens,
  f.avg_output_tokens,
  COALESCE(uc.primary_need, 'quality') AS primary_need,
  uc.secondary_need,
  uc.tertiary_need,
  COALESCE(uc.use_equal_weights, FALSE) AS use_equal_weights,
  COALESCE(uc.required_context, 4096) AS required_context,
  uc.estimated_monthly_tokens,
  uc.estimated_monthly_spend,
  uc.input_type,
  uc.output_type,
  COALESCE(uc.requires_vision, FALSE) AS requires_vision,
  COALESCE(uc.requires_function_calling, FALSE) AS requires_function_calling,
  COALESCE(uc.requires_streaming, FALSE) AS requires_streaming,
  uc.monthly_cost_current,
  uc.monthly_cost_optimized,
  uc.last_analyzed_at,
  COALESCE(uc.status, 'active') AS status,
  COALESCE(uc.metadata, f.metadata, '{}') AS metadata,
  COALESCE(uc.created_at, f.created_at) AS created_at,
  GREATEST(COALESCE(uc.updated_at, f.updated_at), f.updated_at) AS updated_at
FROM functions f
LEFT JOIN use_cases uc ON uc.function_id = f.id;

-- Handle orphaned functions (no use cases)
-- These become use cases themselves
INSERT INTO use_cases_new (
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

-- Rename tables
ALTER TABLE use_cases RENAME TO use_cases_old;
ALTER TABLE use_cases_new RENAME TO use_cases;

-- Recreate indexes and triggers
-- ... (as defined in schema section)

-- Keep old tables for 30 days, then drop
-- DROP TABLE use_cases_old;
-- DROP TABLE functions;
```

### Step 2: Update Opportunities Table
```sql
-- Opportunities already link to use_case_id, so no change needed!
-- This is why the simplified structure works better -
-- the optimization engine already operates at the use case level
```

### Step 3: API Endpoint Migration

**Old endpoints (deprecated, but maintained for 90 days):**
- GET `/api/products/:id/functions`
- POST `/api/products/:id/functions`
- GET `/api/functions/:id`
- PATCH `/api/functions/:id`
- DELETE `/api/functions/:id`

**New endpoints:**
- GET `/api/products/:id/use-cases` (replaces `/functions`)
- POST `/api/products/:id/use-cases`
- GET `/api/use-cases/:id` (existing, enhanced)
- PATCH `/api/use-cases/:id` (existing, enhanced)
- DELETE `/api/use-cases/:id` (existing)

**Transition:**
- Old endpoints remain functional but deprecated
- Return deprecation headers
- Log usage for monitoring
- Remove after 90 days

---

## Implementation Checklist

### Phase 1: Database (Week 1)
- [ ] Create migration script for use_cases table
- [ ] Test migration on staging data
- [ ] Create rollback script
- [ ] Update RLS policies
- [ ] Update database triggers

### Phase 2: Backend (Week 2)
- [ ] Update `/api/products/:id/use-cases` endpoint
- [ ] Enhance `/api/use-cases/:id` endpoints
- [ ] Add deprecation warnings to old function endpoints
- [ ] Update TypeScript types
- [ ] Update server-side validation

### Phase 3: Frontend Components (Week 3-4)
- [ ] Update ProductDetailView (remove function layer)
- [ ] Create enhanced UseCaseCard component
- [ ] Update UseCaseForm (add function fields)
- [ ] Update ProductCard (show use case count, not function count)
- [ ] Update navigation (remove function detail pages)

### Phase 4: Testing (Week 5)
- [ ] Test data migration with production-like data
- [ ] Test all CRUD operations on use cases
- [ ] Test RLS policies
- [ ] Test opportunities still link correctly
- [ ] User acceptance testing

### Phase 5: Deployment (Week 6)
- [ ] Deploy to staging
- [ ] Notify users of upcoming change
- [ ] Run migration on production
- [ ] Monitor for issues
- [ ] Collect user feedback

---

## Optional Future Enhancements

### Grouping/Filtering (if needed for large use case lists)
```typescript
// Add to use_cases table
category?: 'customer-facing' | 'internal' | 'analytics' | 'automation'
tags?: string[]  // ['high-volume', 'critical-path', 'real-time']

// UI: Filter dropdown on product detail page
[All Use Cases v] [Critical Only] [Customer-Facing Only]
```

### Bulk Operations
```
Select multiple use cases:
[x] Trading Strategy
[x] Trade Proposals
[ ] Sentiment Analysis

Actions: [Optimize Selected] [Archive Selected] [Export]
```

### Use Case Templates
```
Quick Start Templates:
- "Content Generation" (GPT-4, text→text, streaming)
- "Code Review" (Claude, code→text, no streaming)
- "Image Analysis" (GPT-4V, multimodal→text)
- "JSON API" (GPT-3.5, structured→json)
```

---

## Success Criteria

### User Experience
- ✅ Users can see all AI use cases on product page without clicking
- ✅ Adding a use case takes < 3 minutes (down from 5+)
- ✅ Monthly costs visible at a glance
- ✅ Optimization opportunities visible inline

### Technical
- ✅ Zero data loss during migration
- ✅ API backwards compatible for 90 days
- ✅ RLS policies properly enforced
- ✅ All tests passing

### Business
- ✅ 50% reduction in "where do I enter X" support tickets
- ✅ 30% reduction in form abandonment
- ✅ Increased user engagement with optimization features

---

## Questions for Approval

1. **Does this UI direction match your vision?**
   - Inline optimization indicators?
   - Cost visibility on cards?
   - Icon usage?

2. **Should we include category/tags in initial implementation?**
   - Or add later if users request it?

3. **Timeline acceptable?**
   - 6 weeks for full implementation?

4. **Migration approach approved?**
   - Keep old tables for 30 days?
   - Deprecate old API endpoints for 90 days?

