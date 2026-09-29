<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\GardenPlot;
use App\Models\PlotRequest;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class Phase4SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_val01_empty_login_fields_are_rejected(): void
    {
        $this->postJson('/login', [])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->assertGuest();
    }

    public function test_val02_invalid_email_is_rejected(): void
    {
        $this->postJson('/login', ['email' => 'abc', 'password' => 'Garden123!'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_val03_single_character_registration_name_is_rejected(): void
    {
        $this->postJson('/register', $this->registration(['name' => 'A']))
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_val04_duplicate_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'phase4@example.test']);
        $this->postJson('/register', $this->registration())
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseCount('users', 1);
    }

    public function test_val05_short_password_is_rejected(): void
    {
        $this->postJson('/register', $this->registration(['password' => 'short', 'password_confirmation' => 'short']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_val06_password_confirmation_must_match(): void
    {
        $this->postJson('/register', $this->registration(['password_confirmation' => 'Mismatch123!']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_val07_plot_size_must_be_positive_and_status_must_be_valid(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $this->actingAs($staff)->postJson('/garden-plots', [
            'plot_code' => 'V-01', 'location' => 'North', 'size' => -1, 'status' => 'invalid',
        ])->assertUnprocessable()->assertJsonValidationErrors(['size', 'status']);
        $this->assertDatabaseCount('garden_plots', 0);
    }

    public function test_val08_request_notes_enforce_both_length_limits(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $plot = $this->plot();
        foreach (['', 'short', str_repeat('x', 501)] as $notes) {
            $this->actingAs($member)->postJson('/api/plot-requests', ['garden_plot_id' => $plot->id, 'notes' => $notes])
                ->assertUnprocessable()->assertJsonValidationErrors('notes');
        }
        $this->assertDatabaseCount('plot_requests', 0);
    }

    public function test_val09_event_end_must_be_after_start(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $this->actingAs($staff)->postJson('/garden-calendar', [
            'title' => 'Invalid event', 'starts_at' => '2026-09-29 10:00',
            'ends_at' => '2026-09-29 09:00', 'status' => 'draft',
        ])->assertUnprocessable()->assertJsonValidationErrors('ends_at');
        $this->assertDatabaseCount('calendar_events', 0);
    }

    public function test_sql01_injection_in_login_email_is_rejected(): void
    {
        User::factory()->create();
        $this->postJson('/login', ['email' => "' OR '1'='1' --", 'password' => 'anything'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_sql02_tautology_in_password_cannot_bypass_login(): void
    {
        $user = User::factory()->create(['password' => 'Garden123!']);
        $this->postJson('/login', ['email' => $user->email, 'password' => "' OR 1=1 --"])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_sql03_union_payload_cannot_bypass_login(): void
    {
        $user = User::factory()->create(['password' => 'Garden123!']);
        $this->postJson('/login', ['email' => $user->email, 'password' => "' UNION SELECT 1,2,3 --"])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_sql04_search_payload_is_bound_as_data_and_returns_no_extra_rows(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $this->plot();
        $payload = "' OR 1=1 --";
        $queries = [];
        DB::listen(function (QueryExecuted $query) use (&$queries): void {
            $queries[] = $query;
        });
        $this->actingAs($staff)->get('/garden-plots?'.http_build_query(['view' => 'manage', 'search' => $payload]))
            ->assertOk()->assertInertia(fn ($page) => $page->has('plots.data', 0)->where('plots.total', 0));
        $bound = array_filter($queries, fn ($query) => in_array('%'.$payload.'%', $query->bindings, true));
        $this->assertNotEmpty($bound, 'The search payload must be a bound value.');
        foreach ($bound as $query) {
            $this->assertStringNotContainsString($payload, $query->sql);
            $this->assertStringContainsString('?', $query->sql);
        }
        $this->assertDatabaseCount('garden_plots', 1);
    }

    public function test_sql05_stacked_statement_in_plot_code_is_saved_as_literal_text(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $payload = "T'); DROP TABLE users;--";
        $queries = [];
        DB::listen(function (QueryExecuted $query) use (&$queries): void {
            $queries[] = $query;
        });
        $this->actingAs($staff)->post('/garden-plots', [
            'plot_code' => $payload, 'location' => 'Test bed', 'size' => 10, 'status' => 'available',
        ])->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('garden_plots', ['plot_code' => $payload]);
        $this->assertDatabaseCount('users', 1);
        $bound = array_filter($queries, fn ($query) => in_array($payload, $query->bindings, true));
        $this->assertNotEmpty($bound);
        foreach ($bound as $query) {
            $this->assertStringNotContainsString($payload, $query->sql);
        }
    }

    public function test_sql06_injection_in_numeric_plot_id_is_rejected(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $this->plot();
        $this->actingAs($member)->postJson('/api/plot-requests', [
            'garden_plot_id' => '1 OR 1=1', 'notes' => 'A valid length request note.',
        ])->assertUnprocessable()->assertJsonValidationErrors('garden_plot_id');
        $this->assertDatabaseCount('plot_requests', 0);
    }

    public function test_sql07_legitimate_apostrophes_are_preserved(): void
    {
        $this->post('/register', $this->registration(['name' => "Maria O'Brien"]))
            ->assertSessionHasNoErrors()->assertRedirect('/member/dashboard');
        $this->assertDatabaseHas('users', ['name' => "Maria O'Brien"]);
    }

    public function test_auth01_login_rotates_session_and_logout_clears_access(): void
    {
        $user = User::factory()->create(['password' => 'Garden123!']);
        $this->get('/login');
        $guestSession = session()->getId();
        $this->post('/login', ['email' => $user->email, 'password' => 'Garden123!'])
            ->assertRedirect('/member/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertNotSame($guestSession, session()->getId());
        $authenticatedSession = session()->getId();
        $token = session()->token();
        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
        $this->assertNotSame($authenticatedSession, session()->getId());
        $this->assertNotSame($token, session()->token());
        $this->get('/member/dashboard')->assertRedirect('/login');
    }

    public function test_auth02_login_is_throttled_after_five_failed_attempts(): void
    {
        $user = User::factory()->create(['password' => 'Garden123!']);
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', ['email' => $user->email, 'password' => 'incorrect'])
                ->assertUnprocessable()->assertJsonPath('errors.email.0', __('auth.failed'));
        }
        $response = $this->postJson('/login', ['email' => $user->email, 'password' => 'Garden123!'])
            ->assertUnprocessable();
        $this->assertStringContainsString('Too many login attempts', $response->json('errors.email.0'));
        $this->assertGuest();
    }

    public function test_auth03_suspended_account_cannot_login(): void
    {
        $user = User::factory()->create(['is_active' => false, 'password' => 'Garden123!']);
        $this->postJson('/login', ['email' => $user->email, 'password' => 'Garden123!'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_auth04_suspension_invalidates_existing_session(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get('/member/dashboard')->assertOk();
        $sessionId = session()->getId();
        $user->update(['is_active' => false]);
        $this->get('/member/dashboard')->assertRedirect('/login')->assertSessionHas('error', 'Your account is suspended.');
        $this->assertGuest();
        $this->assertNotSame($sessionId, session()->getId());
        $this->assertNotEmpty(session()->token(), 'A fresh CSRF token must be available after forced logout.');
    }

    public function test_auth05_password_change_requires_current_password(): void
    {
        $user = User::factory()->create(['password' => 'Garden123!']);
        $this->actingAs($user)->putJson('/settings/password', [
            'current_password' => 'incorrect', 'password' => 'Changed123!', 'password_confirmation' => 'Changed123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check('Garden123!', $user->fresh()->password));
    }

    public function test_auth06_anonymous_json_access_requires_authentication(): void
    {
        $this->getJson('/api/garden-plots')->assertUnauthorized();
        $this->postJson('/api/plot-requests', [])->assertUnauthorized();
    }

    public function test_role01_registration_cannot_assign_admin_or_staff(): void
    {
        $this->post('/register', $this->registration(['role' => 'admin', 'is_active' => false]))
            ->assertRedirect('/member/dashboard');
        $user = User::firstOrFail();
        $this->assertSame(UserRole::Member, $user->role);
        $this->assertTrue($user->is_active);
    }

    public function test_role02_member_cannot_promote_themselves(): void
    {
        $user = User::factory()->create(['role' => UserRole::Member]);
        $this->actingAs($user)->putJson('/members/'.$user->id, ['role' => 'staff', 'is_active' => true])
            ->assertForbidden();
        $this->assertSame(UserRole::Member, $user->fresh()->role);
    }

    public function test_role03_staff_cannot_modify_member_access(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $this->actingAs($staff)->putJson('/members/'.$member->id, ['role' => 'staff', 'is_active' => false])
            ->assertForbidden();
        $this->assertSame(UserRole::Member, $member->fresh()->role);
        $this->assertTrue($member->fresh()->is_active);
    }

    public function test_role04_member_cannot_approve_their_own_request(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $request = PlotRequest::create([
            'user_id' => $member->id, 'garden_plot_id' => $this->plot()->id,
            'notes' => 'Grow vegetables for the community.', 'status' => 'pending',
        ]);
        $this->actingAs($member)->postJson('/plot-requests/'.$request->id.'/approve', ['start_date' => '2026-09-29'])
            ->assertForbidden();
        $this->assertDatabaseHas('plot_requests', ['id' => $request->id, 'status' => 'pending']);
        $this->assertDatabaseCount('plot_assignments', 0);
    }

    public function test_xss01_profile_script_is_preserved_as_data_and_escaped_in_html(): void
    {
        $member = User::factory()->create();
        $payload = '<script>window.__phase4Xss=1</script>';
        $this->actingAs($member)->put('/settings/profile', ['name' => $payload, 'email' => $member->email])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $member->id, 'name' => $payload]);
        $this->get('/settings')->assertOk()->assertDontSee($payload, false)
            ->assertInertia(fn ($page) => $page->where('auth.user.name', $payload));
    }

    public function test_xss02_announcement_event_handler_is_transported_as_data(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $payload = '<img src=x onerror="window.__phase4Xss=2">';
        $this->actingAs($staff)->post('/community-updates', ['title' => 'XSS test', 'body' => $payload, 'status' => 'published'])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('community_updates', ['body' => $payload]);
        $this->actingAs($member)->get('/community-updates')->assertOk()->assertDontSee($payload, false)
            ->assertInertia(fn ($page) => $page->where('updates.data.0.body', $payload));
    }

    public function test_xss03_reflected_search_is_escaped_in_initial_html(): void
    {
        $member = User::factory()->create();
        $payload = '<svg onload="window.__phase4Xss=3">';
        $this->actingAs($member)->get('/community-updates?'.http_build_query(['search' => $payload]))
            ->assertOk()->assertDontSee($payload, false)
            ->assertInertia(fn ($page) => $page->where('filters.search', $payload)->has('updates.data', 0));
    }

    private function registration(array $overrides = []): array
    {
        return [...[
            'name' => 'Phase Four Gardener', 'email' => 'phase4@example.test',
            'password' => 'Garden123!', 'password_confirmation' => 'Garden123!',
        ], ...$overrides];
    }

    private function plot(): GardenPlot
    {
        return GardenPlot::create(['plot_code' => 'T-01', 'location' => 'North', 'size' => 10, 'status' => 'available']);
    }
}
