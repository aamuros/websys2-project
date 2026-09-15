<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_open_the_shared_dashboard(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('dashboard'));
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
