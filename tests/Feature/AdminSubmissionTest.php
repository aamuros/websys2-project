<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use Database\Seeders\DevelopmentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_matches_seeded_garden_and_account_totals(): void
    {
        $this->seed(DevelopmentSeeder::class);
        $admin = User::where('email', 'admin@garden.test')->firstOrFail();
        $this->actingAs($admin)->get('/admin/dashboard')->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')->where('metrics.plots', 14)->where('metrics.available', 7)
            ->where('metrics.pending', 3)->where('metrics.assignments', 4)
            ->where('metrics.members', 7)->where('metrics.staff', 2)->where('metrics.suspended', 1));
    }

    public function test_member_directory_filters_do_not_include_admin_accounts(): void
    {
        $this->seed(DevelopmentSeeder::class);
        $this->actingAs(User::where('email', 'admin@garden.test')->firstOrFail());
        $this->get('/members')->assertInertia(fn ($page) => $page->where('members.total', 9));
        $this->get('/members?role=staff&status=active')->assertInertia(fn ($page) => $page->where('members.total', 2));
        $this->get('/members?status=suspended')->assertInertia(fn ($page) => $page->where('members.total', 1)->where('members.data.0.email', 'eric@garden.test'));
        $this->get('/members?search=rosalie')->assertInertia(fn ($page) => $page->where('members.total', 1)->where('members.data.0.email', 'rosalie@garden.test'));
    }

    public function test_role_changes_revoke_sessions_and_change_page_permissions(): void
    {
        config(['session.driver' => 'database', 'session.connection' => 'sqlite']);
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $member = User::factory()->create(['remember_token' => 'previous-token']);
        DB::table('sessions')->insert(['id' => 'member-session', 'user_id' => $member->id, 'payload' => '', 'last_activity' => now()->timestamp]);
        $this->actingAs($admin)->put("/members/{$member->id}", ['role' => 'staff', 'is_active' => true])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('sessions', ['id' => 'member-session']);
        $this->assertNotSame('previous-token', $member->fresh()->getRememberToken());
        $this->actingAs($member->fresh())->get('/staff/dashboard')->assertOk();
        $this->get('/member/dashboard')->assertForbidden();
    }

    public function test_members_with_active_assignments_cannot_be_promoted_until_the_assignment_is_closed(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $member = User::factory()->create();
        $plot = GardenPlot::create(['plot_code' => 'ADMIN-01', 'location' => 'North', 'size' => 10, 'status' => 'occupied']);
        $assignment = PlotAssignment::create(['user_id' => $member->id, 'garden_plot_id' => $plot->id, 'start_date' => now()->toDateString(), 'status' => 'active']);
        $this->actingAs($admin)->put("/members/{$member->id}", ['role' => 'staff', 'is_active' => true])->assertSessionHasErrors('role');
        $this->assertSame(UserRole::Member, $member->fresh()->role);
        $this->assertSame('active', $assignment->fresh()->status->value);
    }

    public function test_admin_accounts_and_admin_role_assignment_are_protected(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $otherAdmin = User::factory()->create(['role' => UserRole::Admin]);
        $member = User::factory()->create();
        $this->actingAs($admin)->put("/members/{$otherAdmin->id}", ['role' => 'member', 'is_active' => false])->assertForbidden();
        $this->put("/members/{$member->id}", ['role' => 'admin', 'is_active' => true])->assertSessionHasErrors('role');
        $this->assertSame(UserRole::Member, $member->fresh()->role);
    }

    public function test_suspension_and_reactivation_control_login_without_losing_member_history(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $member = User::factory()->create(['password' => 'Garden123!']);
        $this->actingAs($admin)->put("/members/{$member->id}", ['role' => 'member', 'is_active' => false])->assertRedirect();
        $this->post('/logout');
        $this->post('/login', ['email' => $member->email, 'password' => 'Garden123!'])->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->actingAs($admin)->put("/members/{$member->id}", ['role' => 'member', 'is_active' => true])->assertRedirect();
        $this->post('/logout');
        $this->post('/login', ['email' => $member->email, 'password' => 'Garden123!'])->assertRedirect('/member/dashboard');
        $this->assertDatabaseHas('users', ['id' => $member->id]);
    }

    public function test_reports_filter_by_date_and_reject_invalid_ranges(): void
    {
        $this->seed(DevelopmentSeeder::class);
        $this->actingAs(User::where('email', 'admin@garden.test')->firstOrFail());
        $this->get('/reports?from=2099-01-01&to=2099-01-31')->assertInertia(fn ($page) => $page
            ->has('requestBreakdown', 0)->has('assignmentBreakdown', 0)->where('metrics.totalPlots', 14));
        $this->from('/reports')->get('/reports?from=2026-10-01&to=2026-09-01')->assertRedirect('/reports')->assertSessionHasErrors('to');
        $this->getJson('/reports/export?from=not-a-date&to=2026-09-01')->assertUnprocessable()->assertJsonValidationErrors('from');
        $this->get('/reports?from=&to=')->assertOk();
    }

    public function test_csv_export_preserves_text_and_neutralizes_spreadsheet_formulas(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $member = User::factory()->create(['name' => '=1+1']);
        $plot = GardenPlot::create(['plot_code' => '@formula', 'location' => 'North', 'size' => 10, 'status' => 'available']);
        PlotRequest::create(['user_id' => $member->id, 'garden_plot_id' => $plot->id, 'status' => 'pending']);
        $response = $this->actingAs($admin)->get('/reports/export?from='.now()->toDateString().'&to='.now()->toDateString())
            ->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $rows = explode("\n", $response->streamedContent());
        $row = str_getcsv($rows[1], ',', '"', '');
        $this->assertSame("'=1+1", $row[1]);
        $this->assertSame("'@formula", $row[2]);
        $this->assertStringContainsString('Assignment ID', $response->streamedContent());
    }
}
