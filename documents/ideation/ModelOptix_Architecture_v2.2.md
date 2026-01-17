# ModelOptix Architecture v2.2

## Overview

ModelOptix is a trust-first AI model advisor that helps developers find, compare, and optimize their LLM usage. This document defines the technical architecture.

---

## 1. Architecture Decision: Single Deployment on Railway + Cloudflare

### Why This Architecture

The original architecture split frontend (Vercel) and backend (Railway). We've consolidated to **Next.js Standalone on Railway** with **Cloudflare CDN** for:

- **No platform timeouts** — Sanity Checks can run with app-level timeouts (60s/model), not platform limits
- **Predictable costs** — No per-invocation billing surprises
- **Single deployment** — One codebase, one deploy target
- **Simpler debugging** — Single log stream (note: still need request_id correlation for external services)
- **Global performance** — Cloudflare caches static assets at 300+ edge locations
- **Future-proof** — Can scale horizontally or migrate to Kubernetes

### Architecture Diagram

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

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **CDN** | Cloudflare (Free) | Global edge caching, DDoS protection |
| **Runtime** | Railway | No timeouts, predictable pricing |
| **Framework** | Next.js 14 (standalone) | SSR for SEO, React for app |
| **API** | API Routes + Zod | Simple, type-safe, webhook-friendly |
| **Database** | Supabase Postgres | Managed, RLS, Realtime |
| **Auth** | Supabase Auth | OAuth, magic links, sessions |
| **Rate Limiting** | Upstash Redis | Distributed, survives restarts |
| **Payments** | Stripe | Subscriptions, webhooks |
| **Email** | Resend | Transactional emails |
| **LLM API** | OpenRouter | Unified access to models |
| **Observability** | PostHog + Sentry | Analytics + error tracking |

### Cost Breakdown (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Cloudflare | Free | $0 |
| Railway | Starter | ~$5-20 |
| Supabase | Free/Pro | $0-25 |
| Upstash Redis | Free | $0 (10K commands/day) |
| **Total Infrastructure** | | **~$5-45/month** |

---

## 3. Recommendation Engine

### Location

```
lib/recommendations/
├── fit-score.ts          # Calculate weighted FitScore
├── opportunity-generator.ts  # Compare models, create Opportunities
├── thresholds.ts         # Configurable thresholds
└── weights.ts            # Weight configurations
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
  const scores = {
    cost: normalizeCost(model.pricing, useCase.estimatedUsage),
    speed: normalizeSpeed(model.latency),
    quality: normalizeQuality(model.benchmarks, useCase.capabilities),
    trust: normalizeTrust(model.trustTier),
    context: Math.min(1.0, model.contextLength / useCase.requiredContext)
  };
  
  return Object.entries(weights).reduce((total, [factor, weight]) => {
    return total + (scores[factor] * weight);
  }, 0);
}
```

### Opportunity Generation

- **Trigger:** Daily cron job at 4am UTC
- **Process:** For each active Use Case, compare current model to alternatives
- **Threshold:** Create Opportunity if improvement > 10%
- **Output:** Opportunity record with improvement %, evidence, recommended model

---

## 4. Database Schema

### Enable Extensions

```sql
-- Enable pgvector for NL search features
CREATE EXTENSION IF NOT EXISTS vector;
```

### Core Tables

