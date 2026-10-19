import { type Page, expect } from '@playwright/test';

export const PASSWORD = 'Password123!';

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Hello/ })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/login/);
}

/** Click a sidebar link, opening the mobile navigation drawer first when the burger is shown. */
export async function goToNav(page: Page, name: string) {
  const burger = page.getByRole('button', { name: 'Open navigation' });
  if (await burger.isVisible()) await burger.click();
  await page.getByRole('link', { name }).click();
}
