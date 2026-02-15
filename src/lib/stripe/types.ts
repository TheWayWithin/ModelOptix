// Stripe types for ModelOptix

export type SubscriptionTier = 'free' | 'solo' | 'growth' | 'pro' | 'enterprise';
export type BillingInterval = 'monthly' | 'annual';

export interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualTotal: number;
  firstYearDiscount: number; // 20% off = $95.52 for Solo
  features: TierFeatures;
  limits: TierLimits;
}

export interface TierFeatures {
  products: number | 'unlimited';
  sanityChecksPerMonth: number | 'unlimited';
  testHistory: string;
  emailAlerts: boolean;
  slackDiscord: boolean;
  webhooks: boolean;
  customAlertRules: boolean;
  apiAccess: boolean;
  roiDashboard: boolean;
  support: 'none' | 'email' | 'priority' | '4-hour' | 'dedicated';
}

export interface TierLimits {
  maxProducts: number;
  maxSanityChecksPerMonth: number;
  historyRetentionDays: number;
}

export interface PriceConfig {
  tier: SubscriptionTier;
  interval: BillingInterval;
  priceId: string;
  amount: number; // in cents
  currency: string;
}

export interface CheckoutSessionParams {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  applyFirstYearCoupon?: boolean;
}

export interface PortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export interface SubscriptionStatus {
  id: string;
  customerId: string;
  tier: SubscriptionTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

// Webhook event types we handle (configured in Stripe Dashboard)
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';
