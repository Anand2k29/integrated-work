/**
 * TrustLayer API Security Platform — Automated Browser Demo
 * ==========================================================
 * Playwright script that walks through every major module for a
 * repeatable product demonstration recording.
 *
 * Prerequisites:
 *   npm install playwright @playwright/test
 *   npx playwright install chromium
 *
 * Usage:
 *   npx playwright test demo_walkthrough.spec.ts --headed --project=chromium
 *
 * Recording (video):
 *   The script uses Playwright's built-in video recording.
 *   Videos are saved to ./demo-recordings/
 */

import { test, expect, Page } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';
const PAUSE_SHORT = 1500;   // Brief pause for UI transitions
const PAUSE_MEDIUM = 3000;  // Medium pause for reading content
const PAUSE_LONG = 5000;    // Long pause for important screens

// Configure video recording
test.use({
  video: { mode: 'on', size: { width: 1920, height: 1080 } },
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 200 }
});

async function pause(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}

test.describe('TrustLayer Product Demo Walkthrough', () => {

  test('Complete Platform Demo', async ({ page }) => {
    test.setTimeout(180_000); // 3 minute max

    // ====================================================
    // SCENE 1: Landing Page
    // ====================================================
    console.log('📍 Scene 1: Landing Page');
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await pause(page, PAUSE_LONG);

    // Verify landing page loaded
    const heroText = page.locator('text=TrustLayer');
    await expect(heroText.first()).toBeVisible({ timeout: 10000 });

    // Scroll down to see feature cards
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await pause(page, PAUSE_MEDIUM);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await pause(page, PAUSE_SHORT);

    // ====================================================
    // SCENE 2: Enter Console
    // ====================================================
    console.log('📍 Scene 2: Enter Console');
    const launchBtn = page.locator('button:has-text("Launch"), button:has-text("Console"), button:has-text("Start"), button:has-text("Demo")').first();
    if (await launchBtn.isVisible()) {
      await launchBtn.click();
    }
    await pause(page, PAUSE_MEDIUM);

    // ====================================================
    // SCENE 3: Executive Dashboard
    // ====================================================
    console.log('📍 Scene 3: Executive Dashboard');
    await pause(page, PAUSE_LONG);

    // Take screenshot of dashboard
    await page.screenshot({ path: 'demo-recordings/01-dashboard.png', fullPage: false });

    // ====================================================
    // SCENE 4: Endpoint Discovery
    // ====================================================
    console.log('📍 Scene 4: Endpoint Discovery');
    const discoveryBtn = page.locator('button:has-text("Discovery")').first();
    if (await discoveryBtn.isVisible()) {
      await discoveryBtn.click();
      await pause(page, PAUSE_MEDIUM);
      await page.screenshot({ path: 'demo-recordings/02-discovery.png', fullPage: false });
    }
    await pause(page, PAUSE_MEDIUM);

    // ====================================================
    // SCENE 5: API Crawler
    // ====================================================
    console.log('📍 Scene 5: API Crawler');
    const crawlerBtn = page.locator('button:has-text("Crawler")').first();
    if (await crawlerBtn.isVisible()) {
      await crawlerBtn.click();
      await pause(page, PAUSE_MEDIUM);
      await page.screenshot({ path: 'demo-recordings/03-crawler.png', fullPage: false });
    }

    // ====================================================
    // SCENE 6: Mutation Fuzzer
    // ====================================================
    console.log('📍 Scene 6: Mutation Fuzzer');
    const mutationBtn = page.locator('button:has-text("Mutation"), button:has-text("Fuzzer")').first();
    if (await mutationBtn.isVisible()) {
      await mutationBtn.click();
      await pause(page, PAUSE_MEDIUM);
      await page.screenshot({ path: 'demo-recordings/04-mutation.png', fullPage: false });
    }

    // ====================================================
    // SCENE 7: JWT Analyzer — Live Demo
    // ====================================================
    console.log('📍 Scene 7: JWT Analyzer');
    const jwtBtn = page.locator('button:has-text("JWT")').first();
    if (await jwtBtn.isVisible()) {
      await jwtBtn.click();
      await pause(page, PAUSE_SHORT);

      // Type a JWT token into the input
      const jwtInput = page.locator('textarea, input[type="text"]').first();
      if (await jwtInput.isVisible()) {
        const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IlRlc3QiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        await jwtInput.fill(sampleToken);
        await pause(page, PAUSE_SHORT);

        // Click analyze button
        const analyzeBtn = page.locator('button:has-text("Analyze"), button:has-text("Decode"), button:has-text("Submit")').first();
        if (await analyzeBtn.isVisible()) {
          await analyzeBtn.click();
          await pause(page, PAUSE_LONG);
        }
      }

      await page.screenshot({ path: 'demo-recordings/05-jwt-analysis.png', fullPage: false });
    }

    // ====================================================
    // SCENE 8: Role Swapper
    // ====================================================
    console.log('📍 Scene 8: Role Swapper');
    const roleBtn = page.locator('button:has-text("Role"), button:has-text("Swapper")').first();
    if (await roleBtn.isVisible()) {
      await roleBtn.click();
      await pause(page, PAUSE_MEDIUM);
      await page.screenshot({ path: 'demo-recordings/06-role-swapper.png', fullPage: false });
    }

    // ====================================================
    // SCENE 9: Async Worker Engine
    // ====================================================
    console.log('📍 Scene 9: Worker Engine');
    const workerBtn = page.locator('button:has-text("Worker"), button:has-text("Engine")').first();
    if (await workerBtn.isVisible()) {
      await workerBtn.click();
      await pause(page, PAUSE_LONG);
      await page.screenshot({ path: 'demo-recordings/07-worker-engine.png', fullPage: false });
    }

    // ====================================================
    // SCENE 10: Response Diff Engine — Live Demo
    // ====================================================
    console.log('📍 Scene 10: Diff Engine');
    const diffBtn = page.locator('button:has-text("Diff")').first();
    if (await diffBtn.isVisible()) {
      await diffBtn.click();
      await pause(page, PAUSE_MEDIUM);
      await page.screenshot({ path: 'demo-recordings/08-diff-engine.png', fullPage: false });
    }
    await pause(page, PAUSE_MEDIUM);

    // ====================================================
    // SCENE 11: Reports
    // ====================================================
    console.log('📍 Scene 11: Reports');
    const reportsBtn = page.locator('button:has-text("Report"), button:has-text("Security")').first();
    if (await reportsBtn.isVisible()) {
      await reportsBtn.click();
      await pause(page, PAUSE_MEDIUM);
      await page.screenshot({ path: 'demo-recordings/09-reports.png', fullPage: false });
    }

    // ====================================================
    // SCENE 12: Settings
    // ====================================================
    console.log('📍 Scene 12: Settings');
    const settingsBtn = page.locator('button:has-text("Settings")').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await pause(page, PAUSE_MEDIUM);
      await page.screenshot({ path: 'demo-recordings/10-settings.png', fullPage: false });
    }

    // ====================================================
    // SCENE 13: Return to Dashboard
    // ====================================================
    console.log('📍 Scene 13: Return to Dashboard');
    const dashBtn = page.locator('button:has-text("Executive"), button:has-text("SOC"), button:has-text("Dashboard")').first();
    if (await dashBtn.isVisible()) {
      await dashBtn.click();
      await pause(page, PAUSE_LONG);
    }

    // Final screenshot
    await page.screenshot({ path: 'demo-recordings/11-final-dashboard.png', fullPage: false });

    console.log('✅ Demo walkthrough completed successfully!');
  });
});
