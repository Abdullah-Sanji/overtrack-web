import { test, expect } from '@playwright/test';
import { login, goToNav } from './helpers';

test('finance marks an approved sheet paid and downloads the export', async ({ page }) => {
  await login(page, 'finance@overtrack.local');
  await goToNav(page, 'Payments');
  await page.getByRole('checkbox', { name: 'Select all' }).check();
  await page.getByRole('button', { name: /Mark paid \(/ }).click();
  await page.getByLabel('Payment reference').fill('E2E-BATCH');
  await page.getByRole('button', { name: 'Mark paid', exact: true }).click();
  await expect(page.getByText(/Marked \d+ paid/)).toBeVisible();
  await page.getByRole('tab', { name: 'Paid', exact: true }).click();
  await expect(page.getByText('E2E-BATCH').first()).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByRole('menuitem', { name: 'CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/overtrack-.*\.csv/);
});
