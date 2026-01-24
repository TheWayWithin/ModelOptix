# ModelOptix Handoff Notes

> Current context for agent-to-agent handoff
> Last Updated: 2026-01-24 (Task 5.7 Complete)

---

## Current Phase

**Phase 5: Polish, Admin & Launch** - IN PROGRESS (13/14 tasks complete)

---

## Latest Session - 2026-01-24 (Admin Parameter Support)

### Task 5.7: Admin Parameter Support ✅

**Files Created:**
- `src/types/parameter.ts` - Parameter types, COMMON_PARAMETERS list, helper functions
- `src/app/api/admin/parameters/route.ts` - GET (model list), POST (create), PATCH (update), DELETE
- `src/app/api/admin/parameters/[modelId]/route.ts` - GET (model params), PUT (bulk replace), POST (add common)
- `src/app/admin/parameters/page.tsx` - Full admin UI with two views (model list → parameter detail)

**Files Updated:**
- `src/app/admin/layout.tsx` - Added "Parameters" nav item with Sliders icon

**Features Implemented:**
- Model list view with parameter counts and search
- Parameter detail view for selected model
- Add/Edit parameter modal with value type selection
- Delete confirmation dialog
- "Add Common Parameters" bulk action (10 standard params)
- Mobile responsive, dark mode compatible

**Verification:**
- ✅ Build passes
- ✅ All files verified on filesystem
- ✅ Task marked complete in project-plan.md

---

## Previous Session - 2026-01-24 (Sentry Setup)

### Task 5.11: Sentry + PostHog Integration ✅

**Sentry Configured:**
- Created Sentry project "modeloptix" in org "the-way-within"
- Added 4 environment variables to both Production and Staging:
  - SENTRY_DSN
  - SENTRY_ORG
  - SENTRY_PROJECT
  - SENTRY_AUTH_TOKEN
- Both environments deployed

**PostHog:** Already working (configured previously)

---

## Previous Session - 2026-01-23 23:15 (Audit Log Infrastructure)

### Task 5.13: Audit Log Infrastructure ✅

**Files Created:**
- `supabase/migrations/005_audit_logs.sql` - Table, enums, indexes, RLS
- `src/types/audit.ts` - TypeScript types and constants
- `src/lib/audit/index.ts` - Audit service with logging + query functions
- `src/app/api/admin/audit/route.ts` - API with filters + CSV export
- `src/app/admin/audit/page.tsx` - Admin UI with filtering, pagination, diff viewer

**Key Features:**
- 20 audit action types, 7 entity types
- Before/after state tracking with JSON diff
- 2-year retention policy for compliance
- CSV export for compliance audits
- IP address + user agent logging

**Migration Status:**
- [x] Deploy `006_audit_logs.sql` to Staging - 2026-01-24
- [x] Deploy `006_audit_logs.sql` to Production - 2026-01-24

---

## Previous Session - 2026-01-23 23:00 (Performance + Security Review)

### Task 5.12: Performance + Security Review ✅

**Security Review:**
- Authentication: A (middleware protects routes, rate limiting, CSRF)
- Authorization: A (admin checks at middleware + API level, RLS enforced)
- Input Validation: A (Supabase parameterized queries, TypeScript)
- Secrets: A (all secrets server-side only)
- Webhooks: A (Stripe signature verification)

**Fix Applied:**
- Added security headers to `next.config.mjs`:
  - HSTS, X-Frame-Options, X-Content-Type-Options
  - Referrer-Policy, Permissions-Policy

**Performance Review:**
- Bundle size: A (200 kB shared, acceptable)
- Database: A (parallel queries, proper projections)
- RSC: A (proper client/server separation)

**Verdict: Production Ready**

---

## Previous Session - 2026-01-23 22:25 (Email Templates)

### Task 5.9: Email Templates ✅

