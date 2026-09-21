<?php

use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CalendarEventController;
use App\Http\Controllers\CommunityUpdateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GardenPlotController;
use App\Http\Controllers\HelpController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PlotRequestController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;

Route::get('/', function (): RedirectResponse {
    return redirect()->route(auth()->check() ? 'dashboard' : 'login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/garden-plots', [GardenPlotController::class, 'index'])->name('plots.index');
    Route::post('/garden-plots', [GardenPlotController::class, 'store'])->name('plots.store');
    Route::put('/garden-plots/{gardenPlot}', [GardenPlotController::class, 'update'])->name('plots.update');
    Route::post('/garden-plots/{gardenPlot}/archive', [GardenPlotController::class, 'archive'])->name('plots.archive');
    Route::get('/plot-requests', [PlotRequestController::class, 'index'])->name('requests.index');
    Route::post('/plot-requests', [PlotRequestController::class, 'store'])->name('requests.store');
    Route::post('/plot-requests/{plotRequest}/cancel', [PlotRequestController::class, 'cancel'])->name('requests.cancel');
    Route::post('/plot-requests/{plotRequest}/approve', [PlotRequestController::class, 'approve'])->name('requests.approve');
    Route::post('/plot-requests/{plotRequest}/reject', [PlotRequestController::class, 'reject'])->name('requests.reject');
    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
    Route::post('/assignments', [AssignmentController::class, 'store'])->name('assignments.store');
    Route::put('/assignments/{assignment}', [AssignmentController::class, 'update'])->name('assignments.update');
    Route::post('/assignments/{assignment}/close', [AssignmentController::class, 'close'])->name('assignments.close');
    Route::get('/garden-calendar', [CalendarEventController::class, 'index'])->name('events.index');
    Route::post('/garden-calendar', [CalendarEventController::class, 'store'])->name('events.store');
    Route::put('/garden-calendar/{event}', [CalendarEventController::class, 'update'])->name('events.update');
    Route::post('/garden-calendar/{event}/publish', [CalendarEventController::class, 'publish'])->name('events.publish');
    Route::post('/garden-calendar/{event}/archive', [CalendarEventController::class, 'archive'])->name('events.archive');
    Route::get('/community-updates', [CommunityUpdateController::class, 'index'])->name('updates.index');
    Route::post('/community-updates', [CommunityUpdateController::class, 'store'])->name('updates.store');
    Route::put('/community-updates/{communityUpdate}', [CommunityUpdateController::class, 'update'])->name('updates.update');
    Route::post('/community-updates/{communityUpdate}/publish', [CommunityUpdateController::class, 'publish'])->name('updates.publish');
    Route::post('/community-updates/{communityUpdate}/archive', [CommunityUpdateController::class, 'archive'])->name('updates.archive');
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::put('/members/{user}', [MemberController::class, 'update'])->name('members.update');
    Route::get('/help', [HelpController::class, 'index'])->name('help');
    Route::get('/settings', [SettingsController::class, 'show'])->name('settings');
    Route::put('/settings/profile', [SettingsController::class, 'profile'])->name('settings.profile');
    Route::put('/settings/password', [SettingsController::class, 'password'])->name('settings.password');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::prefix('member')->name('member.')->middleware('role:member')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'member'])->name('dashboard');
    });

    Route::prefix('staff')->name('staff.')->middleware('role:staff')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'staff'])->name('dashboard');
    });

    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'admin'])->name('dashboard');
    });
});
