# Export reports by date range

1. Log in as admin and open **Reports**.
2. Select **From date** and **To date**. For November through December 2026, use `2026-11-01` through `2026-12-31`.
3. Check the matching record count and date basis displayed on each report card.
4. Choose **CSV** or **Print / PDF**. Both export the same filtered records. CSV filenames and printed report headings show the selected date range.
5. **Clear dates** restores all dates. Selecting just one date or a reversed range disables exports until corrected. Reports with no matching records also have disabled export buttons.

Both selected days are included in full. Applications use submission dates; applicants use account registration dates; inspections use scheduled inspection dates; documents use upload dates. BPLO service and business-type totals use only applications submitted within the range. Rows without a valid date are excluded when a range is active. The filter affects report exports, not dashboard records or the separate Applications-page export.

Registration dates come from the existing `bplo_accounts.created_at` column, so no database migration is needed. Explicitly timezone-marked timestamps are interpreted using Philippine calendar dates; date-only and timezone-free SQL values retain their stored calendar day.

Run `npm.cmd run test:reports` from `frontend` to verify date boundaries, report contents and totals.
