# Stripe Setup Guide for ModelOptix

> **Task 4.1**: Stripe account setup + products/prices
> **Last Updated**: 2026-01-22

---

## Overview

This guide walks through setting up Stripe for ModelOptix subscriptions. The pricing structure incentivizes annual commitments with a 20% first-year discount.

---

## Pricing Structure

From `.context/structured/pricing.yaml`:

| Tier | Annual (per month) | Monthly | Annual Total | First Year (20% off) |
|------|-------------------|---------|--------------|---------------------|
| **Solo** | $9.95/mo | $13.45/mo | $119.40/yr | **$95.52/yr** |
| **Growth** | $19.95/mo | $26.95/mo | $239.40/yr | **$191.52/yr** |
| **Pro** | $29.95/mo | $40.45/mo | $359.40/yr | **$287.52/yr** |
| **Enterprise** | Contact | Contact | Custom | Custom |

**Key points**:
- Monthly billing has a ~35% premium over annual
- 20% first-year discount incentivizes immediate annual commitment
- Free tier is post-trial downgrade only (not a signup option)

---

## Signup Hierarchy

| Priority | Action | Incentive |
|----------|--------|-----------|
| **1st (Best)** | Annual paid signup | 20% off first year |
| **2nd** | Monthly paid signup | Full price, flexibility |
| **3rd (Fallback)** | 7-day trial | Risk reversal for hesitant |

---

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click your organization name (top-left) → **New account**
3. Name: `ModelOptix`
4. Work in **Test Mode** initially (toggle in top-right)

---

## Step 2: Create Products

Navigate to **Products** → **Add product**

### Product 1: Solo

| Field | Value |
|-------|-------|
| Name | Solo |
| Description | For individual developers with up to 3 AI products. 10 sanity checks/month, 90-day history, email + Slack/Discord alerts. |

### Product 2: Growth

| Field | Value |
|-------|-------|
| Name | Growth |
| Description | For multi-product solopreneurs. 10 products, 30 sanity checks/month, 1-year history, webhooks, custom alert rules. Best Value. |

### Product 3: Pro

| Field | Value |
|-------|-------|
| Name | Pro |
| Description | For power users and agencies. 25 products, 100 sanity checks/month, forever history, full API access, ROI dashboard, 4-hour support. |

---

## Step 3: Create Prices

For each product, click **Add price** to create both monthly and annual options.

### Solo Plan Prices

**Monthly Price:**
| Field | Value |
|-------|-------|
| Pricing model | Standard pricing |
| Price | $13.45 |
| Billing period | Monthly |
| Free trial | 7 days |

**Annual Price:**
| Field | Value |
|-------|-------|
| Pricing model | Standard pricing |
| Price | $119.40 |
| Billing period | Yearly |
| Free trial | 7 days |

### Growth Plan Prices

**Monthly Price:**
| Field | Value |
|-------|-------|
| Price | $26.95 |
| Billing period | Monthly |
| Free trial | 7 days |

**Annual Price:**
| Field | Value |
|-------|-------|
| Price | $239.40 |
| Billing period | Yearly |
| Free trial | 7 days |

### Pro Plan Prices

**Monthly Price:**
| Field | Value |
|-------|-------|
| Price | $40.45 |
| Billing period | Monthly |
| Free trial | 7 days |

**Annual Price:**
| Field | Value |
|-------|-------|
| Price | $359.40 |
| Billing period | Yearly |
| Free trial | 7 days |

---

## Step 4: Create 20% First-Year Coupon

Navigate to **Products** → **Coupons** → **Create coupon**

| Field | Value |
|-------|-------|
| Name | First Year 20% Off |
| ID | `firstyear20` |
| Type | Percentage discount |
| Percent off | 20 |
| Duration | Once |
| Apply to | Specific products: Solo, Growth, Pro |

