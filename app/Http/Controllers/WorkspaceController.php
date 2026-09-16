<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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

    private const PAGE_ROLES = [
        'garden-plots' => ['member', 'staff', 'admin'],
        'plot-requests' => ['member', 'staff', 'admin'],
        'assignments' => ['member', 'staff', 'admin'],
        'garden-calendar' => ['member', 'staff', 'admin'],
        'community-updates' => ['member', 'staff', 'admin'],
        'reports' => ['staff', 'admin'],
        'members' => ['admin'],
        'help' => ['member', 'staff', 'admin'],
        'settings' => ['member', 'staff', 'admin'],
    ];

    private const MEMBER_PAGES = [
        'garden-plots' => ['title' => 'Garden plots', 'description' => 'Browse available plots and view how they are currently used.'],
        'plot-requests' => ['title' => 'My plot requests', 'description' => 'Submit and track your requests for a community garden plot.'],
        'assignments' => ['title' => 'My assignments', 'description' => 'View your current plot assignment and renewal dates.'],
        'garden-calendar' => ['title' => 'Garden calendar', 'description' => 'View upcoming events, maintenance, and shared work days.'],
        'community-updates' => ['title' => 'Community updates', 'description' => 'Read the latest news from the community garden.'],
    ];

    public function show(Request $request, string $page): Response
    {
        abort_unless(array_key_exists($page, self::PAGES), 404);
        abort_unless(in_array($request->user()->role->value, self::PAGE_ROLES[$page], true), 403);

        $content = $request->user()->role->value === 'member'
            ? self::MEMBER_PAGES[$page] ?? self::PAGES[$page]
            : self::PAGES[$page];

        return Inertia::render('workspace-page', [
            ...$content,
            'page' => $page,
        ]);
    }
}
