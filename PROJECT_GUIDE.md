# Code map

Not a tour. Just where things live.

**Game** — `src/lib/game/`
- `engine.ts` complete/tick/shields
- `progression.ts` xp curve, ranks
- `protocol.ts` + `quest-library.ts` starting path
- `streaks.ts`, `achievements.ts`, `gates.ts`, `backup.ts`

**App** — `src/store/app-store.ts` → `src/db/hibi-db.ts`

**Screens** — `src/routes/` (`home`, `onboarding`, `quests`, …)

**Don't hand-edit:** `src/routeTree.gen.ts`

Platform leftovers (`src/lib/auth`, `src/lib/db.ts`, `public/__hibi`) need to stay or the PWA/build breaks. Ignore them otherwise.
