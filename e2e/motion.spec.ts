import { test, expect, type Page } from '@playwright/test';

/**
 * Gate G3 (docs/BRIEF.md §9): the scroll story actually plays.
 *
 * Everything scrolls with `window.scrollTo` — Lenis follows the native scroll
 * position, so the tests never depend on its smoothing — and waits for the
 * scrubbed state to settle instead of sleeping fixed amounts.
 */

const SHOTS = 'test-results/shots';
const SEGMENTS = 16; // 5 steps x 3 beats + the closing beat
const PERCENTS = [0, 0.2, 0.4, 0.6, 0.8, 1];
/** Step shown at each of the percentages above (floor(pct * 16) / 3 + 1). */
const EXPECTED_STEPS = ['1', '2', '3', '4', '5', '5'];

function viewportTag(page: Page): string {
  return String(page.viewportSize()?.width ?? 0);
}

async function openStory(page: Page): Promise<void> {
  // Skip the once-per-session loader: it is covered by its own test.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('jovanIntroSeen', '1');
    } catch {
      /* storage disabled */
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function pinRange(page: Page): Promise<{ top: number; distance: number }> {
  return page.evaluate(() => {
    const section = document.querySelector<HTMLElement>('[data-testid="section-anatomy"]');
    if (!section) return { top: 0, distance: 1 };
    const spacer = section.querySelector<HTMLElement>('.pin-spacer') ?? section;
    const rect = spacer.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      distance: Math.max(1, rect.height - window.innerHeight),
    };
  });
}

/** Waits until the scrubbed scene stops changing (scrub smoothing settles). */
async function settle(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const section = document.querySelector<HTMLElement>('[data-testid="section-anatomy"]');
      const energized = document.querySelector<SVGPathElement>(
        '[data-testid="mainline-energized"]'
      );
      const state = `${section?.dataset.step}-${section?.dataset.beat}-${Math.round(
        window.scrollY
      )}-${energized ? Math.round(parseFloat(getComputedStyle(energized).strokeDashoffset)) : 0}`;
      const store = window as unknown as { __jvState?: string; __jvStable?: number };
      if (store.__jvState === state) {
        store.__jvStable = (store.__jvStable ?? 0) + 1;
      } else {
        store.__jvState = state;
        store.__jvStable = 0;
      }
      return (store.__jvStable ?? 0) > 8;
    },
    null,
    { timeout: 8000 }
  );
}

async function scrollToPin(page: Page, fraction: number): Promise<void> {
  const { top, distance } = await pinRange(page);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(top + distance * fraction));
  await settle(page);
}

/** Scroll to the middle of one beat: segment = step * 3 + beat index. */
async function scrollToSegment(page: Page, segment: number): Promise<void> {
  await scrollToPin(page, (segment + 0.5) / SEGMENTS);
}

async function scrollToContact(page: Page): Promise<void> {
  await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>('[data-testid="section-contact"]');
    if (!section) return;
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - 60);
  });
  await page.waitForTimeout(2600);
}

