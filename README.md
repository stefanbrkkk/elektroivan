# Električar Jovan — demo sajt

Jednostrani demo sajt za lokalnog električara iz Beograda. React 19 + Vite + TypeScript (strict) + Tailwind CSS v4, GSAP + Lenis za animacije, self-hosted Fontsource fontovi. Statičan frontend, bez backend-a, bez baze, bez tajnih ključeva.

## Pokretanje

Potreban je Node.js ≥20 (razvijano i testirano na 22.x) i npm.

```bash
npm install
npm run dev
```

Sajt je dostupan na `http://localhost:5173`.

## Provere kvaliteta

```bash
npm run typecheck   # TypeScript, strict, bez emitovanja
npm run lint        # ESLint (flat config), 0 upozorenja dozvoljeno
npm run build       # klijentski build + SSR prerender u dist/
npm run preview     # servira dist/ na http://localhost:4173
npm run test:e2e    # Playwright, 4 viewporta (360/390/768/1440)
npm run lh          # Lighthouse (mobile) nad vite preview
npm run og:build    # generiše public/og.png i public/apple-touch-icon.png
```

Pre `test:e2e` i `lh` mora biti pokrenut produkcioni build (`npm run build`); Playwright sam pokreće `vite preview` ako već ne radi (`webServer` u `playwright.config.ts`).

## Build i prerenderovanje

`npm run build` radi tri koraka:

1. `vite build` — klijentski bandl u `dist/`.
2. `vite build --ssr src/entry-server.tsx --outDir dist/server` — SSR bandl korišćen samo za prerenderovanje.
3. `node scripts/prerender.mts` — renderuje `<App/>` u statičan HTML, ubacuje SEO metapodatke (title, opis, Open Graph, Twitter, JSON-LD) u `dist/index.html`, piše `dist/robots.txt`, i na kraju briše `dist/server` (ne ide u deploy). **`canonical` link, `dist/sitemap.xml` i `Sitemap:` red u `robots.txt` se ne generišu dok je `siteUrl` prazan** (relativan `<loc>`/canonical bi bio nevalidan) — pojavljuju se automatski čim se `siteUrl` popuni (vidi ispod).

## Objava na Vercel

Projekat: **jovan-elektro**. Preset: **Vite**. Build komanda: `npm run build`. Izlazni direktorijum: `dist`.

```bash
vercel deploy --yes         # preview
vercel deploy --prod --yes  # produkcija
```

`vercel.json` postavlja samo `Cache-Control: public, max-age=31536000, immutable` za `/assets/*` — nema rewrite pravila jer je sajt jedna stranica sa sidrima.

Posle prvog produkcionog deploy-a upišite pravi domen u `src/config/site.ts` → `siteUrl`, pa ponovo pokrenite `npm run build` (i po potrebi `npm run og:build`) da se canonical, `sitemap.xml`, `robots.txt` i Open Graph URL-ovi regenerišu sa pravim domenom, i objavite ponovo.

## Gde se menjaju poslovni podaci

Sve vidljive informacije i tekstovi žive u **`src/config/site.ts`** (tipizirano, jedan izvor istine):

- Naziv, zanat, grad, mejl, telefon, radno vreme, `siteUrl`.
- SEO naslov/opis, Open Graph tekstovi.
- Navigacija, hero tekstovi, statistike (`// DEMO`), koraci anatomije kvara, usluge, koraci rada, tekstovi za „pre/posle”, utisci (`// DEMO`), pitanja i odgovori, kontakt i footer tekstovi.

Ako je `phone` prazan string, dugme za poziv i `tel:` linkovi se uopšte ne prikazuju. Kada se doda pravi broj, dugme se automatski pojavljuje.

Statistike i utisci su jasno označeni komentarom `// DEMO` u kodu i prikazuju vidljivu demo oznaku na sajtu — zamenite ih stvarnim podacima pre pravog puštanja u rad.

## Prilagođavanje drugom zanatu

1. **Naziv i tekstovi** — izmenite vrednosti u `src/config/site.ts` (tipovi ostaju isti, popunite polja za novi zanat/grad/usluge).
2. **Boje** — sve boje su CSS promenljive u `src/styles/tokens.css` (`@theme` blok): `--color-bg`, `--color-surface`, `--color-volt` (primarna akcentna boja), `--color-arc` (fokus/„pod naponom”), `--color-fault` (stanja kvara) itd. Izmena ovih vrednosti menja ceo sajt.
3. **Fontovi** — uvoze se u `src/styles/global.css` preko Fontsource paketa; zamenite paket i `--font-*` promenljive u `tokens.css` ako menjate tipografiju.
4. **Ikone/ilustracije usluga i „pre/posle”** — inline SVG u `src/sections/Services.tsx` i `src/sections/BeforeAfter.tsx`; nema spoljnih/stock fotografija po dizajnu.

## Struktura

```
src/config/site.ts     — sve poslovne podatke i tekstove (jedini izvor istine)
src/sections/          — po jedna komponenta po sekciji (ids/testids zaključani u docs/CONTRACT.md)
src/motion/            — GSAP registracija i deljeni motion alati
src/components/        — Nav pomoćne komponente, SmoothScroll, Cursor, DemoBadge
src/hooks/, src/lib/   — SSR-bezbedne kuke i pomoćne funkcije
scripts/               — prerender, generisanje OG slike/ikonice, Lighthouse
e2e/                   — Playwright testovi
docs/                  — BRIEF, CONTRACT, DECISIONS, izveštaji
```
