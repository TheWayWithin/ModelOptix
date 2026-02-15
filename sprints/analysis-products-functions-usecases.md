# Analysis: Products, Functions, and Use Cases Relationship

**Date:** 2026-01-25
**Analyst:** Claude
**Purpose:** Evaluate current data model complexity and propose simplification

---

## Executive Summary

**You're absolutely right.** The current three-tier structure (Product → Function → Use Case) is overcomplicated. The core issue is that **a function fundamentally IS a use case with an LLM**. We've artificially separated what should be a single entity.

**Key Finding:** The current model creates unnecessary cognitive overhead and data entry friction without providing meaningful organizational benefit.

**Recommendation:** Flatten the structure to **Product → Use Cases** (eliminating Functions as a separate entity).

---

## Current Structure Analysis

### Current Hierarchy
```
Product (e.g., "Trading Bot")
  ├─ Function (e.g., "Trading Strategy")
  │   └─ Use Case (e.g., "Generate strategy with GPT-4", "Analyze with Claude")
  ├─ Function (e.g., "Sentiment Analysis")
  │   └─ Use Case (e.g., "Analyze news with GPT-3.5")
  └─ Function (e.g., "Trade Proposals")
      └─ Use Case (e.g., "Generate trades with GPT-4")
```

### Database Schema (Current)

**products table:**
- Basic product metadata (name, description, icon, category)
- No AI-specific fields

**functions table:**
- product_id (link to product)
- name, description
- priority, latency_requirement_ms, quality_requirement
- monthly_volume, avg_input_tokens, avg_output_tokens
- metadata

**use_cases table:**
- function_id (link to function)
- name, description
- **current_model_id** ← The actual LLM being used
- primary_need, secondary_need, tertiary_need
- required_context, estimated_monthly_tokens
- input_type, output_type
- requires_vision, requires_function_calling, requires_streaming
- monthly_cost_current, monthly_cost_optimized

### Problems Identified

#### 1. **Conceptual Confusion**
- Users must think: "Is 'Trading Strategy' a function or a use case?"
- In reality: Trading Strategy IS a use case that uses an LLM
- The distinction between function and use case is artificial

#### 2. **Data Duplication**
Functions table has:
- `monthly_volume`, `avg_input_tokens`, `avg_output_tokens`

Use Cases table has:
- `estimated_monthly_tokens`

**Which is the source of truth?** This creates confusion.

#### 3. **Model Assignment at Wrong Level**
- The `current_model_id` is on **use_cases**, not functions
- But functionally, each "function" (Trading Strategy, Sentiment Analysis) uses ONE primary model
- Multiple use cases per function implies testing alternatives, not normal usage

#### 4. **Navigation Complexity**
Users must navigate 3 levels to see LLM usage:
1. Click Product →
2. Click Function →
3. See Use Cases (where models are assigned)

This is 2 clicks too many for the primary use case: "What LLMs am I using and for what?"

#### 5. **Form Burden**
Creating a new AI capability requires:
1. Creating/selecting a Product
2. Creating a Function (with duplicate token/volume fields)
3. Creating a Use Case (with the actual model assignment)

This is exhausting for users.

---

## User Mental Model vs. System Model

### What Users Actually Think About:
1. **"I have a Trading Bot"** (Product)
2. **"It does 5 things with AI"**:
   - Trading Strategy Generation (uses GPT-4)
   - Sentiment Analysis (uses Claude Sonnet)
   - Trade Proposals (uses GPT-4)
   - Trade Validation (uses GPT-3.5)
   - Risk Management (uses Claude Haiku)

### What the System Forces Them to Think:
1. Product: Trading Bot
2. Function: Trading Strategy
3. Use Case: "Generate strategy" (GPT-4)
4. Function: Sentiment Analysis
5. Use Case: "Analyze news" (Claude Sonnet)
... etc

**Mismatch:** Users think in terms of "AI capabilities" (what we call use cases), not an intermediate "function" layer.

---

## What Users Actually Need to See

### Dashboard View (Ideal)
```
Trading Bot
├─ Trading Strategy → GPT-4 → $120/mo
├─ Sentiment Analysis → Claude Sonnet → $45/mo
├─ Trade Proposals → GPT-4 → $80/mo
├─ Trade Validation → GPT-3.5 → $20/mo
└─ Risk Management → Claude Haiku → $15/mo

Total: $280/mo
Optimization opportunities: 2
```

### What They See Now
```
Trading Bot
├─ Trading Strategy (click to see use cases)
│   └─ Use Case 1 → GPT-4 → $120/mo
├─ Sentiment Analysis (click to see use cases)
│   └─ Use Case 1 → Claude Sonnet → $45/mo
...
```

**Problem:** Extra layer obscures the information users actually care about.

---

## Proposed Simplified Structure