**Resulting first-year prices when coupon applied:**
- Solo Annual: ~~$119.40~~ → **$95.52**
- Growth Annual: ~~$239.40~~ → **$191.52**
- Pro Annual: ~~$359.40~~ → **$287.52**

---

## Step 5: Configure Customer Portal

Navigate to **Settings** → **Billing** → **Customer portal**

### Enable Features

- [x] **Customers can update their payment methods**
- [x] **Customers can view their invoice history**
- [x] **Customers can update subscriptions**
  - [x] Customers can switch plans
  - [x] Prorate subscription changes
- [x] **Customers can cancel subscriptions**
  - [x] Collect cancellation reasons

### Business Information

- **Privacy policy**: `https://modeloptix.com/privacy`
- **Terms of service**: `https://modeloptix.com/terms`

---

## Step 6: Set Up Webhook Endpoint

Navigate to **Developers** → **Webhooks** → **Add endpoint**

### Staging Environment

| Field | Value |
|-------|-------|
| Endpoint URL | `https://staging.modeloptix.com/api/webhooks/stripe` |
| Description | ModelOptix Staging |
| Listen to | Events on your account |

### Events Subscribed (✅ Configured)

- `checkout.session.completed` - New subscription via checkout
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Plan change, renewal, etc.
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Payment successful
- `invoice.payment_failed` - Payment failed

### Production Environment (Later)

Create a second webhook endpoint:
- URL: `https://modeloptix.com/api/webhooks/stripe`
- Same events as staging

---

## Step 7: Collect Configuration Values

After completing setup, gather these values:

### API Keys

Found in **Developers** → **API keys**

```bash
# Test Mode Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Webhook Secret

Found in **Developers** → **Webhooks** → Click your endpoint → **Signing secret**

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Price IDs

Found on each product page, click on each price to see its ID:

```bash
# Solo
STRIPE_PRICE_SOLO_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_SOLO_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxx

# Growth
STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_GROWTH_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxx

