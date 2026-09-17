// Dev-only helper: capture the v2 motion screenshots used in docs/reports/v2-motion.md.
// Not part of the build. Run: node scripts/v2shots.mjs [width]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'docs/reports/v2-motion';
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE ?? 'http://localhost:4173';
const widths = process.argv[2] ? [Number(process.argv[2])] : [1440, 390];
const SIZES = { 1440: { width: 1440, height: 900 }, 390: { width: 390, height: 844 }, 360: { width: 360, height: 640 } };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const w of widths) {
  const page = await browser.newPage({ viewport: SIZES[w], deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    try { sessionStorage.setItem('jovanIntroSeen', '1'); } catch { /* ignore */ }
  });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);

  await page.screenshot({ path: `${OUT}/hero-${w}.png` });

  const pin = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="section-anatomy"]');
    const spacer = section.querySelector('.pin-spacer') ?? section;
    const rect = spacer.getBoundingClientRect();
    return { top: rect.top + window.scrollY, distance: Math.max(1, rect.height - window.innerHeight) };
  });

  for (const pct of [8, 20, 40, 60, 80, 100]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(pin.top + pin.distance * (pct / 100)));
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${OUT}/anatomy-${w}-${pct}.png` });
  }

  // the process track, a third of the way through its own pin
  await page.evaluate(() => {
    const section = document.querySelector('[data-testid="section-process"]');
    const spacer = section.querySelector('.pin-spacer') ?? section;
    const rect = spacer.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    window.scrollTo(0, Math.round(top + Math.max(0, rect.height - window.innerHeight) * 0.34));
  });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/process-${w}.png` });

  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="section-contact"]');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
  });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: `${OUT}/finale-${w}.png` });

  await page.close();
}

await browser.close();
console.log('shots written to', OUT);
