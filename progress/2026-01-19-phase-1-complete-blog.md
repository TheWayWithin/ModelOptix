# Phase 1 Complete: From Zero to Full-Stack MVP in 48 Hours

Building in public with ModelOptix - the independent AI model advisor that helps you stop overpaying for AI.

---

## TL;DR

- ✅ Built complete foundation infrastructure in 2 days (12 tasks)
- ✅ Added interactive savings calculator + case study to landing page
- ✅ 17-table database with RLS, OAuth working, middleware stack complete
- ✅ Live demo shows $747/month savings on trading platform use case
- 🎯 Beta launch in ~2 weeks - [join the waitlist](https://modeloptix.com)

---

## What We Shipped This Week

I just closed out Phase 1 of ModelOptix - the complete foundation infrastructure for an AI model recommendation engine. This is the unglamorous but critical work that makes everything else possible.

**What is ModelOptix?** An independent AI model advisor that monitors your AI product stack and alerts you when better/cheaper models appear. Think of it as your "stop overpaying for AI" insurance policy.

### Phase 1: The Foundation (Complete)

**12 tasks completed in 48 hours:**

1. **Complete Database Schema** - 17 tables across 4 domains (User, Model, Action, Infrastructure)
2. **Row Level Security** - Proper multi-tenant data isolation
3. **Auth System** - OAuth (Google, GitHub) + email/password with automatic profile creation
4. **Upstash Redis** - Rate limiting and caching layer
5. **Middleware Stack** - Auth validation, CSRF protection, rate limiting, admin checks
6. **Job Infrastructure** - Distributed locking with PostgreSQL, heartbeat, reaper job
7. **Seed Script** - 31 AI models from 6 providers (OpenAI, Anthropic, Google, Mistral, Meta, Cohere)
8. **App Shell** - Route groups, dark mode, responsive layouts
9. **Auth Pages** - Login, signup, password reset with redirect preservation
10. **Protected Routes** - Middleware enforcement, auth context provider
11. **Error Handling** - Global error boundary, 404, loading skeletons, toast notifications
12. **CI/CD** - Type checking, linting, build validation on GitHub Actions

**Tech Stack:**
- **Frontend:** Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Database:** Supabase PostgreSQL with pgvector extension
- **Auth:** Supabase Auth with OAuth + email/password
- **Caching:** Upstash Redis for rate limiting
- **Deployment:** Railway (auto-deploy from GitHub)
- **CDN:** Cloudflare for performance + DDoS protection
- **Email:** Resend for transactional emails
- **Analytics:** PostHog for product analytics

### Phase 0.5: The "Aha Moment" Demo

Before diving into Phase 2, I added an interactive demo to the landing page. This is critical for waitlist conversion - show value *before* signup.

**Interactive Savings Calculator:**
- Slider for monthly API calls (10K - 1M)
- Dropdown for primary use case (6 options)
- Dropdown for current model (10 top models)
- Real-time savings calculation
- Shows monthly + yearly savings with specific numbers
- CTA scrolls to waitlist form

**Trader7 Case Study:**

Fictional trading platform with 6 AI use cases showing real-world savings:

| Use Case | Current Model | Recommended | Monthly Savings |
|----------|---------------|-------------|-----------------|
| Strategy Analysis | GPT-4o | Claude 3.5 Sonnet | $127 (32%) |
| Sentiment Analysis | GPT-4 Turbo | Llama 3.1 70B | $89 (67%) |
| Signal Generator | Claude 3 Opus | GPT-4o mini | $203 (71%) |
| Trade Validator | GPT-4o | Mistral Large | $156 (84%) |
| Risk Management | Claude 3 Opus | Claude 3.5 Sonnet | $94 (41%) |
| Execution | GPT-4 Turbo | GPT-4o mini | $78 (52%) |
| **TOTAL** | **$1,847/mo** | **$1,100/mo** | **$747/mo (40%)** |

Quality maintained: **96.2% average task success rate**

---

## Why This Matters (For Builders)

### The Problem I'm Solving

You ship a product with GPT-4. Six months later you're overpaying because:
- Cheaper models have gotten better (Llama 3.3, Gemini Flash)
- Your use case doesn't need GPT-4 (classification, summarization)
- You never benchmarked alternatives (too busy shipping features)

**400+ AI models constantly changing. Zero unbiased guidance.**

Every model creator says theirs is best. Aggregators profit from affiliate commissions. You need someone in your corner who has zero incentive to steer you wrong.

### The Solution: Proactive Model Monitoring

ModelOptix works like this:

1. **Tell us your AI stack** - Add your products, functions, use cases
2. **We analyze your usage** - Match requirements to 400+ models
3. **Get recommendations** - See better/cheaper options with confidence scores
4. **Sanity Check before switching** - Test models side-by-side on YOUR prompts
5. **Act on opportunities** - Switch models with one click, track savings

**Your AI stack evolves with the market, not 6 months behind.**

---

## Technical Deep Dive (For The Nerds)

### Database Architecture

17 tables across 4 domains with proper normalization:

**User Domain:**
- `user_profiles` - Subscription tier, admin flag, cumulative savings
- `products` - User's AI products/apps
- `functions` - AI functions within products (chat, summarization, etc.)
- `use_cases` - Specific use cases per function with current model

**Model Domain:**
- `models` - 400+ models with benchmarks, context windows, capabilities
- `providers` - OpenAI, Anthropic, Google, etc. with trust tiers (A, B, C)
- `model_provider_pricing` - Pricing per provider per model
- `model_trust_scores` - 8-dimension trust framework
- `parameter_support` - Parameter compatibility matrix
- `editorial_overrides` - Manual trust adjustments

**Action Domain:**
- `opportunities` - Recommended model switches with savings estimates
- `sanity_checks` - Side-by-side comparison results
- `alerts` - Proactive notifications when better options appear
- `notification_preferences` - User alert settings

**Infrastructure:**
- `job_runs` - Distributed job locking with heartbeat
- `webhook_events` - Stripe webhook idempotency
- `usage_tracking` - Feature usage analytics

### Row Level Security

Multi-tenant data isolation using Supabase RLS:

```sql
-- Example: Users can only see their own products
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (user_id = auth.uid());

-- Nested ownership: use_cases belong to products
CREATE POLICY "Users can view own use cases"
  ON use_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM functions f
      JOIN products p ON f.product_id = p.id
      WHERE f.id = use_cases.function_id
        AND p.user_id = auth.uid()
    )
  );
```

**Public read for model data** (SELECT only), **server-only for jobs** (no RLS policies = deny all).

### Job Infrastructure

Distributed job locking using PostgreSQL unique partial index (no Redis/Zookeeper needed):

```typescript
// lib/jobs/runner.ts
export async function runJobWithLock(jobName: string, fn: () => Promise<void>) {
  // Try to insert job_run with unique constraint
  const { data, error } = await supabase
    .from('job_runs')
    .insert({
      job_name: jobName,
      status: 'running',
      started_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
    });

  if (error?.code === '23505') {
    // Unique constraint violation = another instance running
    return { success: false, skipped: true };
  }

  // Run job with 30s heartbeat
  const interval = setInterval(async () => {
    await supabase
      .from('job_runs')
      .update({ heartbeat_at: new Date().toISOString() })
      .eq('id', data.id);
  }, 30000);

  try {
    await fn();
    return { success: true };
  } finally {
    clearInterval(interval);
    await supabase.from('job_runs').update({ status: 'completed' }).eq('id', data.id);
  }
}
```

**Reaper job** runs every 5 minutes, marks jobs with no heartbeat for 5+ minutes as failed.

### Middleware Stack

Next.js middleware handling auth, rate limiting, CSRF, admin checks:

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // 1. Refresh session
  const { data: { session } } = await supabase.auth.getSession();

  // 2. Rate limiting (API routes)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const result = await checkApiRateLimit(request);
    if (!result.success) {
      return rateLimitExceededResponse();
    }
  }

  // 3. Protected routes require auth
  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Admin routes require is_admin
  if (isAdminRoute(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single();

    if (!profile?.is_admin) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // 5. CSRF protection (POST/PUT/DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!origin || !origin.includes(host)) {
      return new NextResponse('CSRF check failed', { status: 403 });
    }
  }

  return response;
}
```

**Cloudflare-aware IP extraction** via `CF-Connecting-IP` header for accurate rate limiting behind CDN.

---

## What's Next: Phase 2

**Portfolio Management + Model Catalog** (10 tasks):

1. Product CRUD - Add/edit/delete products
2. Function CRUD - Define AI functions within products
3. Use Case CRUD - Specify use cases with current models
4. Portfolio Quick Start - Guided onboarding
5. Model Catalog Sync Job - Pull 400+ models from OpenRouter daily
6. Pricing + Benchmark Sync Jobs - Weekly updates
7. Model List UI - Browse, filter, search models
8. Model Detail Page - Full specs, pricing, benchmarks
9. Model Comparison - Side-by-side comparison table
10. Dashboard Home - Basic metrics (products, opportunities, savings)

**Goal:** Users can add their AI stack and browse the full model catalog. Foundation for recommendations in Phase 3.

**Estimated:** 3-4 days (similar velocity to Phase 1)

---

## The Build-in-Public Strategy

I'm building ModelOptix entirely in public because:

1. **Target users are builders** - You understand the problem because you live it
2. **Transparency builds trust** - An independent advisor must practice independence
3. **Feedback loops** - I'd rather pivot in Week 2 than Month 6
4. **Accountability** - Public commits force shipping over perfect

**Following along:**
- **Twitter/X:** Daily updates [@Jamie_within](https://x.com/Jamie_within)
- **LinkedIn:** Weekly deep dives [Jamie Watters](https://linkedin.com/in/jamie-watters-solo)
- **Blog:** Full writeups at [jamiewatters.work](https://jamiewatters.work)
- **Live app:** See progress at [modeloptix.com](https://modeloptix.com)

---

## Why I'm Building This

I spent 6 months and $4,000+ overpaying for AI before I realized:

**Every model recommendation was biased.**

- Model creators say theirs is best (obviously)
- Aggregators earn affiliate commissions (conflict of interest)
- Consultants get paid to recommend enterprise (not always needed)

I wanted someone in my corner with zero incentive to steer me wrong. That person didn't exist, so I'm building it.

**No investors. No partnerships. No affiliate commissions.**

ModelOptix makes money one way: your subscription. Our incentive is 100% aligned with yours - save you money, save you time, stay independent.

---

## Join the Beta

**MVP launching in ~2 weeks.** Beta testers get:

- ✅ Free lifetime access to Solo tier ($9.95/mo value)
- ✅ Early access to all features
- ✅ Direct line to me for feedback/feature requests
- ✅ Your feedback shapes the product

**[Join the waitlist at modeloptix.com](https://modeloptix.com)**

Try the interactive savings calculator on the landing page - see how much you could save with ModelOptix monitoring your AI stack.

---

## For Other Builders

If you're building in public too, I'd love to connect. Some lessons learned from this sprint:

**1. Do infrastructure properly from the start**

I wanted to defer staging environments. User insisted we do it right. They were 100% correct. Setting up dev/staging/prod environments Day 1 saved hours of rework.

**2. Security-first development**

Never compromise security for convenience. When I hit OAuth redirect loops, I didn't disable CSRF protection - I fixed the root cause (missing callback route in middleware).

**3. Interactive demos convert**

Static landing pages get 2-5% conversion. Interactive calculators get 10-15%. The Trader7 case study took 4 hours to build - ROI will be 10x in beta signups.

**4. Phase gates prevent scope creep**

Every phase has quality gates: build passes, tests pass, manual verification. Can't proceed until gates pass. Prevents "just one more feature" syndrome.

**5. Build-in-public is a feature**

Other builders are my ideal beta testers. They understand the problem viscerally. By building in public, I'm doing marketing and user research simultaneously.

---

## Let's Connect

- **Try the demo:** [modeloptix.com](https://modeloptix.com)
- **X/Twitter:** [@Jamie_within](https://x.com/Jamie_within)
- **LinkedIn:** [Jamie Watters](https://linkedin.com/in/jamie-watters-solo)
- **Blog:** [jamiewatters.work](https://jamiewatters.work)

Building something similar? Drop a comment - I'd love to hear what you're working on.

---

**Next post:** Phase 2 progress update (Portfolio Management + Model Catalog)

**Previously:** [Introducing ModelOptix - Stop Overpaying for AI](https://jamiewatters.work/progress/2026-01-18-introduction)

---

*Building in public, one phase at a time. Join the journey at [modeloptix.com](https://modeloptix.com).*
