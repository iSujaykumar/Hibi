# Deploy

Already hooked up: GitHub `iSujaykumar/Hibi` → Vercel (`hibix.vercel.app`). Push `main`, wait for green.

## Local prod check

```bash
npm i
npm run build
npm run preview
```

If the build dies, `npm run typecheck` is usually faster than staring at Vite.

## New Vercel project (if you ever re-link it)

1. vercel.com → import the repo
2. leave defaults
3. no env vars
4. deploy

Framework is TanStack Start / Vite. Nitro preset is already in `vite.config.ts`. Don't add a `vercel.json` unless you know why.

## PWA on a phone

Use the vercel URL, not localhost. Install once while online, then airplane mode should still open the shell.

Stuck on an old build: close every tab of the app, reopen, or nuke the service worker in DevTools → Application.
