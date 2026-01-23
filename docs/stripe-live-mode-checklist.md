# Stripe Live Mode Setup Checklist

This checklist guides you through activating Stripe in live mode for ModelOptix.

## Prerequisites

- [ ] Stripe account verified and activated
- [ ] Business details completed in Stripe Dashboard
- [ ] Bank account connected for payouts

## 1. Stripe Dashboard Configuration

### Products & Prices

- [ ] Create live mode products matching your tiers:
  - **Solo Plan** - $29/month, $290/year (17% savings)
  - **Team Plan** - $99/month, $990/year (17% savings)
  - **Enterprise Plan** - Custom pricing

- [ ] Record live price IDs:
  ```
  STRIPE_PRICE_SOLO_MONTHLY=price_live_...
  STRIPE_PRICE_SOLO_YEARLY=price_live_...
  STRIPE_PRICE_TEAM_MONTHLY=price_live_...
  STRIPE_PRICE_TEAM_YEARLY=price_live_...
  ```

### Webhook Configuration

- [ ] Create webhook endpoint in Stripe Dashboard (Live mode):
  - **URL**: `https://modeloptix.com/api/webhooks/stripe`
  - **Events to listen for**:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.paid`
    - `invoice.payment_failed`

- [ ] Record live webhook secret:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_live_...
  ```

### Customer Portal

- [ ] Configure Customer Portal in Stripe Dashboard:
  - Enable subscription cancellation
  - Enable plan changes (upgrade/downgrade)
  - Enable payment method updates
  - Customize branding to match ModelOptix

## 2. Environment Variables

### Railway Production

Add these environment variables to Railway Production environment:

```bash
# Navigate to Railway Dashboard > ModelOptix > Production > Variables

STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Price IDs
STRIPE_PRICE_SOLO_MONTHLY=price_live_...
STRIPE_PRICE_SOLO_YEARLY=price_live_...
STRIPE_PRICE_TEAM_MONTHLY=price_live_...
STRIPE_PRICE_TEAM_YEARLY=price_live_...
```

### Verification Steps

- [ ] All live keys start with `sk_live_`, `pk_live_`, `whsec_live_`, `price_live_`
- [ ] No test keys (starting with `_test_`) in production
- [ ] Staging environment still uses test keys

## 3. Testing Live Mode

### Test Checkout Flow

1. [ ] Create a new account on production
2. [ ] Navigate to pricing page
3. [ ] Complete checkout with a real card (use a low-value plan)
4. [ ] Verify subscription appears in Stripe Dashboard
5. [ ] Verify user profile updated in Supabase production

### Test Webhook Events

1. [ ] Verify checkout.session.completed fires
2. [ ] Verify user tier updates correctly
3. [ ] Verify welcome email sends

### Test Customer Portal

1. [ ] User can access billing portal
2. [ ] User can update payment method
3. [ ] User can cancel subscription
4. [ ] Cancellation updates user tier to free

## 4. Go-Live Checklist

- [ ] All test data removed from production
- [ ] Live Stripe keys deployed to production
- [ ] Webhook endpoint receiving events
- [ ] Error monitoring active (Sentry)
- [ ] Analytics tracking live (PostHog)

## 5. Post-Launch Monitoring

### First 24 Hours

- [ ] Monitor Stripe webhook delivery success rate
- [ ] Check Sentry for any checkout errors
- [ ] Verify first real payments process correctly
- [ ] Confirm welcome emails delivering

### First Week

- [ ] Review conversion rates in PostHog
- [ ] Check for failed payments in Stripe
- [ ] Monitor subscription churn
- [ ] Respond to any payment-related support tickets

## Rollback Plan

If issues arise with live payments:

1. **Immediate**: Switch back to test mode by reverting environment variables
2. **Communication**: Notify affected users via email
3. **Fix**: Debug and fix issues in staging first
4. **Redeploy**: Push fix and switch back to live mode

## Support Contacts

- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Webhook Issues**: Check Stripe Dashboard > Webhooks > Failed events
- **Payment Disputes**: Stripe Dashboard > Payments > Disputes

---

Last Updated: 2024-01-23