```sql
-- Users (managed by Supabase Auth, extended here)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free',  -- free, solo, growth, pro
  subscription_status TEXT DEFAULT 'active',  -- active, past_due, cancelled, trialing
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
  openrouter_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  context_length INTEGER,
  latency_p50 INTEGER,  -- milliseconds
  latency_p95 INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  embedding vector(1536),  -- For NL search (Phase 2)
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
  use_case_id UUID REFERENCES use_cases(id),
  user_id UUID REFERENCES user_profiles(id),
  prompt TEXT NOT NULL,
  current_model_id UUID REFERENCES models(id),
  recommended_model_id UUID REFERENCES models(id),
  current_response TEXT,
  recommended_response TEXT,
  current_latency INTEGER,
  recommended_latency INTEGER,
  user_preference TEXT,  -- current, recommended, neither
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
CREATE INDEX idx_use_cases_function ON use_cases(function_id) WHERE status = 'active';
CREATE INDEX idx_opportunities_use_case ON opportunities(use_case_id) WHERE status = 'active';
CREATE INDEX idx_models_available ON models(id) WHERE is_available = TRUE;
CREATE INDEX idx_sanity_checks_user ON sanity_checks(user_id);
CREATE INDEX idx_job_runs_name_status ON job_runs(job_name, status);
CREATE INDEX idx_job_runs_stale ON job_runs(heartbeat_at) WHERE status = 'running';
CREATE INDEX idx_alerts_user_unread ON alerts(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month);
CREATE INDEX idx_model_provider_pricing_model ON model_provider_pricing(model_id);
CREATE INDEX idx_parameter_support_model ON parameter_support(model_id);

-- Vector index for NL search (Phase 2)
CREATE INDEX idx_models_embedding ON models USING ivfflat (embedding vector_cosine_ops);
```

### Row Level Security

```sql
-- Users can only see their own data
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_user_policy ON products
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE functions ENABLE ROW LEVEL SECURITY;
CREATE POLICY functions_user_policy ON functions
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY use_cases_user_policy ON use_cases
  FOR ALL USING (
    function_id IN (
      SELECT f.id FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY opportunities_user_policy ON opportunities
  FOR ALL USING (
    use_case_id IN (
      SELECT uc.id FROM use_cases uc
      JOIN functions f ON uc.function_id = f.id
      JOIN products p ON f.product_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

ALTER TABLE sanity_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY sanity_checks_user_policy ON sanity_checks
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY alerts_user_policy ON alerts
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_prefs_user_policy ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_tracking_user_policy ON usage_tracking
  FOR ALL USING (user_id = auth.uid());

-- Models, providers, and pricing are public read
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
CREATE POLICY models_public_read ON models FOR SELECT USING (true);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY providers_public_read ON providers FOR SELECT USING (true);

ALTER TABLE model_provider_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY model_provider_pricing_public_read ON model_provider_pricing FOR SELECT USING (true);

ALTER TABLE parameter_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY parameter_support_public_read ON parameter_support FOR SELECT USING (true);

-- Model trust scores: public read, admin write
ALTER TABLE model_trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY model_trust_scores_public_read ON model_trust_scores FOR SELECT USING (true);
-- Admin write policy would be enforced at application level
```

---

## 5. Job Safety

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
  const STALE_THRESHOLD_MINUTES = 5;
  
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

### Cron Strategy

**MVP:** node-cron inside the app with locking (as above)

**Future:** When scaling, migrate to:
- Railway Scheduled Jobs calling `/api/jobs/run?job=sync-models`
- Or separate worker service

---

## 6. Pricing & Tier Limits

### Pricing (from pricing.yaml)

| Tier | Annual Price | Monthly Price | Products | Sanity Checks/Month |
|------|--------------|---------------|----------|---------------------|
| **Free** | $0 | $0 | 1 | 0 |
| **Solo** | $9.95/mo | $13.45/mo | 3 | 10 |
| **Growth** | $19.95/mo | $26.95/mo | 10 | 30 |
| **Pro** | $29.95/mo | $40.45/mo | 25 | 100 |
| **Enterprise** | Contact | Contact | Unlimited | Unlimited |

*Annual prices are per-month when paid annually. First year: 20% off.*

### Feature Matrix

| Feature | Free | Solo | Growth | Pro | Enterprise |
|---------|------|------|--------|-----|------------|
| Products | 1 | 3 | 10 | 25 | Unlimited |
| Sanity Checks/mo | 0 | 10 | 30 | 100 | Unlimited |
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
- Pro user at 100 checks/month = ~$3/month cost
- At $29.95/month Pro tier (annual) = 10% margin impact

