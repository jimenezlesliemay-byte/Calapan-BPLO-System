# webfinal cleanup and cache report

The active project is React/Vite in `frontend` and the BPLO LavaLust API in `backend`. The audit checked the application import graph, registered routes, controller/model/view references, database setup, deployment inputs, package scripts and private/generated folders. Framework and installed dependency files were inventoried and retained.

Removed files were inactive sample PHP modules (products, users, students, old PHP dashboards and their migrations), unreachable browser-demo stores, their obsolete test, the mistakenly consolidated Docker setup and generated change notes. The legacy routes and middleware registrations were removed before their source files. No database rows were deleted.

The extra `deploy` folder held Apache/PHP configuration and the Render startup script; it was organizational, not required by Render. The backend server settings now live in `backend/Dockerfile`, `backend/public/.htaccess`, and `backend/start-render.sh`. The frontend is a separate Render Static Site; no root combined Dockerfile is used. `.github` held optional CI checks; it was removed so Render can deploy directly on a GitHub commit. The optional Blueprint `render.yaml` was also removed. Test scripts remain available locally.

Preserved: all BPLO controllers and business flows; the LavaLust `scheme` framework; PHP error views; `.env` files and local Aiven CA; all uploaded documents, payment proofs, sessions and database records; `vendor`, `node_modules`, lockfiles; working styles and logo; requirement/reference documents and maintained guides.

A single service worker at the application root covers public, admin and applicant pages. Production builds precache only the public HTML shell, logo and fingerprinted static files. Authenticated API requests, personal data, documents, payment proofs, writes and third-party map requests stay on the network. Each build has a new cache version. Navigation checks the network first and uses the saved public shell only if the network fails. No private API offline copy is stored.

## Removed paths
- `.github/workflows/ci.yml`
- `backend/app/commands/Migration.php`
- `backend/app/commands/RunMigrations.php`
- `backend/app/controllers/AdminAuthController.php`
- `backend/app/controllers/AdminController.php`
- `backend/app/controllers/ApiAuthController.php`
- `backend/app/controllers/ApiProductController.php`
- `backend/app/controllers/AuthController.php`
- `backend/app/controllers/MigrationController.php`
- `backend/app/controllers/ProductController.php`
- `backend/app/controllers/StudentController.php`
- `backend/app/controllers/UsersController.php`
- `backend/app/controllers/Welcome.php`
- `backend/app/middlewares/AdminMiddleware.php`
- `backend/app/middlewares/AuthMiddleware.php`
- `backend/app/middlewares/JwtMiddleware.php`
- `backend/app/middlewares/StudentMiddleware.php`
- `backend/app/migrations/000_initial_setup.php`
- `backend/app/migrations/001_create_users_table.php`
- `backend/app/migrations/002_create_refresh_tokens_table.php`
- `backend/app/migrations/003_add_name_columns_to_users_table.php`
- `backend/app/migrations/004_create_products_table.php`
- `backend/app/migrations/005_add_email_to_users_table.php`
- `backend/app/migrations/event.code-workspace`
- `backend/app/models/AuthModel.php`
- `backend/app/models/ProductModel.php`
- `backend/app/models/UsersModel.php`
- `backend/app/views/admin/applicants.php`
- `backend/app/views/admin/applications.php`
- `backend/app/views/admin/dashboard.php`
- `backend/app/views/admin/documents.php`
- `backend/app/views/admin/notifications.php`
- `backend/app/views/auth/login.php`
- `backend/app/views/dbcrud/creat.php`
- `backend/app/views/dbcrud/edit.php`
- `backend/app/views/dbcrud/index.php`
- `backend/app/views/layouts/admin_end.php`
- `backend/app/views/layouts/admin_start.php`
- `backend/app/views/layouts/admin_style.php`
- `backend/app/views/products/create.php`
- `backend/app/views/products/edit.php`
- `backend/app/views/products/index.php`
- `backend/app/views/student/home.php`
- `backend/app/views/student/profile.php`
- `backend/app/views/UserView.php`
- `backend/app/views/welcome_page.php`
- `backend/favicon.ico`
- `deploy/apache.conf`
- `deploy/php.ini`
- `deploy/production.htaccess`
- `deploy/start-render.sh`
- `frontend/CHANGES_SELECT_TYPES.md`
- `frontend/CHANGES_SERVICE_CATALOG.md`
- `frontend/CHANGES_THIS_VERSION.md`
- `frontend/FIX_NOTES.md`
- `frontend/FIX_NOTES_DESIGN.md`
- `frontend/scripts/test-demo.mjs`
- `frontend/src/admin/store.js`
- `frontend/src/applicant/applicationStore.js`
- `render.yaml`

- `frontend/INTEGRATION_README.md` (duplicate, obsolete setup guide; replaced by SETUP_FIRST.md)

## Verification and inventory

The cleanup was corrected for separate repositories: `backend/Dockerfile` was restored and the combined root Dockerfile was removed. Retained-directory file counts include installed dependencies and private runtime files without exposing their names or contents.

| Directory | Files retained |
| --- | --- |
| `frontend\src` | 22 |
| `frontend\public` | 2 |
| `frontend\scripts` | 5 |
| `backend\app` | 38 |
| `backend\scheme` | 46 |
| `backend\tests` | 4 |
| `backend\vendor` | 239 |
| `frontend\node_modules` | 3843 |
| `backend\runtime` | 36 |

Passed: frontend structure/UI checks, six-report date tests, cache policy tests, PHP workflow/notification tests and BPLO syntax checks. A real headless Edge test verified public/admin/applicant display, service-worker JavaScript/CSS on reload, offline public assets and network-only private API requests. The production entry JavaScript decreased from about 373 kB to 255 kB before compression through role-based code splitting; this is a build-size comparison, not a measured page-load timing claim. No Docker engine is installed locally, so the complete container image still needs validation on Render.

## Separate-repository correction

The original cleanup incorrectly treated the backend Dockerfile as a duplicate. It has been restored as a standalone PHP-only Dockerfile. Backend and frontend now each have their own ignore rules and deployment instructions; the API health check no longer requires frontend HTML. The outer Git repository metadata was not changed.
