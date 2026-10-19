import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('employee adds an entry to the current month and submits', async ({ page }) => {
  await login(page, 'emp1.platform@overtrack.local');
  await page.getByRole('button', { name: 'Add overtime' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Add entry' }).first().click();
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel('Date').fill(today);
  await page.getByLabel('Start').fill('18:00');
  await page.getByLabel('End').fill('20:00');
  await page.getByLabel('Overtime type').click();
  await page.getByRole('option').first().click();
  await page.getByRole('textbox', { name: 'Work item', exact: true }).fill('E2E-1');
  await page.getByLabel('What did you do?').fill('Playwright end-to-end overtime entry');
  await page.getByRole('button', { name: 'Add entry' }).last().click();
  await expect(page.getByText('Entry added')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: /Submit for approval/ }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('Sheet submitted')).toBeVisible();
  await expect(page.getByText('Submitted', { exact: true })).toBeVisible();
});
