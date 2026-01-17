# ModelOptix Architecture

> Version: 2.4.1
> Generated: 2025-01-17
> Status: Ready for Implementation
> Last Updated: 2025-01-17

---

## Executive Summary

ModelOptix Core is a trust-first AI model advisor that helps developers find, compare, and optimize their LLM usage. This document captures all architectural decisions made before implementation begins.

**Key Architectural Choices:**
- **Monolithic** Next.js application for fast iteration
- **Railway** for hosting (no platform timeouts, predictable costs)
- **Cloudflare CDN** for global edge caching
- **Supabase** for database, auth, and real-time features
- **Upstash Redis** for distributed rate limiting
- **Stripe** for subscriptions, **OpenRouter** for LLM access

---

## System Overview

### Why Railway + Cloudflare

The architecture consolidates to **Next.js Standalone on Railway** with **Cloudflare CDN** for:

- **No platform timeouts** — Sanity Checks can run with app-level timeouts (60s/model), not platform limits
- **Predictable costs** — No per-invocation billing surprises
- **Single deployment** — One codebase, one deploy target
- **Simpler debugging** — Single log stream
- **Global performance** — Cloudflare caches static assets at 300+ edge locations
- **Future-proof** — Can scale horizontally or migrate to Kubernetes

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare (Free Tier)                       │
│  - Global CDN for JS/CSS/images                                  │
│  - DDoS protection                                               │
│  - SSL termination (Full Strict mode)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Railway                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js (standalone mode)                     │  │
│  │  - App Router (SSR for SEO, Client for app)               │  │
│  │  - API Routes + Zod validation                            │  │
│  │  - No tRPC (simpler for solo dev)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Background Workers                            │  │
│  │  - node-cron for scheduled jobs (with locking)            │  │
│  │  - Initialized via src/instrumentation.ts                 │  │
│  │  - Reaper job for stuck job recovery                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Supabase │   │ Upstash  │   │ External │
        │ Postgres │   │  Redis   │   │ Services │
        │ + Auth   │   │ (limits) │   │          │
        └──────────┘   └──────────┘   └──────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                        OpenRouter      Stripe        Resend
```

### Cost Breakdown (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Cloudflare | Free | $0 |
| Railway | Starter | ~$5-20 |
| Supabase | Free/Pro | $0-25 |
| Upstash Redis | Free | $0 (10K commands/day) |
| **Total Infrastructure** | | **~$5-45/month** |

---

## 1. Application Architecture

### Pattern: Monolith

**Decision:** Single Next.js application containing all features.

**Rationale:**
- Faster to build and iterate during MVP phase
- Simpler deployment and debugging
- Features are tightly coupled (dashboards share data)
- Can extract services later if needed

**Structure:**
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── (marketing)/       # Public pages (landing, pricing)
│   ├── admin/             # Admin dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
├── lib/                   # Shared utilities
│   ├── supabase/         # Supabase client config
│   ├── stripe/           # Stripe utilities
│   ├── openrouter/       # OpenRouter client
│   └── recommendations/  # Recommendation engine
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── instrumentation.ts     # Cron job initialization (see Section 8)
```

---

## 2. Frontend Architecture

### Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** React Server Components + Client Components as needed

### Rendering Strategy

| Page Type | Rendering | Reason |
|-----------|-----------|--------|
| Landing, Pricing | SSG/SSR | SEO, fast initial load |
| Dashboard, Portfolio | Client | Interactive, real-time data |
| Trust Reports | SSR + Client | SEO for public reports, interactive details |

### Key UI Patterns

**Command Bar (Cmd+K)**
- Global keyboard shortcut
- Quick navigation
- Natural language queries (P1 feature)

**Dashboard Layout**
- Sidebar navigation
- Responsive (mobile-first)
- Dark mode support (via Tailwind)

**Component Library**
```
shadcn/ui components to install:
- button, input, label, textarea
- card, dialog, dropdown-menu
- table, tabs, toast
- command (for Cmd+K)
- chart (for visualizations)
```

---

## 3. Backend Architecture

### Database: Supabase (PostgreSQL)

**Why Supabase:**
- PostgreSQL for complex relational data
- Row-Level Security (RLS) for multi-tenancy
- Real-time subscriptions for alerts
- Auth integration
- Edge Functions for serverless logic

### Multi-tenancy Strategy

**Approach:** Row-based multi-tenancy with `user_id` column + RLS policies