# Pro
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxx
```

### Coupon ID

```bash
STRIPE_COUPON_FIRSTYEAR=firstyear20
```

---

## Step 8: Add Environment Variables to Railway

### Staging Environment

1. Go to Railway Dashboard → ModelOptix project
2. Select **Staging** environment
3. Go to **Variables** tab
4. Add all the variables from Step 7 (use test mode keys)

### Production Environment (When Ready)

1. Switch Stripe to **Live Mode**
2. Get live API keys (sk_live_xxx, pk_live_xxx)
3. Create production webhook endpoint
4. Add live keys to Railway production environment

---

## Verification Checklist

Before proceeding to Task 4.2, confirm:

- [ ] Stripe account created for ModelOptix
- [ ] 3 products created (Solo, Growth, Pro)
- [ ] 6 prices created (monthly + annual for each tier)
- [ ] 7-day trial enabled on all prices
- [ ] 20% first-year coupon created (`firstyear20`)
- [ ] Customer portal configured
- [ ] Webhook endpoint created (staging)
- [ ] All Price IDs recorded
- [ ] Environment variables added to Railway staging

---

## Checkout Flow Summary

Based on the pricing hierarchy, here's how checkout will work:

### Primary Path: Annual with 20% Off (Priority 1)

1. User lands on pricing page
2. Annual billing toggle is **default/selected**
3. User selects tier (Growth highlighted as "Best Value")
4. Clicks "Start Now - 20% Off First Year"
5. Stripe Checkout opens with:
   - Annual price
   - `firstyear20` coupon auto-applied
   - Shows: ~~$239.40~~ **$191.52/year**
6. User enters payment details
7. Subscription starts immediately (or after 7-day trial if selected)

### Secondary Path: Monthly (Priority 2)

1. User toggles to "Monthly" billing
2. Sees full monthly prices ($13.45, $26.95, $40.45)
3. No coupon applied
4. Subscription starts immediately

### Fallback Path: 7-Day Trial (Priority 3)

1. User clicks small "Try 7 days free" link
2. Stripe Checkout with trial enabled
3. Card collected but not charged
4. Full Solo features during trial
5. Day 8: Card charged or downgrade to Free tier

---

## Trial Behavior

From `pricing.yaml`:

| Setting | Value |
|---------|-------|
| Trial duration | 7 days |
| Features during trial | Full Solo tier |
| Card required | Yes (upfront) |
| Charge day | Day 8 |
| Payment failure | Downgrade to Free tier |

---

## Tier Limits Reference

For implementing tier enforcement (Task 4.10):

| Feature | Free | Solo | Growth | Pro | Enterprise |
|---------|------|------|--------|-----|------------|
| Products | 1 | 3 | 10 | 25 | Unlimited |
| Sanity checks/month | 0 | 10 | 30 | 100 | Unlimited |
| Test history | 7 days | 90 days | 1 year | Forever | Forever |
| Email alerts | Weekly digest | ✅ | ✅ | ✅ | ✅ |
| Slack/Discord | ❌ | ✅ | ✅ | ✅ | ✅ |
| Webhooks | ❌ | ❌ | ✅ | ✅ | ✅ |
| Custom alert rules | ❌ | ❌ | ✅ | ✅ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ | ✅ |
| ROI dashboard | ❌ | ❌ | ❌ | ✅ | ✅ |
| Support | ❌ | Email | Priority | 4-hour | Dedicated |

---

## Live Mode Setup (Task 5.14 - Before Production Launch)

When ready to accept real payments, complete these steps:

### Step 1: Switch to Live Mode

1. In Stripe Dashboard, toggle **Test mode** → **Live mode** (top-right)
2. Complete account activation if prompted (business details, bank account)

### Step 2: Create Live Products & Prices

Recreate the same products/prices in live mode:

| Product | Monthly Price | Annual Price |
|---------|--------------|--------------|
| Solo | $13.45 | $119.40 |
| Growth | $26.95 | $239.40 |
| Pro | $40.45 | $359.40 |

**Important:** Enable 7-day trial on each price.

### Step 3: Create Live Coupon

- **Name**: First Year 20% Off
- **ID**: `firstyear20`
- **Type**: Percentage (20%)
- **Duration**: Once

### Step 4: Create Live Webhook Endpoint

**Developers** → **Webhooks** → **Add endpoint**

- **URL**: `https://modeloptix.com/api/webhooks/stripe`
- **Events**: Same 6 events as test mode

### Step 5: Get Live API Keys

**Developers** → **API keys** (in Live mode)

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (from live webhook)
```

### Step 6: Update Railway Production Variables

Add all live keys and price IDs to Railway **production** environment:

```bash
railway variables set STRIPE_SECRET_KEY="sk_live_..." -e production
railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..." -e production
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..." -e production
railway variables set STRIPE_PRICE_SOLO_MONTHLY="price_..." -e production
# ... all price IDs
railway variables set STRIPE_COUPON_FIRSTYEAR="firstyear20" -e production
```

### Step 7: Verify Live Mode

- [ ] Test checkout with a real card (small amount, refund after)
- [ ] Verify webhook receives events
- [ ] Check subscription appears in Stripe Dashboard
- [ ] Customer Portal works

---

## Related Tasks

- **Task 4.2**: Stripe client integration (uses these Price IDs) ✅
- **Task 4.3**: Checkout flow implementation
- **Task 4.4**: Trial flow (7-day, card upfront)
- **Task 4.5**: Webhook handlers
- **Task 4.6**: Customer Portal integration
- **Task 4.10**: Tier limit enforcement (uses limits above)
- **Task 5.14**: Stripe Live Mode Setup (this section)

---

## Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Docs: Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Docs: Coupons](https://stripe.com/docs/billing/subscriptions/coupons)
- [Stripe Docs: Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Docs: Webhooks](https://stripe.com/docs/webhooks)
