import { test, expect, type Locator } from '@playwright/test';

const SHOTS = 'test-results/shots';

async function animationPlayState(locator: Locator): Promise<string> {
  return locator.evaluate((el) => getComputedStyle(el).animationPlayState);
}

test.describe('contact copy-to-clipboard', () => {
  test('copies the email and shows the accessible toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    await page.getByTestId('contact-copy').click();
    await expect(page.getByTestId('contact-toast')).toHaveText('Kopirano ✓');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('stefanbrkk@gmail.com');
  });
});

test.describe('FAQ accordion keyboard interaction', () => {
  test('Enter opens and Space closes a trigger, panel visibility follows', async ({ page }) => {
    await page.goto('/');

    const trigger = page.getByTestId('faq-trigger').nth(1);
    await trigger.focus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const panelId = await trigger.getAttribute('aria-controls');
    if (!panelId) throw new Error('faq-trigger is missing aria-controls');
    const panel = page.locator(`#${panelId}`);

    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  });

  test('ArrowDown/ArrowUp/Home/End move focus between triggers', async ({ page }) => {
    await page.goto('/');
    const triggers = page.getByTestId('faq-trigger');
    const count = await triggers.count();

    await triggers.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(triggers.nth(1)).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(triggers.nth(0)).toBeFocused();

    await page.keyboard.press('End');
    await expect(triggers.nth(count - 1)).toBeFocused();

    await page.keyboard.press('Home');
    await expect(triggers.nth(0)).toBeFocused();
  });
});

test.describe('before/after comparison slider', () => {
  test('ArrowRight increases aria-valuenow; Home/End jump to the ends', async ({ page }) => {
    await page.goto('/');
    const slider = page.getByTestId('ba-slider');
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();

    const initial = Number(await slider.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowRight');
    const afterRight = Number(await slider.getAttribute('aria-valuenow'));
    expect(afterRight).toBeGreaterThan(initial);

    await page.keyboard.press('Home');
    await expect(slider).toHaveAttribute('aria-valuenow', '0');

    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
  });
});

test.describe('marquee and testimonials pause controls', () => {
  test('marquee-toggle pauses and resumes the services strip', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('marquee-toggle');
    const track = page.getByTestId('marquee');

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(await animationPlayState(track)).toBe('running');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await animationPlayState(track)).toBe('paused');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(await animationPlayState(track)).toBe('running');
  });

  test('testimonials-toggle pauses and resumes both rows', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('testimonials-toggle');
    const tracks = page.locator('[data-testid="section-testimonials"] ul');
    const rowCount = await tracks.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < rowCount; i++) {
      expect(await animationPlayState(tracks.nth(i))).toBe('paused');
    }

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    for (let i = 0; i < rowCount; i++) {
      expect(await animationPlayState(tracks.nth(i))).toBe('running');
    }
  });
});

test.describe('services bento at desktop width', () => {
  test('no card text overflows its glass panel at 1024-1440 (M8, docs/reports/review-1.md)', async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) !== 1440, 'd1440 only');

    await page.goto('/');
    // Let the once-per-session loader finish and hide itself before
    // scrolling and capturing, so it never covers the shot.
    await expect(page.getByTestId('section-intro')).toBeHidden();

    const grid = page.getByTestId('section-services');
    await grid.scrollIntoViewIfNeeded();

    // Wait for the scroll-triggered reveal (stagger 0.08s * 5 + 0.6s tween)
    // to finish before capturing, so the shot reflects final layout, not a
    // mid-fade frame.
    const cards = page.getByTestId('service-card');
    await expect
      .poll(async () => Number(await cards.last().evaluate((el) => getComputedStyle(el).opacity)))
      .toBeGreaterThan(0.99);

    // Viewport clip (not an element screenshot) so the blueprint grid, the
    // main cable and the section chrome are part of the visual record.
    await page.screenshot({ path: `${SHOTS}/services-1440.png` });

    // Geometry check: every card's content must fit inside its own
    // bounding box (no descendant taller/wider than its glass panel).
    const overflowing = await page.evaluate(() => {
      const results: string[] = [];
      document.querySelectorAll('[data-testid="service-card"]').forEach((card, index) => {
        const cardBox = card.getBoundingClientRect();
        card.querySelectorAll('*').forEach((child) => {
          const box = child.getBoundingClientRect();
          const overflowsBottom = box.bottom - cardBox.bottom > 1;
          const overflowsRight = box.right - cardBox.right > 1;
          if (overflowsBottom || overflowsRight) {
            results.push(`card ${index}: child overflows (bottom ${box.bottom - cardBox.bottom}px, right ${box.right - cardBox.right}px)`);
          }
        });
      });
      return results;
    });
    expect(overflowing, overflowing.join('\n')).toEqual([]);
  });
});

test.describe('blueprint section screenshots', () => {
  // Visual record for the v2 redesign review (docs/DESIGN.md §5). Viewport
  // clips, so grid, cable and section chrome are all captured.
  const sections: Array<{ id: string; shot: string }> = [
    { id: 'poverenje', shot: 'trust-1440.png' },
    { id: 'pre-posle', shot: 'before-after-1440.png' },
    { id: 'pitanja', shot: 'faq-1440.png' },
  ];

  for (const { id, shot } of sections) {
    test(`captures ${shot}`, async ({ page }) => {
      test.skip((page.viewportSize()?.width ?? 0) !== 1440, 'd1440 only');

      await page.goto('/');
      await expect(page.getByTestId('section-intro')).toBeHidden();

      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
      // Let scroll-triggered reveals settle before the capture.
      await page.waitForTimeout(1200);

      await page.screenshot({ path: `${SHOTS}/${shot}` });
    });
  }
});
