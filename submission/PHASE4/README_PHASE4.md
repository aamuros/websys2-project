# Phase 4 Submission Package

The package contains the recorded security/testing report, 16 screenshots and their evidence PDF, JUnit/browser results, a bug log, human-feedback forms, and the updated project.

**Before submitting:** complete at least three actual usability sessions in `DOCUMENTATION/USABILITY_TESTING.md`, complete `DOCUMENTATION/MEMBER_CONTRIBUTIONS.md` with leader approval, and update the report's pending statuses and counts. No human feedback has been fabricated.

## Contents

- `Security_Testing_Report.pdf` and `DOCUMENTATION/SECURITY_TESTING_REPORT.md`: report sections A-G, issue log, checklist and summary.
- `SCREENSHOTS/Test_Evidence.pdf` and PNGs: captioned application evidence.
- `EVIDENCE/`: raw initial/final JUnit and browser outputs, JSON observations, frontend checks and source hashes.
- `DOCUMENTATION/`: editable feedback, contribution and issue records.
- `PROJECT/`: current source with the verified validation fix and production frontend assets.

## Run the final project locally

Requirements: PHP 8.4 with PDO SQLite, Composer 2, Node.js 24+, npm.

1. Enter `PROJECT`, run `composer install` and `npm ci`.
2. Copy `.env.local.example` to `.env`; run `php artisan key:generate`.
3. Create an empty `database/database.sqlite` file. In `.env`, set `DB_CONNECTION=sqlite`, `DB_DATABASE=` to the **absolute path** of that file, `DB_URL=` blank, `SESSION_CONNECTION=sqlite`, `SESSION_DRIVER=database`, `CACHE_STORE=file`, `APP_ENV=local`, `APP_URL=http://127.0.0.1:8000`, `SESSION_SECURE_COOKIE=false`.
4. On this new isolated database only, run `php artisan migrate --seed`.
5. Run `npm run build` and `php artisan serve --host=127.0.0.1 --port=8000`.
6. Open `http://127.0.0.1:8000`. Development-only emails are `admin@garden.test`, `staff@garden.test`, and `member@garden.test`; their fixture password is `Garden123!`.

SQLite is used for repeatable classroom tests/demonstration. The normal PostgreSQL configuration remains documented in the project README; no hosted PostgreSQL test is claimed.

## Repeat backend verification

```bash
php vendor/bin/phpunit tests/Feature --colors=never --log-junit phase4-results.xml
npm run typecheck
php vendor/bin/pint --test app/Http/Requests/Auth/RegisterRequest.php tests/Feature/Phase4SecurityTest.php
npm run build
```

`PROJECT/output/playwright/` contains the two evidence scripts and an isolated server router. They were executed using the Playwright CLI skill wrapper, a named `phase4` session and the separate test server described in the report. Run auth first, open the staff announcement creation dialog, then run features; output artifacts are relative to the project root. They are evidence-capture helpers, not production routes. The normal .env and public/hot were preserved.

Nessus was not used; PHPUnit and browser-driven vulnerability tests provide the documented alternative. The initial regression failure and final passing results are retained. Source hashes in `EVIDENCE/source-manifest.json` describe this packaged snapshot.