### New Hierarchy
```
Product (e.g., "Trading Bot")
  ├─ Use Case (e.g., "Trading Strategy" + GPT-4)
  ├─ Use Case (e.g., "Sentiment Analysis" + Claude Sonnet)
  ├─ Use Case (e.g., "Trade Proposals" + GPT-4)
  ├─ Use Case (e.g., "Trade Validation" + GPT-3.5)
  └─ Use Case (e.g., "Risk Management" + Claude Haiku)
```

### New Schema (Proposed)

**products table:** (unchanged)

**use_cases table:** (enhanced, absorbing function fields)
- product_id (direct link to product, no intermediate function)
- name (e.g., "Trading Strategy Generation")
- description
- **current_model_id** (the LLM being used)
- **priority** (moved from functions: critical/high/medium/low)
- **primary_need, secondary_need** (cost/speed/quality/trust/context)
- **latency_requirement_ms** (moved from functions)
- **quality_requirement** (moved from functions)
- **monthly_volume** (moved from functions)
- **avg_input_tokens, avg_output_tokens** (moved from functions)
- **required_context** (max tokens needed)
- **estimated_monthly_tokens** (total monthly usage)
- **estimated_monthly_spend** (calculated from model + tokens)
- input_type, output_type
- requires_vision, requires_function_calling, requires_streaming
- status (active/archived/draft)
- metadata

**functions table:** DELETED

### Migration Strategy
```sql
-- Merge functions into use_cases
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
  ...
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
  ...
FROM functions f
LEFT JOIN use_cases uc ON uc.function_id = f.id;

-- For functions with NO use cases (unlikely, but possible):
INSERT INTO use_cases_new (product_id, name, description, ...)
SELECT product_id, name, description, ...
FROM functions
WHERE id NOT IN (SELECT function_id FROM use_cases);
```

---

## Benefits of Simplification

### 1. Reduced Cognitive Load
- Users think: "My product has 5 AI capabilities"
- System matches this mental model exactly

### 2. Faster Data Entry
- One form instead of two
- All relevant fields in one place
- Clearer what information is needed and why

### 3. Better "At-a-Glance" View
- Product detail page shows ALL AI capabilities immediately
- No need to click into intermediate functions

### 4. Eliminates Data Duplication
- Single source of truth for token usage
- No confusion about where to enter monthly volume

### 5. Clearer Model Assignment
- Each use case has ONE model (the current one)
- Historical alternatives tracked separately (if needed)

### 6. Better for Optimization Workflow
- Opportunities table already links to `use_case_id`
- No need to traverse through functions

---

## Addressing "Multiple Models per Function"

### Current System Assumption
"A function might use multiple models (testing alternatives)"

### Reality Check
- In production, a capability uses ONE model at a time
- Testing alternatives is a WORKFLOW, not a data structure
- If users want to compare models, they use Sanity Checks
- Keeping multiple "use cases" per function just to track alternatives is overkill

### Better Approach for Testing
- Primary use case: "Trading Strategy" → GPT-4 (current)
- When testing alternative: Create sanity check (GPT-4 vs Claude Opus)
- If they switch: Update `current_model_id` in the use case
- Historical model usage: Track in opportunities/sanity_checks tables

---

## UX Improvements with Simplified Structure

### Product Detail Page
**Before:**
```
Functions (3)
├─ Trading Strategy (click to see use cases)
├─ Sentiment Analysis (click to see use cases)
└─ Trade Proposals (click to see use cases)
```

**After:**
```
AI Use Cases (5)
├─ Trading Strategy → GPT-4 → $120/mo → 🔍 Optimize
├─ Sentiment Analysis → Claude Sonnet → $45/mo → ✅ Optimized
├─ Trade Proposals → GPT-4 → $80/mo → 🔍 Optimize
├─ Trade Validation → GPT-3.5 → $20/mo → ✅ Optimized
└─ Risk Management → Claude Haiku → $15/mo → ✅ Optimized

Total Monthly Cost: $280
Potential Savings: $35/mo
```

**One-click navigation to optimization details**

### Add Use Case Form
**Simplified fields:**
- **Name:** "What does this AI capability do?"
- **Description:** "Describe the task"
- **Current Model:** Dropdown of available models
- **Priority:** What matters most (cost/speed/quality/trust/context)
- **Usage:** Monthly volume, avg input/output tokens
- **Requirements:** Vision, function calling, streaming

**All relevant fields in one logical form**

---

## Data Capture Automation

You mentioned: "I have no idea how many tokens I use per prompt, per month."

### Proposed Automation Strategy

#### 1. **API Integration** (Recommended)
```typescript
// Example: OpenAI usage tracking
async function trackUsage(useCaseId: string, apiResponse: any) {
  const usage = {
    use_case_id: useCaseId,
    prompt_tokens: apiResponse.usage.prompt_tokens,
    completion_tokens: apiResponse.usage.completion_tokens,
    total_tokens: apiResponse.usage.total_tokens,
    cost: calculateCost(apiResponse.model, apiResponse.usage),
    timestamp: new Date()
  };

  await logUsage(usage);
}
```

