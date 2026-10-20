import { test, expect } from '@playwright/test';
import { login, goToNav } from './helpers';

test('admin manages roles and deletes are guarded', async ({ page }) => {
  await login(page, 'admin@overtrack.local');

  await goToNav(page, 'Roles');
  await page.getByRole('button', { name: 'New role' }).click();
  await page.getByLabel('Name').fill('QA Lead');
  await page.getByLabel('Level').click();
  await page.getByRole('option', { name: 'Manager' }).click();
  await page.getByRole('button', { name: 'Create role' }).click();
  await expect(page.getByText('Role created')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'QA Lead' })).toHaveCount(1);

  await goToNav(page, 'Users');
  await page.getByLabel('Search').fill('emp3.mobile');
  const row = page.getByRole('row').filter({ hasText: 'emp3.mobile@overtrack.local' });
  await row.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Role').click();
  await page.getByRole('option', { name: 'QA Lead' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('User updated')).toBeVisible();

  await goToNav(page, 'Roles');
  await page.getByRole('button', { name: 'Actions for QA Lead' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText(/Users still have this role/)).toBeVisible();

  await goToNav(page, 'Teams');
  await page.getByRole('button', { name: 'Delete team Platform' }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText(/still has members or sheets/)).toBeVisible();

  await goToNav(page, 'Users');
  await page.getByRole('button', { name: 'Invite user' }).click();
  await page.getByLabel('First name').fill('Temp');
  await page.getByLabel('Last name').fill('Person');
  await page.getByLabel('Email').fill('temp.e2e@overtrack.local');
  await page.getByRole('button', { name: 'Send invite' }).click();
  await expect(page.getByText('Invite sent')).toBeVisible();
  await page.getByLabel('Search').fill('temp.e2e');
  const temp = page.getByRole('row').filter({ hasText: 'temp.e2e@overtrack.local' });
  await temp.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('User deleted')).toBeVisible();
  await expect(temp).toHaveCount(0);
});
