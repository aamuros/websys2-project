<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\CommunityUpdate;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
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

    public function member(Request $request): Response
    {
        return Inertia::render('member/dashboard', ['assignment' => PlotAssignment::with('gardenPlot')->where('user_id', $request->user()->id)->where('status', 'active')->first(), 'requests' => PlotRequest::with('gardenPlot')->where('user_id', $request->user()->id)->latest()->limit(5)->get(), 'events' => CalendarEvent::where('status', 'published')->where('ends_at', '>=', now())->orderBy('starts_at')->limit(3)->get(), 'updates' => CommunityUpdate::where('status', 'published')->latest('published_at')->limit(3)->get()]);
    }

    public function staff(): Response
    {
        return Inertia::render('staff/dashboard', ['metrics' => $this->operationsMetrics(), 'requests' => PlotRequest::with(['user', 'gardenPlot'])->where('status', 'pending')->oldest()->limit(6)->get()]);
    }

    public function admin(): Response
    {
        return Inertia::render('admin/dashboard', ['metrics' => [...$this->operationsMetrics(), 'members' => User::where('role', 'member')->count(), 'staff' => User::where('role', 'staff')->count(), 'suspended' => User::where('is_active', false)->count()], 'requests' => PlotRequest::with(['user', 'gardenPlot'])->where('status', 'pending')->oldest()->limit(6)->get()]);
    }

    private function operationsMetrics(): array
    {
        return ['plots' => GardenPlot::whereNull('archived_at')->count(), 'available' => GardenPlot::whereNull('archived_at')->where('status', 'available')->count(), 'pending' => PlotRequest::where('status', 'pending')->count(), 'assignments' => PlotAssignment::where('status', 'active')->count()];
    }
}
