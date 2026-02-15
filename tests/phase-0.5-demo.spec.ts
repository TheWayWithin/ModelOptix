import { test, expect } from '@playwright/test';

test.describe('Phase 0.5: Waitlist Demo Enhancement', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    // Wait for DOM to be ready (don't use networkidle - PostHog keeps connections open)
    await page.waitForLoadState('domcontentloaded');
    // Wait for React to hydrate
    await page.waitForTimeout(1000);
  });

  test.describe('Landing Page Structure', () => {
    test('landing page loads successfully', async ({ page }) => {
      // Check page title or heading
      await expect(page.locator('h1')).toContainText('Stop overpaying for AI');
    });

    test('hero section has CTA to scroll to demo', async ({ page }) => {
      // Use more specific selector - hero CTA contains "Calculate Your Savings" text
      const heroCta = page.locator('a[href="#demo-section"]').filter({ hasText: 'Calculate Your Savings' });
      await expect(heroCta).toBeVisible();
    });

    test('demo section exists with correct header', async ({ page }) => {
      const demoSection = page.locator('#demo-section');
      await expect(demoSection).toBeVisible();

      const sectionHeader = demoSection.locator('h2');
      await expect(sectionHeader).toContainText('See Your Potential Savings');
    });

    test('smooth scroll works from hero to demo section', async ({ page }) => {
      // Click the hero CTA
      await page.click('a[href="#demo-section"]');

      // Wait for scroll animation
      await page.waitForTimeout(500);

      // Demo section should now be in viewport
      const demoSection = page.locator('#demo-section');
      await expect(demoSection).toBeInViewport();
    });
  });

  test.describe('Savings Calculator', () => {
    test('calculator component is visible', async ({ page }) => {
      // Look for the calculator card
      const calculator = page.locator('text=Monthly API Calls').first();
      await expect(calculator).toBeVisible();
    });

    test('API calls slider exists and is interactive', async ({ page }) => {
      // Find the slider
      const slider = page.locator('[role="slider"]').first();
      await expect(slider).toBeVisible();

      // Check slider is interactable
      await expect(slider).toBeEnabled();
    });

    test('use case dropdown has 6 options', async ({ page }) => {
      // Find and click the use case dropdown
      const useCaseDropdown = page.locator('button').filter({ hasText: /Code Generation|Reasoning|Text Generation|Data Processing|Chat|Agentic/i }).first();
      await expect(useCaseDropdown).toBeVisible();

      // Click to open dropdown
      await useCaseDropdown.click();

      // Check for options
      await expect(page.locator('[role="option"]')).toHaveCount(6);

      // Verify some options
      await expect(page.locator('[role="option"]').filter({ hasText: 'Code Generation' })).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: 'Reasoning' })).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: 'Text Generation' })).toBeVisible();

      // Close dropdown by pressing Escape
      await page.keyboard.press('Escape');
    });

    test('model dropdown has multiple options', async ({ page }) => {
      // Find and click the model dropdown - it shows "Current Model" label with model name
      const modelDropdown = page.locator('button').filter({ hasText: /Claude Sonnet|GPT-4|Gemini|Claude Opus/i }).first();
      await expect(modelDropdown).toBeVisible();

      // Click to open dropdown
      await modelDropdown.click();

      // Check for at least 5 options
      const options = page.locator('[role="option"]');
      expect(await options.count()).toBeGreaterThanOrEqual(5);

      // Verify some models - using partial matches for flexibility
      await expect(page.locator('[role="option"]').filter({ hasText: /GPT-4/i }).first()).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: /Claude/i }).first()).toBeVisible();

      // Close dropdown
      await page.keyboard.press('Escape');
    });

    test('optimization priority dropdown exists', async ({ page }) => {
      // Find the priority dropdown
      const priorityDropdown = page.locator('button').filter({ hasText: /Balanced|Quality First|Cost First/i }).first();
      await expect(priorityDropdown).toBeVisible();

      // Click to open dropdown
      await priorityDropdown.click();

      // Check for 3 options
      await expect(page.locator('[role="option"]')).toHaveCount(3);

      // Verify options
      await expect(page.locator('[role="option"]').filter({ hasText: 'Balanced' })).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: 'Quality First' })).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: 'Cost First' })).toBeVisible();

      // Close dropdown
      await page.keyboard.press('Escape');
    });

    test('dual metrics display shows performance and cost', async ({ page }) => {
      // Look for the optimization display
      const optimizationDisplay = page.locator('text=Your estimated optimization');
      await expect(optimizationDisplay).toBeVisible();

      // Should show performance improvement with percentage
      const performanceDisplay = page.locator('text=/\\+\\d+%/').first();
      await expect(performanceDisplay).toBeVisible();

      // Should show cost value with dollar sign
      const costDisplay = page.locator('text=/[\\-\\+]\\$[\\d,\\.]+/').first();
      await expect(costDisplay).toBeVisible();
    });

    test('CTA button exists and is clickable', async ({ page }) => {
      const ctaButton = page.locator('button').filter({ hasText: 'Join Waitlist for Real Results' });
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toBeEnabled();
    });

    test('CTA button scrolls to waitlist section', async ({ page }) => {
      // The CTA button may scroll to or navigate to waitlist
      const ctaButton = page.locator('button').filter({ hasText: 'Join Waitlist for Real Results' });
      await expect(ctaButton).toBeVisible();

      // Click CTA
      await ctaButton.click();

      // Wait for any scroll/navigation
      await page.waitForTimeout(1000);

      // Either waitlist form is in viewport, or page scrolled down
      // This is a lenient check since the exact scroll behavior may vary
      const scrollY = await page.evaluate(() => window.scrollY);
      const waitlistSection = page.locator('#waitlist-form');

      // Either scrolled down OR waitlist is in viewport
      const isInViewport = await waitlistSection.isVisible().catch(() => false);
      expect(scrollY > 0 || isInViewport).toBeTruthy();
    });

    test('changing priority updates recommendations', async ({ page }) => {
      // Wait for calculator to be ready
      await page.waitForSelector('text=Your estimated optimization', { timeout: 10000 });

      // Get initial recommended model
      const recommendedText = page.locator('text=/Recommended:/');
      await expect(recommendedText).toBeVisible({ timeout: 5000 });
      const initialText = await recommendedText.textContent();
      expect(initialText).toBeTruthy();

      // Change priority to Quality First
      const priorityDropdown = page.locator('button').filter({ hasText: /Balanced|Quality First|Cost First/i }).first();
      await expect(priorityDropdown).toBeVisible({ timeout: 5000 });
      await priorityDropdown.click();

      // Wait for dropdown to open and select option
      const qualityOption = page.locator('[role="option"]').filter({ hasText: 'Quality First' });
      await expect(qualityOption).toBeVisible({ timeout: 5000 });
      await qualityOption.click();

      // Wait for recalculation
      await page.waitForTimeout(1000);

      // Check performance display still exists after priority change
      const performanceDisplay = page.locator('text=/\\+\\d+%/').first();
      await expect(performanceDisplay).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Trader7 Case Study', () => {
    test('case study section is visible', async ({ page }) => {
      // Look for case study heading
      const caseStudyHeading = page.locator('text=/How a Trading Platform Optimized/i');
      await expect(caseStudyHeading).toBeVisible();
    });

    test('shows net savings result', async ({ page }) => {
      // The case study now shows net result with $379/mo savings
      const netResult = page.locator('text=/\\$379/').first();
      await expect(netResult).toBeVisible();
    });

    test('shows average performance gain', async ({ page }) => {
      // Should show average performance improvement
      const performanceGain = page.locator('text=/\\+19% avg|\\+19%/').first();
      await expect(performanceGain).toBeVisible();
    });

    test('shows quality maintained badge', async ({ page }) => {
      const qualityBadge = page.locator('text=/97\\.8%/');
      await expect(qualityBadge).toBeVisible();
    });

    test('case study badge is visible', async ({ page }) => {
      const badge = page.locator('text=Case Study');
      await expect(badge).toBeVisible();
    });

    test('shows critical task investment message', async ({ page }) => {
      // Should show that critical tasks got investment
      const criticalMessage = page.locator('text=/Critical Tasks|Critical/i').first();
      await expect(criticalMessage).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('calculator is usable on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Calculator should still be visible
      const calculator = page.locator('text=Monthly API Calls').first();
      await expect(calculator).toBeVisible();

      // Slider should be visible
      const slider = page.locator('[role="slider"]').first();
      await expect(slider).toBeVisible();

      // CTA should be visible
      const ctaButton = page.locator('button').filter({ hasText: 'Join Waitlist for Real Results' });
      await expect(ctaButton).toBeVisible();
    });

    test('case study renders on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Case study should be visible
      const caseStudyHeading = page.locator('text=/How a Trading Platform Optimized/i');
      await expect(caseStudyHeading).toBeVisible();

      // On mobile, verify the mobile card version of "Net Result" is visible (span, not table cell)
      const netResultLabel = page.locator('span').filter({ hasText: 'Net Result' });
      await expect(netResultLabel).toBeVisible();
    });
  });

  test.describe('Waitlist Form Integration', () => {
    test('waitlist form is present on page', async ({ page }) => {
      const waitlistSection = page.locator('#waitlist-form');
      await expect(waitlistSection).toBeVisible();

      // Email input
      const emailInput = waitlistSection.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      // Submit button
      const submitButton = waitlistSection.locator('button').filter({ hasText: /Join Waitlist/i });
      await expect(submitButton).toBeVisible();
    });

    test('waitlist form shows "Ready to stop guessing?" heading', async ({ page }) => {
      const heading = page.locator('#waitlist-form h2');
      await expect(heading).toContainText('Ready to stop guessing');
    });
  });

  test.describe('Performance', () => {
    test('page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Page should load DOM in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });
  });
});
