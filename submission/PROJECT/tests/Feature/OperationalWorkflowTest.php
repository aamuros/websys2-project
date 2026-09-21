<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\CalendarEvent;
use App\Models\GardenPlot;
use App\Models\PlotRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OperationalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_request_can_be_approved_into_an_assignment(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $plot = GardenPlot::create(['plot_code' => 'A-10', 'location' => 'North', 'size' => 12, 'status' => GardenPlotStatus::Available]);

        $this->actingAs($member)->post('/plot-requests', ['garden_plot_id' => $plot->id, 'notes' => 'Herbs'])->assertRedirect();
        $plotRequest = PlotRequest::firstOrFail();
        $this->actingAs($staff)->post("/plot-requests/{$plotRequest->id}/approve", ['start_date' => '2026-09-22'])->assertRedirect();

        $this->assertDatabaseHas('plot_requests', ['id' => $plotRequest->id, 'status' => 'approved', 'reviewed_by' => $staff->id]);
        $this->assertDatabaseHas('plot_assignments', ['user_id' => $member->id, 'garden_plot_id' => $plot->id, 'status' => 'active']);
        $this->assertDatabaseHas('garden_plots', ['id' => $plot->id, 'status' => 'occupied']);
        $this->assertNotEmpty($member->fresh()->notifications);
    }

    public function test_members_cannot_manage_operational_records(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $this->actingAs($member)->post('/garden-plots', ['plot_code' => 'X', 'location' => 'X', 'size' => 1, 'status' => 'available'])->assertForbidden();
        $this->actingAs($member)->get('/reports')->assertForbidden();
        $this->actingAs($member)->get('/members')->assertForbidden();
    }

    public function test_admin_can_suspend_a_member_and_the_member_cannot_sign_in(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $member = User::factory()->create(['role' => UserRole::Member, 'password' => Hash::make('password')]);
        $this->actingAs($admin)->put("/members/{$member->id}", ['role' => 'member', 'is_active' => false])->assertRedirect();
        $this->post('/logout');
        $this->post('/login', ['email' => $member->email, 'password' => 'password'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_staff_can_publish_an_event_and_notify_active_users(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $event = CalendarEvent::create(['title' => 'Work day', 'starts_at' => '2026-09-25 08:00', 'ends_at' => '2026-09-25 10:00', 'status' => 'draft', 'created_by' => $staff->id]);
        $this->actingAs($staff)->post("/garden-calendar/{$event->id}/publish")->assertRedirect();
        $this->assertDatabaseHas('calendar_events', ['id' => $event->id, 'status' => 'published']);
        $this->assertSame(1, $member->fresh()->unreadNotifications()->count());
    }

    public function test_users_can_update_their_profile_and_password(): void
    {
        $member = User::factory()->create(['password' => Hash::make('old-password')]);
        $this->actingAs($member)->put('/settings/profile', ['name' => 'Updated Gardener', 'email' => 'updated@example.com'])->assertRedirect();
        $this->put('/settings/password', ['current_password' => 'old-password', 'password' => 'new-password', 'password_confirmation' => 'new-password'])->assertRedirect();
        $this->assertTrue(Hash::check('new-password', $member->fresh()->password));
    }

    public function test_staff_can_archive_an_unused_plot_without_losing_history(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $plot = GardenPlot::create(['plot_code' => 'Z-01', 'location' => 'South', 'size' => 8, 'status' => GardenPlotStatus::Available]);
        $this->actingAs($staff)->post("/garden-plots/{$plot->id}/archive")->assertRedirect();
        $this->assertNotNull($plot->fresh()->archived_at);
        $this->assertDatabaseHas('garden_plots', ['id' => $plot->id]);
    }

    public function test_operational_reports_can_be_exported_as_csv(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $this->actingAs($staff)->get('/reports/export?from=2026-09-01&to=2026-09-30')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}
