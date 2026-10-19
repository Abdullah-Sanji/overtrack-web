import { test, expect } from '@playwright/test';
import { login, goToNav } from './helpers';

test('tech lead approves from the inbox, delivery manager sees it next', async ({ page }) => {
  await login(page, 'tl.platform@overtrack.local');
  await goToNav(page, 'Inbox');
  const rows = page.getByRole('row').filter({ hasText: 'Platform' });
  await expect(rows.first()).toBeVisible();
  const before = await rows.count();
  await rows.first().click();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByLabel('Comment (optional)').fill('Looks good');
  await page.getByRole('button', { name: 'Approve', exact: true }).last().click();
  await expect(page.getByText('Sheet approved')).toBeVisible();
  await goToNav(page, 'Inbox');
  await expect(rows).toHaveCount(before - 1);
});

test('rejecting requires a reason', async ({ page }) => {
  await login(page, 'cto@overtrack.local');
  await goToNav(page, 'Inbox');
  await page.getByRole('row').filter({ hasText: 'Mobile' }).first().click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).last().click();
  await expect(page.getByText(/at least 5 characters/)).toBeVisible();
});

test('cto rejects the Mobile sheet with a reason and it leaves the inbox', async ({ page }) => {
  await login(page, 'cto@overtrack.local');
  await goToNav(page, 'Inbox');
  await page.getByRole('row').filter({ hasText: 'Mobile' }).first().click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.getByLabel('Reason').fill('Missing ticket links');
  await page.getByRole('button', { name: 'Reject', exact: true }).last().click();
  await expect(page.getByText('Sheet rejected')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Mobile' })).toHaveCount(0);
});
