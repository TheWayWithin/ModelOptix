# Phase 4 Complete: ModelOptix Now Has a Business Model

*Build in Public Update - January 22, 2026*

---

## The Hook: Are You Paying 10x More Than You Should for AI?

Here's a number that keeps me up at night: **most developers are overpaying for AI by 40-70%**.

Not because they're careless. Because the AI landscape is moving so fast that what was the "best model" three months ago is now outperformed by something that costs a fraction of the price.

I've been building ModelOptix to solve this exact problem - an independent AI model advisor that tells you when you're overpaying and shows you exactly what to switch to.

Today, I'm excited to share that **Phase 4 is complete**: ModelOptix now has a full monetization system. Here's what we shipped.

---

## What We Built This Week

### Stripe Integration: The Full Stack

We didn't just add a "Buy" button. We built a complete subscription infrastructure:

**Pricing Architecture**
- Three paid tiers: Solo ($9.95/mo annual), Growth ($19.95/mo), Pro ($29.95/mo)
- 20% first-year discount automatically applied at checkout
- 7-day free trial with card upfront (on Solo tier)
- Annual vs monthly toggle with real-time price updates

**The Checkout Flow**
```
Pricing Page → Stripe Checkout → Webhook → Database Update → Dashboard
```

Every step is covered:
- Unauthenticated users get redirected to signup with return URL preserved
- Checkout sessions pre-populate with user email and tier selection
- Success/cancel/error states all handled gracefully

**Webhook Handlers**
We handle 6 critical Stripe events:
1. `checkout.session.completed` - New subscription activated
2. `customer.subscription.created` - Subscription created (may still be trialing)
3. `customer.subscription.updated` - Upgrades, downgrades, renewals
4. `customer.subscription.deleted` - Cancellation completed
5. `invoice.paid` - Recurring payment successful
6. `invoice.payment_failed` - Payment failed, mark as `past_due`

**Customer Portal**
Users can manage their subscription, update payment methods, and view invoices directly through Stripe's Customer Portal - accessible from their account settings.

### Tier Limits: Making Freemium Work

We enforce limits at the API level:

| Feature | Free | Solo | Growth | Pro |
|---------|------|------|--------|-----|
| Products | 1 | 3 | 10 | Unlimited |
| Sanity Checks | 3/mo | 10/mo | 30/mo | 100/mo |

When you hit a limit, you get a clear error with upgrade prompt - not a cryptic failure.

### Account Settings Page

A single settings page handles:
- Profile management (name, company)
- Subscription status with visual badges (Active/Trial/Past Due)
- "Manage Billing" button for portal access
- Upgrade prompts for free tier users

---

## The Bug That Almost Broke Everything

Here's where it gets interesting (read: where I lost several hours debugging).

When we wrote E2E tests for the payment flows, **every test failed with a blank page**.

The error in the console?
```
Neither apiKey nor config.authenticator provided
```

At first, I thought it was PostHog. We refactored PostHog to use dynamic imports. Still broken.

Then I traced it deeper. The error was coming from... **the Stripe SDK**.

### Root Cause: Server Code Leaking to Client

Here's what happened:

Our `@/lib/stripe/index.ts` file had this innocent-looking line:
```typescript
export * from './client';
```

The `client.ts` file initializes Stripe like this:
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { ... });
```

See the problem?

When **any client component** imported from `@/lib/stripe` (even just types!), Webpack bundled the entire `client.ts` module - including the Stripe SDK initialization that requires the server-only `STRIPE_SECRET_KEY`.

**The Fix:**

We separated client-safe exports from server-only code:
```typescript
// index.ts - Client-safe only
export * from './types';
export * from './config';
// NOTE: Do NOT re-export from './client' here
```

API routes now import directly from `@/lib/stripe/client` when they need server-side Stripe functions.

This is the kind of bug that's invisible in development (SSR works fine) but breaks everything in production when client bundles try to initialize server-only code.

---

## E2E Test Coverage

We now have 11 passing Playwright tests covering the payment journey:

**Pricing Page (6 tests)**
- Displays all three pricing tiers
- Shows correct annual pricing by default
- Toggles between annual/monthly correctly
- Trial CTA visible
- Enterprise contact section present
- Trust elements displayed (20% badge, independence message)

**Checkout Flow (2 tests)**
- Unauthenticated users redirect to signup with tier preserved
- Trial button redirects with trial flag

**Checkout Callbacks (3 tests)**
- Success callback handles invalid sessions gracefully
- Canceled checkout shows appropriate message
- Failed payment shows error state

Four tests are skipped pending test user credentials for authenticated flows.

---

## By The Numbers

**Phase 4 Stats:**
- 11 tasks completed
- ~2,500 lines of code added
- 6 webhook handlers
- 11 E2E tests (4 skipped)
- 1 critical bundling bug fixed
- $0 in Stripe fees (test mode)

**Files Created:**
- `src/lib/stripe/` - Complete Stripe integration
- `src/app/api/checkout/` - Checkout endpoints
- `src/app/api/billing/` - Portal endpoint
- `src/app/api/webhooks/stripe/` - Webhook handlers
- `src/app/(marketing)/pricing/` - Pricing page
- `src/app/(dashboard)/dashboard/settings/` - Account settings
- `tests/e2e/payments.spec.ts` - E2E test suite

---

## What's Next: Phase 5

Phase 5 is the final push to production:

1. **Savings Tracking** - Show users their ROI from model switches
2. **Admin Dashboard** - Tools for managing models, providers, trust scores
3. **Email Templates** - Welcome, trial reminders, weekly digests
4. **Sentry + PostHog** - Error tracking and analytics
5. **Performance & Security Review** - Audit before launch
6. **Stripe Live Mode** - Flip the switch to real money

---

## Try It Yourself

Want to see how much you could save on AI?

**[Check out the interactive savings calculator on our landing page](https://modeloptix.com)**

Enter your current model, use case, and API volume - we'll show you exactly what you're overpaying.

If you're building with AI and want to stop leaving money on the table, **[join the waitlist](https://modeloptix.com)**.

No investors. No agenda. Just independent advice on which models actually make sense for your use case.

---

*Building in public means sharing the wins and the 3-hour debugging sessions. Thanks for following along.*

**[modeloptix.com](https://modeloptix.com)** - Stop Overpaying for AI

#buildinpublic #solofounder #stripe #nextjs
