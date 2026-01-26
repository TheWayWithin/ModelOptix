# Sprint: OpenRouter Integration & Live Data

**Sprint ID:** SPRINT-006
**Created:** 2026-01-25
**Priority:** P0 - Critical
**Estimated Effort:** 2-3 days
**Status:** Ready for Development

---

## Executive Summary

ModelOptix has core infrastructure built but is operating as an "island" - not connected to real data. This sprint connects the system to OpenRouter for live model data, pricing, and user portfolio import.

**The Problem:**
- Sync jobs exist but may not be running (need verification)
- Users must manually enter all portfolio data (no import)
- The PRD specifies "Time to First Insight < 5 minutes" - impossible with manual entry
- OpenRouter Import (F-003a primary path) was deferred but is critical for launch

**The Goal:**
After this sprint, users can connect their OpenRouter API key and immediately see:
1. Their actual model usage auto-imported as a portfolio
2. Live model catalog with real pricing
3. Recommendations based on their real data

---

## Pre-Sprint Verification

**BEFORE starting development, verify the environment:**

### Task 0.1: Verify Environment Variables

Check Railway dashboard for these variables:

```bash
OPENROUTER_API_KEY=sk-or-...      # Required for all OpenRouter features
NEXT_PUBLIC_SUPABASE_URL=...       # Should already be set
SUPABASE_SERVICE_ROLE_KEY=...      # Required for sync jobs
```

**If OPENROUTER_API_KEY is not set:**
1. Go to https://openrouter.ai/keys
2. Create a new API key with read permissions
3. Add to Railway environment variables
4. Redeploy

### Task 0.2: Verify Sync Jobs Are Working

```bash
# SSH into Railway or check logs for these patterns:
# Look for: "[OpenRouter] Successfully fetched X models"
# Look for: "[SyncModelCatalog] Completed"

# If no logs found, jobs haven't run yet (cron scheduled for 2am UTC)
# You can manually trigger by calling the job function
```

### Task 0.3: Check Database Has Live Data

```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as model_count,
       MAX(last_synced_at) as last_sync
FROM models;

-- If last_sync is NULL or count is low, sync hasn't run
-- Expected: 200+ models after sync
```

---

## Phase 1: Manual Sync Triggers (Admin)

**Objective:** Allow admins to manually trigger syncs without waiting for cron.

### Task 1.1: Create Admin Sync API Endpoints

**File:** `src/app/api/admin/sync/route.ts`

```typescript
// POST /api/admin/sync
// Body: { job: 'model-catalog' | 'pricing' | 'benchmarks' }
// Returns: { success: boolean, stats: object }

// Implementation guidance:
// 1. Check user is admin (user_profiles.is_admin = true)
// 2. Import and call the appropriate job function directly
// 3. Return the job stats

// Reference existing jobs:
// - src/lib/jobs/sync-model-catalog.ts -> syncModelCatalog()
// - src/lib/jobs/sync-pricing.ts -> syncPricing()
// - src/lib/jobs/sync-benchmarks.ts -> syncBenchmarks()
```

**Acceptance Criteria:**
- [ ] POST `/api/admin/sync` with `{ job: 'model-catalog' }` triggers catalog sync
- [ ] Returns stats: `{ modelsCreated, modelsUpdated, pricingRecordsUpserted }`
- [ ] Non-admin users receive 403 Forbidden
- [ ] Errors are caught and returned with appropriate status codes

### Task 1.2: Add Sync Status to Admin Dashboard

**File:** `src/app/admin/page.tsx` (modify existing)

Add a "Data Sync" section showing:
- Last sync timestamp for each job type
- Button to trigger each sync manually
- Loading state during sync
- Success/error toast after completion

**Query for last sync times:**
```sql
SELECT
  (SELECT MAX(last_synced_at) FROM models) as models_last_sync,
  (SELECT MAX(last_synced_at) FROM model_provider_pricing) as pricing_last_sync,
  (SELECT MAX(updated_at) FROM models WHERE benchmarks != '{}') as benchmarks_last_sync
```

**Acceptance Criteria:**
- [ ] Admin dashboard shows last sync time for models, pricing, benchmarks
- [ ] "Sync Now" button for each job type
- [ ] Loading spinner during sync
- [ ] Toast notification on success/failure
- [ ] Sync times update after successful sync

---

## Phase 2: OpenRouter User Import (Critical)

