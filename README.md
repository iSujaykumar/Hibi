# HIBI

Habit tracker with RPG progression. Local-only — no accounts, nothing leaves the browser.

You pick a focus, it builds a starting protocol, you complete quests, you get XP / stats / rank. That's the loop.

Live: https://hibix.vercel.app

## Run

Needs Node 22.

```bash
npm i
npm run dev
```

```bash
npm test
npm run build
```

## Layout

| | |
|---|---|
| `src/lib/game/` | rules (xp, streaks, ranks, quest gen). no react in here |
| `src/store/app-store.ts` | zustand. calls the engine, then writes dexie |
| `src/db/hibi-db.ts` | indexeddb |
| `src/routes/` | pages |
| `src/components/` | ui |
| `public/sw.js` | tiny app-shell worker (prod only) |

Tokens are in `src/styles.css`. Don't sprinkle raw hex in components if you can avoid it.

## Data

Everything is IndexedDB (`hibi`). Export/import is under Settings. Reset progress keeps quests; erase all requires typing `DELETE`.

Completions are keyed `habitId:YYYY-MM-DD` so you can't double-dip a daily. Custom XP maxes out at 500.

## Deploy

Repo is [iSujaykumar/Hibi](https://github.com/iSujaykumar/Hibi). Vercel builds `main`. No env vars.

PWA install needs HTTPS. iOS is Share → Add to Home Screen.

More in `DEPLOYMENT_GUIDE.md` if something's on fire.