**React Email System Created:**
- `src/emails/components/` - Shared components (header, footer, button, card)
- `src/emails/welcome.tsx` - Welcome email
- `src/emails/alert.tsx` - Opportunity/cost alert email
- `src/emails/trial-reminder.tsx` - Trial expiration reminder
- `src/emails/weekly-digest.tsx` - Weekly digest for free tier

**Dependencies Added:**
- `@react-email/components` ^1.0.6
- `react-email` ^5.2.5

**Note:** Existing HTML templates in `src/lib/email/templates.ts` remain functional. React Email templates are an enhancement providing:
- Reusable React components
- Better maintainability
- Preview capability

---

## Previous Session - 2026-01-23 (Phase 5 Progress)

### Tasks Completed:

**Task 5.1: Savings Tracking (F-017, F-018)** ✅
- `supabase/migrations/004_savings_tracking.sql` - New table with RLS
- `src/types/savings.ts` - TypeScript interfaces
- `src/lib/savings/record-savings.ts` - Server logic
- `src/app/api/savings/route.ts` - API endpoint
- `src/components/savings/SavingsSummaryCard.tsx` - Dashboard card
- `src/app/(dashboard)/savings/page.tsx` - Detail page with CSV export

**Task 5.3: Admin Dashboard** ✅
- `src/app/api/admin/stats/route.ts` - Platform stats API (service role)
- `src/app/admin/page.tsx` - Full dashboard with real-time metrics

**Task 5.4: Admin Model Management** ✅
- `src/app/api/admin/models/route.ts` - GET (list + search + pagination) + PATCH (update)
- `src/app/admin/models/page.tsx` - Model catalog table with edit modal
- `src/components/ui/dialog.tsx` - New shadcn/ui dialog component
- `src/components/ui/switch.tsx` - New shadcn/ui switch component
- Added `@radix-ui/react-switch` dependency

**Task 5.5: Admin Provider Management** ✅
- `src/app/api/admin/providers/route.ts` - GET (list + search + model counts) + PATCH (update)
- `src/app/admin/providers/page.tsx` - Provider table with edit modal

**Task 5.8: Admin Editorial Overrides** ✅
- `src/app/api/admin/editorial-overrides/route.ts` - Full CRUD (GET/POST/PATCH/DELETE)
- `src/app/admin/editorial-overrides/page.tsx` - Override management with create/edit/delete

**Task 5.2: Notification Preferences** ✅
- `src/app/api/settings/notifications/route.ts` - GET/POST/DELETE for preferences
- Updated `src/app/(dashboard)/dashboard/settings/page.tsx` - Full notification controls

**Task 5.6: Admin Trust Queue** ✅
- `src/app/admin/trust/page.tsx` - Trust queue page with search, filters, progress tracking
- `src/components/admin/trust-score-editor.tsx` - Modal for editing 8 trust dimensions
- `src/app/api/admin/trust/route.ts` - GET (list models) + POST (create scores)
- `src/app/api/admin/trust/[modelId]/route.ts` - GET/PUT for model-specific scores
- `src/types/trust.ts` - Updated with 8 dimensions matching DB schema + admin types
- `src/app/admin/layout.tsx` - Added Trust Queue to admin nav
- 8 trust dimensions: data_handling, transparency, security, reliability, consistency, safety, accuracy, cost_stability
- Each dimension has: score (0-100), confidence, evidence, source_url, notes
- Audit trail via reviewed_by and reviewed_at fields

### Features Implemented:
- **Dashboard**: Real-time platform metrics, user counts, value delivered
- **Models**: Paginated list, search, edit (name, description, context length, active toggle)
- **Providers**: Paginated list, search, edit (name, slug, trust tier, status, HQ, docs URL)
- **Editorial Overrides**: Full CRUD, three types (exclude/downrank/flag), severity levels, expiration dates

