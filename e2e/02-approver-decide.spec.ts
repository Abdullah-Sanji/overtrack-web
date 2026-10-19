import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('tech lead approves from the inbox, delivery manager sees it next', async ({ page }) => {
  await login(page, 'tl.platform@overtrack.local');
  await page.getByRole('link', { name: 'Inbox' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Platform' }).first();
  await row.click();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByLabel('Comment (optional)').fill('Looks good');
  await page.getByRole('button', { name: 'Approve', exact: true }).last().click();
  await expect(page.getByText('Sheet approved')).toBeVisible();
});

test('rejecting requires a reason', async ({ page }) => {
  await login(page, 'cto@overtrack.local');
  await page.goto('/approvals?scope=waiting');
  const row = page.getByRole('row').filter({ hasText: 'Mobile' }).first();
  await row.click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).last().click();
  await expect(page.getByText(/at least 5 characters/)).toBeVisible();
});
