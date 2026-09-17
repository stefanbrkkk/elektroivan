// Build-time prerender: renders the app to static HTML and injects SEO
// metadata, so the shipped dist/index.html is fully correct without
// requiring JavaScript to run first (docs/BRIEF.md §7).
import { readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distIndexPath = path.join(rootDir, 'dist', 'index.html');
const serverEntryPath = path.join(rootDir, 'dist', 'server', 'entry-server.js');
const serverDir = path.join(rootDir, 'dist', 'server');

interface ServerEntry {
  render: () => string;
  site: {
    name: string;
    city: string;
    email: string;
    phone: string;
    hours: string;
    siteUrl: string;
    seo: {
      title: string;
      description: string;
      ogTitle: string;
      ogDescription: string;
      locale: string;
    };
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

async function main(): Promise<void> {
  const entryUrl = new URL(`file://${serverEntryPath}`);
  const { render, site } = (await import(entryUrl.href)) as ServerEntry;

  const appHtml = render();
  const ogImageUrl = site.siteUrl ? `${site.siteUrl}/og.png` : '/og.png';
  const canonicalUrl = site.siteUrl ? `${site.siteUrl}/` : '';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Electrician',
    name: site.name,
    description: site.seo.description,
    email: site.email,
    image: ogImageUrl,
    areaServed: site.city,
    openingHours: site.hours,
  };
  if (site.siteUrl) jsonLd.url = site.siteUrl;
  if (site.phone) jsonLd.telephone = site.phone;

  // Preload the hashed display-font asset Vite emitted (latin subset), so the preload matches the CSS URL.
  const assetFiles = await readdir(path.join(rootDir, 'dist', 'assets'));
  const displayFont = assetFiles.find((f) => /^bricolage-grotesque-latin-wght-normal-.*\.woff2$/.test(f));
  const headTags = [
    displayFont
      ? `<link rel="preload" as="font" type="font/woff2" href="/assets/${displayFont}" crossorigin>`
      : '',
    `<meta name="description" content="${escapeAttr(site.seo.description)}">`,
    canonicalUrl ? `<link rel="canonical" href="${escapeAttr(canonicalUrl)}">` : '',
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeAttr(site.seo.ogTitle)}">`,
    `<meta property="og:description" content="${escapeAttr(site.seo.ogDescription)}">`,
    `<meta property="og:image" content="${escapeAttr(ogImageUrl)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:locale" content="${escapeAttr(site.seo.locale)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeAttr(site.seo.ogTitle)}">`,
    `<meta name="twitter:description" content="${escapeAttr(site.seo.ogDescription)}">`,
    `<meta name="twitter:image" content="${escapeAttr(ogImageUrl)}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');

  let html = await readFile(distIndexPath, 'utf8');
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(site.seo.title)}</title>`);
  html = html.replace('<!--app-head-->', headTags);
  html = html.replace('<!--app-html-->', appHtml);
  await writeFile(distIndexPath, html, 'utf8');

  // A sitemap with a relative <loc> (or a robots.txt Sitemap: line pointing
  // at one) is invalid — both need an absolute URL. Skip writing either
  // until `site.siteUrl` is filled in after the first production deploy
  // (docs/BRIEF.md §8; minor 10, docs/reports/review-1.md).
  const robotsLines = ['User-agent: *', 'Allow: /'];
  if (site.siteUrl) {
    robotsLines.push(`Sitemap: ${site.siteUrl}/sitemap.xml`);
  }
  await writeFile(path.join(rootDir, 'dist', 'robots.txt'), `${robotsLines.join('\n')}\n`, 'utf8');

  if (site.siteUrl) {
    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url>',
      `    <loc>${escapeHtml(`${site.siteUrl}/`)}</loc>`,
      '  </url>',
      '</urlset>',
      '',
    ].join('\n');
    await writeFile(path.join(rootDir, 'dist', 'sitemap.xml'), sitemap, 'utf8');
  } else {
    console.log('site.siteUrl is empty: skipping dist/sitemap.xml and the robots.txt Sitemap: line.');
  }

  // The SSR bundle is only needed for this script; it must not ship.
  await rm(serverDir, { recursive: true, force: true });

  console.log(
    `Prerender complete: dist/index.html, dist/robots.txt${site.siteUrl ? ', dist/sitemap.xml' : ''}`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
