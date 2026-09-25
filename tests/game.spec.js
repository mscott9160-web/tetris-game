const { test, expect } = require('@playwright/test');

test('starts, pauses, resumes, and exposes the daily challenge', async ({ page }) => {
  await page.goto('/');
  await page.locator('#board').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#status')).toHaveText('LIVE');
  await page.locator('#pause').click();
  await expect(page.locator('#status')).toHaveText('PAUSED');
  await expect(page.locator('#live-status')).toContainText('PAUSED');
  await page.locator('#pause').click();
  await expect(page.locator('#pause')).toHaveText('Pause game');
  await expect(page.locator('#mode option[value="daily"]')).toHaveCount(1);
});

test('persists run history and supports mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#run-history')).toContainText('No runs yet');
  await expect(page.locator('.mobile-controls')).toBeVisible();
  await expect(page.locator('#timer')).toHaveText('--:--');
});
