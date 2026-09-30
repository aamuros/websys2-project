# Submission readiness check

Checked September 30, 2026. Admin/member workflows and authentication were tested in Chromium against a separate seeded SQLite database. All three roles also passed a browser smoke check against the project's running Supabase PostgreSQL database. Hosted deployment and real inbox delivery remain unverified.

## Results

| Area | Checked behavior | Result |
| --- | --- | --- |
| Admin dashboard | Seeded metrics and navigation | Pass |
| Member directory | Search, staff/member filters, suspended filter, account form validation | Pass |
| Account administration | Role changes, immediate session revocation, suspension, blocked login, reactivation; existing admin accounts protected | Pass |
| Assignment guard | Members with active assignments cannot be moved to another role | Pass |
| Reports | Date validation, explicit Apply dates action, empty ranges, CSV endpoint and browser download | Pass |
| CSV safety | Text that could become a spreadsheet formula is neutralized | Pass, automated |
| Community updates | Admin publishes; member reads; member cannot publish | Pass |
| Member operations | Planting survives reload; assignment/history detail; request validation, submission, viewing and cancellation | Pass |
| Role boundaries | Direct requests to other roles' pages are denied | Pass |
| Mobile | Admin reports/directory/navigation, member assignments/navigation and confirmation page at 390 × 844 | Pass |
| Registration | Normalized email, member-only role, automatic sign-in, confirmation notice and gated workspace/API | Pass |
| Email confirmation | Actual locally logged link works; altered signature rejected; resend and cooldown work | Pass |
| Recovery | Unknown-account response is generic; actual locally logged reset link works; mismatched confirmation fails | Pass |
| Password reset | New password works; old password fails; remembered sessions revoked; consumed link rejected | Pass |
| Email changes | Current password required; new email must be confirmed; new address works at login | Pass |
| Authentication edge cases | Expired links, wrong-user links, inactive accounts, signed link after guest login, mail transport failure and session invalidation | Pass, automated |
| Rate limits | Login lockout persists across six separate HTTP requests; registration/recovery/verification limits tested | Pass |
| PostgreSQL | Migration applied; admin/staff/member login, workspace pages, CSV/plot endpoints and logout | Pass |
| PostgreSQL RLS | Enabled on users, password_reset_tokens, cache and cache_locks | Pass |

The earlier detailed staff review is in [STAFF_PRESENTATION_CHECK.md](STAFF_PRESENTATION_CHECK.md). Its database-unavailable limitation was resolved during this follow-up check.

## Changes

- Added signed email confirmation, confirmation resend, forgot/reset password pages, remember-me login, and persistent authentication rate limits.
- Added verification/remember-token columns plus password-reset/cache tables. Operational routes require confirmed email; Settings and logout remain available before confirmation.
- Added current-password checks and renewed confirmation for email changes. Resetting a password revokes all sessions; changing a password in Settings preserves the current session and revokes others.
- Administrative role/access changes revoke sessions and remembered logins. Active assignments prevent role changes. Login uses the account's current role, preventing stale redirects after a role change.
- Reports validate dates before applying filters; exported ranges match the displayed report; CSV formula-like text is escaped.
- Email links use configured APP_URL rather than an incoming Host header. Mail transport errors keep accounts recoverable with readable messages.
- Updated environment examples, development fixtures, authentication tests, admin regression tests and setup documentation. Pint excludes browser evidence and generated submission copies from source formatting checks.

Main application files: authentication controllers/requests in `app/Http`, `app/Models/User.php`, `app/Providers/AppServiceProvider.php`, `app/Services/AccountSessionService.php`, `routes/web.php`, the authentication migration, `resources/js/pages/auth`, `resources/js/components/auth-panel.tsx`, `resources/js/components/settings-modal.tsx`, and the admin member/report controllers and pages. Additional changes cover shared props, cache/mail configuration, the local seeder and test configuration.

Regression coverage: `tests/Feature/Auth/AccountRecoveryTest.php`, `tests/Feature/AdminSubmissionTest.php`, and updated authentication/workflow tests. Browser evidence and reusable admin/member/PostgreSQL scripts are in `output/playwright/submission-*`. Scripts containing emailed test tokens were kept outside the repository.

## Verification

- Full Laravel suite: **120 tests, 1,459 assertions**, all passing.
- TypeScript check and production build pass. The build still reports dependency `use client` directives and a bundle-size warning.
- Source PHP formatting and whitespace checks pass.
- Chromium workflow checks pass; the PostgreSQL smoke check reported zero uncaught browser errors.

SQLite was used for destructive workflow tests. PostgreSQL checks exercised existing records through read operations and login/logout. The local database was migrated and development fixtures seeded without resetting it; the seeder preserves saved account roles, passwords and operational edits while confirming known demo addresses and adding missing fixtures. The pending crop-maturity migration was also applied.

## Presentation setup and remaining work

1. Keep OrbStack/Docker and local Supabase running. Start the app with `composer run dev` and open the configured APP_URL, normally `http://localhost:8000`.
2. Use `admin@garden.test` and `staff@garden.test` with `Garden123!`. In the existing local database, `member@garden.test` currently has the **staff** role. That saved role was preserved. Use **`paolo@garden.test` / `Garden123!`** for a member login, or deliberately restore the other demo account before rehearsing its assigned-plot flow.
3. Configure SMTP and an approved sender using the [README email setup](../README.md#email-confirmation-and-password-recovery). Current MAIL_MAILER is `log`, so confirmation/reset emails are previewed in Laravel logs and do not reach inboxes. Public email cannot reach the seeded `.test` addresses.
4. Use a real email account to demonstrate registration → inbox confirmation → workspace access → forgot password → inbox reset → new-password login. This is the remaining external delivery check.
5. Apply migrations on the submission/deployment database, set APP_URL to its exact public origin, keep database sessions and database rate limits, and check these flows once on that deployment. The local migration has already been applied.

Hosted Supabase, production deployment, SMTP delivery, and external weather-provider availability are outside the verified result. Existing event timestamps entered before the staff timezone fix were not rewritten; review their intended local times before presenting them.
