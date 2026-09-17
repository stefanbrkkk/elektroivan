// Runs Lighthouse (mobile, default emulation) against a running `vite
// preview` server, writing json+html reports into .lighthouse/ and printing
// the four category scores (docs/BRIEF.md §7 / §9 gate G4).
import { spawnSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

interface LighthouseCategory {
  title: string;
  score: number | null;
}

interface LighthouseReport {
  categories: Record<string, LighthouseCategory>;
}

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outputDir = path.join(rootDir, '.lighthouse');
const outputPath = path.join(outputDir, 'report');
const targetUrl = process.env.LIGHTHOUSE_URL ?? 'http://localhost:4173';
const chromePath = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium';
const lighthouseBin = path.join(rootDir, 'node_modules', '.bin', 'lighthouse');

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  const args = [
    targetUrl,
    '--output=json',
    '--output=html',
    `--output-path=${outputPath}`,
    '--chrome-flags=--headless=new --no-sandbox',
    '--quiet',
  ];

  const result = spawnSync(lighthouseBin, args, {
    cwd: rootDir,
    env: { ...process.env, CHROME_PATH: chromePath },
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`lighthouse exited with status ${result.status}`);
  }

  const jsonPath = `${outputPath}.report.json`;
  const raw = await readFile(jsonPath, 'utf8');
  const report = JSON.parse(raw) as LighthouseReport;

  // docs/BRIEF.md §7 names exactly these four gates; newer Lighthouse
  // versions may ship extra categories (e.g. "Agentic Browsing") that are
  // out of scope here.
  const REQUIRED_CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

  console.log(`\nLighthouse scores (mobile) for ${targetUrl}:`);
  for (const id of REQUIRED_CATEGORIES) {
    const category = report.categories[id];
    if (!category) {
      console.log(`  ${id}: missing from report`);
      continue;
    }
    const score = category.score === null ? 'n/a' : Math.round(category.score * 100);
    console.log(`  ${category.title}: ${score}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
