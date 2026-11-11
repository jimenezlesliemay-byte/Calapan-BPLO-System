# Separate frontend and backend repositories: Render + Aiven

The intended setup is two independent GitHub repositories and two Render services:

- Push the contents of `backend/` to the backend repository. Deploy it as a Docker Web Service using its own `Dockerfile`.
- Push the contents of `frontend/` to the frontend repository. Deploy it as a Render Static Site using Vite.
- Aiven MySQL is used only by the backend.

Do not deploy the outer workspace folder as a combined application. The outer workspace Git metadata has been left untouched. No repositories were created, committed, pushed or rewritten by this correction. Choose which existing repository belongs to each folder before setting their remotes; never force-push over existing history.

## 1. Deploy the backend repository

The backend repository root must contain `Dockerfile`, `.dockerignore`, `composer.json`, `composer.lock`, `start-render.sh`, `app/`, `scheme/` and `public/`.

In Render, choose **New → Web Service**, connect your backend GitHub repository and use:

| Setting | Value |
| --- | --- |
| Runtime | Docker |
| Branch | Your deployment branch, normally `main` |
| Root directory | Blank: the repository already contains backend files at its root |
| Dockerfile path | `./Dockerfile` |
| Docker build context | `.` |
| Instance | Free for the demo you selected |
| Health check | `/healthz.php` |
| Auto-deploy | On commit |

The Dockerfile installs Composer dependencies, configures PHP/Apache, and serves the API from `public/`. It never builds or copies the frontend. The health check verifies API runtime files/extensions and does not require React's `index.html`.

Add these variables privately in the backend service's **Environment**:

| Key | Value |
| --- | --- |
| `APP_ENV` | `production` |
| `APP_KEY` | A new random secret of at least 32 characters |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | Your existing Aiven connection settings |
| `DB_SSL_CA` | `/etc/secrets/ca.pem` |
| `ALLOW_ORIGIN` | The exact frontend HTTPS origin, e.g. `https://your-frontend.onrender.com` |
| `MAIL_TRANSPORT` | `brevo` |
| `BPLO_EMAIL_ENABLED` | `1` |
| `BREVO_API_KEY` | A Brevo API key, not an SMTP password |
| `SMTP_FROM_EMAIL` | Sender verified in Brevo |
| `SMTP_FROM_NAME` | `Calapan City BPLO` |
| `BPLO_SMS_ENABLED` | `1` |
| `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID` | Your TextBee settings |

Add a Render **Secret File** named `ca.pem` containing the certificate from your Aiven project. Do not put `.env`, credentials, certificates, uploaded documents or payment proofs in GitHub. The backend's own ignore files protect these when it is a standalone repository.

Reuse the existing database and accounts. A new empty database needs `database/bplo_schema.sql` imported once; older BPLO databases missing payment tables can use `php scripts/setup_manual_payments.php`. Run one-time commands privately from your computer with the selected Aiven settings because Render Free has no service shell. Startup does not modify database tables or accounts.

After deployment, `https://YOUR-BACKEND.onrender.com/healthz.php` should return `{"status":"ok"}`. The backend main URL is an API service, not the React landing page.

## 2. Deploy the frontend repository

The frontend repository root must contain `package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `src/` and `public/`.

Choose **New → Static Site**, connect your frontend repository and use:

| Setting | Value |
| --- | --- |
| Root directory | Blank: the repository already contains frontend files at its root |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Environment variable | `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com` |
| Auto-deploy | On commit |

Do not append `/api/bplo` to the environment value; the adapter adds it. Set the variable before building. A Vite variable is baked into the build, so changing it requires rebuilding/redeploying the static site. `frontend/.env.production.example` documents the setting without changing the current local `.env`.

Only the public backend URL belongs in the frontend environment. Database, email, SMS credentials and `APP_KEY` belong exclusively in the backend service. The frontend does not need a Dockerfile for Render's Static Site deployment.

In the frontend site's **Redirects/Rewrites**, use `/*` → `/index.html`, action **Rewrite**, if direct client-side paths are needed. Existing static files, including `sw.js` and `assets`, take precedence over this rewrite.

Configure the following frontend static-site response headers in Render's dashboard:

| Path | Header | Value |
| --- | --- | --- |
| `/` | `Cache-Control` | `no-cache, max-age=0, must-revalidate` |
| `/index.html` | `Cache-Control` | `no-cache, max-age=0, must-revalidate` |
| `/sw.js` | `Cache-Control` | `no-cache, max-age=0, must-revalidate` |
| `/assets/*` | `Cache-Control` | `public, max-age=31536000, immutable` |

The frontend service worker covers public, admin and applicant views on the frontend origin. It caches only public build assets and the HTML shell. Requests to the separate backend, authenticated API data, writes, documents and payment proofs stay on the network.

## 3. Link the two deployed services

Copy the frontend's exact Render HTTPS origin into backend `ALLOW_ORIGIN`. Use no trailing slash or page path. Multiple approved origins can be comma-separated. Copy the backend's HTTPS origin into frontend `VITE_API_BASE_URL`. Redeploy each service after changing its settings.

Verify login, registration, ownership checks, documents, manual payments, both messaging channels and filtered reports. Cross-origin requests include `Authorization`; the existing API CORS handling allows the configured frontend origin and bearer headers. If CORS fails, compare the browser's actual frontend origin with `ALLOW_ORIGIN`.

Render Free blocks SMTP ports 25, 465 and 587, so use the included Brevo HTTPS transport. TextBee's Android phone must stay online and able to send SMS. Add Render outbound IP ranges to Aiven/Brevo allowlists if those services restrict source IPs. Provider acceptance is separate from inbox/handset delivery.

## 4. Independent future updates

Commit and push backend changes from the backend repository; Render redeploys the backend Web Service. Commit and push frontend changes from the frontend repository; Render rebuilds the Static Site. `.github`, a separate `deploy` directory and a Blueprint are not required.

Keep both lockfiles, the backend Dockerfile/startup script, and the frontend service worker. Tests remain local. No Docker engine is installed in this workspace, so the container still needs its first real image build on Render.

The free backend's uploads are temporary across restart/redeploy/idle shutdown; Aiven preserves database rows, not the uploaded files. Persistent uploads require a paid backend disk at `/var/www/html/backend/runtime` or external object storage. Browser caching does not preserve backend files or eliminate a backend cold start.

Official references: [Render Docker](https://render.com/docs/docker), [static-site headers](https://render.com/docs/static-site-headers), [rewrites](https://render.com/docs/redirects-rewrites), [secrets](https://render.com/docs/configure-environment-variables), [free limits](https://render.com/docs/free).