# Manual payments

## Database setup (once)

For an existing BPLO database, open a terminal in this project's `backend` folder:

```powershell
php scripts/setup_manual_payments.php
```

The script uses the same backend `.env`, LavaLust database configuration, and TLS settings as the application. It creates `bplo_payment_assessments`, `bplo_payment_submissions`, and a setup marker in `bplo_settings`. It does not remove or replace existing records. It is safe to run again. Alternatively, import `backend/database/manual_payments.sql` into the same database using Navicat. New installations can import the updated complete `backend/database/bplo_schema.sql`.

Restart the backend and frontend if needed. No payment provider account or API key is required.

## Administrator: assess a fee

1. Open **Payments** in the admin sidebar and choose **Manage payment**, or open an application and choose its **Payments** tab.
2. Enter the actual amount due and a fee description. Choose GCash, Maya or Bank Transfer and enter the recipient account name, account/mobile number, and instructions. For bank transfers, include the bank name in the instructions.
3. Click **Save assessment & notify**. The applicant receives an in-app notification, and the backend attempts email and SMS to the applicant account's registered email and mobile number. Email includes the exact amount, application reference, fee description, recipient details and payment instructions. SMS includes the exact amount, reference, method and instructions to open Payments in the portal.
4. If the application requires no payment, select **No fee required** and enter the reason instead. This is recorded in the audit log.

There are no built-in fees or recipient accounts. Amounts are stored as integer centavos. One payment must cover the full assessed amount; installments, refunds, cash-counter collection, QR uploads and automatic bank reconciliation are not included.

## Applicant: pay and upload proof

1. Open **Payments** in the applicant sidebar or view **Payment details** inside the application.
2. Read the assessed amount and recipient details. Make the transfer using the specified payment method outside the website.
3. Enter the amount paid, transaction reference and payment date. Attach a PDF, JPG or PNG proof file up to 5 MB.
4. Submit. The status becomes **Awaiting verification**, not Paid. Administrators receive in-app notifications.

## Administrator: verify

1. Open **Payments**, filter by **Awaiting verification**, and open the record.
2. Download the proof. Check the actual received transaction in the recipient account: reference, amount, date and recipient must match.
3. Choose **Verify payment received**, confirm the verification checkbox, and save. The payment becomes **Paid**. The application status remains unchanged.
4. Or choose **Reject proof**, enter the reason, and save. The applicant can submit corrected proof. Previous submissions and reviews remain available.

Only the applicant who owns the application can submit proof. Only administrators can assess or review. Proof downloads require an authenticated owner or administrator and are stored outside the public directory. Duplicate active payment references and proof files cannot be reused. Rejected submissions release their duplicate checks so corrected proof can reuse a legitimate reference.

## Release and history

Changing an application to **Released** now requires a verified payment or an explicit no-fee assessment. Existing released records remain as they are. An assessment cannot be edited after the first proof submission, including rejected attempts. Applications with assessments cannot be deleted, preserving the payment history. Payments close when an application is Released or Rejected; an admin can reopen a rejected application through the existing status workflow when correction is appropriate.

Payment verification produces an internal payment record, not an official government receipt. Receipts and permit approval/release remain separate office processes. Payment events create database notifications and audit entries. Fee assessments also trigger email and SMS; proof submissions and reviews currently use in-app notifications.

## Fee notices by email and SMS

The backend uses the existing SMTP configuration and TextBee Android gateway. Set `BPLO_EMAIL_ENABLED=1`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` and optionally `SMTP_FROM_NAME`. For SMS, set `BPLO_SMS_ENABLED=1`, `TEXTBEE_API_KEY` and the registered `TEXTBEE_DEVICE_ID`. The TextBee phone must be connected and able to send SMS using its SIM. Keep these settings in `backend/.env`.

Application confirmations, status updates, inspection schedules and fee assessments are sent automatically to the applicant's registered email and mobile number when the corresponding backend channels are enabled. The applicant Notifications page shows the destination contacts and has no channel checkboxes or Save preferences button. Old saved applicant preferences are ignored; no database migration or applicant opt-in is needed. Inspection scheduling sends its detailed email once and automatically attempts SMS separately. No-fee assessments clearly say no payment is required. Saving an updated assessment sends the new amount and instructions. Existing assessments can be notified with **Send fee notice by email & SMS**.

The admin's payment panel shows separate results for email and SMS. SMTP acceptance is shown as **Sent to mail server**; TextBee acceptance is shown as **Accepted by TextBee**, which does not confirm delivery to the handset. Configuration errors, invalid contacts and provider failures appear separately. The assessment stays saved even when either channel fails. **Retry unsuccessful notifications** retries only channels that have not succeeded for the current assessment. Notices and channel outcomes are persisted in the existing `bplo_settings` table and audited; no additional database migration is needed. Retries close after proof submission or application closure to avoid asking an applicant to pay again after submitting proof.

If a gateway times out, check SMTP/TextBee history before retrying because a provider can accept a message before the connection fails. Inbox and handset delivery must be checked separately from API acceptance.

## Verification

From `backend`:

```powershell
php tests/manual_payments_test.php
php tests/automatic_notifications_test.php
node tests/manual_payments_http_test.mjs
php scripts/setup_manual_payments.php --check
```

The regression tests use the bundled LavaLust query builder against temporary SQLite databases, never the configured live database. They cover amount validation, role/ownership checks, assessment edits, proof rejection/retry, duplicate payment detection, verification, and release eligibility. The HTTP test starts a temporary localhost PHP server and verifies actual multipart uploads, MIME/size validation, failed-upload cleanup, and authenticated binary proof downloads. Set `PHP_BINARY` if PHP is installed somewhere other than `C:/xampp/php/php.exe` on Windows. SQLite tests do not verify MySQL row locking; the deployed MySQL schema uses unique keys and application-row locks for simultaneous requests. The `--check` command only reads the configured database to verify that payment setup exists.

From `frontend`:

```powershell
npm.cmd run check:structure
npm.cmd run test:ui
npm.cmd run build
```

For a complete live check, use separate admin and applicant browser sessions and follow the steps above with test recipient details and proof. Confirm the database records, protected proof downloads, rejection/retry, and release blocking. Do not transfer real money during a demonstration.
