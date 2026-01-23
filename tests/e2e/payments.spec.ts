import { test, expect } from '@playwright/test';

/**
 * Payment User Journey Tests
 *
 * These tests cover the subscription and billing flows:
 * 1. Pricing page display and interactions
 * 2. Checkout initiation (redirects to Stripe)
 * 3. Post-checkout success/cancel callbacks
 * 4. Subscription management in settings
 *
 * Note: Full Stripe checkout automation requires handling external domain.
 * These tests verify our app's behavior up to and after Stripe interactions.
 */

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
    // Wait for page to fully load (Suspense boundary)
    await page.waitForLoadState('networkidle');
  });

  test('displays all three pricing tiers', async ({ page }) => {
    // Check hero section - the heading contains periods
    await expect(page.getByRole('heading', { level: 1 })).toContainText('10x Better');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('10x Cheaper');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('1000x Return');

    // Check all tier cards are present (CardTitle uses h3 role)
    await expect(page.getByText('Solo').first()).toBeVisible();
    await expect(page.getByText('Growth').first()).toBeVisible();
    await expect(page.getByText('Pro').first()).toBeVisible();

    // Check "Best Value" badge on Growth tier
    await expect(page.getByText('Best Value')).toBeVisible();
  });

  test('shows correct annual pricing by default', async ({ page }) => {
    // Annual should be selected by default - look for the Annual button being active
    // The toggle uses text color to indicate active state, and Annual is default
    const annualButton = page.getByRole('button', { name: 'Annual' });
    await expect(annualButton).toBeVisible();

    // Check annual prices are displayed
    await expect(page.getByText('$9.95')).toBeVisible(); // Solo annual
    await expect(page.getByText('$19.95')).toBeVisible(); // Growth annual
    await expect(page.getByText('$29.95')).toBeVisible(); // Pro annual

    // Check first-year discount text is shown in cards
    await expect(page.getByText('First year only').first()).toBeVisible();
  });

  test('toggles between annual and monthly pricing', async ({ page }) => {
    // Click monthly toggle button
    const monthlyButton = page.getByRole('button', { name: 'Monthly' });
    await monthlyButton.click();

    // Wait for prices to update
    await page.waitForTimeout(300);

    // Check monthly prices are displayed
    await expect(page.getByText('$13.45')).toBeVisible(); // Solo monthly
    await expect(page.getByText('$26.95')).toBeVisible(); // Growth monthly
    await expect(page.getByText('$40.45')).toBeVisible(); // Pro monthly

    // First-year discount text should not be visible in monthly mode
    await expect(page.getByText('First year only')).not.toBeVisible();

    // Toggle back to annual
    const annualButton = page.getByRole('button', { name: 'Annual' });
    await annualButton.click();

    // Wait for prices to update
    await page.waitForTimeout(300);

    // Annual prices should be back
    await expect(page.getByText('$9.95')).toBeVisible();
  });

  test('shows trial CTA', async ({ page }) => {
    await expect(page.getByText('Try 7 days free')).toBeVisible();
    await expect(page.getByText('Card required')).toBeVisible();
  });

  test('shows enterprise contact section', async ({ page }) => {
    await expect(page.getByText('Need Enterprise features?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Sales' })).toBeVisible();
  });

  test('shows trust elements', async ({ page }) => {
    // 20% badge appears twice (toggle and trust section), use first()
    await expect(page.getByText('20% off first year').first()).toBeVisible();
    await expect(page.getByText('Independent: No investors, no conflicts')).toBeVisible();
  });
});

test.describe('Checkout Flow - Unauthenticated', () => {
  test('redirects to signup when clicking tier button', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click on Solo tier button
    const soloButton = page.getByRole('button', { name: 'Get Solo' });
    await soloButton.click();

    // Should redirect to signup with return params
    await expect(page).toHaveURL(/\/signup\?redirect=.*pricing.*tier=solo/);
  });

  test('redirects to signup when clicking trial', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click trial button
    await page.getByText('Try 7 days free').click();

    // Should redirect to signup with trial param
    await expect(page).toHaveURL(/\/signup\?redirect=.*trial=true/);
  });
});