### Migration Status:
- [x] Deploy 004_savings_tracking.sql to Staging - 2026-01-24
- [x] Deploy 004_savings_tracking.sql to Production - 2026-01-24
- [x] Deploy 005_trial_reminder_tracking.sql to Staging - 2026-01-24
- [x] Deploy 005_trial_reminder_tracking.sql to Production - 2026-01-24

### Verification:
- ✅ Build passes
- ✅ All files verified on filesystem

---

## Previous Session - 2026-01-22 (Payment E2E Tests)

### Session Summary

Created comprehensive Playwright E2E tests for payment user journeys. Fixed critical hydration/bundling bugs discovered during testing.

### Tests Created (11 passing, 4 skipped):

**tests/e2e/payments.spec.ts** (314 lines)
- 6 Pricing Page tests (display, toggle, pricing, CTAs, trust elements)
- 2 Checkout Flow tests (unauthenticated redirects to signup)
- 3 Checkout Callback tests (success, cancel, error handling)
- 4 skipped tests (require TEST_USER_EMAIL/PASSWORD credentials)

### Critical Bugs Fixed:

**1. Stripe SDK Client Bundling Issue** 🚨
- **Symptom**: Hydration error "Neither apiKey nor config.authenticator provided"
- **Root Cause**: `@/lib/stripe/index.ts` re-exported `client.ts` which initializes Stripe SDK at module load with server-only `STRIPE_SECRET_KEY`. Client components importing from `@/lib/stripe` bundled the SDK.
- **Fix**: Modified `src/lib/stripe/index.ts` to only export types/config. API routes import from `@/lib/stripe/client` directly.

**2. Middleware Missing Stripe Endpoints**
- Added `/api/checkout/success` and `/api/webhooks` to PUBLIC_API_ROUTES

**3. PostHog SSR Issues**
- Refactored to dynamic imports with `src/components/posthog-wrapper.tsx`

### Files Modified:
- `src/lib/stripe/index.ts` - Critical: removed client.ts re-export
- `src/middleware.ts` - Added Stripe public routes
- `src/components/posthog-provider.tsx` - Dynamic import
- All Stripe API routes - Changed imports to `@/lib/stripe/client`

### Verification:
- ✅ 11 tests pass, 4 skipped (need test credentials)
- ✅ Build passes
- ✅ Pushed to develop (staging.modeloptix.com)

---

## Phase 4 Summary (COMPLETE)

All 11 monetization tasks completed:
- Stripe integration with checkout flow
- Trial flow (7-day, card upfront)
- 6 webhook handlers for subscription lifecycle
- Customer Portal integration
- Settings page (profile + subscription management)
- Tier limits enforced (products: 1/3/10/unlimited, sanity checks: 3/10/30/100/500)
- E2E tests for payment journeys

---

## Remaining Phase 5 Tasks

### P0 Tasks (Must Have):
| ID | Task | Description | Status |
|----|------|-------------|--------|
| 5.1 | Savings Tracking | Track savings from model switches (F-017, F-018) | ✅ DONE |
| 5.2 | Notification Preferences | User settings for alerts/emails (F-023) | pending |
| 5.3 | Admin Dashboard | Platform overview metrics | ✅ DONE |
| 5.3 | Admin Dashboard | Admin panel home page |
| 5.4 | Admin: Model Management | CRUD for models |
| 5.5 | Admin: Provider Management | CRUD for providers |
| 5.8 | Admin: Editorial Overrides | Manual recommendation adjustments |
| 5.9 | Email Templates | Welcome, alerts, trial reminders, digest |
| 5.10 | Trial Reminder Job | Email job for trial expiring users |
| 5.11 | Sentry + PostHog Integration | Error tracking + analytics |
| 5.12 | Performance + Security Review | Optimization and security audit |
| 5.14 | Stripe Live Mode Setup | Switch from test to live keys |