**Objective:** Let users connect their OpenRouter API key to auto-import their portfolio.

### OpenRouter API Reference

**Endpoint:** `GET https://openrouter.ai/api/v1/auth/key`
**Auth:** Bearer token (user's API key)
**Response:**
```json
{
  "data": {
    "label": "My API Key",
    "usage": 12.50,
    "limit": 100.00,
    "is_free_tier": false,
    "rate_limit": {
      "requests": 200,
      "interval": "10s"
    }
  }
}
```

**Endpoint:** `GET https://openrouter.ai/api/v1/auth/key/usage`
**Response:** Usage data by model (this is what we need for import)

### Task 2.1: Create OpenRouter Connection Service

**File:** `src/lib/openrouter/user-import.ts`

```typescript
export interface OpenRouterKeyInfo {
  label: string;
  usage: number;
  limit: number | null;
  isFreeTier: boolean;
}

export interface OpenRouterUsageByModel {
  modelId: string;        // e.g., "openai/gpt-4o"
  tokenCount: number;
  cost: number;
  requestCount: number;
}

/**
 * Validate an OpenRouter API key and get account info
 */
export async function validateOpenRouterKey(apiKey: string): Promise<{
  valid: boolean;
  info?: OpenRouterKeyInfo;
  error?: string;
}> {
  // Call /api/v1/auth/key with user's key
  // Return account info if valid
}

/**
 * Fetch user's model usage from OpenRouter
 */
export async function fetchUserModelUsage(apiKey: string): Promise<{
  success: boolean;
  usage?: OpenRouterUsageByModel[];
  error?: string;
}> {
  // Call /api/v1/auth/key/usage or similar
  // Parse response into model usage data
}

/**
 * Generate portfolio structure from usage data
 */
export function generatePortfolioFromUsage(
  usage: OpenRouterUsageByModel[]
): {
  products: Array<{
    name: string;
    functions: Array<{
      name: string;
      modelId: string;
      estimatedMonthlySpend: number;
    }>;
  }>;
} {
  // Group models into logical products
  // Strategy:
  // - If 1-3 models: Single product "My AI App" with each as a function
  // - If 4+: Group by provider (OpenAI functions, Anthropic functions, etc.)
  // - Name functions based on model (e.g., "GPT-4o Tasks", "Claude Analysis")
}
```

**Acceptance Criteria:**
- [ ] `validateOpenRouterKey()` returns valid/invalid with account info
- [ ] `fetchUserModelUsage()` returns usage data by model
- [ ] `generatePortfolioFromUsage()` creates sensible product/function structure
- [ ] Handles API errors gracefully (invalid key, rate limit, network)

### Task 2.2: Create Import API Endpoint

**File:** `src/app/api/portfolio/import/route.ts`

```typescript
// POST /api/portfolio/import
// Body: { apiKey: string, preview?: boolean }
//
// If preview=true: Return proposed portfolio without creating
// If preview=false: Create portfolio and return result

// Steps:
// 1. Validate the API key
// 2. Fetch usage data
// 3. Generate portfolio structure
// 4. If preview: return structure for user review
// 5. If not preview:
//    a. Create products
//    b. Create functions
//    c. Create use_cases with current_model_id linked
//    d. Return created portfolio

// Important: Look up model IDs from our models table using openrouter_id
// If model not in our catalog, skip or create placeholder
```

**Acceptance Criteria:**
- [ ] Preview mode returns proposed portfolio without database changes
- [ ] Import mode creates products, functions, use_cases
- [ ] Models are linked by `openrouter_id` to our catalog
- [ ] Unknown models are handled (skip with warning or create placeholder)
- [ ] User's existing portfolio is preserved (additive import)
- [ ] Respects tier limits (returns error if would exceed)

### Task 2.3: Create Import UI Flow

**File:** `src/components/quick-start/openrouter-import.tsx`

**Flow:**
1. **Step 1: API Key Input**
   - Text input for OpenRouter API key
   - Link to "Where do I find this?" (https://openrouter.ai/keys)
   - "Connect" button
   - Show validation result (account name, usage tier)

2. **Step 2: Preview**
   - Show detected models with usage stats
   - Show proposed product/function structure
   - Checkboxes to include/exclude items
   - Edit names before import
   - "Import Selected" button

3. **Step 3: Success**
   - Show created portfolio
   - "View Opportunities" CTA
   - Background: trigger opportunity generation for new functions

**UI Components needed:**
- API key input with show/hide toggle
- Model list with usage stats
- Editable preview cards
- Import progress indicator

**Acceptance Criteria:**
- [ ] API key input with validation feedback
- [ ] Preview shows all detected models with usage
- [ ] User can edit product/function names before import
- [ ] User can deselect items they don't want imported
- [ ] Import creates portfolio and redirects to opportunities
- [ ] Error states handled (invalid key, no usage, API errors)

### Task 2.4: Integrate Into Onboarding

**File:** `src/components/quick-start/quick-start-wizard.tsx` (modify)

Current flow: Manual entry only

New flow:
1. **Choice screen:** "Connect OpenRouter (Recommended)" | "Set up manually"
2. If OpenRouter: Go to import flow (Task 2.3)
3. If Manual: Go to existing wizard

**Acceptance Criteria:**
- [ ] New users see choice between import and manual
- [ ] OpenRouter import is visually recommended (primary button)
- [ ] Manual setup still works as before
- [ ] Import flow can fall back to manual if user prefers

---

## Phase 3: Verify End-to-End Flow

### Task 3.1: Test Complete User Journey

**Test script:**
1. Create new account
2. Choose "Connect OpenRouter"
3. Enter valid API key
4. See preview of detected models
5. Confirm import
6. Land on dashboard with portfolio
7. See opportunities generated
8. Run a Sanity Check

**Acceptance Criteria:**
- [ ] Full flow works end-to-end
- [ ] Time to first insight < 5 minutes
- [ ] No console errors
- [ ] Mobile responsive

### Task 3.2: Error Handling Verification

Test these error cases:
- [ ] Invalid API key shows clear error
- [ ] API rate limited shows retry message
- [ ] No usage data shows "no models found" message
- [ ] Network error shows retry option
- [ ] Tier limit exceeded shows upgrade prompt

---

## Technical Reference

### Existing Files to Reference

| File | Purpose |
|------|---------|
| `src/lib/openrouter/client.ts` | Existing OpenRouter client (model fetch, chat completion) |
| `src/lib/openrouter/types.ts` | TypeScript types for OpenRouter API |
| `src/lib/jobs/sync-model-catalog.ts` | Model catalog sync job |
| `src/lib/supabase/service.ts` | Service role client for database operations |
| `src/components/quick-start/quick-start-wizard.tsx` | Current manual wizard |
| `src/app/api/portfolio/route.ts` | Existing portfolio API |

### Database Tables Involved

| Table | Usage |
|-------|-------|
| `products` | Created during import |
| `functions` | Created during import |
| `use_cases` | Created with model link |
| `models` | Look up by `openrouter_id` |
| `model_provider_pricing` | Get current pricing |

### API Key Storage Decision

**Do NOT store user's OpenRouter API key permanently.**
- Only use during import session
- Do not save to database
- User re-enters if they want to re-import later

Rationale: Security - we don't need ongoing access, just one-time import.

---

## Quality Gates

Before marking sprint complete:

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] Admin can manually trigger all sync jobs
- [ ] User can import portfolio via OpenRouter API key
- [ ] Imported functions link to correct models in catalog
- [ ] Time to first insight < 5 minutes (measured)
- [ ] All error cases show user-friendly messages

---

## Definition of Done

This sprint is complete when:

1. **Admin Sync Controls:** Admins can trigger model/pricing/benchmark syncs on demand
2. **OpenRouter Import:** Users can enter API key and auto-generate portfolio
3. **End-to-End Verified:** Full journey from signup to recommendation works
4. **Live Data Flowing:** Database contains real OpenRouter model catalog

---

## Appendix: OpenRouter API Notes

### Rate Limits
- Model catalog: No auth required for /models endpoint
- User data: Requires user's API key, subject to their rate limits

### Model ID Format
OpenRouter uses format: `provider/model-name`
Examples:
- `openai/gpt-4o`
- `anthropic/claude-3.5-sonnet`
- `meta-llama/llama-3.1-70b-instruct`

Our `models.openrouter_id` column stores this exact format.

### Pricing Format
OpenRouter returns price per token (not per 1K tokens).
Multiply by 1000 when storing to `model_provider_pricing` if storing per-1K format.

Check existing `parseOpenRouterModel()` in `src/lib/openrouter/client.ts` for parsing logic.