```sql
-- Example RLS policy for products table
CREATE POLICY "Users can only see their own products"
ON products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own products"
ON products FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### API Layer: Hybrid

| Operation | Approach | Why |
|-----------|----------|-----|
| CRUD operations | Supabase client (direct) | RLS handles security, user-owned data only |
| Business logic | Next.js API routes | Complex validation, transformations |
| Webhooks | Next.js API routes | Stripe, external services |
| Real-time | Supabase subscriptions | Built-in, efficient |

**Critical Rule:** Any operation requiring privileged access MUST use API routes with service role:
- OpenRouter API calls (API key must stay server-side)
- Stripe operations (secret key must stay server-side)
- Trust score writes (admin-only, use service role)
- Model catalog syncing (service role for bulk operations)
- Webhook processing (service role for consistency)
- **Guest sanity checks** (service role to write without user context)

### Database Schema (Complete)

See detailed schema in Section 6 below. Key tables:

**User Domain:**
- `user_profiles` - Extended user data with subscription info
- `products` - User's AI products/apps
- `functions` - Features within products
- `use_cases` - Specific LLM usage within functions

**Model Domain:**
- `models` - LLM catalog with pricing, latency, capabilities, benchmarks
- `providers` - Model providers with trust tiers
- `model_provider_pricing` - Junction table for same model, different providers
- `model_trust_scores` - Trust scores by dimension
- `parameter_support` - Parameter compatibility matrix
- `editorial_overrides` - Admin "kill switch" for model exclusion/downranking

**Action Domain:**
- `opportunities` - Recommendations with improvement metrics
- `sanity_checks` - Side-by-side model comparisons
- `alerts` - Notifications for users
- `notification_preferences` - User alert preferences

**Infrastructure:**
- `job_runs` - Job locking and heartbeat tracking
- `webhook_events` - Idempotency for webhooks
- `usage_tracking` - Tier limit enforcement

---

## 4. Recommendation Engine

### Location

```
lib/recommendations/
├── fit-score.ts          # Calculate weighted FitScore
├── opportunity-generator.ts  # Compare models, create Opportunities
├── thresholds.ts         # Configurable thresholds
├── weights.ts            # Weight configurations
└── editorial.ts          # Apply editorial overrides
```

### Five Scoring Factors

| Factor | Description | Scoring Method |
|--------|-------------|----------------|
| **Cost** | Price per token | Lower is better (normalized) |
| **Speed** | Latency, TTFT | Lower is better (normalized) |
| **Quality** | Capability, benchmarks | Higher is better (normalized) |
| **Trust** | Provider trust tier | A=1.0, B=0.7, C=0.4, Unknown=0.2 |
| **Context** | Context window size | Sufficiency ratio: min(1.0, model/required) |

### Weight System

Users rank 3 priorities. The 4th and 5th factors get minimal weight.

```typescript
const WEIGHTS = {
  ranked: {
    primary: 0.55,    // Statistically dominant
    secondary: 0.22,
    tertiary: 0.12,
    fourth: 0.07,
    fifth: 0.04
  },
  equal: {
    all: 0.20  // Each factor gets 20%
  }
};
```

### FitScore Calculation

```typescript
function calculateFitScore(
  model: Model,
  useCase: UseCase,
  weights: WeightConfig
): number {
  // Check editorial overrides first
  const override = getEditorialOverride(model.id);
  if (override?.override_type === 'exclude') {
    return 0; // Excluded models score 0
  }

  const scores = {
    cost: normalizeCost(model.pricing, useCase.estimatedUsage),
    speed: normalizeSpeed(model.latency),
    quality: normalizeQuality(model.benchmarks, useCase.capabilities),
    trust: normalizeTrust(model.provider.trustTier),
    context: Math.min(1.0, model.contextLength / useCase.requiredContext)
  };

  let finalScore = Object.entries(weights).reduce((total, [factor, weight]) => {
    return total + (scores[factor] * weight);
  }, 0);

  // Apply downrank penalty if applicable
  if (override?.override_type === 'downrank') {
    finalScore *= 0.5; // 50% penalty
  }

  return finalScore;
}
```

### Opportunity Generation

- **Trigger:** Daily cron job at 4am UTC
- **Process:** For each active Use Case, compare current model to alternatives
- **Threshold:** Create Opportunity if improvement > 10%
- **Output:** Opportunity record with improvement %, evidence, recommended model

---

## 5. Authentication

### Provider: Supabase Auth

**Why Supabase Auth:**
- Included with Supabase (no extra cost)
- Seamless RLS integration (user context flows to database)
- OAuth + Email/Password support
- Session management built-in

### Auth Methods (MVP)

| Method | Priority | Notes |
|--------|----------|-------|
| Google OAuth | P0 | Primary - most users have Google |
| GitHub OAuth | P0 | Important for developer audience |
| Email/Password | P0 | Fallback option |
| Microsoft OAuth | Post-MVP | For enterprise users |
| Apple OAuth | Post-MVP | For iOS users |

### Session Strategy

- **Type:** JWT (stateless)
- **Storage:** HTTP-only cookies (Supabase default)
- **Refresh:** Automatic token refresh via Supabase client

### Role Hierarchy

| Role | Access | Enforcement |
|------|--------|-------------|
| `user` | Own data only | RLS policies (auth.uid() checks) |
| `admin` | All data + admin dashboard + trust score management | API route middleware checks `user_profiles.is_admin` boolean |

**Admin Implementation:**
- `is_admin BOOLEAN DEFAULT FALSE` column in `user_profiles` table
- Admin routes (`/api/admin/*`) verify `is_admin = TRUE` before allowing access
- Trust score writes, provider management, parameter support edits, editorial overrides all require admin role
- Admin status checked server-side only (never trust client claims)
- **First admin must be created via seed script** (see Section 21)

---

## 6. Complete Database Schema

### Enable Extensions

```sql
-- Enable pgvector for NL search features
CREATE EXTENSION IF NOT EXISTS vector;
```

### Auto-update Timestamps

```sql
-- Trigger function to auto-update updated_at on any UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_use_cases_updated_at BEFORE UPDATE ON use_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_provider_pricing_updated_at BEFORE UPDATE ON model_provider_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_trust_scores_updated_at BEFORE UPDATE ON model_trust_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parameter_support_updated_at BEFORE UPDATE ON parameter_support
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Core Tables

```sql
-- Users (managed by Supabase Auth, extended here)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free',  -- free, solo, growth, pro, enterprise (manual setup)
  subscription_status TEXT DEFAULT 'active',  -- active, past_due, cancelled, trialing
  is_admin BOOLEAN DEFAULT FALSE,  -- Admin role for trust score management
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (user's AI products/apps)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Functions (features within products)
CREATE TABLE functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Use Cases (specific LLM usage within functions)
CREATE TABLE use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID REFERENCES functions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_model_id UUID REFERENCES models(id),
  primary_need TEXT NOT NULL,  -- cost, speed, quality, trust, context
  secondary_need TEXT,
  tertiary_need TEXT,
  use_equal_weights BOOLEAN DEFAULT FALSE,
  required_context INTEGER DEFAULT 4096,
  estimated_monthly_tokens BIGINT,
  estimated_monthly_spend DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Providers
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  hq_country TEXT,
  trust_tier TEXT DEFAULT 'unknown',  -- A, B, C, unknown
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Models (LLM catalog)
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id),  -- Link to provider for trust tier
  openrouter_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  context_length INTEGER,
  latency_p50 INTEGER,  -- milliseconds
  latency_p95 INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  benchmarks JSONB DEFAULT '{}',  -- MMLU, HumanEval, etc. from Artificial Analysis
  capabilities JSONB DEFAULT '{}',  -- vision, function_calling, json_mode, etc.
  embedding vector(1536),  -- For NL search (Phase 2) - size matches OpenAI text-embedding-3-small
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model Provider Pricing (same model, different providers/prices)
CREATE TABLE model_provider_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  input_price DECIMAL(12,8),  -- per 1K tokens
  output_price DECIMAL(12,8),
  is_primary BOOLEAN DEFAULT FALSE,  -- Primary pricing source for this model
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, provider_id)
);

-- Model Trust Scores
CREATE TABLE model_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,  -- data_handling, transparency, security, etc.
  score INTEGER CHECK (score >= 0 AND score <= 100),
  evidence TEXT,
  source_url TEXT,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, dimension)
);

-- Parameter Support Matrix (for migration diffs)
CREATE TABLE parameter_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,  -- temperature, top_p, max_tokens, stop, etc.
  is_supported BOOLEAN DEFAULT TRUE,
  min_value DECIMAL(10,4),
  max_value DECIMAL(10,4),
  default_value DECIMAL(10,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, parameter_name)
);

-- Editorial Overrides (Admin "kill switch" for models)
-- Use when qualitative issues exist not captured by benchmarks
CREATE TABLE editorial_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL CHECK (override_type IN ('exclude', 'downrank', 'flag')),
  reason TEXT NOT NULL,  -- Required: document why
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ  -- Optional: auto-expire overrides
);

-- Opportunities (recommendations)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
  recommended_model_id UUID REFERENCES models(id),
  opportunity_type TEXT NOT NULL,  -- cost_saving, speed_improvement, quality_upgrade, trust_upgrade
  improvement_percentage DECIMAL(5,2),
  estimated_monthly_savings DECIMAL(10,2),
  evidence JSONB,
  status TEXT DEFAULT 'active',  -- active, dismissed, accepted, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Sanity Checks
CREATE TABLE sanity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID REFERENCES use_cases(id),  -- Nullable for guest/ad-hoc tests
  user_id UUID REFERENCES user_profiles(id),  -- Nullable for guest tests
  prompt TEXT NOT NULL,
  current_model_id UUID REFERENCES models(id),
  recommended_model_id UUID REFERENCES models(id),
  current_response TEXT,
  recommended_response TEXT,
  current_latency INTEGER,
  recommended_latency INTEGER,
  user_preference TEXT,  -- current, recommended, neither
  is_guest BOOLEAN DEFAULT FALSE,  -- Flag for guest vs authenticated tests
  guest_session_id TEXT,  -- Hashed session ID for guest access control
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (switching opportunities, price changes, etc.)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,  -- opportunity, price_change, model_deprecated, trust_change
  title TEXT NOT NULL,
  message TEXT,
  related_model_id UUID REFERENCES models(id),
  related_opportunity_id UUID REFERENCES opportunities(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,  -- email, slack, discord
  alert_types TEXT[] DEFAULT ARRAY['opportunity', 'price_change'],
  is_enabled BOOLEAN DEFAULT TRUE,
  webhook_url TEXT,  -- For Slack/Discord
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel)
);

-- Usage Tracking (for tier limit enforcement)
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- Format: YYYY-MM
  products_count INTEGER DEFAULT 0,
  functions_count INTEGER DEFAULT 0,
  sanity_checks_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Job Runs (for idempotency and locking)
CREATE TABLE job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ DEFAULT NOW(),  -- Updated periodically during run
  status TEXT DEFAULT 'running',  -- running, completed, failed
  cursor TEXT,  -- for resumable jobs
  error TEXT,
  items_processed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique partial index to prevent concurrent runs of same job
CREATE UNIQUE INDEX idx_job_runs_active_lock
  ON job_runs(job_name)
  WHERE status = 'running';

-- Webhook Events (for idempotency)
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,  -- Stripe event ID
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_user ON products(user_id);  -- Heavy query pattern
CREATE INDEX idx_use_cases_function ON use_cases(function_id) WHERE status = 'active';
CREATE INDEX idx_opportunities_use_case ON opportunities(use_case_id) WHERE status = 'active';
CREATE INDEX idx_models_provider ON models(provider_id);  -- For provider trust tier joins
CREATE INDEX idx_models_available ON models(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_models_openrouter_id ON models(openrouter_id);  -- For syncing from OpenRouter
CREATE INDEX idx_sanity_checks_user ON sanity_checks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_sanity_checks_guest ON sanity_checks(created_at) WHERE is_guest = TRUE;  -- For cleanup job
CREATE INDEX idx_job_runs_name_status ON job_runs(job_name, status);
CREATE INDEX idx_job_runs_stale ON job_runs(heartbeat_at) WHERE status = 'running';
CREATE INDEX idx_alerts_user_unread ON alerts(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month);
CREATE INDEX idx_model_provider_pricing_model ON model_provider_pricing(model_id);
CREATE INDEX idx_parameter_support_model ON parameter_support(model_id);
CREATE INDEX idx_editorial_overrides_model ON editorial_overrides(model_id) WHERE active = TRUE;

-- Vector index for NL search (Phase 2)
-- Note: IVFFlat requires sufficient training data (pgvector builds clusters)
-- For small datasets (<1000 rows), use HNSW instead: USING hnsw (embedding vector_cosine_ops)
-- CREATE INDEX AFTER seeding models with embeddings
CREATE INDEX idx_models_embedding ON models USING ivfflat (embedding vector_cosine_ops);
```

### Row Level Security

**RLS Policy Style Guide:**
- Always use separate policies per operation (SELECT, INSERT, UPDATE, DELETE)
- `USING` clause: controls which rows can be read/modified
- `WITH CHECK` clause: controls what values can be written
- Never use `FOR ALL` in production — it's a footgun for future refactors

```sql
-- ============================================================
-- USER-OWNED TABLES (accessed via Supabase client with anon key)
-- ============================================================

-- User profiles: users can read/update their own profile only
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_select ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY user_profiles_update ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());  -- Prevent changing id to another user

-- No INSERT policy: profiles created via auth trigger
-- No DELETE policy: users cannot delete their profile

-- Products: users can only see/modify their own data
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select ON products
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY products_insert ON products
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY products_update ON products
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());  -- Prevent reassigning to another user

CREATE POLICY products_delete ON products
  FOR DELETE USING (user_id = auth.uid());

ALTER TABLE functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY functions_select ON functions
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

CREATE POLICY functions_insert ON functions
  FOR INSERT WITH CHECK (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

CREATE POLICY functions_update ON functions
  FOR UPDATE USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  ) WITH CHECK (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

CREATE POLICY functions_delete ON functions
  FOR DELETE USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY use_cases_select ON use_cases
  FOR SELECT USING (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY use_cases_insert ON use_cases
  FOR INSERT WITH CHECK (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY use_cases_update ON use_cases
  FOR UPDATE USING (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  ) WITH CHECK (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY use_cases_delete ON use_cases
  FOR DELETE USING (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY opportunities_select ON opportunities
  FOR SELECT USING (
    use_case_id IN (
      SELECT uc.id FROM use_cases uc
      JOIN functions f ON uc.function_id = f.id
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Opportunities are system-generated, no INSERT/UPDATE policies for client
-- Dismissing an opportunity uses an API route with service role

-- Sanity Checks: CRITICAL - Users can only see their OWN tests
-- Guest tests are accessed via API routes with service role + guest_session_id validation
ALTER TABLE sanity_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY sanity_checks_select ON sanity_checks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY sanity_checks_insert ON sanity_checks
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_guest = FALSE);

-- No UPDATE/DELETE: sanity checks are immutable
-- Guest sanity checks (is_guest = TRUE) written via service role only

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY alerts_select ON alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY alerts_update ON alerts
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());  -- For marking as read

-- Alerts are system-generated, no INSERT policy for client
-- No DELETE: alerts are retained for history

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_prefs_select ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notification_prefs_insert ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_prefs_update ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_prefs_delete ON notification_preferences
  FOR DELETE USING (user_id = auth.uid());

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_tracking_select ON usage_tracking
  FOR SELECT USING (user_id = auth.uid());

-- Usage tracking is system-managed, no INSERT/UPDATE/DELETE for client

-- ============================================================
-- PUBLIC READ TABLES (catalog data, visible to all)
-- All writes happen via service role in API routes
-- Client NEVER receives capability to mutate these tables
-- ============================================================

ALTER TABLE models ENABLE ROW LEVEL SECURITY;
CREATE POLICY models_select ON models FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = deny all client writes

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY providers_select ON providers FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = deny all client writes

ALTER TABLE model_provider_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY model_provider_pricing_select ON model_provider_pricing FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = deny all client writes

ALTER TABLE parameter_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY parameter_support_select ON parameter_support FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = deny all client writes

ALTER TABLE model_trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY model_trust_scores_select ON model_trust_scores FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = deny all client writes

ALTER TABLE editorial_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY editorial_overrides_select ON editorial_overrides FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = deny all client writes

-- IMPORTANT: All catalog/admin writes MUST occur via service role.
-- Service role bypasses RLS entirely. API routes verify is_admin before mutations.

-- ============================================================
-- SERVER-ONLY TABLES (no client access, deny all)
-- ============================================================

-- job_runs: Background job management (server-only)
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
-- No policies = deny all client access (service role bypasses RLS)

-- webhook_events: Webhook idempotency tracking (server-only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies = deny all client access (service role bypasses RLS)
```

---

## 7. External Integrations

### Payments: Stripe

**Features Used:**
- Subscriptions (4 tiers: Free, Solo, Growth, Pro)
- Trials (7-day with card upfront)
- Promo codes
- Customer Portal (self-service billing management)
- Webhooks for subscription lifecycle

**Webhook Events to Handle:**
```
checkout.session.completed    → Create subscription
customer.subscription.updated → Update tier/status
customer.subscription.deleted → Downgrade to free
invoice.payment_failed        → Handle dunning
invoice.paid                  → Confirm payment
```

**Implementation:**
```typescript
// Webhook handler location
src/app/api/webhooks/stripe/route.ts

// Stripe client
lib/stripe/client.ts
lib/stripe/subscriptions.ts
```

### LLM Access: OpenRouter

**Used For:**
- Sanity Check feature (compare model outputs)
- Future: Natural language queries

**Implementation:**
```typescript
// OpenRouter client
lib/openrouter/client.ts

// Sanity check service
lib/openrouter/sanity-check.ts
```

**Rate Limiting:**
- Per-user limits based on tier
- Fallback handling if rate limited

### Email: Resend

**Email Types:**
| Email | Trigger |
|-------|---------|
| Welcome | After signup |
| Password reset | User request |
| Alert notification | New opportunity, price change |
| Weekly digest | Monday (free tier) |
| Trial ending | Day 5, Day 7 |
| Payment failed | Stripe webhook |

**Implementation:**
```typescript
// Email client
lib/resend/client.ts

// Email templates (React Email)
emails/
├── welcome.tsx
├── password-reset.tsx
├── alert-notification.tsx
├── weekly-digest.tsx
└── trial-ending.tsx
```

### Data Sources

| Source | Data | Refresh |
|--------|------|---------|
| OpenRouter API | Model catalog, pricing | Daily |
| Artificial Analysis API | Benchmarks, quality scores | Weekly |
| Manual/Admin | Trust scores, evidence | As updated |

---

## 8. Job Safety & Background Processing

### Cron Job Initialization

**Critical:** Next.js standalone mode does not auto-run sidecar scripts. Use Next.js Instrumentation to initialize cron jobs on server start.

**Single Instance Assumption:** MVP assumes 1 Railway web instance. The locking mechanism handles brief overlap during deploys, but if horizontal scaling is enabled:
1. Move cron jobs to a dedicated worker service, OR
2. Use Railway Scheduled Jobs calling a single API endpoint, OR
3. Add leader election (e.g., via Redis SETNX)

**Implementation:**

```typescript
// src/instrumentation.ts
export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const { runJobWithLock } = await import('@/lib/jobs/runner');
    const jobs = await import('@/lib/jobs');

    // Schedule all jobs
    cron.schedule('0 2 * * *', () => runJobWithLock('sync-model-catalog', jobs.syncModelCatalog));
    cron.schedule('0 3 * * *', () => runJobWithLock('sync-pricing', jobs.syncPricing));
    cron.schedule('0 4 * * 0', () => runJobWithLock('sync-benchmarks', jobs.syncBenchmarks));
    cron.schedule('0 5 * * *', () => runJobWithLock('generate-opportunities', jobs.generateOpportunities));
    cron.schedule('0 10 * * *', () => runJobWithLock('send-trial-reminders', jobs.sendTrialReminders));
    cron.schedule('0 9 * * 1', () => runJobWithLock('send-weekly-digest', jobs.sendWeeklyDigest));
    cron.schedule('0 1 * * *', () => runJobWithLock('cleanup-expired-sessions', jobs.cleanupSessions));
    cron.schedule('0 6 * * *', () => runJobWithLock('cleanup-guest-sanity-checks', jobs.cleanupGuestSanityChecks));
    cron.schedule('*/5 * * * *', () => jobs.reaper()); // Reaper doesn't need locking
    
    console.log('Cron jobs initialized');
  }
}
```

### Problem: Duplicate Job Execution + Stuck Jobs

When running `node-cron` inside a container:
1. If Railway auto-scales to 2+ instances, cron jobs run in **both** instances
2. If a process dies mid-run, job stays "running" forever

### Solution: Locking + Heartbeat + Reaper

```typescript
async function runJobWithLock(jobName: string, fn: () => Promise<void>) {
  const db = getDb();

  // Try to acquire lock via unique partial index
  try {
    const jobRun = await db.query(
      `INSERT INTO job_runs (job_name, status, heartbeat_at)
       VALUES ($1, 'running', NOW())
       RETURNING id`,
      [jobName]
    );

    const jobId = jobRun.rows[0].id;

    // Start heartbeat interval
    const heartbeatInterval = setInterval(async () => {
      await db.query(
        `UPDATE job_runs SET heartbeat_at = NOW() WHERE id = $1`,
        [jobId]
      );
    }, 30000); // Every 30 seconds

    try {
      await fn();
      await db.query(
        `UPDATE job_runs SET status = 'completed', finished_at = NOW() WHERE id = $1`,
        [jobId]
      );
    } catch (error) {
      await db.query(
        `UPDATE job_runs SET status = 'failed', error = $2, finished_at = NOW() WHERE id = $1`,
        [jobId, error.message]
      );
      throw error;
    } finally {
      clearInterval(heartbeatInterval);
    }
  } catch (error) {
    // Unique constraint violation = another instance has the lock
    if (error.code === '23505') {
      console.log(`Job ${jobName} already running on another instance, skipping`);
      return;
    }
    throw error;
  }
}