test.describe('G3 motion — the scroll story plays', () => {
  test('anatomy scrubs through five steps and every frame differs', async ({ page }) => {
    const tag = viewportTag(page);
    await openStory(page);

    const section = page.getByTestId('section-anatomy');
    const stage = page.getByTestId('anatomy-stage');
    const shots: Buffer[] = [];

    for (let index = 0; index < PERCENTS.length; index += 1) {
      const percent = PERCENTS[index];
      await scrollToPin(page, percent);

      await expect(section).toHaveAttribute('data-step', EXPECTED_STEPS[index]);
      await expect(page.getByTestId('anatomy-counter')).toHaveText(
        `0${EXPECTED_STEPS[index]}/05`
      );

      shots.push(
        await stage.screenshot({
          path: `${SHOTS}/anatomy-${tag}-${Math.round(percent * 100)}.png`,
        })
      );
    }

    for (let a = 0; a < shots.length; a += 1) {
      for (let b = a + 1; b < shots.length; b += 1) {
        expect(
          Buffer.compare(shots[a], shots[b]),
          `frames ${PERCENTS[a]} and ${PERCENTS[b]} look identical`
        ).not.toBe(0);
      }
    }

    // the closing beat leaves the whole circuit lit
    await expect(section).toHaveAttribute('data-beat', 'final');
    await expect(page.getByTestId('anatomy-bulb')).toHaveAttribute('data-lit', 'true');
    await expect(page.getByTestId('anatomy-final')).toBeVisible();
  });

  test('step 3 shows the arc and sparks on the fault beat, tape on the fix beat', async ({
    page,
  }) => {
    const tag = viewportTag(page);
    await openStory(page);

    const section = page.getByTestId('section-anatomy');
    const arc = page.getByTestId('anatomy-arc');
    const sparks = page.getByTestId('anatomy-sparks');
    const tape = page.getByTestId('anatomy-tape');

    // step 3 (index 2), beat 1 of 3 → segment 6
    await scrollToSegment(page, 6);
    await expect(section).toHaveAttribute('data-step', '3');
    await expect(section).toHaveAttribute('data-beat', 'fault');
    await expect(arc).toBeVisible();
    await expect(sparks).toBeVisible();
    await expect(tape).toBeHidden();
    await page.getByTestId('anatomy-stage').screenshot({
      path: `${SHOTS}/anatomy-${tag}-step3-fault.png`,
    });

    // same step, fix beat → segment 7
    await scrollToSegment(page, 7);
    await expect(section).toHaveAttribute('data-step', '3');
    await expect(section).toHaveAttribute('data-beat', 'fix');
    await expect(tape).toBeVisible();
    await expect(sparks).toBeHidden();
    await expect(arc).toBeHidden();
    await page.getByTestId('anatomy-stage').screenshot({
      path: `${SHOTS}/anatomy-${tag}-step3-fix.png`,
    });

    // scrolling back re-breaks the cable: the scene is reversible
    await scrollToSegment(page, 6);
    await expect(section).toHaveAttribute('data-beat', 'fault');
    await expect(tape).toBeHidden();
    await expect(arc).toBeVisible();
    await page.getByTestId('anatomy-stage').screenshot({
      path: `${SHOTS}/anatomy-${tag}-step3.png`,
    });
  });

  test('progress dots jump to their step', async ({ page }) => {
    await openStory(page);
    await scrollToPin(page, 0);

    await page.getByTestId('anatomy-dot-4').click();
    await settle(page);
    await expect(page.getByTestId('section-anatomy')).toHaveAttribute('data-step', '4');
    await expect(page.getByTestId('anatomy-counter')).toHaveText('04/05');
  });

  test('the pinned anatomy fits one screen with nothing overlapping', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'stacked layout is the phone one');
    await openStory(page);
    await scrollToSegment(page, 6);

    const layout = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>('[data-testid="anatomy-stage"]');
      const counter = document.querySelector<HTMLElement>('[data-testid="anatomy-counter"]');
      const card = document.querySelector<HTMLElement>(
        '[data-testid="anatomy-card"][data-active="true"]'
      );
      const pinned = stage?.parentElement;
      if (!stage || !counter || !card || !pinned) return null;
      return {
        stage: stage.getBoundingClientRect().bottom,
        counterTop: counter.getBoundingClientRect().top,
        counterBottom: counter.getBoundingClientRect().bottom,
        cardTop: card.getBoundingClientRect().top,
        cardBottom: card.getBoundingClientRect().bottom,
        overflow: pinned.scrollHeight - pinned.clientHeight,
        viewport: window.innerHeight,
      };
    });

    expect(layout).not.toBeNull();
    if (!layout) return;
    expect(layout.stage, 'drawing overlaps the counter').toBeLessThanOrEqual(layout.counterTop + 1);
    expect(layout.counterBottom, 'counter overlaps the card').toBeLessThanOrEqual(
      layout.cardTop + 1
    );
    expect(layout.cardBottom, 'card runs past the screen').toBeLessThanOrEqual(
      layout.viewport + 1
    );
    expect(layout.overflow, 'pinned step scrolls internally').toBeLessThanOrEqual(2);
  });

  test('main line energizes with scroll progress', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'cable only exists on ≥1024px');
    await openStory(page);

    const readOffset = () =>
      page.evaluate(() => {
        const path = document.querySelector<SVGPathElement>('[data-testid="mainline-energized"]');
        return path ? parseFloat(getComputedStyle(path).strokeDashoffset) : Number.NaN;
      });

    const offsets: number[] = [];
    for (const fraction of [0, 0.25, 0.5, 0.75]) {
      await page.evaluate((value) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(max * value));
      }, fraction);
      await settle(page);
      offsets.push(await readOffset());
    }

    for (let index = 1; index < offsets.length; index += 1) {
      expect(offsets[index], `offset at step ${index}`).toBeLessThan(offsets[index - 1]);
    }
    expect(await page.getByTestId('progress-bar').count()).toBe(1);
  });

  test('finale lights up on enter and replays after leaving completely', async ({ page }) => {
    const tag = viewportTag(page);
    await openStory(page);

    const card = page.getByTestId('contact-card');
    const bulb = page.getByTestId('contact-bulb');
    const wallSwitch = page.getByTestId('contact-switch');

    await scrollToContact(page);

    await expect(wallSwitch).toHaveAttribute('data-on', 'true');
    await expect(bulb).toHaveAttribute('data-lit', 'true');
    await expect(card).toBeVisible();

    const finalState = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return { opacity: style.opacity, clip: style.clipPath, y: element.getBoundingClientRect().top };
    });
    expect(Number(finalState.opacity)).toBeGreaterThan(0.99);
    expect(finalState.clip === 'none' || finalState.clip.startsWith('inset(0%')).toBe(true);

    await page.screenshot({ path: `${SHOTS}/finale-${tag}-lit.png` });

    // leave completely, then come back — same elements, scene plays again
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    await expect(wallSwitch).toHaveAttribute('data-on', 'false');

    await scrollToContact(page);
    await expect(wallSwitch).toHaveAttribute('data-on', 'true');
    await expect(bulb).toHaveAttribute('data-lit', 'true');
    await expect(card).toBeVisible();
    await expect(card).toHaveCount(1);
    await expect(bulb).toHaveCount(1);
  });

  test('hero words end up fully lit', async ({ page }) => {
    const tag = viewportTag(page);
    await openStory(page);
    await page.waitForTimeout(1800);

    const title = page.getByTestId('hero-title');
    await expect(title).toBeVisible();
    const opacities = await title.evaluate((element) =>
      Array.from(element.querySelectorAll('[data-hero-word]')).map(
        (word) => getComputedStyle(word).opacity
      )
    );
    expect(opacities).toHaveLength(3);
    for (const opacity of opacities) expect(Number(opacity)).toBeGreaterThan(0.99);
    await expect(page.getByTestId('hero-tagline')).toBeVisible();

    await page.getByTestId('section-hero').screenshot({ path: `${SHOTS}/hero-${tag}.png` });
  });

  test('intro reveal runs once per session and then stays hidden', async ({ page }) => {
    await page.goto('/');
    const intro = page.getByTestId('section-intro');
    await expect(intro).toBeHidden({ timeout: 4000 });

    const seen = await page.evaluate(() => sessionStorage.getItem('jovanIntroSeen'));
    expect(seen).toBe('1');

    await page.reload();
    await expect(intro).toBeHidden();
  });
});

