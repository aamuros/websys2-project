<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\PlotRequestStatus;
use App\Enums\UserRole;
use App\Models\CalendarEvent;
use App\Models\GardenPlot;
use App\Models\PlotRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_pages_are_limited_by_role(): void
    {
        $access = [
            UserRole::Member->value => [
                'garden-plots', 'plot-requests', 'assignments', 'garden-calendar',
                'community-updates', 'help', 'settings',
            ],
            UserRole::Staff->value => [
                'garden-plots', 'plot-requests', 'assignments', 'garden-calendar',
                'community-updates', 'help', 'settings',
            ],
            UserRole::Admin->value => [
                'community-updates', 'reports', 'members', 'help', 'settings',
            ],
        ];
        $pages = ['garden-plots', 'plot-requests', 'assignments', 'garden-calendar', 'community-updates', 'reports', 'members', 'help', 'settings'];

        foreach (UserRole::cases() as $role) {
            $user = User::factory()->create(['role' => $role]);

            foreach ($pages as $page) {
                $response = $this->actingAs($user)->get('/'.$page);

                if (in_array($page, $access[$role->value], true)) {
                    $component = in_array($page, ['garden-plots', 'garden-calendar'], true) || ($role === UserRole::Member && $page === 'plot-requests')
                        ? 'workspace-page'
                        : $page;
                    $response->assertOk()->assertInertia(fn ($inertia) => $inertia->component($component));
                } else {
                    $response->assertForbidden();
                }
            }
        }
    }

    public function test_calendar_workspace_receives_the_complete_published_schedule_for_both_roles(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        for ($index = 0; $index < 12; $index++) {
            CalendarEvent::create([
                'title' => "Published event {$index}", 'status' => 'published', 'created_by' => $staff->id,
                'starts_at' => now()->addDays($index)->setTime(9, 0),
                'ends_at' => now()->addDays($index)->setTime(10, 0),
            ]);
        }
        foreach (['draft', 'archived'] as $status) {
            CalendarEvent::create([
                'title' => "Hidden {$status} event", 'status' => $status, 'created_by' => $staff->id,
                'starts_at' => now()->setTime(11, 0), 'ends_at' => now()->setTime(12, 0),
            ]);
        }

        foreach ([$member, $staff] as $user) {
            $this->actingAs($user)->get('/garden-calendar')->assertOk()->assertInertia(fn ($page) => $page
                ->component('workspace-page')->where('page', 'garden-calendar')
                ->has('calendarEvents', 12)
                ->where('calendarEvents.0.title', 'Published event 0')
                ->where('calendarEvents.11.title', 'Published event 11')
                ->where('manageEventsHref', $user->role === UserRole::Staff ? '/garden-calendar?view=manage' : null));
        }

        $this->actingAs($staff)->get('/garden-calendar?view=manage&status=draft')->assertOk()->assertInertia(fn ($page) => $page
            ->component('garden-calendar')->has('events.data', 1)
            ->where('events.data.0.status', 'draft')->where('filters.status', 'draft'));
    }

    public function test_staff_plot_management_remains_available_alongside_the_original_gallery(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        GardenPlot::create(['plot_code' => 'A-01', 'location' => 'North Garden', 'size' => 12, 'status' => GardenPlotStatus::Available]);
        GardenPlot::create(['plot_code' => 'A-02', 'location' => 'North Garden', 'size' => 12, 'status' => GardenPlotStatus::Maintenance]);

        $this->actingAs($staff)->get('/garden-plots')->assertOk()->assertInertia(fn ($page) => $page
            ->component('workspace-page')->where('page', 'garden-plots'));
        $this->get('/garden-plots?view=manage&status=available&search=A-01')->assertOk()->assertInertia(fn ($page) => $page
            ->component('garden-plots')->has('plots.data', 1)->where('plots.data.0.plot_code', 'A-01')
            ->where('filters.status', 'available')->where('filters.search', 'A-01'));
    }

    public function test_members_keep_the_original_workspaces_when_a_management_view_is_requested(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);

        $this->actingAs($member)->get('/garden-calendar?view=manage')->assertOk()->assertInertia(fn ($page) => $page
            ->component('workspace-page')->where('page', 'garden-calendar')->where('manageEventsHref', null));
        $this->get('/garden-plots?view=manage')->assertOk()->assertInertia(fn ($page) => $page
            ->component('workspace-page')->where('page', 'garden-plots'));
    }

    public function test_member_pages_use_personal_labels(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);

        $this->actingAs($member)
            ->get('/plot-requests')
            ->assertInertia(fn ($page) => $page->component('workspace-page')->where('title', 'My plot requests'));

        $this->actingAs($member)
            ->get('/assignments')
            ->assertInertia(fn ($page) => $page->component('assignments'));
    }

    public function test_member_plot_requests_page_receives_only_their_request_details(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $plot = GardenPlot::create([
            'plot_code' => 'A-01',
            'location' => 'North Garden',
            'size' => 12,
            'status' => GardenPlotStatus::Available,
        ]);

        PlotRequest::create([
            'user_id' => $member->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Pending,
            'notes' => 'Vegetables for our household and neighbors.',
        ]);
        PlotRequest::create([
            'user_id' => $otherMember->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Rejected,
            'notes' => 'This request must not appear for the signed-in member.',
        ]);

        $this->actingAs($member)
            ->get('/plot-requests')
            ->assertInertia(fn ($page) => $page
                ->has('plotRequests', 1)
                ->where('plotRequests.0.status', 'pending')
                ->where('plotRequests.0.decision_notes', null)
                ->where('plotRequests.0.reviewed_at', null)
                ->where('plotRequests.0.plot.plot_code', 'A-01')
                ->where('plotRequests.0.plot.location', 'North Garden'));
    }

    public function test_member_can_read_the_staff_decision_for_their_request(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $plot = GardenPlot::create([
            'plot_code' => 'B-01',
            'location' => 'South Garden',
            'size' => 8,
            'status' => GardenPlotStatus::Available,
        ]);
        $plotRequest = PlotRequest::create([
            'user_id' => $member->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Pending,
            'notes' => 'I plan to grow vegetables.',
        ]);

        $this->actingAs($staff)
            ->post("/plot-requests/{$plotRequest->id}/reject", ['decision_notes' => 'Please choose a larger plot for these crops.'])
            ->assertRedirect();

        $this->actingAs($member)
            ->get('/plot-requests')
            ->assertInertia(fn ($page) => $page
                ->has('plotRequests', 1)
                ->where('plotRequests.0.status', 'rejected')
                ->where('plotRequests.0.decision_notes', 'Please choose a larger plot for these crops.')
                ->where('plotRequests.0.reviewed_at', $plotRequest->fresh()->reviewed_at->toIso8601String()));
    }

    public function test_member_can_cancel_their_pending_request_and_see_the_updated_history(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $plot = GardenPlot::create([
            'plot_code' => 'C-01',
            'location' => 'West Garden',
            'size' => 10,
            'status' => GardenPlotStatus::Available,
        ]);
        $plotRequest = PlotRequest::create([
            'user_id' => $member->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Pending,
        ]);

        $this->actingAs($member)
            ->from('/plot-requests')
            ->post("/plot-requests/{$plotRequest->id}/cancel")
            ->assertRedirect('/plot-requests')
            ->assertSessionHas('success', 'Request cancelled.');

        $this->get('/plot-requests')
            ->assertInertia(fn ($page) => $page
                ->has('plotRequests', 1)
                ->where('plotRequests.0.status', 'cancelled')
                ->where('plotRequests.0.reviewed_at', null));
        $this->assertSame(GardenPlotStatus::Available, $plot->fresh()->status);
        $this->post("/plot-requests/{$plotRequest->id}/cancel")->assertSessionHasErrors('request');
    }

    public function test_member_cannot_cancel_another_members_request(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $plot = GardenPlot::create([
            'plot_code' => 'D-01',
            'location' => 'East Garden',
            'size' => 10,
            'status' => GardenPlotStatus::Available,
        ]);
        $plotRequest = PlotRequest::create([
            'user_id' => $otherMember->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Pending,
        ]);

        $this->actingAs($member)->post("/plot-requests/{$plotRequest->id}/cancel")->assertForbidden();
        $this->assertSame(PlotRequestStatus::Pending, $plotRequest->fresh()->status);
    }

    public function test_workspace_pages_require_authentication(): void
    {
        $this->get('/garden-plots')->assertRedirect('/login');
    }
}