// Reaper job - runs every 5 minutes
async function reaperJob() {
  // Tunable per job type - increase for long-running jobs
  const STALE_THRESHOLD_MINUTES = 5;  // Default: 5min for most jobs
  // For long jobs (e.g., sync-benchmarks): use 15-30min threshold

  await db.query(
    `UPDATE job_runs
     SET status = 'failed',
         error = 'Marked stale by reaper - no heartbeat',
         finished_at = NOW()
     WHERE status = 'running'
       AND heartbeat_at < NOW() - INTERVAL '${STALE_THRESHOLD_MINUTES} minutes'`
  );
}
```

---

## 9. Infrastructure

### Hosting

| Component | Platform | Why |
|-----------|----------|-----|
| Next.js App | Railway | No timeouts, predictable costs, long-running Sanity Checks |
| CDN | Cloudflare Free | Global edge caching, DDoS protection |
| Database | Supabase | PostgreSQL + RLS + Auth |
| Background Jobs | Railway (node-cron) | Same container, locking for safety |

### Environments

| Environment | Purpose | Branch |
|-------------|---------|--------|
| Development | Local dev | - |
| Preview | PR previews | PR branches |
| Staging | Pre-production testing | `staging` |
| Production | Live | `main` |

### Background Jobs (Railway)

**Scheduled Jobs:**
| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-model-catalog` | Daily 2am UTC | Refresh models from OpenRouter |
| `sync-pricing` | Daily 3am UTC | Refresh pricing data |
| `sync-benchmarks` | Weekly Sunday 4am UTC | Refresh benchmark data |
| `generate-opportunities` | Daily 5am UTC | Recalculate opportunities |
| `send-trial-reminders` | Daily 10am UTC | Email Day 5 and Day 7 trial warnings |
| `send-weekly-digest` | Monday 9am UTC | Send free tier digests |
| `cleanup-expired-sessions` | Daily 1am UTC | Remove old sessions |
| `cleanup-guest-sanity-checks` | Daily 6am UTC | Remove guest sanity checks older than 7 days |
| `reaper` | Every 5 minutes | Mark stale jobs as failed (no heartbeat) |