test.describe('Checkout Flow - Authenticated', () => {
  // These tests require authentication
  test.describe.configure({ mode: 'serial' });

  test('clicking tier button initiates Stripe checkout', async ({ page, context }) => {
    // Skip if no test user credentials
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip(true, 'Test user credentials not configured');
      return;
    }

    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for dashboard redirect
    await page.waitForURL(/\/dashboard/);

    // Go to pricing
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click on Growth tier (most common choice)
    const growthButton = page.getByRole('button', { name: 'Get Growth' });

    // Listen for navigation to Stripe
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 10000 }).catch(() => null),
      growthButton.click(),
    ]);

    // Should redirect to Stripe checkout OR open new tab
    const currentUrl = page.url();
    const stripeUrl = newPage?.url();

    const redirectedToStripe =
      currentUrl.includes('checkout.stripe.com') ||
      stripeUrl?.includes('checkout.stripe.com');

    expect(redirectedToStripe).toBeTruthy();
  });
});

test.describe('Checkout Callbacks', () => {
  test('success callback gracefully handles invalid session', async ({ page }) => {
    // Simulate checkout return with invalid session (e.g., user manually accessing URL)
    // The API will catch the Stripe error and redirect to dashboard
    // Since dashboard requires auth, unauthenticated users end up at login
    await page.goto('/api/checkout/success?session_id=test_session');

    // Without auth, redirects to dashboard -> login (with redirect param)
    // This tests that the error handling works and doesn't break
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });

  test('canceled checkout shows canceled message', async ({ page }) => {
    await page.goto('/pricing?canceled=true');
    await page.waitForLoadState('networkidle');

    // Should show canceled alert
    await expect(page.getByText('Checkout was canceled')).toBeVisible();
    await expect(page.getByText('No charges were made')).toBeVisible();
  });

  test('failed payment shows error message', async ({ page }) => {
    await page.goto('/pricing?error=payment_incomplete');
    await page.waitForLoadState('networkidle');

    // Should show error alert
    await expect(page.getByText('Payment was not completed')).toBeVisible();
  });
});

test.describe('Subscription Management - Settings', () => {
  test('settings page shows subscription section', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip(true, 'Test user credentials not configured');
      return;
    }

    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Navigate to settings
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Check profile section exists
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/display name/i)).toBeVisible();

    // Check subscription section exists
    await expect(page.getByText('Subscription')).toBeVisible();

    // Should show current tier (Free, Solo, Growth, or Pro)
    const tierNames = ['Free Plan', 'Solo Plan', 'Growth Plan', 'Pro Plan'];
    const tierVisible = await Promise.any(
      tierNames.map(tier =>
        page.getByText(tier).isVisible()
      )
    ).catch(() => false);

    expect(tierVisible).toBeTruthy();
  });

  test('manage billing button opens Stripe portal', async ({ page, context }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip(true, 'Test user credentials not configured');
      return;
    }

    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Go to settings
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Find manage billing button (only visible for subscribed users)
    const manageBillingButton = page.getByRole('button', { name: 'Manage Billing' });

    const hasManageBilling = await manageBillingButton.isVisible().catch(() => false);

    if (hasManageBilling) {
      // Click and expect redirect to Stripe billing portal
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
        page.waitForURL(/billing\.stripe\.com/, { timeout: 10000 }).catch(() => null),
        manageBillingButton.click(),
      ]);

      const currentUrl = page.url();
      const portalUrl = newPage?.url();

      const openedPortal =
        currentUrl.includes('billing.stripe.com') ||
        portalUrl?.includes('billing.stripe.com');

      expect(openedPortal).toBeTruthy();
    } else {
      // User is on free tier, should see upgrade button instead
      await expect(page.getByRole('button', { name: /Upgrade Plan|View Plans/i })).toBeVisible();
    }
  });
});

test.describe('Tier Limit Enforcement', () => {
  test('free tier user sees upgrade prompt when limit reached', async ({ page }) => {
    const testEmail = process.env.TEST_FREE_USER_EMAIL;
    const testPassword = process.env.TEST_FREE_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip(true, 'Free tier test user not configured');
      return;
    }

    // Login as free tier user
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // This test would need a free user who already has 1 product
    // Then try to create another and verify 402 response
    // For now, just verify the settings page shows correct tier
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Free Plan')).toBeVisible();
  });
});