### P1 Tasks (Nice to Have):
| ID | Task | Description |
|----|------|-------------|
| 5.6 | Admin: Trust Queue | ✅ DONE - Trust score review workflow |
| 5.7 | Admin: Parameter Support | ✅ DONE - Parameter support matrix management |
| 5.13 | Audit Log Infrastructure | ✅ DONE - 2-year retention for compliance |

### Recommended Starting Point:
- **5.1 Savings Tracking** - User-visible value, shows ROI
- OR **5.3-5.5 Admin Dashboard** - Operational tools for managing data

---

## Key Files Created in Phase 3

### Recommendation Engine
- `src/lib/recommendations/fit-score.ts` - FitScore calculation
- `src/lib/recommendations/weights.ts` - Weight system
- `src/lib/recommendations/opportunity-generator.ts` - Opportunity generation

### Sanity Check
- `src/lib/sanity-check/service.ts` - OpenRouter integration
- `src/lib/sanity-check/quota.ts` - Quota enforcement
- `src/components/sanity-check/` - Form, results, evaluation, quota display

### Opportunities
- `src/app/api/opportunities/` - List and detail endpoints
- `src/components/opportunities/` - Card, list, detail, filters

### Trust
- `src/types/trust.ts` - Trust types and helpers
- `src/app/(dashboard)/trust/` - Trust dashboard pages

### Guest Flow
- `src/lib/guest-session.ts` - Token management
- `src/app/try/` - Public sanity check page

---

## Immediate Context

### Session Summary - 2026-01-20 (Phase 2)

**Tasks Completed:**
1. **Task 2.1: Product CRUD** - ✅ COMPLETE (2026-01-19 23:28)
   - API routes: /api/products, /api/products/[id]
   - Components: product-card, product-form, product-list, product-detail-view
   - Pages: /products, /products/[id]
   - Full CRUD with search/filter, delete confirmation, toast notifications

2. **Task 2.2: Function CRUD** - ✅ COMPLETE (2026-01-19 23:55)
   - API routes: /api/products/[id]/functions, /api/functions/[id], /api/models
   - Components: function-card, function-form, function-list
   - Functions nested under products with model dropdown selection
   - Type casting for Supabase relation types

3. **Task 2.3: Use Case CRUD** - ✅ COMPLETE (2026-01-20 00:25)
   - API routes: /api/functions/[id]/use-cases, /api/use-cases/[id]
   - Components: use-case-card, use-case-form, use-case-list
   - Page: /products/[id]/functions/[functionId]
   - 8 task types, metrics display (calls, tokens, quality, latency)

4. **Task 2.4: Portfolio Quick Start** - ✅ COMPLETE (2026-01-20 08:45)
   - API routes: /api/dashboard/stats, /api/quick-start
   - Components: quick-start-wizard, dashboard empty-state, dashboard-content
   - Custom hook: use-dashboard-stats
   - 4-step guided onboarding wizard with skip functionality
   - Empty state detection on dashboard

5. **Task 2.5: Model Catalog Sync Job** - ✅ COMPLETE (2026-01-20 10:15)
   - OpenRouter client: src/lib/openrouter/ (types, client, index)
   - Sync job: src/lib/jobs/sync-model-catalog.ts
   - Cron schedule: Daily at 2:00 AM UTC
   - Upserts providers, models, and pricing from OpenRouter API
   - Uses service role client to bypass RLS

6. **Task 2.6: Pricing + Benchmark Sync Jobs** - ✅ COMPLETE (2026-01-20 12:10)
   - Artificial Analysis client: src/lib/artificial-analysis/ (types, client, index)
   - Pricing sync: src/lib/jobs/sync-pricing.ts (daily 3am UTC)
   - Benchmark sync: src/lib/jobs/sync-benchmarks.ts (weekly Sunday 4am UTC)
   - Updates model_provider_pricing and models.benchmarks JSONB