**Job Structure:**
```
src/lib/jobs/
├── index.ts                    # Export all jobs
├── runner.ts                   # runJobWithLock utility
├── sync-model-catalog.ts
├── sync-pricing.ts
├── sync-benchmarks.ts
├── generate-opportunities.ts
├── send-trial-reminders.ts
├── send-weekly-digest.ts
├── cleanup-expired-sessions.ts
├── cleanup-guest-sanity-checks.ts
└── reaper.ts
```

### CI/CD

**Deployment Flow:**
```
Push to GitHub
      │
      ├── main branch ──────▶ Railway Production
      │
      ├── staging branch ───▶ Railway Staging
      │
      └── PR branches ──────▶ Railway Preview
```

**GitHub Actions (optional enhancements):**
- Run tests before deploy
- Type checking
- Lint checking
- Notify Railway webhook for deployment

---

## 10. Rate Limiting (Upstash Redis)

### Why Redis Over In-Memory

- **Survives restarts** — Railway can restart containers anytime
- **Works with scaling** — Multiple instances share state
- **Free tier sufficient** — 10K commands/day covers MVP

### Implementation

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// API rate limit: 100 requests per 15 minutes per IP
const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
  prefix: 'ratelimit:api',
});

// Sanity check rate limit: 10 per hour per user/IP
const sanityCheckLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:sanity',
});
```

### Cloudflare IP Extraction

When behind Cloudflare, use `CF-Connecting-IP` header:

```typescript
function getClientIP(req: Request): string {
  // Trust CF-Connecting-IP only when request comes through Cloudflare
  const cfIP = req.headers.get('CF-Connecting-IP');
  if (cfIP && isCloudflareRequest(req)) {
    return cfIP;
  }
  // Fallback for direct access (dev environment)
  return req.headers.get('X-Forwarded-For')?.split(',')[0] || 'unknown';
}

