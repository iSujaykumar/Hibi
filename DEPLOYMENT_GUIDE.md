# HIBI deployment guide

This guide assumes you have never deployed a web app. Follow the steps in order.

## 1. Install Node.js

1. Open [https://nodejs.org](https://nodejs.org).
2. Download the LTS build (22 or newer).
3. Install it with the default options.
4. Open a new terminal and run `node -v`. You should see a version number.

## 2. Open the project

1. Install [VS Code](https://code.visualstudio.com/) if you do not have it.
2. Use **File → Open Folder** and select the HIBI project folder.

## 3. Open a terminal in VS Code

**Terminal → New Terminal**. The prompt should show the project folder.

## 4. Install dependencies

```bash
npm install
```

Wait until it finishes without errors.

## 5. Run the app locally

```bash
npm run dev
```

## 6. Open the local URL

The terminal prints a local address (often port 8080 in this environment). Open it in Chrome.

## 7. Test the app

1. Tap **Enter System**.
2. Choose a name, focus, difficulty, and archetype.
3. Create the first quest and enter HIBI.
4. Complete a quest on Home. XP should rise. Completing it again must not double the XP.
5. Reload the page. Your player should still be there.

## 8. Production build

Stop the dev server with Ctrl+C, then:

```bash
npm run build
```

If this fails, read the error. Typical causes: a TypeScript issue or a missing file.

Optional preview of the built app:

```bash
npm run preview
```

## 9. Create a GitHub repository

1. Create an account at [https://github.com](https://github.com) if needed.
2. Click **New repository**. Name it `hibi`. Do not add a README (this project already has one).
3. In the project terminal:

```bash
git init
git add .
git commit -m "Initial HIBI release"
git branch -M main
git remote add origin https://github.com/YOUR_USER/hibi.git
git push -u origin main
```

Replace `YOUR_USER` with your GitHub username.

## 10. Connect GitHub to Vercel

1. Open [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New… → Project**.
3. Import the `hibi` repository.

## 11. Deploy

Leave the defaults. Framework detection should work. **Do not add environment variables** — HIBI has no backend secrets.

Click **Deploy** and wait for the green success state.

## 12. Verify the live app

Open the Vercel URL. You should see the HIBI title screen, not a blank page.

## 13. Verify PWA

In Chrome desktop: install icon in the address bar, or the browser menu → **Install HIBI**.

On Android Chrome: **Add to Home screen**.

On iPhone Safari: Share → **Add to Home Screen**.

## 14. Install on your phone

Use the HTTPS Vercel URL, not `localhost`. `localhost` only works on the computer running the app.

## 15. Test offline

1. Open the installed app once while online.
2. Turn on airplane mode.
3. Reopen HIBI. Home, quests, and your data should still work.
4. Complete a quest. It should persist.

If the first offline load is blank, open it online once more so the service worker can cache the shell.
