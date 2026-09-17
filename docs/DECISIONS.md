# DECISIONS

## Phase 0 — environment (2026-09-17)
- `node -v` → v22.22.2 (≥20 OK), npm 10.9.7, `git --version` → 2.43.0.
- `vercel` CLI not installed and no `VERCEL_TOKEN`; `vercel whoami` cannot pass → deploy will be reported as the one remaining external step (BRIEF §8). Project name suggestion: `jovan-elektro`.
- Repo is a fresh clone with zero commits on branch `claude/hopeful-meitner-x5cd1c`; remote has no branches. All work is committed on that branch.
- Session env var `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1` cannot be set from inside a running session; built-in Explore/Plan/general-purpose agents are simply not used. Lookups go to `scout`.
- GSAP official skills cloned from `greensock/gsap-skills` and copied into `.claude/skills/` (gsap-core, gsap-scrolltrigger, gsap-plugins, gsap-react); preloaded to `motion-engineer` via `skills:`.
- `omitClaudeMd: true` set on scout/qa-runner (ignored if unsupported by Claude Code 2.1.42).
- Playwright's preinstalled Chromium is build 1194 at `/opt/pw-browsers/chromium` (symlink). If `@playwright/test` needs a different build, use `executablePath` instead of downloading.
- Intro loader keeps its root element mounted (inert + `hidden`) after finishing so the "12 sections in order" test is deterministic.
- SEO/prerender: `vite build` client + `vite build --ssr src/entry-server.tsx`, then `scripts/prerender.mts` renders `<App/>` with `renderToString` into `dist/index.html` and injects meta/OG/JSON-LD from `site.ts`; `main.tsx` hydrates. Components never touch `window` during render.
- TypeScript pinned to 5.9.x (latest 7.x is the native port; typescript-eslint peer range is `<6.1`).

## Package versions (npm registry, 2026-09-17 — to be confirmed by scout)
| package | version |
|---|---|
| vite | 8.3.0 |
| @vitejs/plugin-react | 6.1.1 |
| react / react-dom | 19.3.0 |
| typescript | 5.9.3 |
| tailwindcss / @tailwindcss/vite | 4.3.3 |
| gsap | 3.15.0 |
| @gsap/react | 2.1.2 |
| lenis | 1.3.26 |
| @fontsource-variable/bricolage-grotesque, @fontsource/instrument-serif, @fontsource-variable/geist, @fontsource-variable/jetbrains-mono | 5.3.0 |
| @playwright/test | 1.63.0 |
| lighthouse | 13.4.1 |
| eslint | 10.10.0 |
| typescript-eslint | 8.70.0 |
| vercel (CLI, not installed) | 59.20.0 |

## Scout findings (phase 0)

All versions confirmed current (2026-09-17). Key findings:

| Package | Status | Note |
|---|---|---|
| vite 8.3.0 | ✓ | ESM-first; HMR on file changes |
| @vitejs/plugin-react 6.1.1 | ✓ | Auto JSX refresh; React 19 ready |
| tailwindcss 4.3.3 + @tailwindcss/vite | ✓ | CSS-first with `@import "tailwindcss"; @theme {}` in CSS |
| gsap 3.15.0 | ✓ | ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin in public package; import as `gsap/ScrollTrigger` |
| @gsap/react 2.1.2 | ✓ | useGSAP hook; peer: gsap ≥3.12.5, react ≥17 |
| lenis 1.3.26 | ✓ | GSAP: `autoRaf:false`, `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t=>lenis.raf(t*1000))` |
| Fontsource 5.3.0 | ✓ | bricolage-grotesque: `wght.css`; instrument-serif: `latin-ext-400-italic.css`+`latin-400-italic.css`; geist/jetbrains-mono: `wght.css` |
| @playwright/test 1.63.0 | ⚠ | Version OK, but expects Chromium revision 1243; preinstalled is 1194 — use `executablePath` override |
| lighthouse 13.4.1 | ✓ | Mobile: `--form-factor=mobile`; CHROME_PATH env var for binary path |
| Node 22.22.2 | ✓ | Supports .mts natively since 22.18; no tsx needed |