function isCloudflareRequest(req: Request): boolean {
  // Verify request came through Cloudflare
  return !!req.headers.get('CF-Ray');
}
```

---

## 11. Parameter Translation Layer

### Purpose

Enable "exact configuration changes needed" when switching models. Users need to know what parameters to change.

### Data Model

The `parameter_support` table captures per-model parameter compatibility:

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| temperature | Randomness control | min: 0, max: 2, default: 1 |
| top_p | Nucleus sampling | min: 0, max: 1, default: 1 |
| max_tokens | Output limit | min: 1, max: 128000 |
| stop | Stop sequences | supported: true/false |
| frequency_penalty | Repetition control | min: -2, max: 2 |
| presence_penalty | Topic control | min: -2, max: 2 |
| response_format | JSON mode | supported: true/false |
| tools | Function calling | supported: true/false |
| vision | Image input | supported: true/false |

### Migration Diff Generation

```typescript
interface MigrationDiff {
  from_model: string;
  to_model: string;
  parameter_changes: ParameterChange[];
  warnings: string[];
  code_snippet: string;
}

interface ParameterChange {
  parameter: string;
  action: 'keep' | 'adjust' | 'remove' | 'add';
  from_value?: any;
  to_value?: any;
  reason: string;
}

function generateMigrationDiff(
  fromModelId: string,
  toModelId: string,
  currentConfig: Record<string, any>
): MigrationDiff {
  // Compare parameter support between models
  // Generate actionable changes
  // Produce code snippet
}
```

---

## 12. Trial Flow & Subscription State

### Trial Flow

```
User lands on pricing page
         │
         ▼
┌─────────────────┐
│ Choose signup   │
│ path            │
└────────┬────────┘
         │
    ┌────┴────┬─────────────┐
    ▼         ▼             ▼
 Annual    Monthly       Trial
 (20% off) (full price)  (7 days)
    │         │             │
    └────┬────┘             │
         ▼                  ▼
    Stripe Checkout    Stripe Checkout
    (charge now)       (card capture, charge Day 8)
         │                  │
         ▼                  ▼
    Active Solo/       Trialing (Solo features)
    Growth/Pro              │
                           ▼
                    ┌──────┴──────┐
                    ▼             ▼
               Day 8 charge   Payment fails
               succeeds           │
                    │             ▼
                    ▼        Downgrade to Free
               Active Solo
