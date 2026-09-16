<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        return redirect()->route($request->user()->dashboardRouteName());
    }

    public function member(): Response
    {
        return Inertia::render('member/dashboard');
    }

    public function staff(): Response
    {
        return Inertia::render('staff/dashboard');
    }

    public function admin(): Response
    {
        return Inertia::render('admin/dashboard');
    }
}
