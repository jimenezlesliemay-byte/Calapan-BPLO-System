# Acceptance checks for the connected BPLO system

Use test accounts and documents. Separate admin and applicant sessions keep role checks easy to verify. Browser-only demo data is no longer supported.

From `frontend`, run `npm.cmd run check:structure`, `npm.cmd run test:ui`, `npm.cmd run test:reports`, and `npm.cmd run test:cache`. Build the production frontend before `npm.cmd run test:cache-browser`. The browser cache test uses a temporary profile and local mock API, never the live Aiven database.

From `backend`, run `php tests/automatic_notifications_test.php` and `node tests/manual_payments_http_test.mjs`. These use isolated SQLite data and fake providers.

| Workflow | Expected result |
| --- | --- |
| Register, log in, reload and log out | Backend validates sessions and role access. No private API data is supplied from an offline worker cache. |
| Applicant submits an application and documents | Real records/files reach the authenticated backend. Required document validation remains active. |
| Another applicant requests those files/records | Backend denies access. |
| Admin reviews documents, changes status or schedules inspection | Database, in-app notices and configured email/SMS reflect the saved action. |
| Admin assesses a fee | Applicant sees the amount and payment instructions; separate email/SMS outcomes and retry controls are available. |
| Applicant uploads payment proof | Payment waits for admin verification. Wrong amount, reused proof/reference and unsupported files are rejected. |
| Admin rejects proof, applicant retries, admin verifies | Earlier attempts remain recorded; payment status becomes Paid only after verification. |
| Admin releases an application | Payment must be verified or an explicit no-fee assessment must exist. |
| Reports use November 1 through December 31 | CSV/PDF contain only the selected dates, including the entire last day; grouped totals match filtered applications. |
| Public/admin/applicant pages reload after the first production visit | Public scripts/styles/logo can load from the service worker; fresh API requests still reach the server. |
| Browser goes offline | Public cached assets can load; account/payment/document requests have no cached API fallback and no offline writes are queued. |
| A new frontend build is deployed | New HTML is checked online, worker assets are versioned, and an unfinished form is not force-reloaded. |

Provider acceptance does not prove delivery to an inbox or handset. A real provider-delivery test is separate from the isolated automated tests. Free Render does not retain server upload files across restart/redeploy; browser caching does not change that limitation.