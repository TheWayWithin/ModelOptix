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
      const heroCta = page.locator('a[href="#demo-section"]');
      await expect(heroCta).toBeVisible();
      await expect(heroCta).toContainText('See How Much You Could Save');
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
      const useCaseDropdown = page.locator('button').filter({ hasText: /Code Generation|Content Writing|Data Extraction|Summarization|Classification|Chat Support/i }).first();
      await expect(useCaseDropdown).toBeVisible();

      // Click to open dropdown
      await useCaseDropdown.click();

      // Check for options
      await expect(page.locator('[role="option"]')).toHaveCount(6);

      // Verify some options
      await expect(page.locator('[role="option"]').filter({ hasText: 'Code Generation' })).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: 'Content Writing' })).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: 'Data Extraction' })).toBeVisible();

      // Close dropdown by pressing Escape
      await page.keyboard.press('Escape');
    });

    test('model dropdown has multiple options', async ({ page }) => {
      // Find and click the model dropdown (second dropdown)
      const modelDropdown = page.locator('button').filter({ hasText: /GPT-4o|Claude|Gemini|Mistral|Llama/i }).first();
      await expect(modelDropdown).toBeVisible();

      // Click to open dropdown
      await modelDropdown.click();

      // Check for at least 5 options (we have 10)
      const options = page.locator('[role="option"]');
      expect(await options.count()).toBeGreaterThanOrEqual(5);

      // Verify some models
      await expect(page.locator('[role="option"]').filter({ hasText: 'GPT-4o' })).toBeVisible();
      await expect(page.locator('[role="option"]').filter({ hasText: 'Claude 3 Opus' })).toBeVisible();

      // Close dropdown
      await page.keyboard.press('Escape');
    });

    test('savings display shows dollar amounts', async ({ page }) => {
      // Look for the savings display
      const savingsDisplay = page.locator('text=Your estimated savings');
      await expect(savingsDisplay).toBeVisible();

      // Should show monthly savings with dollar sign
      const monthlySavings = page.locator('text=/\\$[\\d,]+/').first();
      await expect(monthlySavings).toBeVisible();

      // Should show percentage
      const percentage = page.locator('text=/\\d+%\\s*cost reduction/');
      await expect(percentage).toBeVisible();
    });

    test('CTA button exists and is clickable', async ({ page }) => {
      const ctaButton = page.locator('button').filter({ hasText: 'Get Personalized Recommendations' });
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toBeEnabled();
    });

    test('CTA button scrolls to waitlist form', async ({ page }) => {
      // Scroll down to make sure we're not at waitlist already
      await page.evaluate(() => window.scrollTo(0, 500));

      // Click CTA
      const ctaButton = page.locator('button').filter({ hasText: 'Get Personalized Recommendations' });
      await ctaButton.click();

      // Wait for scroll
      await page.waitForTimeout(500);

      // Waitlist form should be in viewport
      const waitlistSection = page.locator('#waitlist-form');
      await expect(waitlistSection).toBeInViewport();
    });

    test('changing use case updates savings calculation', async ({ page }) => {
      // Get initial savings value from the calculator card's large savings display
      const savingsElement = page.locator('.text-4xl, .sm\\:text-5xl').filter({ hasText: /^\$/ }).first();
      const savingsText = await savingsElement.textContent();

      // Change use case
      const useCaseDropdown = page.locator('button').filter({ hasText: /Code Generation|Content Writing|Data Extraction|Summarization|Classification|Chat Support/i }).first();
      await useCaseDropdown.click();
      await page.locator('[role="option"]').filter({ hasText: 'Classification' }).click();

      // Wait for recalculation
      await page.waitForTimeout(500);

      // Get new savings value
      const newSavingsText = await savingsElement.textContent();

      // Values should be different (Classification has 60% multiplier vs Code Gen's 35%)
      expect(newSavingsText).not.toBe(savingsText);
    });
  });

  test.describe('Trader7 Case Study', () => {
    test('case study section is visible', async ({ page }) => {
      // Look for case study heading
      const caseStudyHeading = page.locator('text=/How a Trading Platform Saves/i');
      await expect(caseStudyHeading).toBeVisible();
    });

    test('shows $747 total savings', async ({ page }) => {
      // Use first() since $747 appears in multiple places (heading, table, mobile summary)
      const totalSavings = page.locator('text=/\\$747/').first();
      await expect(totalSavings).toBeVisible();
    });

    test('shows quality maintained badge', async ({ page }) => {
      const qualityBadge = page.locator('text=/96\\.2%/');
      await expect(qualityBadge).toBeVisible();
    });

    test('case study badge is visible', async ({ page }) => {
      const badge = page.locator('text=Case Study');
      await expect(badge).toBeVisible();
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
      const ctaButton = page.locator('button').filter({ hasText: 'Get Personalized Recommendations' });
      await expect(ctaButton).toBeVisible();
    });

    test('case study renders on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Case study should be visible
      const caseStudyHeading = page.locator('text=/How a Trading Platform Saves/i');
      await expect(caseStudyHeading).toBeVisible();

      // $747 savings should be visible (use first() since appears in multiple places)
      const totalSavings = page.locator('text=/\\$747/').first();
      await expect(totalSavings).toBeVisible();
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