#### 2. **Usage Tracking Table** (New)
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  use_case_id UUID REFERENCES use_cases(id),
  model_id UUID REFERENCES models(id),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens BIGINT,
  cost DECIMAL(10,6),
  latency_ms INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Aggregation view for monthly rollups
CREATE VIEW monthly_usage_summary AS
SELECT
  use_case_id,
  DATE_TRUNC('month', timestamp) as month,
  COUNT(*) as request_count,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(latency_ms) as avg_latency_ms
FROM usage_logs
GROUP BY use_case_id, DATE_TRUNC('month', timestamp);
```

#### 3. **SDK Wrapper**
```typescript
// ModelOptix SDK wrapper for automatic tracking
import { ModelOptixClient } from '@modeloptix/sdk';

const client = new ModelOptixClient({
  apiKey: process.env.MODELOPTIX_API_KEY,
  useCaseId: 'trading-strategy-uuid'
});

// Automatically tracks usage
const response = await client.openai.chat.completions.create({
  model: "gpt-4",
  messages: [...]
});

// Usage logged automatically to ModelOptix backend
```

#### 4. **Manual Entry Fallback**
For users who can't integrate directly:
- Import CSV from provider dashboards
- Manual monthly estimates with bulk update
- Polling provider APIs (where available) to backfill data

---

## Implementation Roadmap

### Phase 1: Schema Migration (1-2 weeks)
1. Create new `use_cases_v2` table with merged schema
2. Migrate existing data (functions → use_cases)
3. Update RLS policies
4. Create database migration script

### Phase 2: API Updates (1 week)
1. Update `/api/products/[id]/functions` → `/api/products/[id]/use-cases`
2. Deprecate function-related endpoints
3. Update use case endpoints to handle new fields

### Phase 3: UI Updates (1-2 weeks)
1. Simplify product detail view (remove function layer)
2. Update use case form (add function fields)
3. Update navigation (remove intermediate function pages)
4. Add inline use case management on product page

### Phase 4: Usage Tracking (2-3 weeks)
1. Create usage_logs table
2. Build SDK wrapper for major providers
3. Create admin dashboard for usage analytics
4. Add CSV import for manual backfill

### Phase 5: Testing & Deployment (1 week)
1. Test data migration with staging data
2. Create rollback plan
3. Deploy to production
4. Monitor for issues

**Total Estimated Timeline:** 6-9 weeks

---

## Risks & Mitigation

### Risk 1: Data Loss During Migration
**Mitigation:**
- Full database backup before migration
- Run migration on staging first
- Keep old tables for 30 days post-migration
- Provide rollback script

### Risk 2: User Confusion During Transition
**Mitigation:**
- In-app announcement of changes
- Email to all users explaining simplification
- Optional migration guide/video
- Grandfather existing workflows during transition

### Risk 3: Breaking API Contracts
**Mitigation:**
- Version API endpoints (`/v1/functions` vs `/v2/use-cases`)
- Maintain deprecated endpoints for 90 days
- Provide migration guide for API users

---

## Success Metrics

### Quantitative
- **Time to Add Use Case:** Target 50% reduction (from 5 min to 2.5 min)
- **Form Abandonment Rate:** Target 30% reduction
- **Support Tickets:** Target 40% reduction in "where do I enter..." questions
- **Data Completeness:** Target 80%+ of use cases with monthly usage data (with automation)

### Qualitative
- User feedback: "Much easier to understand"
- Reduced onboarding friction
- Clearer value proposition in product tours

---

## Recommendations

### Immediate Actions (This Sprint)
1. ✅ **Approve** simplified structure (Product → Use Cases)
2. ✅ **Design** new database schema (merge functions into use_cases)
3. ✅ **Prototype** new product detail view (Figma/wireframe)

### Next Sprint
4. Implement database migration
5. Update API endpoints
6. Update UI components

### Future Enhancements
7. Build usage tracking SDK
8. Add CSV import for historical data
9. Create usage analytics dashboard

---

## Conclusion

The current three-tier structure (Product → Function → Use Case) creates unnecessary complexity. Users naturally think of their products as having "AI capabilities" (use cases) that use specific models.

**Flattening to Product → Use Cases** will:
- Match user mental models
- Reduce data entry burden
- Eliminate confusion about where data lives
- Make the core value prop (optimization) more visible
- Enable better usage tracking automation

**Recommendation:** Proceed with simplification as outlined above.

---

## Questions for Discussion

1. **Do you agree with eliminating the Function layer entirely?**
   - Or should we keep it as optional grouping/tagging?

2. **For users with 20+ use cases, do we need sub-grouping?**
   - E.g., Tags like "customer-facing", "internal", "analytics"?
   - Or is search/filter sufficient?

3. **Should we preserve historical function names anywhere?**
   - In case users want to reference old structure?

4. **Priority on usage tracking automation?**
   - Build SDK first, or manual entry for MVP?

5. **Migration timeline acceptable?**
   - 6-9 weeks realistic given your availability?