7. **Task 2.7: Model List UI** - ✅ COMPLETE (2026-01-20 22:30)
   - Extended types: src/types/model.ts (Model, Provider, ModelPricing, ModelWithProvider)
   - Catalog API: src/app/api/models/catalog/route.ts (filtering, search, pagination)
   - Components: src/components/models/ (model-card, model-filters, model-list)
   - Page: src/app/(dashboard)/models/page.tsx
   - Features: URL state sync, grid/list toggle, trust tier badges, capability icons

8. **Task 2.8: Model Detail Page** - ✅ COMPLETE (2026-01-21 20:40)
   - API route: src/app/api/models/[id]/route.ts (single model fetch)
   - Component: src/components/models/model-detail.tsx
   - Page: src/app/(dashboard)/models/[id]/page.tsx
   - Features: Pricing, context/limits, latency, capabilities, provider info, benchmarks, API reference

9. **Task 2.9: Model Comparison (F-019)** - ✅ COMPLETE (2026-01-21 21:15)
   - API route: src/app/api/models/compare/route.ts (fetch 2-4 models)
   - Component: src/components/models/model-comparison.tsx
   - Page: src/app/(dashboard)/models/compare/page.tsx
   - Updated: model-card.tsx (compare checkbox), model-list.tsx (sticky comparison bar)
   - Features: Side-by-side comparison table, value highlighting, capability icons, benchmark scores

10. **Task 2.10: Dashboard Home (basic metrics)** - ✅ COMPLETE (2026-01-21 21:45)
    - Enhanced API: src/app/api/dashboard/stats/route.ts (recent activity, model catalog stats)
    - Updated hook: src/hooks/use-dashboard-stats.ts
    - Updated component: src/app/(dashboard)/dashboard/dashboard-content.tsx
    - Features: Quick actions section, recent activity with relative times, model catalog card

**Phase 2 Complete!**

**Next Phase:**
- **Phase 3: Core Value Loop** - Recommendations engine, sanity checks, alerts

---

### Previous Session Summary - 2026-01-18 (Phase 0.5)

**Tasks Completed:**
1. **Task 0.5.1: Additional UI Components** - ✅ COMPLETE
2. **Task 0.5.2: Savings Calculator Component** - ✅ COMPLETE
3. **Task 0.5.3: Trader7 Case Study Section** - ✅ COMPLETE
4. **Task 0.5.4: Landing Page Integration** - ✅ COMPLETE
5. **Task 0.5.5: Dashboard Preview GIF** - ⏭️ SKIPPED

---

### Previous Session Summary - 2026-01-18 (Phase 1)

**Tasks Completed:**
1. **Task 1.1: Complete Database Schema** - ✅ COMPLETE
   - Created `supabase/migrations/001_initial_schema.sql` (601 lines, 24.8KB)
   - 17 tables across 4 domains (User, Model, Action, Infrastructure)
   - pgvector extension, triggers, indexes

2. **Task 1.2: Row Level Security Policies** - ✅ COMPLETE
   - Created `supabase/migrations/002_rls_policies.sql` (401 lines, 15.9KB)
   - User-owned tables with CRUD policies
   - Public read tables with SELECT only
   - Server-only tables with deny-all

3. **Task 1.3: Supabase Auth Configuration** - ⏳ PARTIAL
   - Created `supabase/migrations/003_auth_trigger.sql` (5.5KB)
   - Auth trigger for automatic user_profiles creation
   - **BLOCKED**: Manual Supabase dashboard config required

4. **Task 1.4: Upstash Redis Setup** - ✅ COMPLETE (code portion)
   - Installed `@upstash/redis` and `@upstash/ratelimit`
   - Created `src/lib/redis.ts` and `src/lib/rate-limit.ts`
   - **USER ACTION**: Create Upstash instance and add env vars

5. **Task 1.5: Middleware Stack** - ✅ COMPLETE
   - Installed `@supabase/ssr` for server-side auth
   - Created `src/middleware.ts` with full protection stack
   - Created `src/lib/supabase/` with client/server/middleware/service clients