```

### Trial Details

- **Duration:** 7 days
- **Features:** Full Solo tier access
- **Card required:** Yes, upfront
- **Charge day:** Day 8
- **Failure action:** Downgrade to Free tier
- **Reminder emails:** Day 5 (2 days left), Day 7 (last day)

### Subscription State Machine

```
trialing → active → past_due → cancelled
    ↓         ↑         ↓
cancelled ←───┴─────────┘
    ↓
  active (resubscribe)
```

| From | To | Trigger |
|------|----|---------|
| trialing | active | Trial ends + payment succeeds |
| trialing | cancelled | Trial ends + payment fails |
| active | past_due | Payment fails |
| active | cancelled | User cancels |
| past_due | active | Payment succeeds |
| past_due | cancelled | Grace period expires (3 days) |
| cancelled | active | User resubscribes |

---

## 13. Sanity Check Execution Flow

### Guest vs Authenticated Users

**Guest Users (Pre-signup):**
- Can run Sanity Checks without account (Free tier limit: 3/month)
- `is_guest = TRUE` flag set in database
- `guest_session_id` stores hashed session identifier for access control
- Results stored for 7 days then purged
- Limited to IP-based rate limiting only
- **Accessed via API routes only** (service role) — NOT via Supabase client

**Guest Access Contract:**
```typescript
// 1. On first guest sanity check, generate session token
const guestToken = crypto.randomUUID();
const hashedToken = await hash(guestToken, { algorithm: 'sha256' });

// 2. Store hashed token in database
await db.insert('sanity_checks', {
  is_guest: true,
  guest_session_id: hashedToken,
  // ... other fields
});

// 3. Return token to client (stored in localStorage)
res.json({ guestToken, results: ... });

// 4. On subsequent requests, client sends token in header
// X-Guest-Token: <guestToken>

// 5. API route validates and retrieves
const guestToken = req.headers.get('X-Guest-Token');
if (!guestToken) return unauthorized();

const hashedToken = await hash(guestToken, { algorithm: 'sha256' });
const results = await db.query(
  `SELECT * FROM sanity_checks 
   WHERE guest_session_id = $1 
   AND created_at > NOW() - INTERVAL '7 days'`,
  [hashedToken]
);
```

**Token Lifecycle:**
- **TTL:** 7 days (matches retention)
- **Storage:** Client localStorage (lost on clear = results inaccessible, but auto-purged anyway)
- **Rotation:** Not needed (short TTL, no sensitive data)
- **Conversion:** On signup, optionally migrate guest results to user account via token

**Authenticated Users:**
- Usage counted against tier limits
- `is_guest = FALSE`, `user_id` populated
- Results retained per tier retention policy
- Can link tests to specific Use Cases

### Synchronous Flow (MVP)

```
User submits prompt
       │
       ▼
┌─────────────────┐
│ Check Redis     │ ← IP-based rate limit (10/hour for guests)
│ rate limits     │   User-based limit (tier-specific for authenticated)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check monthly   │ ← Only for authenticated users
│ quota (if auth) │   Skip for guests (use Free tier limit)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Call OpenRouter │ ← Parallel requests
│ (both models)   │   60s timeout each
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store results   │ ← Retention: 7 days (guests), tier-based (authenticated)
│ Increment usage │   Only increment if authenticated
│ Return to user  │
└─────────────────┘
```

### Future: Async Flow (Phase 2)

When adding multi-test suites, judge models, or retries:

```
User submits prompt → Enqueue job → Return job_id
                           │
                           ▼
                    Worker picks up job
                           │
                           ▼
                  Client polls or streams results (SSE/WebSocket)
```

---

## 14. Admin UI

### Purpose

Manage Trust Scores and model metadata without direct database access.

### Features

- `/admin/dashboard` — Business metrics overview
- `/admin/models` — List all models, edit trust scores, benchmarks, capabilities
- `/admin/providers` — Manage provider trust tiers
- `/admin/trust-queue` — Review auto-collected trust data, approve/reject
- `/admin/parameters` — Manage parameter support matrix
- `/admin/editorial` — Manage editorial overrides (exclude/downrank models)

### Hybrid Automation

1. **Automated collection:** Scrape provider websites for certifications, policies
2. **Draft scores:** System suggests scores based on collected data
3. **Manual approval:** Admin reviews and approves final scores
4. **Audit log:** All changes tracked with timestamp and admin ID

---

## 15. Security

### Authentication & Authorization

| Layer | Protection |
|-------|------------|
| Auth | Supabase Auth (OAuth + Email/Password) |
| API | JWT validation on protected routes |
| Database | Row-Level Security policies |
| Admin | Role check + separate admin routes |

### Data Protection

| Measure | Implementation |
|---------|----------------|
| Encryption at rest | Supabase default (AES-256) |
| Encryption in transit | HTTPS everywhere (Cloudflare SSL + Railway) |
| PII handling | Minimal collection, encrypted storage |
| Payment data | Stripe handles (PCI compliant) |

### API Security

| Measure | Implementation |
|---------|----------------|
| Rate limiting | Per-user limits in middleware (Upstash Redis) |
| Input validation | Zod schemas on all inputs |
| CORS | Configured for production domain only |
| CSRF | Origin/Host validation + SameSite cookies (see below) |

### CSRF Protection

**Cookie Configuration:**
```typescript
// Supabase Auth cookie settings (configured in Supabase dashboard)
{
  sameSite: 'Lax',      // Prevents CSRF on cross-site POST
  secure: true,          // HTTPS only
  httpOnly: true         // No JS access
}
```

**API Route Protection:**
```typescript
// middleware.ts - Apply to all state-changing routes
function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('Origin');
  const host = req.headers.get('Host');
  
  // Allow same-origin requests
  if (!origin) return true; // Same-origin requests may not have Origin header
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    `https://${host}`
  ];
  
  return allowedOrigins.includes(origin);
}

