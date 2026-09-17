// Build-time asset generation: renders scripts/og.html with Playwright to
// produce the 1200x630 social share card, and rasterizes the SVG favicon
// into a 180x180 apple-touch-icon. Both outputs are committed to public/
// (docs/BRIEF.md §7 / §9).
import { readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { site } from '../src/config/site.ts';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CHROMIUM_EXECUTABLE = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toFileUrl(absolutePath: string): string {
  return `file://${absolutePath}`;
}

async function buildOgImage(): Promise<void> {
  const templatePath = path.join(rootDir, 'scripts', 'og.html');
  const template = await readFile(templatePath, 'utf8');

  const fontDisplayPath = path.join(
    rootDir,
    'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2'
  );
  const fontMonoPath = path.join(
    rootDir,
    'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'
  );

  const html = template
    .replaceAll('{{FONT_DISPLAY_SRC}}', toFileUrl(fontDisplayPath))
    .replaceAll('{{FONT_MONO_SRC}}', toFileUrl(fontMonoPath))
    .replaceAll('{{EYEBROW}}', escapeHtml(`${site.trade} · ${site.city}`.toUpperCase()))
    .replaceAll('{{TITLE}}', escapeHtml(site.seo.ogTitle))
    .replaceAll('{{DESCRIPTION}}', escapeHtml(site.seo.ogDescription))
    .replaceAll('{{WORDMARK}}', escapeHtml(site.wordmark));

  // Chromium blocks file:// subresources (fonts, images) from a document
  // that isn't itself served from file://, so page.setContent() alone would
  // silently drop our @font-face sources. Writing a real temp file and
  // navigating to it keeps the document's origin as file:// too.
  const tempHtmlPath = path.join(tmpdir(), `jovan-og-${Date.now()}.html`);
  await writeFile(tempHtmlPath, html, 'utf8');

  const browser = await chromium.launch({ executablePath: CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(rootDir, 'public', 'og.png') });
  } finally {
    await browser.close();
    await rm(tempHtmlPath, { force: true });
  }
}

async function buildAppleTouchIcon(): Promise<void> {
  const faviconPath = path.join(rootDir, 'public', 'favicon.svg');
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0A0B10;"><img src="${toFileUrl(
    faviconPath
  )}" width="180" height="180" /></body></html>`;

  const tempHtmlPath = path.join(tmpdir(), `jovan-icon-${Date.now()}.html`);
  await writeFile(tempHtmlPath, html, 'utf8');

  const browser = await chromium.launch({ executablePath: CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle' });
    const image = page.locator('img');
    await image.screenshot({ path: path.join(rootDir, 'public', 'apple-touch-icon.png') });
  } finally {
    await browser.close();
    await rm(tempHtmlPath, { force: true });
  }
}

async function main(): Promise<void> {
  if (!existsSync(CHROMIUM_EXECUTABLE)) {
    throw new Error(
      `Chromium executable not found at ${CHROMIUM_EXECUTABLE}. Set PLAYWRIGHT_CHROMIUM_PATH to override.`
    );
  }

  await buildOgImage();
  await buildAppleTouchIcon();
  console.log('Generated public/og.png (1200x630) and public/apple-touch-icon.png (180x180)');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
