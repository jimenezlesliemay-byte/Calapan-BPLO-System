# Active BPLO API

Local configuration: `VITE_API_BASE_URL=http://localhost:8000` (the backend origin). Requests use `/api/bplo` below that origin. For separate Render services, set this variable to the backend's HTTPS origin and set backend `ALLOW_ORIGIN` to the frontend's exact HTTPS origin. All protected requests include `Authorization: Bearer <token>` and bypass browser/service-worker data caching.

| Methods | Path under `/api/bplo` | Purpose |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | Register an applicant or sign in; returns a token and user |
| GET | `/auth/me` | Validate the current account/session |
| POST | `/auth/logout` | Revoke the session |
| PUT | `/profile` | Update profile or password |
| GET, POST | `/applications` | List authorized records or submit an application |
| GET, PUT, DELETE | `/applications/{ref}` | View/update/delete according to role and status |
| PUT | `/applications/{ref}/status` | Admin status update; release enforces payment eligibility |
| PUT | `/applications/{ref}/inspection` | Admin inspection schedule |
| POST | `/applications/{ref}/uploads` | Authenticated multipart document upload |
| PUT | `/applications/{ref}/documents` | Admin document review |
| GET | `/applications/{ref}/documents/{id}/download` | Protected document download |
| DELETE | `/applications/{ref}/documents/{id}/delete` | Authorized document removal |
| GET, POST | `/applicants` | Admin applicant directory/creation |
| PUT, DELETE | `/applicants/{id}` | Admin update/deactivation |
| GET | `/notifications` | In-app notification inbox |
| PUT | `/notifications/read-all`, `/notifications/{id}/read` | Mark notifications read |
| GET | `/audit-logs` | Admin audit history |
| GET, PUT | `/settings` | Admin general settings |
| GET | `/payments` | Authorized payment records |
| GET | `/applications/{ref}/payment` | Assessment, submissions and delivery results |
| PUT | `/applications/{ref}/payment/assessment` | Admin fee assessment and automatic notices |
| POST | `/applications/{ref}/payment/notice` | Admin retry of unsuccessful notice channels |
| POST | `/applications/{ref}/payment/submissions` | Applicant proof submission |
| PUT | `/applications/{ref}/payment/submissions/{id}/review` | Admin verification or rejection |
| GET | `/applications/{ref}/payment/submissions/{id}/proof` | Protected payment-proof download |

Passwords are hashed, bearer sessions are stored in `bplo_sessions`, and controllers enforce applicant ownership/admin roles against the database. The old users/products/student demo routes and their sources have been removed. Applicant notification preferences have been removed; configured email/SMS channels send automatically for the implemented events. See `../MANUAL_PAYMENTS.md` for the payment workflow.
