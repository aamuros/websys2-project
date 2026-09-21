# Community Garden Management System — Submission Package

This folder contains the complete Web Systems 2 submission.

## Contents

- `PROJECT/` — runnable Laravel, React, TypeScript, CSS, assets, database migrations, backend endpoints, and tests
- `DOCUMENTATION/API_NOTES.md` — endpoint and AJAX/Inertia integration notes
- `DOCUMENTATION/SUBMISSION_CHECKLIST.md` — verified submission checklist
- `DOCUMENTATION/MEMBER_CONTRIBUTIONS.md` — contribution/rating template for the leader or assistant leader
- `SCREENSHOTS/` — desktop, mobile, validation, filter, and server-generated-content evidence

## Run the project

Requirements: PHP 8.4, Composer 2, Node.js 22.12+ (Node 24 recommended), and npm.

```powershell
cd PROJECT
composer install
npm ci
Copy-Item .env.local.example .env
php artisan key:generate
New-Item -ItemType File database/database.sqlite -Force
```

Set these values in `.env`:

```dotenv
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
SESSION_CONNECTION=sqlite
```

Then initialize and run:

```powershell
php artisan migrate --seed
php artisan serve
```

In another terminal:

```powershell
npm.cmd run dev
```

Open `http://localhost:8000`.

Development accounts all use `Garden123!`:

- `admin@garden.test`
- `staff@garden.test`
- `member@garden.test`