6. **Task 1.6: Job Locking Infrastructure** - ✅ COMPLETE
   - Installed `node-cron` for cron scheduling
   - Created `src/lib/jobs/` with runner, reaper, cleanup jobs
   - Created `src/instrumentation.ts` for cron initialization
   - Added `experimental.instrumentationHook: true` to next.config.mjs

7. **Task 1.7: Seed Script** - ✅ COMPLETE
   - Created `scripts/seed.ts` (1166 lines, 36KB)
   - 6 providers: OpenAI, Anthropic, Google (tier A); Mistral, Meta, Cohere (tier B)
   - 31 models with realistic pricing, benchmarks, capabilities
   - 248 trust scores (8 dimensions × 31 models)
   - Admin user creation via Supabase auth.admin API
   - Added `pnpm seed` command

8. **Task 1.8: App Shell + Layout** - ✅ COMPLETE
   - Route groups: `(marketing)`, `(auth)`, `(dashboard)`, `admin`
   - Dashboard layout with collapsible sidebar
   - Marketing layout with header/footer
   - Auth layout for login/signup
   - Dark mode toggle via next-themes
   - Responsive design (mobile-first)

9. **Task 1.9: Auth Pages** - ✅ COMPLETE
   - Created `src/app/auth/callback/route.ts` for OAuth callback
   - Updated `src/app/(auth)/login/page.tsx` with OAuth + email/password
   - Updated `src/app/(auth)/signup/page.tsx` with email confirmation flow
   - Created `src/app/(auth)/forgot-password/page.tsx`
   - Created `src/app/(auth)/reset-password/page.tsx`
   - All pages have loading states, error handling, redirect preservation
   - Suspense boundaries for Next.js static generation

10. **Task 1.10: Protected Route Handling** - ✅ COMPLETE
    - Created `src/components/providers/auth-provider.tsx` with AuthProvider, useAuth, useRequireAuth
    - Created `src/app/api/auth/logout/route.ts` for server-side logout
    - Updated root layout with AuthProvider
    - Updated dashboard layout with user info and logout
    - Updated admin layout with admin check and logout

### What Needs Manual Action

**Supabase Dashboard Configuration (Task 1.3):**
1. **Google OAuth** - Auth > Providers > Enable Google
2. **GitHub OAuth** - Auth > Providers > Enable GitHub
3. **Email Templates** - Auth > Email Templates > Customize with ModelOptix branding
4. **Redirect URLs** - Auth > URL Configuration:
   - Site URL: `https://modeloptix.com`
   - Add: `https://modeloptix.com/auth/callback`
   - Add: `https://staging.modeloptix.com/auth/callback`
   - Add: `http://localhost:3000/auth/callback`
5. **Session Cookies** - Auth > Settings:
   - SameSite: Lax
   - Secure: true
   - HttpOnly: true

**Upstash Redis Setup (Task 1.4):**
1. Create Upstash Redis instance at https://console.upstash.com (free tier)
2. Add to Railway environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Phase 1 Complete - All User Actions Done

| Action | Description | Status |
|--------|-------------|--------|
| Configure OAuth | Set up Google + GitHub OAuth in Supabase Dashboard (BOTH staging & prod) | ✅ DONE |
| Create Upstash | Create Upstash Redis instance, add env vars to Railway (BOTH environments) | ✅ DONE |
| Run Migrations | Deploy 001, 002, 003 migrations to staging Supabase | ✅ DONE |
| Test Auth | OAuth login tested and working on staging | ✅ DONE |
| Add NEXT_PUBLIC_APP_URL | Added to BOTH Railway environments | ✅ DONE |

### Bugs Fixed (2026-01-18)

1. **OAuth Login Loop** - `/auth/callback` was not in middleware PUBLIC_ROUTES, causing redirect loop
2. **OAuth Redirect to localhost:8080** - Railway internal URL was used; fixed by using `NEXT_PUBLIC_APP_URL`

