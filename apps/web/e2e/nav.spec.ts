import { expect, rejectOptionalConsent, test } from './fixtures';

test('mobile native dismissal, focus return and resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  await rejectOptionalConsent(page);
  const button = page.locator('.nav-toggle');
  const menu = page.locator('#site-nav');
  await expect(menu).toHaveAttribute('popover', 'auto');
  for (const dismiss of ['button', 'Escape', 'outside']) {
    await button.click();
    await expect(menu).toBeVisible();
    await expect(menu).toHaveJSProperty('popover', 'auto');
    if (dismiss === 'button') await button.click();
    if (dismiss === 'Escape') {
      await menu.locator('a').first().focus();
      await page.keyboard.press('Escape');
    }
    if (dismiss === 'outside') await page.locator('main').click({ position: { x: 2, y: 800 } });
    await expect(menu).toBeHidden();
    // Light dismiss follows the pointer's focus target; Escape restores the invoker.
    if (dismiss !== 'outside') await expect(button).toBeFocused();
  }
  await button.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(menu).not.toHaveAttribute('popover');
  await expect(menu).toBeVisible();
  await expect(button).toBeHidden();
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(menu).toHaveAttribute('popover', 'auto');
  await expect(menu).toBeHidden();
  await button.click();
  await expect(menu).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('mobile menu opens and dismisses natively', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/');
    const button = page.locator('.nav-toggle');
    const menu = page.locator('#site-nav');
    await expect(menu).toBeHidden();
    await button.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    await page.locator('main').click({ position: { x: 2, y: 800 } });
    await expect(menu).toBeHidden();
  });
});

test('desktop links render inline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.locator('.nav-toggle')).toBeHidden();
  await expect(page.locator('#site-nav')).not.toHaveAttribute('popover');
  await expect(page.locator('#site-nav')).toBeVisible();
  expect(await page.locator('#site-nav').evaluate(el => getComputedStyle(el).position)).toBe('static');
});