// Apply to POST/PUT/DELETE/PATCH routes
if (!validateOrigin(request)) {
  return new Response('Forbidden', { status: 403 });
}
```

**Sensitive Actions (Admin, Billing):**
- Double-submit cookie pattern for `/api/admin/*` routes
- Stripe Checkout uses their hosted page (inherently CSRF-safe)
- Webhook endpoints verify signatures (not cookie-based)

### Webhook Security

```typescript
// Stripe webhook verification
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Idempotency check
const existing = await db.query(
  `SELECT id FROM webhook_events WHERE id = $1`,
  [event.id]
);
if (existing.rows.length > 0) {
  return { status: 'already_processed' };
}

// Store event before processing
await db.query(
  `INSERT INTO webhook_events (id, event_type, payload) VALUES ($1, $2, $3)`,
  [event.id, event.type, event.data]
);
```

### Request Correlation

For debugging across services (Supabase, Stripe, OpenRouter, Resend):

```typescript
// Generate request ID at entry point
const requestId = crypto.randomUUID();

// Pass through all service calls
await openrouter.chat({
  ...params,
  headers: { 'X-Request-ID': requestId }
});

// Include in logs
logger.info({ requestId, action: 'sanity_check_started' });
```

---

## 16. Data Sources

### OpenRouter API

- **Full sync:** Daily at 3am UTC — all models
- **Top 30 sync:** Every 4 hours — popular models only
- **Data:** Pricing, availability, context length, latency

### Artificial Analysis

- **Sync:** Weekly (manual trigger for MVP)
- **Data:** Benchmark scores, quality ratings → stored in `models.benchmarks` JSONB

### Trust Data (Automated Collection)

- Provider websites for certifications, policies
- News feeds for incident history
- Stored as drafts, require manual approval

---

## 17. Observability

### Error Tracking: Sentry

**Configuration:**
- Source maps uploaded on deploy
- User context attached to errors
- Performance monitoring enabled

**Alert Rules:**
- New error type → Slack notification
- Error spike (>10 in 5min) → Urgent alert

### Analytics: PostHog

**Events to Track:**

| Category | Events |
|----------|--------|
| Activation | `signup_completed`, `first_product_added`, `first_insight_seen` |
| Engagement | `opportunity_viewed`, `sanity_check_run`, `trust_report_viewed` |
| Conversion | `trial_started`, `subscription_created`, `tier_upgraded` |
| Retention | `daily_active`, `weekly_active`, `feature_used` |

**Feature Flags (Future):**
- A/B test pricing page
- Gradual rollout of new features

### Logging

**Approach:** Structured JSON logs

```typescript
// Log format
{
  "timestamp": "2026-01-17T10:30:00Z",
  "level": "info",
  "message": "Opportunity generated",
  "userId": "uuid",
  "functionId": "uuid",
  "opportunityType": "cost_savings",
  "metadata": { ... }
}
```

**Log Aggregation:** Railway Logs (built-in) + Sentry for errors

---

## 18. Performance

### Targets (from PRD Quality Gates)

| Metric | Target |
|--------|--------|
| Dashboard load | < 3 seconds |
| Sanity Check completion | < 30 seconds |
| API response (p95) | < 500ms |
| Time to first insight | < 10 minutes |

### Optimization Strategies

**Frontend:**
- React Server Components for initial data
- Suspense boundaries for loading states
- Image optimization via Next.js
- Code splitting by route

**Backend:**
- Database indexes on frequently queried columns
- Connection pooling (Supabase default)
- Caching for model catalog (Redis or in-memory, future)

**LLM Calls (Sanity Check):**
- Streaming responses for perceived speed
- Timeout handling (30s max)
- Queue and retry on rate limits

---

## 19. Pricing & Tier Limits

### Pricing Tiers

| Tier | Annual Price | Monthly Price | Products | Sanity Checks/Month |
|------|--------------|---------------|----------|---------------------|
| **Free** | $0 | $0 | 1 | 3 |
| **Solo** | $9.95/mo | $13.45/mo | 3 | 10 |
| **Growth** | $19.95/mo | $26.95/mo | 10 | 30 |
| **Pro** | $29.95/mo | $40.45/mo | 25 | 100 |
| **Enterprise** | Contact | Contact | Unlimited | Unlimited |

*Annual prices are per-month when paid annually. First year: 20% off.*

**Note:** Free tier includes 3 sanity checks/month (changed from 0 in PRD) to enable the "aha moment" before signup. See rationale below.

### Feature Matrix

| Feature | Free | Solo | Growth | Pro | Enterprise |
|---------|------|------|--------|-----|------------|
| Products | 1 | 3 | 10 | 25 | Unlimited |
| Sanity Checks/mo | 3 | 10 | 30 | 100 | Unlimited |
| Test History | 7 days | 90 days | 1 year | Forever | Forever |
| Email Alerts | Weekly digest | ✅ | ✅ | ✅ | ✅ |
| Slack/Discord | ❌ | ✅ | ✅ | ✅ | ✅ |
| Webhooks | ❌ | ❌ | ✅ | ✅ | ✅ |
| Custom Alert Rules | ❌ | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ | ✅ |
| ROI Dashboard | ❌ | ❌ | ❌ | ✅ | ✅ |
| Support | Community | Email | Priority | 4-hour | Dedicated |

### Cost Model (Sanity Checks)

ModelOptix absorbs all Sanity Check costs via our OpenRouter account.

**Cost estimation:**
- Average sanity check: 2 calls × ~1000 tokens each
- GPT-4 Turbo: ~$0.03 per check
- **Free tier:** 3 checks/month = ~$0.09/user (acquisition cost)
- **Solo tier:** 10 checks/month = ~$0.30/user
- **Pro tier:** 100 checks/month = ~$3/user (10% margin impact at $29.95/mo)

**Rationale for Free tier (3 checks):**
- Enables Happy Path completion (Stage 3: Test before signup)
- Gets users hooked on the "aha moment" of seeing better models
- Low enough to prevent abuse, high enough for meaningful evaluation
- **PRD Divergence:** PRD originally specified 0 sanity checks for Free tier. This was changed to 3 based on user acquisition strategy. Update PRD to match.

---

## 20. Decision Log

| # | Decision | Options Considered | Choice | Rationale |
|---|----------|-------------------|--------|-----------|
| 1 | Architecture | Monolith, Modular Monolith, Microservices | Monolith | Fast to build, features tightly coupled, can split later |
| 2 | Frontend | Next.js App Router, Pages Router, Remix | Next.js 14 App Router | Modern React, SSR for SEO |
| 3 | API Layer | tRPC, API Routes + Zod, Supabase Only | API Routes + Zod | Simpler for solo dev, webhook-friendly |
| 4 | Styling | Tailwind + shadcn/ui, Tailwind + Radix, CSS Modules | Tailwind + shadcn/ui | Fast iteration, own the components, great DX |
| 5 | Database | Supabase, PlanetScale, Neon | Supabase | PostgreSQL + RLS + Auth + Real-time in one |
| 6 | Auth | Supabase Auth, Clerk, Auth.js | Supabase Auth | Included, seamless RLS, no extra cost |
| 7 | OAuth Providers | Google+GitHub, Google only, +Email/Password | Google + GitHub + Email/Password | Cover most devs, fallback option |
| 8 | Payments | Stripe, Lemon Squeezy | Stripe | Industry standard, all features needed |
| 9 | Email | Resend, Postmark, SendGrid | Resend | Modern API, React Email, great DX |
| 10 | LLM Access | OpenRouter, Direct APIs | OpenRouter | PRD specifies, single API for all models |
| 11 | App Hosting | Vercel, Railway, Cloudflare | Railway | No timeouts for Sanity Checks, predictable costs |
| 12 | CDN | Cloudflare, None | Cloudflare Free | Global edge caching, DDoS protection |
| 13 | Background Jobs | Railway node-cron, Vercel Cron, Supabase | Railway node-cron | In-app with locking, simpler for MVP |
| 14 | Rate Limiting | Upstash Redis, In-memory, None | Upstash Redis | Survives restarts, works with scaling |
| 15 | Error Tracking | Sentry, LogRocket, Skip | Sentry | Industry standard, great Next.js integration |
| 16 | Analytics | PostHog, Mixpanel, Plausible | PostHog | Product analytics + feature flags, generous free tier |

---

## 21. Deployment

### Cloudflare Configuration (Day 1)

1. Add site to Cloudflare (free plan)
2. Update DNS to point to Railway
3. Enable proxy (orange cloud)
4. **Set SSL/TLS to "Full (Strict)"** — Critical to avoid redirect loops
5. Configure caching rules:
   - Cache static assets: `/_next/static/*`, `/images/*`
   - Bypass cache for API: `/api/*`

### Railway Configuration

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node .next/standalone/server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 30

[env]
NODE_ENV = "production"
```

### Seed Script

Create `scripts/seed.ts` with:

- **Initial admin user** (set `is_admin = true`) — Critical to avoid lockout
- Top 30 models with realistic pricing, benchmarks, capabilities
- 5 providers with trust tiers
- Sample trust scores
- Parameter support matrix for top models
- Demo user with sample products/functions/use cases

```bash
pnpm seed  # Populates development database
```

---

## 22. Future Considerations

### Horizontal Scaling

When needed:
1. Upstash Redis already in place for distributed rate limiting
2. Move background jobs to Railway Scheduled Jobs or separate worker service
3. CDN already in place (Cloudflare)

### Async Sanity Checks

When adding multi-test suites, judge models, or retries:
1. Add BullMQ or similar job queue
2. Implement job status polling/streaming
3. Add `sanity_check_jobs` table for job tracking

### Multi-Region

If latency becomes an issue:
1. Deploy to multiple Railway regions
2. Use Supabase read replicas
3. Edge caching already in place for static content

### Natural Language Search

Phase 2 feature using pgvector:
1. Vector column already in `models` table
2. Index already defined
3. Implement embedding generation on model sync
4. Add semantic search endpoint

---

## Next Steps

1. **Run `/bootstrap`** to generate project-plan.md from this architecture
2. **Set up accounts:**
   - Cloudflare (free tier)
   - Railway project
   - Supabase project
   - Upstash Redis (free tier)
   - Stripe account (test mode)
   - OpenRouter account
   - Resend account
   - Sentry project
   - PostHog project
3. **Begin implementation** per project-plan.md phases

---

## Appendix A: Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# OpenRouter
OPENROUTER_API_KEY=...

# Resend
RESEND_API_KEY=...

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Sentry
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...

# App
NEXT_PUBLIC_APP_URL=...
```

---

## Appendix B: Implementation Notes

These items are captured from multi-LLM review and should be addressed during implementation:

### From Gemini
1. **Cron Job Initialization** — Use `src/instrumentation.ts` with `register()` function (see Section 8)
2. **First Admin Bootstrap** — Seed script must create admin user (see Section 21)
3. **Editorial Overrides** — `editorial_overrides` table added (see Section 6)

### From ChatGPT (v2.4.0)
4. **Guest Sanity Check RLS** — Fixed: guests now use service role + `guest_session_id`, not blanket `is_guest = TRUE` access (see Section 6)
5. **Server-only Table Lockdown** — `job_runs` and `webhook_events` have RLS enabled with no policies (deny all client access)

### From ChatGPT (v2.4.1)
6. **CSRF Protection** — Added Origin/Host validation + SameSite cookie config (see Section 15)
7. **Guest Access Contract** — Full token flow documented with hashing, TTL, rotation (see Section 13)
8. **RLS Policy Style** — Replaced `FOR ALL` with explicit per-operation policies using `USING` + `WITH CHECK` (see Section 6)
9. **`updated_at` Triggers** — Added trigger function and applied to all relevant tables (see Section 6)
10. **Single Instance Cron** — Documented assumption and scaling migration path (see Section 8)
11. **Admin Write Enforcement** — Explicit "client never receives write capability" statement (see Section 6 RLS)

### From Manus
12. **Provider FK on Models** — Added `provider_id` to `models` table (see Section 6)
13. **Benchmarks Storage** — Added `benchmarks JSONB` column to `models` (see Section 6)
14. **Capabilities Storage** — Added `capabilities JSONB` column to `models` (see Section 6)
15. **Products User Index** — Added `idx_products_user` index (see Section 6)

### From Claude
16. **Free Tier Sanity Checks** — Changed from 0 to 3 (PRD divergence documented in Section 19)
17. **Guest Retention** — Aligned to 7 days (cleanup job + documentation)
18. **Job File Listing** — Updated to include all jobs (see Section 9)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial architecture (Vercel + Railway split) |
| 2.0 | Jan 2025 | Consolidated to Railway, added recommendation engine spec, job safety |
| 2.1 | Jan 2025 | Added Cloudflare CDN, Upstash Redis, alerts/notifications tables, fixed tier alignment |
| 2.2 | Jan 2025 | Switched to API Routes + Zod (removed tRPC), added vector column, heartbeat/reaper for stuck jobs, complete RLS policies, parameter support table, trial flow, pricing alignment |
| 2.3 | Jan 2025 | Fixed multi-tenancy terminology (row-based), added complete RLS policies (user_profiles, admin enforcement), clarified server-only tables, improved indexes, added API layer security rules, guest sanity check support, Free tier 3 checks |
| 2.3.1 | Jan 2025 | Added missing background jobs (trial-reminders, reaper, guest-cleanup), vector index training caveat, enterprise tier in schema |
| 2.4.0 | Jan 2025 | **Multi-LLM Review Fixes:** Added `provider_id` FK to models, added `benchmarks` and `capabilities` JSONB columns, added `editorial_overrides` table, fixed guest sanity check RLS (service role + session ID), added server-only table lockdown, added `idx_products_user` index, documented cron initialization via instrumentation.ts, added first admin to seed script requirements, added Appendix B with implementation notes |
| 2.4.1 | Jan 2025 | **Security Hardening:** Added concrete CSRF protection (Origin/Host validation, SameSite cookies), added Guest Access Contract with token flow, replaced `FOR ALL` RLS policies with explicit per-operation policies (USING + WITH CHECK), added `updated_at` trigger function, added single-instance cron assumption with scaling guidance, explicit admin write enforcement |
