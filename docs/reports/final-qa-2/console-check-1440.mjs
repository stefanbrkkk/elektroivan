import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

let errorCount = 0;
let warningCount = 0;
let pageErrorCount = 0;
const messages = [];

page.on('console', msg => {
  if (msg.type() === 'error') {
    errorCount++;
    messages.push(`console.error: ${msg.text()}`);
  } else if (msg.type() === 'warning') {
    warningCount++;
    messages.push(`console.warning: ${msg.text()}`);
  }
});

page.on('pageerror', err => {
  pageErrorCount++;
  messages.push(`pageerror: ${err.message}`);
});

await page.goto('http://localhost:4173/');

// Scroll to bottom in ~10 steps with 300ms waits
for (let i = 0; i < 10; i++) {
  await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  await page.waitForTimeout(300);
}

console.log(`Console errors: ${errorCount}`);
console.log(`Console warnings: ${warningCount}`);
console.log(`Page errors: ${pageErrorCount}`);
if (messages.length > 0) {
  console.log('Messages:');
  messages.forEach(m => console.log(`  ${m}`));
}

await browser.close();
