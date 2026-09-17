import { test, expect, type Page } from '@playwright/test';

const SECTION_LINKS = [
  { testId: 'nav-link-usluge', targetId: 'usluge' },
  { testId: 'nav-link-anatomija', targetId: 'anatomija' },
  { testId: 'nav-link-kako-radim', targetId: 'kako-radim' },
  { testId: 'nav-link-pre-posle', targetId: 'pre-posle' },
  { testId: 'nav-link-utisci', targetId: 'utisci' },
  { testId: 'nav-link-pitanja', targetId: 'pitanja' },
];

function isMobileLayout(page: Page): boolean {
  const viewport = page.viewportSize();
  return !!viewport && viewport.width < 1024;
}

async function openMobileMenuIfNeeded(page: Page): Promise<void> {
  if (!isMobileLayout(page)) return;
  const toggle = page.getByTestId('nav-toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
}

async function expectScrolledIntoView(page: Page, targetId: string): Promise<void> {
  const viewportHeight = page.viewportSize()?.height ?? 800;
  await expect
    .poll(
      async () => {
        const box = await page.locator(`#${targetId}`).boundingBox();
        return box ? box.y : Number.POSITIVE_INFINITY;
      },
      { timeout: 5000 }
    )
    .toBeLessThan(viewportHeight * 0.5);
}

test.describe('navigation links scroll to their section', () => {
  for (const { testId, targetId } of SECTION_LINKS) {
    test(`${testId} scrolls to #${targetId}`, async ({ page }) => {
      await page.goto('/');
      await openMobileMenuIfNeeded(page);
      await page.getByTestId(testId).click();
      await expectScrolledIntoView(page, targetId);
    });
  }

  test('hero-cta-primary scrolls to #kontakt', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('hero-cta-primary').click();
    await expectScrolledIntoView(page, 'kontakt');
  });

  test('hero-cta-secondary scrolls to #usluge', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('hero-cta-secondary').click();
    await expectScrolledIntoView(page, 'usluge');
  });
});

test.describe('mobile menu', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isMobileLayout(page), 'mobile-only (<1024px) behaviour');
  });

  test('toggle opens/closes the panel and aria-expanded follows', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('nav-toggle');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('nav-menu')).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape closes the menu and returns focus to the toggle', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('nav-toggle');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('Tab cycling never moves focus outside the open menu', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('nav-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // The toggle button lives outside `#nav-menu` in the DOM but is part of
    // the focus trap (minor 5, docs/reports/review-1.md), so it counts too.
    const focusableCount = (await page.getByTestId('nav-menu').locator('a[href], button').count()) + 1;

    for (let i = 0; i < focusableCount + 3; i++) {
      await page.keyboard.press('Tab');
      const isInside = await page.evaluate(() => {
        const menu = document.querySelector('[data-testid="nav-menu"]');
        const navToggle = document.querySelector('[data-testid="nav-toggle"]');
        return (!!menu && menu.contains(document.activeElement)) || document.activeElement === navToggle;
      });
      expect(isInside).toBe(true);
    }
  });

  test('choosing a link closes the menu', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('nav-toggle');
    await toggle.click();
    await page.getByTestId('nav-link-usluge').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

test('skip link moves focus to #sadrzaj, or at least scrolls it into view', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('skip-link')).toBeFocused();

  await page.keyboard.press('Enter');

  const activeId = await page.evaluate(() => document.activeElement?.id);
  if (activeId === 'sadrzaj') return;

  const box = await page.locator('#sadrzaj').boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.y)).toBeLessThan(120);
});
