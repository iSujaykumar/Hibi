# HIBI

**Every Day. Every Quest. Stronger You.**

HIBI is a local-first habit RPG. Ordinary habits become quests. Completing them earns XP, grows attributes, raises your rank, and unlocks achievements. No account. No cloud. Your progression stays on this device.

HIBI is an original personal progression system. It is inspired by dark-fantasy leveling fantasy, not a copy of any existing game.

## Features

- Cinematic title screen and short onboarding
- Daily / weekly quests with binary, numeric, duration, counter, and avoidance types
- XP, levels, ranks (E → EX), attributes, combos, and streak shields
- Achievements, titles, avatar presets, boss challenges, and routines
- Analytics, weekly chart, and activity heatmap
- Themes, sounds (off by default), reduced motion, and notification controls
- IndexedDB persistence (Dexie) with JSON export / import
- Installable PWA with offline-capable app shell
- Mobile-first layout with a desktop navigation rail

## Tech stack

React 19, TypeScript, TanStack Start / Router, Vite, Tailwind CSS v4, Zustand, Dexie, Recharts, Lucide.

## Install and run locally

You need Node.js 22+.

```bash
npm install
npm run dev
```

Then open the printed local URL.

```bash
npm run build
npm run preview
npm run typecheck
npm test
```

## Deploy to Vercel

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for a beginner walkthrough.

The production build uses the Vercel Nitro preset already configured in Vite. Connect the GitHub repository to Vercel and deploy. No environment variables are required.

## PWA installation

After the app is served over HTTPS (or localhost):

1. Open HIBI in Chrome, Edge, or Safari.
2. Use the browser’s **Install app** / **Add to Home Screen** action.
3. Launch from the icon. After the first load, the service worker can serve the shell offline.

Data still lives in that browser profile. Export a backup if you switch devices.

## Data storage

HIBI stores player, habits, completions, XP ledger, achievements, bosses, routines, and settings in **IndexedDB**. Tiny UI preferences are not enough for this dataset, so the core database is not localStorage.

There is no account and no server-side user database.

**Your data is stored on this device. Export a backup regularly if you want protection against device or browser loss.**

### Export / import

Settings → Data → **Export data** downloads a JSON backup. **Import data** validates the file, then lets you replace or merge.

### Reset

- **Reset progress** keeps your quests and identity, clears XP / completions.
- **Erase all data** requires typing `DELETE`.

## Project structure

See [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for a file-by-file map.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `npm` not recognized | Install Node.js 22 LTS and reopen the terminal. |
| Missing `node_modules` | Run `npm install` in the project root. |
| Vite / dev command missing | Use `npm run dev`, not a global Vite install. |
| Build fails | Run `npm run typecheck` and fix the reported file. |
| PWA will not install | Needs HTTPS (or localhost) and a prior successful load. iOS uses Share → Add to Home Screen. |
| Service worker stuck on an old version | Close all tabs, reopen, or unregister the worker in DevTools → Application. |
| IndexedDB issues | Export a backup first. Then erase site data and import. |
| Notifications denied | Re-enable in the browser site settings. Sounds stay off until you enable them in HIBI. |
| Vercel 404 on refresh | This project uses TanStack Start SSR; a failed deploy often means the build did not finish. Redeploy from a clean `npm run build`. |
| Offline mode empty | Open the app once online so the shell can cache, then retry. |
| Duplicate XP | Completions are idempotent per quest per local date (`habitId:YYYY-MM-DD`). |

## Privacy

HIBI does not include third-party analytics. Progression is local unless you export it or a future sync feature is explicitly enabled.
