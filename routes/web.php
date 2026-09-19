<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GardenPlotController;
use App\Http\Controllers\PlotRequestController;
use App\Http\Controllers\WorkspaceController;
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

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/garden-plots', [GardenPlotController::class, 'index'])->name('garden-plots.index');
        Route::post('/plot-requests', [PlotRequestController::class, 'store'])
            ->middleware('role:member')
            ->name('plot-requests.store');
    });

    Route::get('/{page}', [WorkspaceController::class, 'show'])
        ->whereIn('page', [
            'garden-plots',
            'plot-requests',
            'assignments',
            'garden-calendar',
            'community-updates',
            'reports',
            'members',
            'help',
            'settings',
        ])
        ->name('workspace.page');
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
