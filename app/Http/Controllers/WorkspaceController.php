<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    private const PAGES = [
        'garden-plots' => ['title' => 'Garden plots', 'description' => 'View plot availability, status, and current use.'],
        'plot-requests' => ['title' => 'Plot requests', 'description' => 'Review and track requests from community members.'],
        'assignments' => ['title' => 'Assignments', 'description' => 'Coordinate active plot assignments and renewal dates.'],
        'garden-calendar' => ['title' => 'Garden calendar', 'description' => 'Plan garden events, maintenance, and shared work days.'],
        'community-updates' => ['title' => 'Community updates', 'description' => 'Share timely garden news with the community.'],
        'reports' => ['title' => 'Reports', 'description' => 'Review garden activity and operational trends.'],
        'members' => ['title' => 'Members', 'description' => 'Manage community members and their garden access.'],
        'help' => ['title' => 'Help center', 'description' => 'Find guidance for managing the community garden.'],
        'settings' => ['title' => 'Settings', 'description' => 'Manage your account and workspace preferences.'],
    ];

    public function show(string $page): Response
    {
        abort_unless(array_key_exists($page, self::PAGES), 404);

        return Inertia::render('workspace-page', [
            ...self::PAGES[$page],
            'page' => $page,
        ]);
    }
}