test.describe('G3 motion — reduced motion is a complete static experience', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no pins, no loader, everything already in its final state', async ({ page }) => {
    const tag = viewportTag(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.getByTestId('section-intro')).toBeHidden();

    const section = page.getByTestId('section-anatomy');
    await expect(section).toHaveAttribute('data-beat', 'final');
    const cards = page.getByTestId('anatomy-card');
    await expect(cards).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      await expect(cards.nth(index)).toBeVisible();
    }
    await expect(page.getByTestId('anatomy-bulb')).toHaveAttribute('data-lit', 'true');
    await expect(page.getByTestId('anatomy-final')).toBeVisible();
    await expect(page.getByTestId('process-step')).toHaveCount(4);

    await expect(page.getByTestId('contact-card')).toBeVisible();
    await expect(page.getByTestId('contact-bulb')).toHaveAttribute('data-lit', 'true');
    await expect(page.getByTestId('contact-switch')).toHaveAttribute('data-on', 'true');
    await page.getByTestId('section-contact').screenshot({
      path: `${SHOTS}/finale-${tag}-reduced.png`,
    });

    // nothing in the hero moves or changes brightness (back to the top first:
    // the sticky navigation reacts to scrolling, which is not part of this check)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const hero = page.getByTestId('section-hero');
    const box = await hero.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    // Clip to what is actually on screen: capturing an element taller than the
    // viewport makes Playwright scroll, which is a scroll test, not a motion one.
    const clip = {
      x: box?.x ?? 0,
      y: box?.y ?? 0,
      width: box?.width ?? 0,
      height: Math.min(box?.height ?? 0, (viewport?.height ?? 0) - (box?.y ?? 0)),
    };
    const first = await page.screenshot({ path: `${SHOTS}/hero-${tag}-reduced.png`, clip });
    await page.waitForTimeout(400);
    const second = await page.screenshot({ clip });
    expect(Buffer.compare(first, second), 'the hero is not static under reduced motion').toBe(0);
  });
});
