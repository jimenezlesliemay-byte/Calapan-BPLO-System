# LavaLust / MySQL backend handoff

This ZIP provides frontend UI and REST client methods, **not an implemented backend**.

1. Build a separate LavaLust project with MySQL/Aiven connection. Implement your migration schema based on `docs/ERD.mmd` and the approved original ERD. Add indexes, foreign keys, validated data types, migrations, and backups.
2. Implement server authentication (`POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me`), hashed passwords, secure sessions/tokens, CSRF/CORS settings, role checks and permissions. Replace `src/auth.js` demo login and avoid storing passwords in localStorage.
3. Build the API paths listed in `API_ENDPOINTS.md` with controllers/models, protected data retrieval per logged-in applicant and admin. **The frontend's email filtering is only cosmetic and cannot replace server RBAC.**
4. Documents: server-side MIME/signature, size and virus scanning; store outside public web root; generate protected download URLs; audit all reads; implement authorized GET/DELETE endpoints. Browser IndexedDB is demo only.
5. Inspections: persist schedules and inspector identity, enforce date validation. If Google Calendar integration is required, implement OAuth and Calendar API calls server-side; `.ics` download alone does not meet that integration requirement.
6. Notifications: server queue with idempotency/deduplication and status-based email/SMS providers, opt-in/opt-out rules, delivery logs, retry behavior and provider secrets only on server.
7. Print/PDF: use backend PDF library, official permit number issuance only after authorization, approvals and final validation. Frontend previews are watermarked as unofficial.
8. Audit logs: append-only, protected, tamper-evident server records. Set retention, access controls and backup/restore procedures.
9. Configure `.env` to use the real API and validate the actual database records in UI for Checking 2 and full Checking 3.

Before production: check Data Privacy Act requirements and confirm BPLO's real workflow/requirements with the intended office. Synthetic test data should be used in classroom demonstrations.