### Ready for Deployment

**Phase 0.5 needs deployment to staging:**
1. Push changes to `develop` branch
2. Railway auto-deploys to staging.modeloptix.com
3. Manual testing: calculator, mobile, page load time
4. If all good, merge to `main` for production

### Ready for Next Phase (Phase 4: Monetization)

| Task | Agent | Priority | Status |
|------|-------|----------|--------|
| 4.1: Stripe Product + Price Setup | developer | p0 | pending |
| 4.2: Checkout Session API | developer | p0 | pending |
| 4.3: Pricing Page UI | developer | p0 | pending |
| 4.4: Customer Portal Integration | developer | p0 | pending |
| 4.5: Webhook Handlers | developer | p0 | pending |
| 4.6: Subscription Status Sync | developer | p0 | pending |
| 4.7: Trial Period Logic | developer | p0 | pending |
| 4.8: Usage-Based Billing | developer | p1 | pending |
| 4.9: Invoice History | developer | p1 | pending |
| 4.10: Payment Method Management | developer | p1 | pending |
| 4.11: End-to-End Onboarding Funnel | developer | p0 | pending |

---

## Database Migration Status

| Migration | File | Status |
|-----------|------|--------|
| 001_initial_schema.sql | Schema, triggers, indexes | Ready to deploy |
| 002_rls_policies.sql | RLS policies | Ready to deploy |
| 003_auth_trigger.sql | Auth user trigger | Ready to deploy |

**Deployment Order:**
1. Deploy to staging Supabase first
2. Test auth flow
3. Deploy to production Supabase

---

## Critical Context for Next Agent

### Project Overview
- **Product**: ModelOptix - Trust-first AI model advisor
- **Type**: SaaS MVP
- **Architecture**: Monolithic Next.js on Railway + Cloudflare CDN
- **Database**: Supabase PostgreSQL (separate staging & production)

### Environment Configuration

| Environment | Branch | Domain | Supabase Project |
|-------------|--------|--------|------------------|
| Production | `main` | modeloptix.com | ModelOptix (cyodlmpucqfisszcosiw) |
| Staging | `develop` | staging.modeloptix.com | ModelOptix-Staging (hnjnazfkeaptmfxodzmq) |

### Key Files
- `project-plan.md` - Task tracking (mark [x] when complete)
- `progress.md` - Log deliverables and issues here
- `architecture.md` - Technical decisions and schemas
- `supabase/migrations/` - Database migrations (deploy in order)

### App Structure
```
src/app/
├── (marketing)/         # Public pages (landing, pricing, about)
│   ├── layout.tsx       # Header + footer
│   └── page.tsx         # Landing page
├── (auth)/              # Auth pages (no sidebar)
│   ├── layout.tsx       # Centered, minimal
│   ├── login/page.tsx   # Login (placeholder)
│   └── signup/page.tsx  # Signup (placeholder)
├── (dashboard)/         # Authenticated user pages
│   ├── layout.tsx       # Sidebar + header
│   └── dashboard/page.tsx
├── admin/               # Admin panel (not in route group)
│   ├── layout.tsx       # Admin sidebar
│   └── page.tsx
└── layout.tsx           # Root layout with ThemeProvider
```

---

## Warnings

1. **Migration Order**: Must deploy migrations in numerical order (001, 002, 003)
2. **File Persistence**: Use coordinator Write tool for file operations
3. **Security-First**: Never compromise security for convenience
4. **Service Role**: Backend jobs need service role key for:
   - job_runs, webhook_events (no client access)
   - Guest sanity checks (is_guest = TRUE)
   - Generating opportunities, alerts

---

## Dependencies

### External Accounts Needed (Phase 1)
- [ ] Upstash Redis account (free tier) - Task 1.4
- [ ] Google Cloud Console - OAuth credentials for Task 1.3
- [ ] GitHub Developer Settings - OAuth credentials for Task 1.3
