// Stripe configuration for ModelOptix
// Pricing from .context/structured/pricing.yaml

import type { TierConfig, PriceConfig, SubscriptionTier, BillingInterval } from './types';

// Environment variables
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  couponFirstYear: process.env.STRIPE_COUPON_FIRSTYEAR || 'firstyear20',
};

// Price IDs from Stripe Dashboard
export const stripePriceIds: Record<SubscriptionTier, Record<BillingInterval, string>> = {
  free: {
    monthly: '', // No price for free tier
    annual: '',
  },
  solo: {
    monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_SOLO_ANNUAL || '',
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
  },
  enterprise: {
    monthly: '', // Custom pricing
    annual: '',
  },
};

// Tier configurations - matches pricing.yaml
export const tierConfigs: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'Free',
    tier: 'free',
    description: 'Post-trial downgrade only',
    monthlyPrice: 0,
    annualPrice: 0,
    annualTotal: 0,
    firstYearDiscount: 0,
    features: {
      products: 1,
      sanityChecksPerMonth: 0,
      testHistory: '7 days',
      emailAlerts: false, // Weekly digest only
      slackDiscord: false,
      webhooks: false,
      customAlertRules: false,
      apiAccess: false,
      roiDashboard: false,
      support: 'none',
    },
    limits: {
      maxProducts: 1,
      maxSanityChecksPerMonth: 0,
      historyRetentionDays: 7,
    },
  },
  solo: {
    name: 'Solo',
    tier: 'solo',
    description: 'For individual developers with 1-3 AI products',
    monthlyPrice: 13.45,
    annualPrice: 9.95,
    annualTotal: 119.40,
    firstYearDiscount: 95.52, // 20% off first year
    features: {
      products: 3,
      sanityChecksPerMonth: 10,
      testHistory: '90 days',
      emailAlerts: true,
      slackDiscord: true,
      webhooks: false,
      customAlertRules: false,
      apiAccess: false,
      roiDashboard: false,
      support: 'email',
    },
    limits: {
      maxProducts: 3,
      maxSanityChecksPerMonth: 10,
      historyRetentionDays: 90,
    },
  },
  growth: {
    name: 'Growth',
    tier: 'growth',
    description: 'For multi-product solopreneurs',
    monthlyPrice: 26.95,
    annualPrice: 19.95,
    annualTotal: 239.40,
    firstYearDiscount: 191.52, // 20% off first year
    features: {
      products: 10,
      sanityChecksPerMonth: 30,
      testHistory: '1 year',
      emailAlerts: true,
      slackDiscord: true,
      webhooks: true,
      customAlertRules: true,
      apiAccess: false,
      roiDashboard: false,
      support: 'priority',
    },
    limits: {
      maxProducts: 10,
      maxSanityChecksPerMonth: 30,
      historyRetentionDays: 365,
    },
  },
  pro: {
    name: 'Pro',
    tier: 'pro',
    description: 'For power users and agencies',
    monthlyPrice: 40.45,
    annualPrice: 29.95,
    annualTotal: 359.40,
    firstYearDiscount: 287.52, // 20% off first year
    features: {
      products: 25,
      sanityChecksPerMonth: 100,
      testHistory: 'Forever',
      emailAlerts: true,
      slackDiscord: true,
      webhooks: true,
      customAlertRules: true,
      apiAccess: true,
      roiDashboard: true,
      support: '4-hour',
    },
    limits: {
      maxProducts: 25,
      maxSanityChecksPerMonth: 100,
      historyRetentionDays: -1, // Forever
    },
  },
  enterprise: {
    name: 'Enterprise',
    tier: 'enterprise',
    description: 'For teams and large organizations',
    monthlyPrice: 0, // Custom
    annualPrice: 0, // Custom
    annualTotal: 0,
    firstYearDiscount: 0,
    features: {
      products: 'unlimited',
      sanityChecksPerMonth: 'unlimited',
      testHistory: 'Forever',
      emailAlerts: true,
      slackDiscord: true,
      webhooks: true,
      customAlertRules: true,
      apiAccess: true,
      roiDashboard: true,
      support: 'dedicated',
    },
    limits: {
      maxProducts: -1, // Unlimited
      maxSanityChecksPerMonth: -1, // Unlimited
      historyRetentionDays: -1, // Forever
    },
  },
};

// Helper to get price config
export function getPriceConfig(tier: SubscriptionTier, interval: BillingInterval): PriceConfig | null {
  if (tier === 'free' || tier === 'enterprise') {
    return null;
  }

  const priceId = stripePriceIds[tier][interval];
  if (!priceId) {
    return null;
  }

  const config = tierConfigs[tier];
  const amount = interval === 'monthly'
    ? Math.round(config.monthlyPrice * 100)
    : Math.round(config.annualTotal * 100);

  return {
    tier,
    interval,
    priceId,
    amount,
    currency: 'usd',
  };
}

// Helper to get tier from price ID
export function getTierFromPriceId(priceId: string): { tier: SubscriptionTier; interval: BillingInterval } | null {
  for (const [tier, intervals] of Object.entries(stripePriceIds)) {
    for (const [interval, id] of Object.entries(intervals)) {
      if (id === priceId) {
        return { tier: tier as SubscriptionTier, interval: interval as BillingInterval };
      }
    }
  }
  return null;
}

// Signup hierarchy priority
export const signupPriority = {
  annual: 1, // Best - 20% off first year
  monthly: 2, // Full price, flexibility
  trial: 3, // 7-day fallback
};

// Trial configuration
export const trialConfig = {
  durationDays: 7,
  cardRequired: true,
  defaultTier: 'solo' as SubscriptionTier, // Full Solo features during trial
};
