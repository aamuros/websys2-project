<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard');
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
