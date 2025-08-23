import { test, expect } from '@playwright/test';

test('home page renders and has title', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/en/`);
  await expect(page).toHaveTitle(/ZapAround/i);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
});


