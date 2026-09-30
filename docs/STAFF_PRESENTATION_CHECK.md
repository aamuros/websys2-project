# Staff presentation check

Checked on September 30, 2026, using Chromium in Asia/Manila and a separate seeded SQLite database. Presentation records and account credentials in the project database were not changed.

The tested staff workflows pass after the fixes below. The normal local presentation environment still needs Docker and Supabase running; the database readiness check could not connect to the Docker daemon.

## Browser results

| Area | Verified behavior | Result |
| --- | --- | --- |
| Login and dashboard | Staff login redirects correctly; dashboard counts match seeded records; review link opens requests | Pass |
| Requests | Pending/rejected filters; approval creates an assignment; invalid dates and duplicate assignments show inline errors; rejection requires a reason | Pass |
| Assignments | Edit dates; close and cancel assignments; released plots can be reassigned; duplicate active assignments are blocked | Pass |
| Plot management | Create, search, edit, paginate, archive and view archived plots; occupied plots remain protected with readable error messages | Pass |
| Plot gallery | Authenticated plot API returns records; staff management link is available | Pass |
| Crops | Create and edit crops; harvest estimates persist; crop-type filtering works | Pass |
| Calendar | List view, previous/next week, Today, forecast API, date selection, event validation, create/edit/publish/archive, and published-event visibility | Pass |
| Event timezones | 09:00–11:00 Manila stays 09:00–11:00; editing to 10:00–12:00 keeps the new local times | Pass |
| Community updates | Create, edit, publish, search, read, archive and archived-status filtering | Pass |
| Settings and help | Profile saves; current-password validation; new password works at login; test credentials restored; help search and empty state | Pass |
| Permissions and logout | Staff receives 403 for admin/member-only pages; protected dashboard redirects to login after logout | Pass |
| Mobile | At 390 × 844, plots and calendar have no document overflow; mobile menu exposes staff links and navigates correctly | Pass |
| Member notifications | Member sees the approved request; notification opens assignments; marking all read clears unread count | Pass |

## Fixes

- Expected request/assignment conflicts now return form validation messages instead of an Inertia error overlay. Database state and transaction guards remain enforced.
- Occupied-plot edits show a status error; archiving an occupied plot shows a readable message and preserves its assignment.
- Event inputs submit timezone-aware timestamps; Laravel normalizes them to UTC; edit fields convert stored timestamps back to browser-local time.
- The calendar date-range button opens a date picker and displays the week containing the selected date.
- Opening another plot or event form clears previous validation messages.

Existing event timestamps were not rewritten. Review any events entered before the timezone fix if their intended local times were different.

Changed application files:

- `app/Http/Controllers/AssignmentController.php`
- `app/Http/Controllers/PlotRequestController.php`
- `app/Http/Controllers/GardenPlotController.php`
- `app/Http/Controllers/CalendarEventController.php`
- `resources/js/pages/garden-plots.tsx`
- `resources/js/components/content-manager.tsx`
- `resources/js/components/garden-calendar-workspace.tsx`

Regression coverage is in `tests/Feature/MemberBackendTest.php` and `tests/Feature/OperationalWorkflowTest.php`. Browser scripts and dashboard/error-message screenshots are in `output/playwright/staff-*`.

## Automated verification

- 63 targeted Laravel feature tests passed: 977 assertions.
- `npm run typecheck` passed.
- `npm run build` passed, with existing bundle-size and dependency directive warnings.
- PHP Pint passed for the changed controllers and tests.
- `git diff --check` passed.

```bash
php artisan test --compact --filter='OperationalWorkflowTest|WorkspaceNavigationTest|RoleAuthorizationTest|MemberBackendTest|CropPlantingTest|CropCycleForecastTest|CommunityUpdatesTest|GardenPlotApiTest|AuthenticationTest'
```

The browser checks used SQLite. A running Supabase PostgreSQL environment and the hosted deployment were not verified. External weather-provider availability was not part of the result.

## Presentation preparation

1. Start OrbStack or Docker Desktop.
2. Run `composer db:start`, then `composer run dev` from the project directory.
3. Open `http://localhost:8000` and sign in with `staff@garden.test` / `Garden123!` for local seeded data.
4. Approve Paolo Mendoza's request for B-02 for the approval demonstration. The seeded Garden Member already has an active assignment, so approving that member's pending request should display the new validation message.
5. Show the new assignment, edit or close it, then demonstrate plot/crop management and event publishing.

If local fixture accounts are missing, `php artisan db:seed` adds development examples without resetting the database. Avoid resetting the presentation database just to rehearse.
