# Source-to-Frontend Requirements Traceability

Inputs inside `docs/reference/`:
1. `wireframe_web2.pdf` (16 pages): page 1 sitemap, page 2 initial ERD, pages 4–9 applicant, pages 10–16 admin.
2. `SDLC-Part1.1.docx`: project objectives, Phase 1–5 requirements, full modules and integrations.
3. `CHECKING_1_2_3.docx`: Checking 1 design/setup; Checking 2 backend; Checking 3 CRUD criteria.
4. Original frontend ZIP: retained original admin interface / CSS / logo / demo seed data, then extended.

| Requirement from input | Frontend location | Status / caveat |
|---|---|---|
| Home/Login/Register and applicant/admin portals | `src/components/Welcome.jsx`, `src/main.jsx` | Interactive demo auth; not secure backend auth |
| Applicant/new and renewal forms | `src/applicant/ApplicantPortal.jsx` (wizard) | Demo create & client validation; backend POST adapter provided |
| Business profile and map pin | Wizard, application details, `src/shared/exports.js` | Coordinates/manual map link; no Google Maps API key or geocoding |
| Supporting document upload and review | Applicant Documents, Admin Documents | Demo files in IndexedDB, metadata in localStorage, remote upload adapter; protected backend storage pending |
| Search, tracking, statuses, remarks/history | Applicant Track/My Applications, Admin Applications | Shared browser records; server history needs backend |
| Applicant profile and CRUD | Applicant Profile, Admin Applicants and Add Application modal | Working browser demo CRUD; server validation missing |
| Notifications and preferences | Applicant Notifications, Admin Notifications | In-app demo only; no live email/SMS gateway |
| Inspections and calendar | Admin Inspections, applicant details | Schedules + downloadable `.ics`, no Calendar API OAuth integration |
| Print application / assessment / permit | Applicant details, Admin details, Reports | Browser Print/Save as PDF **unofficial preview**; no official permit numbers or legal issuance |
| Reports | Admin Reports | CSV + printable reports based on demo data |
| Audit logs | Admin Audit Logs | Browser demo trail; not tamper-proof or secure server audit |
| Settings, requirement checklist, and user roles | Admin Settings + login | Demo role navigation; backend RBAC pending |
| Privacy, password hashing, secure sessions, backup | `docs/BACKEND_HANDOFF.md` | **Not implemented**; must be implemented in LavaLust/MySQL |
| ERD/architecture | `docs/ERD.mmd`, `docs/SITEMAP.md` | Design handoff; no actual SQL tables |
| Checking 1: site navigation + interface | React app and sitemap | **Frontend complete**; separate LavaLust setup required |
| Checking 2: DB connection/models/controllers | `API_ENDPOINTS.md` contracts | **Backend missing** |
| Checking 3: CRUD views/validation | React controls + demo adapter | **Frontend functional**; real DB writes and server validation pending |

**Scope boundary:** No guarantee of real delivery, database persistence, network access, secure authentication, or legally valid permits in this frontend ZIP. All actual submissions and sensitive data handling must be server-owned and verified with the beneficiary.

## Added service categories (student prototype)

The service catalog includes the seven categories requested for the Calapan BPLO frontend. See `src/shared/services.js`. Public users can select a category from Home > BPLO Services; applicants can select it in New Application; admins can filter, review and report on each service. Admin Settings > Requirements includes optional supporting-document checklist slots with these titles. This does not constitute compliance with actual licensing procedures, payment systems, or the cited original SDLC's backend requirements.
