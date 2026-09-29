<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\CalendarEvent;
use App\Models\CommunityUpdate;
use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use App\Notifications\GardenNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberBackendTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 9, 28)->startOfDay());
    }

    public function test_dashboard_shows_only_the_members_latest_activity_and_published_content(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $plot = $this->plot('A-01');
        $assignment = $this->assignment($member, $plot);
        $this->assignment($other, $this->plot('B-01'));
        $requests = collect();
        for ($i = 0; $i < 7; $i++) {
            $requests->push($this->plotRequest($member, $plot));
        }
        $this->plotRequest($other, $plot);

        $events = collect();
        $updates = collect();
        for ($i = 0; $i < 4; $i++) {
            $events->push(CalendarEvent::create([
                'title' => "Event {$i}", 'created_by' => $staff->id, 'status' => 'published',
                'starts_at' => now()->addDays($i + 1), 'ends_at' => now()->addDays($i + 1)->addHour(),
            ]));
            $updates->push(CommunityUpdate::create([
                'title' => "Update {$i}", 'body' => 'Garden news', 'status' => 'published',
                'created_by' => $staff->id, 'published_at' => now()->subDays(4 - $i),
            ]));
        }
        foreach (['draft', 'archived', 'published'] as $status) {
            CalendarEvent::create([
                'title' => 'Hidden event', 'created_by' => $staff->id, 'status' => $status,
                'starts_at' => now()->subDays(2), 'ends_at' => now()->subDay(),
            ]);
        }
        foreach (['draft', 'archived'] as $status) {
            CommunityUpdate::create([
                'title' => 'Hidden update', 'body' => 'Unpublished news', 'status' => $status,
                'created_by' => $staff->id, 'published_at' => now(),
            ]);
        }

        $this->actingAs($member)->get('/member/dashboard')->assertOk()->assertInertia(fn ($page) => $page
            ->component('member/dashboard')
            ->where('assignment.id', $assignment->id)
            ->where('assignment.garden_plot.plot_code', 'A-01')
            ->missing('assignment.user_id')
            ->has('requests', 5)
            ->where('requests.0.id', $requests->last()->id)
            ->where('requests.4.id', $requests[2]->id)
            ->has('events', 3)->where('events.0.id', $events->first()->id)
            ->has('updates', 3)->where('updates.0.id', $updates->last()->id));
    }

    public function test_new_members_receive_an_empty_dashboard_and_no_member_roster(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();
        $this->assignment($other, $this->plot('A-01'));
        $this->plotRequest($other, $this->plot('B-01'));

        $this->actingAs($member)->get('/member/dashboard')->assertInertia(fn ($page) => $page
            ->where('assignment', null)->has('requests', 0)->has('events', 0)->has('updates', 0));
        $this->get('/assignments')->assertInertia(fn ($page) => $page
            ->has('assignments.data', 0)->where('activeAssignment', null)
            ->has('members', 0)->has('availablePlots', 0));
    }

    public function test_web_and_json_submissions_share_validation_and_do_not_create_duplicates(): void
    {
        $member = User::factory()->create();
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $plot = $this->plot('A-01');
        $payload = ['garden_plot_id' => $plot->id, 'notes' => 'Vegetables for the community kitchen.'];

        $this->actingAs($member)->post('/plot-requests', [...$payload, 'notes' => 'short'])
            ->assertSessionHasErrors('notes');
        $this->postJson('/api/plot-requests', [...$payload, 'notes' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors('notes');
        $this->assertDatabaseCount('plot_requests', 0);

        $this->post('/plot-requests', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->post('/plot-requests', $payload)->assertSessionHasErrors('garden_plot_id');
        $this->postJson('/api/plot-requests', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('garden_plot_id');
        $this->assertDatabaseCount('plot_requests', 1);
        $this->assertSame(1, $staff->unreadNotifications()->count());

        $plot->update(['archived_at' => now()]);
        $this->postJson('/api/plot-requests', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('garden_plot_id');
        $this->getJson('/api/garden-plots')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_a_member_can_cancel_and_resubmit_their_pending_request(): void
    {
        $member = User::factory()->create();
        $plot = $this->plot('A-01');
        $plotRequest = $this->plotRequest($member, $plot);

        $this->actingAs($member)->post("/plot-requests/{$plotRequest->id}/cancel")
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertSame('cancelled', $plotRequest->fresh()->status->value);
        $this->getJson('/api/garden-plots')->assertJsonPath('data.0.has_pending_request', false);
        $this->postJson('/api/plot-requests', ['garden_plot_id' => $plot->id, 'notes' => 'A new request to grow vegetables.'])
            ->assertCreated();
        $this->assertDatabaseCount('plot_requests', 2);
    }

    public function test_cancellation_cannot_change_other_members_or_reviewed_requests(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();
        $plot = $this->plot('A-01');
        $otherRequest = $this->plotRequest($other, $plot);

        $this->actingAs($member)->post("/plot-requests/{$otherRequest->id}/cancel")->assertForbidden();
        $this->assertSame('pending', $otherRequest->fresh()->status->value);
        foreach (['approved', 'rejected', 'cancelled'] as $status) {
            $reviewed = $this->plotRequest($member, $plot, ['status' => $status]);
            $this->post("/plot-requests/{$reviewed->id}/cancel")->assertSessionHasErrors('request');
            $this->assertSame($status, $reviewed->fresh()->status->value);
        }
    }

    public function test_approval_notifies_all_members_affected_and_cannot_be_replayed(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create();
        $other = User::factory()->create();
        $plot = $this->plot('A-01');
        $accepted = $this->plotRequest($member, $plot);
        $declined = $this->plotRequest($other, $plot);
        $cancelled = $this->plotRequest($other, $plot, ['status' => 'cancelled']);

        $this->actingAs($staff)->post("/plot-requests/{$accepted->id}/approve", [
            'start_date' => '2026-09-28', 'decision_notes' => 'Welcome to the garden.',
        ])->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('plot_requests', ['id' => $accepted->id, 'status' => 'approved', 'decision_notes' => 'Welcome to the garden.']);
        $this->assertDatabaseHas('plot_requests', ['id' => $declined->id, 'status' => 'rejected', 'reviewed_by' => $staff->id]);
        $this->assertSame('cancelled', $cancelled->fresh()->status->value);
        $this->assertSame('/assignments', $member->unreadNotifications()->firstOrFail()->data['url']);
        $this->assertSame('/plot-requests', $other->unreadNotifications()->firstOrFail()->data['url']);

        $this->post("/plot-requests/{$accepted->id}/approve", ['start_date' => '2026-09-28'])->assertUnprocessable();
        $this->post("/plot-requests/{$accepted->id}/reject", ['decision_notes' => 'Changed mind'])->assertUnprocessable();
        $this->assertDatabaseCount('plot_assignments', 1);
        $this->assertSame(1, $member->unreadNotifications()->count());
    }

    public function test_requests_cannot_be_approved_for_archived_plots_or_ineligible_members(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create();
        $plot = $this->plot('A-01');
        $plotRequest = $this->plotRequest($member, $plot);
        $this->actingAs($staff);

        $plot->update(['archived_at' => now()]);
        $this->post("/plot-requests/{$plotRequest->id}/approve", ['start_date' => '2026-09-28'])->assertUnprocessable();
        $plot->update(['archived_at' => null]);
        $member->update(['is_active' => false]);
        $this->post("/plot-requests/{$plotRequest->id}/approve", ['start_date' => '2026-09-28'])->assertUnprocessable();
        $member->update(['is_active' => true, 'role' => UserRole::Staff]);
        $this->post("/plot-requests/{$plotRequest->id}/approve", ['start_date' => '2026-09-28'])->assertUnprocessable();

        $this->assertDatabaseCount('plot_assignments', 0);
        $this->assertSame('pending', $plotRequest->fresh()->status->value);
        $this->assertSame('available', $plot->fresh()->status->value);
    }

    public function test_one_active_assignment_is_enforced_for_requests_and_direct_assignments(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create();
        $this->assignment($member, $this->plot('A-01'));
        $plot = $this->plot('B-01');
        $plotRequest = $this->plotRequest($member, $plot);

        $this->actingAs($staff)->post("/plot-requests/{$plotRequest->id}/approve", ['start_date' => '2026-09-28'])->assertUnprocessable();
        $this->post('/assignments', ['user_id' => $member->id, 'garden_plot_id' => $plot->id, 'start_date' => '2026-09-28'])->assertUnprocessable();
        $this->assertDatabaseCount('plot_assignments', 1);
        $this->assertSame('available', $plot->fresh()->status->value);
    }

    public function test_closing_an_assignment_releases_the_plot_without_affecting_its_next_assignment(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create();
        $other = User::factory()->create();
        $plot = $this->plot('A-01');
        $assignment = $this->assignment($member, $plot);

        $this->actingAs($staff)->post("/assignments/{$assignment->id}/close", ['status' => 'ended', 'end_date' => '2026-09-28'])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertSame('available', $plot->fresh()->status->value);
        $this->assertSame(1, $member->unreadNotifications()->count());
        $this->post('/assignments', ['user_id' => $other->id, 'garden_plot_id' => $plot->id, 'start_date' => '2026-09-28'])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->post("/assignments/{$assignment->id}/close", ['status' => 'ended', 'end_date' => '2026-09-28'])->assertUnprocessable();
        $this->assertSame('occupied', $plot->fresh()->status->value);
        $this->assertSame(1, $plot->assignments()->where('status', 'active')->count());
    }

    public function test_planting_dates_respect_the_assignment_end_date(): void
    {
        $member = User::factory()->create();
        $assignment = $this->assignment($member, $this->plot('A-01'));
        $assignment->update(['end_date' => '2026-09-25']);
        $crop = Crop::create(['name' => 'Basil', 'type' => 'herb']);

        $this->actingAs($member)->post("/assignments/{$assignment->id}/plantings", ['crop_id' => $crop->id, 'planted_at' => '2026-09-26'])
            ->assertSessionHasErrors('planted_at');
        $this->assertDatabaseCount('plantings', 0);
        $this->post("/assignments/{$assignment->id}/plantings", ['crop_id' => $crop->id, 'planted_at' => '2026-09-25'])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseCount('plantings', 1);
    }

    public function test_members_can_only_read_their_own_notifications(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();
        $member->notify(new GardenNotification('Your plot request was reviewed.', '/plot-requests'));
        $other->notify(new GardenNotification('Private notification.', '/assignments'));
        $ownNotification = $member->unreadNotifications()->firstOrFail();
        $otherNotification = $other->unreadNotifications()->firstOrFail();

        $this->actingAs($member)->post("/notifications/{$otherNotification->id}/read")->assertNotFound();
        $this->post("/notifications/{$ownNotification->id}/read")->assertRedirect('/plot-requests');
        $this->assertNotNull($ownNotification->fresh()->read_at);
        $member->notify(new GardenNotification('New garden event.', '/garden-calendar'));
        $this->post('/notifications/read-all')->assertRedirect();
        $this->assertSame(0, $member->unreadNotifications()->count());
        $this->assertNull($otherNotification->fresh()->read_at);
    }

    public function test_suspended_members_cannot_read_or_write_member_data(): void
    {
        $member = User::factory()->create(['is_active' => false]);
        $this->actingAs($member)->get('/member/dashboard')->assertRedirect('/login');
        $this->assertGuest();
        $this->actingAs($member)->postJson('/api/plot-requests', [
            'garden_plot_id' => $this->plot('A-01')->id, 'notes' => 'Vegetables for our family meals.',
        ])->assertRedirect('/login');
        $this->assertDatabaseCount('plot_requests', 0);
    }

    private function plot(string $code): GardenPlot
    {
        return GardenPlot::create(['plot_code' => $code, 'location' => 'North Garden', 'size' => 12, 'status' => 'available']);
    }

    private function plotRequest(User $member, GardenPlot $plot, array $attributes = []): PlotRequest
    {
        return PlotRequest::create([
            'user_id' => $member->id, 'garden_plot_id' => $plot->id,
            'status' => 'pending', 'notes' => 'Vegetables for our family meals.', ...$attributes,
        ]);
    }

    private function assignment(User $member, GardenPlot $plot): PlotAssignment
    {
        $plot->update(['status' => 'occupied']);

        return PlotAssignment::create([
            'user_id' => $member->id, 'garden_plot_id' => $plot->id, 'start_date' => '2026-09-01', 'status' => 'active',
        ]);
    }
}
