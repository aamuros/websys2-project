<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_shared_dashboard_redirects_to_the_users_role_dashboard(): void
    {
        foreach (UserRole::cases() as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user)
                ->get('/dashboard')
                ->assertRedirect('/'.$role->value.'/dashboard');
        }
    }

    public function test_role_dashboards_require_the_matching_role(): void
    {
        foreach (UserRole::cases() as $role) {
            $user = User::factory()->create(['role' => $role]);

            foreach (UserRole::cases() as $routeRole) {
                $response = $this->actingAs($user)->get('/'.$routeRole->value.'/dashboard');

                if ($role === $routeRole) {
                    $response->assertOk()->assertInertia(
                        fn ($page) => $page->component($role->value.'/dashboard'),
                    );
                } else {
                    $response->assertForbidden();
                }
            }
        }
    }
}