---

## 7. Trial Flow

### Overview

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

## 8. Sanity Check Flow

### Execution

```
User submits prompt
       │
       ▼
┌─────────────────┐
│ Check Redis     │ ← Upstash rate limit (10/hour)
│ rate limits     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check monthly   │ ← usage_tracking table
│ quota           │
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
│ Store results   │ ← Retention per tier
│ Increment usage │
│ Return to user  │
└─────────────────┘
```

### Future: Async Flow (Phase 2)

When adding multi-test suites, judge models, or retries:

```
User submits prompt
       │
       ▼
┌─────────────────┐
│ Enqueue job     │ → Return job_id immediately
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Worker picks up │ ← Background processing
│ job             │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client polls or │ ← SSE/WebSocket for updates
│ streams results │
└─────────────────┘
```

---

## 9. Parameter Translation Layer

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

// Sanity check rate limit: 10 per hour per user
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
  // Check CF-Ray header or validate source IP against Cloudflare ranges
  return !!req.headers.get('CF-Ray');
}
```

---

## 11. Admin UI

### Purpose

Manage Trust Scores and model metadata without direct database access.

### Features

- `/admin/models` — List all models, edit trust scores
- `/admin/providers` — Manage provider trust tiers
- `/admin/trust-queue` — Review auto-collected trust data, approve/reject
- `/admin/parameters` — Manage parameter support matrix

### Hybrid Automation

1. **Automated collection:** Scrape provider websites for certifications, policies
2. **Draft scores:** System suggests scores based on collected data
3. **Manual approval:** Admin reviews and approves final scores
4. **Audit log:** All changes tracked with timestamp and admin ID

---

## 12. Security

### Authentication

- Supabase Auth with OAuth (Google, GitHub) and magic links
- Session cookies with SameSite=Lax

### CSRF Protection

- All state-changing routes verify Origin header
- SameSite cookies prevent cross-origin requests
- CSRF tokens for sensitive operations (delete account, etc.)

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

## 13. Data Sources

### OpenRouter API

- **Full sync:** Daily at 3am UTC — all models
- **Top 30 sync:** Every 4 hours — popular models only
- **Data:** Pricing, availability, context length, latency

### Artificial Analysis

- **Sync:** Weekly (manual trigger for MVP)
- **Data:** Benchmark scores, quality ratings

### Trust Data (Automated Collection)

- Provider websites for certifications, policies
- News feeds for incident history
- Stored as drafts, require manual approval

---

## 14. Seed Script

Create `scripts/seed.ts` with:

- Top 30 models with realistic pricing
- 5 providers with trust tiers
- Sample trust scores
- Parameter support matrix for top models
- Demo user with sample products/functions/use cases

```bash
pnpm seed  # Populates development database
```

---

## 15. Deployment

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

### Environment Variables

```
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

# Email
RESEND_API_KEY=...

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Observability
NEXT_PUBLIC_POSTHOG_KEY=...
SENTRY_DSN=...
```

---

## 16. Future Considerations

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

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial architecture (Vercel + Railway split) |
| 2.0 | Jan 2025 | Consolidated to Railway, added recommendation engine spec, job safety |
| 2.1 | Jan 2025 | Added Cloudflare CDN, Upstash Redis, alerts/notifications tables, fixed tier alignment, strengthened job locking, subscription state machine |
| 2.2 | Jan 2025 | Switched to API Routes + Zod (removed tRPC), added vector column, heartbeat/reaper for stuck jobs, RLS for opportunities/sanity_checks/model_trust_scores, Cloudflare IP handling, parameter_support table, model_provider_pricing junction, usage_tracking table, trial flow section, pricing alignment with pricing.yaml, async sanity check path in future considerations |
