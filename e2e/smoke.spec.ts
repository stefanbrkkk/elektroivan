import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';

const SECTION_ORDER = [
  'section-intro',
  'section-nav',
  'section-hero',
  'section-trust',
  'section-anatomy',
  'section-services',
  'section-process',
  'section-before-after',
  'section-testimonials',
  'section-faq',
  'section-contact',
  'section-footer',
];

test.describe('phase 1 smoke', () => {
  test('loads with no console errors/warnings and no horizontal overflow', async ({ page }) => {
    const issues = collectConsoleIssues(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });

  test('renders all 12 sections in the locked order', async ({ page }) => {
    await page.goto('/');

    const testids = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid^="section-"]')).map((el) =>
        el.getAttribute('data-testid')
      )
    );

    expect(testids).toEqual(SECTION_ORDER);
  });

  test('has exactly one h1 with the required text/aria-label, and lang=sr-Latn', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'sr-Latn');

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);

    const h1 = h1s.first();
    const ariaLabel = await h1.getAttribute('aria-label');
    const text = (await h1.textContent())?.trim() ?? '';
    const expected = 'Iskače? Treperi? Varniči?';

    expect(ariaLabel === expected || text === expected).toBe(true);
  });

  test('skip link targets #sadrzaj', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.getByTestId('skip-link');
    await expect(skipLink).toHaveAttribute('href', '#sadrzaj');
  });

  test('contact email is correct and there is no phone/tel affordance', async ({ page }) => {
    await page.goto('/');

    const email = page.getByTestId('contact-email');
    await expect(email).toHaveAttribute('href', 'mailto:stefanbrkk@gmail.com?subject=Upit%20sa%20sajta');

    await expect(page.getByTestId('contact-phone')).toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });
});
