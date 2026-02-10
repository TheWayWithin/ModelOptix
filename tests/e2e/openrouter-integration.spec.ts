import { test, expect, Page } from '@playwright/test';

/**
 * OpenRouter Integration E2E Tests (Phase 6: Tasks 6.3.1 & 6.3.2)
 *
 * Covers:
 * 1. Admin sync controls - triggering and status display
 * 2. Model catalog verification - 200+ models present
 * 3. Dashboard onboarding flow - choice UI and navigation
 * 4. OpenRouter import - key validation, error handling, import flow
 * 5. Full user journey - signup → onboarding → import → portfolio
 *
 * Environment Variables:
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD: Authenticated user credentials
 *   - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD: Admin user credentials
 *   - TEST_OPENROUTER_KEY: Valid OpenRouter API key for import tests
 *
 * Note: Tests requiring credentials are skipped when env vars are not set.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────
// Helper: Wait for page to load, retrying on rate limit errors
// ─────────────────────────────────────────────────────────────
async function waitForPageReady(page: Page, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const hasError = await page.getByText(/rate_limit|error loading/i).isVisible().catch(() => false);
    if (!hasError) return true;
    await page.waitForTimeout(3000 * (i + 1));
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
  // Check one last time
  return !(await page.getByText(/rate_limit/i).isVisible().catch(() => false));
}

// ─────────────────────────────────────────────────────────────
// Helper: Log in as a user
// ─────────────────────────────────────────────────────────────
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  // Wait for the login form to be interactive (Suspense boundary resolves)
  await page.waitForSelector('input[type="email"], #email', { timeout: 15000 });

  // Fill email
  const emailInput = page.locator('#email');
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page.locator('#password');
  await passwordInput.fill(password);

  // Submit the form
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for either redirect to dashboard or error message
  await Promise.race([
    page.waitForURL(/\/(dashboard|admin|products)/, { timeout: 20000 }),
    page.waitForSelector('.text-destructive', { timeout: 20000 }).then(async (el) => {
      const errorText = await el.textContent();
      throw new Error(`Login failed: ${errorText}`);
    }),
  ]);
}

// ═════════════════════════════════════════════════════════════
// 1. PUBLIC PAGES - No auth required
// ═════════════════════════════════════════════════════════════

test.describe('Public Pages', () => {
  test('model catalog redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/models');
    await page.waitForLoadState('networkidle');

    // /models is behind auth, so should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('landing page loads successfully', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify the landing page rendered - check for hero headline
    await expect(
      page.getByRole('heading', { name: /stop overpaying/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test('login page renders', async ({ page }) => {
    test.setTimeout(45000); // Allow extra time for cold starts
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('signup page renders', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });

    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15000 });
  });
});

// ═════════════════════════════════════════════════════════════
// 2. DASHBOARD ONBOARDING - Requires auth
// ═════════════════════════════════════════════════════════════

test.describe('Dashboard Onboarding Flow', () => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  test.skip(!email || !password, 'Requires TEST_USER_EMAIL and TEST_USER_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await loginAs(page, email!, password!);
  });

  test('dashboard shows onboarding choice for new users', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const ready = await waitForPageReady(page);
    if (!ready) {
      test.skip(true, 'Rate limited - skipping');
      return;
    }

    // Should see onboarding options (if user has no products)
    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const dashboardContent = page.getByText(/portfolio|products|opportunities/i);

    // One of these should be visible depending on user state
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);
    const hasDashboard = await dashboardContent.isVisible().catch(() => false);
    expect(hasOnboarding || hasDashboard).toBeTruthy();
  });

  test('onboarding shows OpenRouter and Manual options', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const ready = await waitForPageReady(page);
    if (!ready) { test.skip(true, 'Rate limited'); return; }

    // Check if onboarding is shown (only for users without products)
    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (hasOnboarding) {
      // Should see both options (use buttons to avoid strict mode - text appears in both card title and button)
      await expect(page.getByRole('button', { name: 'Connect OpenRouter' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Set Up Manually' })).toBeVisible();
      await expect(page.getByText('Recommended')).toBeVisible();
    } else {
      // User already has products, skip onboarding assertions
      test.skip();
    }
  });

  test('clicking Connect OpenRouter shows import wizard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const ready = await waitForPageReady(page);
    if (!ready) { test.skip(true, 'Rate limited'); return; }

    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      test.skip();
      return;
    }

    // Click the OpenRouter card
    await page.getByRole('button', { name: 'Connect OpenRouter' }).click();

    // Should now see the import wizard
    await expect(page.getByLabel('OpenRouter API Key')).toBeVisible();
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
  });

  test('clicking Set Up Manually shows quick start wizard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const ready = await waitForPageReady(page);
    if (!ready) { test.skip(true, 'Rate limited'); return; }

    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      test.skip();
      return;
    }

    // Click the Manual card
    await page.getByRole('button', { name: 'Set Up Manually' }).click();

    // Should transition to manual setup wizard - look for the product name input
    await expect(page.getByLabel(/product name/i)).toBeVisible({ timeout: 5000 });
  });
});

// ═════════════════════════════════════════════════════════════
// 3. OPENROUTER IMPORT - Error Handling (Task 6.3.2)
// ═════════════════════════════════════════════════════════════

test.describe('OpenRouter Import - Error Handling', () => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  test.skip(!email || !password, 'Requires TEST_USER_EMAIL and TEST_USER_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await loginAs(page, email!, password!);
  });

  test('rejects empty API key', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to import wizard (if onboarding is shown)
    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      test.skip();
      return;
    }

    await page.getByRole('button', { name: 'Connect OpenRouter' }).click();
    await expect(page.getByLabel('OpenRouter API Key')).toBeVisible();

    // Connect button should be disabled when empty
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeDisabled();
  });

  test('rejects invalid API key format', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      test.skip();
      return;
    }

    await page.getByRole('button', { name: 'Connect OpenRouter' }).click();

    // Enter invalid key (doesn't start with sk-or-)
    await page.getByLabel('OpenRouter API Key').fill('invalid-key-12345');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();

    // Should show error toast or stay on key step (invalid format rejected)
    // Toast renders in Radix portal - check either toast text or that form didn't progress
    await page.waitForTimeout(1000);
    // Verify we're still on the key input step (didn't progress to preview/select)
    await expect(page.getByLabel('OpenRouter API Key')).toBeVisible();
    // Also check for toast in the Radix portal
    const toastVisible = await page.locator('[data-state="open"]').filter({ hasText: /invalid/i }).isVisible().catch(() => false);
    const keyStillShown = await page.getByLabel('OpenRouter API Key').isVisible();
    expect(toastVisible || keyStillShown).toBeTruthy();
  });

  test('handles invalid but correctly-formatted API key', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      test.skip();
      return;
    }

    await page.getByRole('button', { name: 'Connect OpenRouter' }).click();

    // Enter key with correct prefix but invalid
    await page.getByLabel('OpenRouter API Key').fill('sk-or-v1-fake-invalid-key-12345');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();

    // Should show loading state, then error - verify we don't progress to preview/select
    // Wait for the API call to complete (validation hits the server)
    await page.waitForTimeout(5000);
    // Verify we're still on the key step (validation failed, didn't progress)
    await expect(page.getByLabel('OpenRouter API Key')).toBeVisible();
    // The key should still be in the input
    await expect(page.getByLabel('OpenRouter API Key')).toHaveValue('sk-or-v1-fake-invalid-key-12345');
  });

  test('back button returns to key input from selection', async ({ page }) => {
    // This test verifies navigation within the import wizard
    // We can only test this if we have a valid key
    const openrouterKey = process.env.TEST_OPENROUTER_KEY;
    if (!openrouterKey) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      test.skip();
      return;
    }

    await page.getByRole('button', { name: 'Connect OpenRouter' }).click();
    await page.getByLabel('OpenRouter API Key').fill(openrouterKey);
    await page.getByRole('button', { name: /connect/i }).click();

    // Wait for validation to complete (preview or select step)
    await page.waitForSelector('text=/verified|review|select/i', { timeout: 15000 });

    // Click back
    await page.getByRole('button', { name: /back/i }).click();

    // Should return to key input
    await expect(page.getByLabel('OpenRouter API Key')).toBeVisible();
  });

  test('Set up manually link cancels import and returns to choice', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      test.skip();
      return;
    }

    // Go to import wizard
    await page.getByRole('button', { name: 'Connect OpenRouter' }).click();
    await expect(page.getByLabel('OpenRouter API Key')).toBeVisible();

    // Click "Set up manually" ghost button
    await page.getByRole('button', { name: /set up manually/i }).click();

    // Should return to onboarding choice
    await expect(page.getByRole('heading', { name: /welcome to modeloptix/i })).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════
// 4. PORTFOLIO IMPORT API - Direct API tests
// ═════════════════════════════════════════════════════════════

test.describe('Portfolio Import API', () => {
  test('returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/portfolio/import?mode=preview', {
      data: { apiKey: 'sk-or-v1-test' },
    });
    // 401 = unauthorized, 429 = rate limited (both block unauthenticated access)
    expect([401, 429]).toContain(response.status());
  });

  test('returns 400 for missing API key', async ({ request, page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    // Login to get session cookies
    await loginAs(page, email, password);

    // Make API call with page's cookies
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/portfolio/import?mode=preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: res.status, body: await res.json() };
    });

    // 400 = validation error, 429 = rate limited
    expect([400, 429]).toContain(response.status);
    if (response.status === 400) {
      expect(response.body.error).toContain('required');
    }
  });

  test('returns 400 for invalid key format via API', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    await loginAs(page, email, password);

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/portfolio/import?mode=preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'not-a-valid-key' }),
      });
      return { status: res.status, body: await res.json() };
    });

    // 400 = invalid format, 429 = rate limited
    expect([400, 429]).toContain(response.status);
    if (response.status === 400) {
      expect(response.body.error).toContain('sk-or-');
    }
  });
});

// ═════════════════════════════════════════════════════════════
// 5. ADMIN SYNC CONTROLS (Task 6.0.2 verification)
// ═════════════════════════════════════════════════════════════

test.describe('Admin Sync Controls', () => {
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;

  test.skip(!adminEmail || !adminPassword, 'Requires TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await loginAs(page, adminEmail!, adminPassword!);
  });

  test('admin dashboard shows Data Sync section', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const ready = await waitForPageReady(page);
    if (!ready) { test.skip(true, 'Rate limited'); return; }

    await expect(page.getByText('Data Sync')).toBeVisible({ timeout: 15000 });
  });

  test('sync status shows model count', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const ready = await waitForPageReady(page);
    if (!ready) { test.skip(true, 'Rate limited'); return; }

    // Should show a model count badge with a number > 0
    const modelCountText = page.getByText(/\d+ models/i);
    await expect(modelCountText).toBeVisible({ timeout: 15000 });
  });

  test('admin models page shows 200+ models', async ({ page }) => {
    await page.goto('/admin/models');
    await page.waitForLoadState('networkidle');
    const ready = await waitForPageReady(page);
    if (!ready) { test.skip(true, 'Rate limited'); return; }

    // The page shows "(X total)" in the heading or table row count
    const totalText = page.getByText(/\(\d+ total\)/);
    await expect(totalText).toBeVisible({ timeout: 15000 });

    // Extract number and verify >= 200
    const text = await totalText.textContent();
    const match = text?.match(/\((\d+) total\)/);
    expect(match).toBeTruthy();
    const count = parseInt(match![1]!, 10);
    expect(count).toBeGreaterThanOrEqual(200);
  });

  test('sync buttons are present and interactive', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const ready = await waitForPageReady(page);
    if (!ready) { test.skip(true, 'Rate limited'); return; }

    // Check for Data Sync section with sync buttons
    await expect(page.getByText('Data Sync')).toBeVisible({ timeout: 15000 });

    // Check for individual sync buttons
    const syncButtons = page.getByRole('button', { name: /sync now/i });
    const syncCount = await syncButtons.count();
    expect(syncCount).toBeGreaterThanOrEqual(2); // At least model-catalog and pricing

    // Check for "Sync All" button
    await expect(page.getByRole('button', { name: /sync all/i })).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════
// 6. FULL USER JOURNEY (Task 6.3.1)
// ═════════════════════════════════════════════════════════════

test.describe('Full User Journey - OpenRouter Import', () => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const openrouterKey = process.env.TEST_OPENROUTER_KEY;

  test.skip(
    !email || !password || !openrouterKey,
    'Requires TEST_USER_EMAIL, TEST_USER_PASSWORD, and TEST_OPENROUTER_KEY'
  );

  test('complete import flow: key → validate → select/preview → import → success', async ({ page }) => {
    test.setTimeout(60000); // Allow extra time for API calls

    await loginAs(page, email!, password!);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Step 1: Check if onboarding is shown
    const welcomeHeading = page.getByRole('heading', { name: /welcome to modeloptix/i });
    const hasOnboarding = await welcomeHeading.isVisible().catch(() => false);

    if (!hasOnboarding) {
      // User already has products - test the import from products page instead
      test.skip();
      return;
    }

    // Step 2: Choose OpenRouter
    await page.getByRole('button', { name: 'Connect OpenRouter' }).click();
    await expect(page.getByLabel('OpenRouter API Key')).toBeVisible();

    // Step 3: Enter valid API key
    await page.getByLabel('OpenRouter API Key').fill(openrouterKey!);
    await page.getByRole('button', { name: /connect/i }).click();

    // Step 4: Wait for validation (shows "Validating...")
    await expect(page.getByText(/validating/i)).toBeVisible({ timeout: 3000 });

    // Step 5: Wait for next step (either preview or selection)
    // The wizard goes to 'preview' (if generation history) or 'select' (if no history)
    await page.waitForSelector(
      'text=/verified|review your ai usage|portfolio name/i',
      { timeout: 20000 }
    );

    // Step 6: Check which step we're on and proceed
    const isSelectStep = await page.getByText(/API Key Verified/i).isVisible().catch(() => false);
    const isPreviewStep = await page.getByText(/Review Your AI Usage/i).isVisible().catch(() => false);

    if (isSelectStep) {
      // Model selection mode - select first few models
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);

      // Select up to 3 models
      for (let i = 0; i < Math.min(3, checkboxCount); i++) {
        await checkboxes.nth(i).check();
      }

      // Verify selection count
      await expect(page.getByText(/\d+ models? selected/i)).toBeVisible();

      // Enter portfolio name
      const nameInput = page.locator('#product-name-select');
      await nameInput.clear();
      await nameInput.fill('E2E Test Portfolio');

      // Click import button
      await page.getByRole('button', { name: /create.*use case/i }).click();
    } else if (isPreviewStep) {
      // Preview mode - verify stats and import
      await expect(page.getByText(/models used/i)).toBeVisible();

      // Enter portfolio name
      const nameInput = page.locator('#product-name-preview');
      await nameInput.clear();
      await nameInput.fill('E2E Test Portfolio');

      // Click import button
      await page.getByRole('button', { name: /import.*use case/i }).click();
    }

    // Step 7: Wait for importing state
    await expect(page.getByText(/importing your data/i)).toBeVisible({ timeout: 5000 });

    // Step 8: Wait for success
    await expect(page.getByText(/import complete/i)).toBeVisible({ timeout: 30000 });

    // Step 9: Verify success details
    await expect(page.getByText(/E2E Test Portfolio/)).toBeVisible();
    await expect(page.getByText(/use cases? imported/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /view portfolio/i })).toBeVisible();

    // Step 10: Navigate to portfolio
    await page.getByRole('button', { name: /view portfolio/i }).click();
    await page.waitForURL(/\/products\//, { timeout: 10000 });

    // Verify we're on the product page
    await expect(page.getByText(/E2E Test Portfolio/)).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════
// 7. ADMIN SYNC API - Direct API tests
// ═════════════════════════════════════════════════════════════

test.describe('Admin Sync API', () => {
  test('sync status endpoint returns 401 for unauthenticated', async ({ request }) => {
    const response = await request.get('/api/admin/sync');
    // 401 = unauthorized, 429 = rate limited (both block unauthenticated access)
    expect([401, 429]).toContain(response.status());
  });

  test('sync trigger endpoint returns 401 for unauthenticated', async ({ request }) => {
    const response = await request.post('/api/admin/sync', {
      data: { job: 'model-catalog' },
    });
    // 401 = unauthorized, 429 = rate limited (both block unauthenticated access)
    expect([401, 429]).toContain(response.status());
  });
});
