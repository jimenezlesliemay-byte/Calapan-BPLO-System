# Calapan BPLO frontend

This folder is a standalone React/Vite repository, deployed separately from the PHP backend. It includes the public, applicant and administrator workspaces and a public-asset service worker.

## Local start

Use `VITE_API_BASE_URL=http://localhost:8000` in your private `.env`, run `npm ci`, then `npm run dev`. Use the backend port actually printed by your PHP server. The API adapter appends `/api/bplo` to the origin.

## Render Static Site

Push this folder's contents to the frontend GitHub repository. Create a Render **Static Site** with root directory blank, build command `npm ci && npm run build`, and publish directory `dist`.

Before building, set `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com` to the separately deployed backend HTTPS origin. Do not append `/api/bplo`, and do not use `/` as the value for this separate-service setup. `.env.production.example` shows the format. Changing the variable requires a new frontend build. The backend must set `ALLOW_ORIGIN` to this frontend's exact HTTPS origin.

The frontend receives only the public backend URL. Keep all database, mail, SMS credentials and application secrets in the backend. This frontend does not require a Dockerfile on Render Static Sites.

If needed, add a Render rewrite `/*` → `/index.html` with action **Rewrite**. Existing files are served normally. Under Render's static-site Headers, set `Cache-Control: no-cache, max-age=0, must-revalidate` for `/`, `/index.html` and `/sw.js`, and `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`.

## Caching

Production builds version and precache the public shell, logo, JavaScript and CSS. Admin/applicant bundles load when needed. Cross-origin backend requests, bearer-authenticated API calls, writes, documents and payment proofs never enter the worker cache. A new build updates the cache without force-reloading an unfinished form. The worker runs over HTTPS or localhost in production preview, and is disabled in `npm run dev`.

## Checks

Run `npm run check:structure`, `npm run test:ui`, `npm run test:reports`, `npm run test:cache`, and `npm run build`. After a build, `npm run test:cache-browser` uses headless Edge on Windows (set `BROWSER_BINARY` for another browser), a temporary profile and mock API data; it does not access Aiven or send messages. The mock browser test is for cache behaviour; verify the actual deployed frontend/backend URLs and CORS separately after publishing.