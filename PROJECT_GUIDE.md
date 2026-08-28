# HIBI project guide

A map of the repository for beginners. Paths are relative to the project root.

## Source code

| Path | What it is |
| --- | --- |
| `src/routes/` | Pages. File-based routes for TanStack Start. |
| `src/components/` | Reusable UI (buttons, layout, quest cards, overlays). |
| `src/features/` | Larger widgets such as the habit form. |
| `src/lib/game/` | XP, ranks, streaks, achievements, engine. Keep this free of React. |
| `src/db/hibi-db.ts` | Dexie / IndexedDB. |
| `src/store/app-store.ts` | Zustand store. Calls the engine, then persists. |
| `src/services/` | Sound and notifications. |
| `src/types/hibi.ts` | Typed schema. |
| `src/styles.css` | Design tokens and global styles. |
| `src/router.tsx` | Router factory. Required by the platform. |
| `src/lib/auth/` | Unused auth helpers that ship with the template. Do not delete. |
| `src/lib/db.ts` | Template database helper. HIBI does not use it for player data. |

## Required platform files (do not delete)

| Path | Why |
| --- | --- |
| `src/router.tsx` | App will not start without `getRouter()`. |
| `src/routes/__root.tsx` | HTML shell, fonts, PWA links. Keep `AuthProvider` and `PreviewHostBridge`. |
| `src/styles.css` | Global CSS. |
| `vite.config.ts` | Dev server on `0.0.0.0:8080`, PWA injector, Vercel Nitro. |
| `public/__hibi/` | Platform install chrome. |
| `server/` | Deployed PWA middleware. |
| `scripts/` | Build, preview, PWA, and QA scripts. |

## PWA

| Path | Role |
| --- | --- |
| `public/sw.js` | App-shell service worker (production only). |
| `public/favicon.svg` | Tab icon. |
| `public/icon-192.png`, `public/icon-512.png` | Install icons. |
| `public/og.jpg` | Share card. |
| `src/lib/og/site.json` | App identity for the share card injector. |
| Manifest | Served at `/__hibi/manifest.webmanifest` by the platform plugin. |

## Styling

Tokens live in `src/styles.css` (`--hibi-*` and `@theme`). Components should use utilities like `bg-bg`, `text-fg`, `bg-accent`, not raw hex.

## Database / XP / habits

| Concern | File |
| --- | --- |
| Schema | `src/types/hibi.ts` |
| Persistence | `src/db/hibi-db.ts` |
| XP, levels, ranks | `src/lib/game/progression.ts` |
| Streaks | `src/lib/game/streaks.ts` |
| Completions, bonuses | `src/lib/game/engine.ts` |
| Achievements | `src/lib/game/achievements.ts` |
| Habit templates | `src/lib/game/templates.ts` |
| Backup parse / merge | `src/lib/game/backup.ts` |
| Tests | `src/lib/game/engine.test.ts` |

## Deployment

`vite.config.ts` already uses the Vercel Nitro preset. No extra `vercel.json` is required. See `DEPLOYMENT_GUIDE.md`.

## Generated files (do not commit noise)

These are produced by tools and should not be edited by hand:

- `src/routeTree.gen.ts`
- `node_modules/`
- `dist/`, `.output/`, `.nitro/`, `.vercel/`

## Safe to ignore / not required for HIBI

- `migrations/auth/` — template auth SQL, unused because HIBI has no login.
- `src/lib/app-data/` — template connector helpers.

Do not delete them unless you know the platform still boots; they are part of the template.

## Do not commit

Secrets, `.env` files, `node_modules`, build output, screenshots, or editor swap files. See `.gitignore`.
