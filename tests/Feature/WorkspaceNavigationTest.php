<?php

namespace Tests\Feature;

use App\Enums\UserRole;
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
                'community-updates', 'reports', 'help', 'settings',
            ],
            UserRole::Admin->value => [
                'garden-plots', 'plot-requests', 'assignments', 'garden-calendar',
                'community-updates', 'reports', 'members', 'help', 'settings',
            ],
        ];
        $pages = ['garden-plots', 'plot-requests', 'assignments', 'garden-calendar', 'community-updates', 'reports', 'members', 'help', 'settings'];

        foreach (UserRole::cases() as $role) {
            $user = User::factory()->create(['role' => $role]);

            foreach ($pages as $page) {
                $response = $this->actingAs($user)->get('/'.$page);

                if (in_array($page, $access[$role->value], true)) {
                    $response->assertOk()->assertInertia(fn ($inertia) => $inertia
                        ->component('workspace-page')
                        ->where('page', $page));
                } else {
                    $response->assertForbidden();
                }
            }
        }
    }

    public function test_member_pages_use_personal_labels(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);

        $this->actingAs($member)
            ->get('/plot-requests')
            ->assertInertia(fn ($page) => $page->where('title', 'My plot requests'));

        $this->actingAs($member)
            ->get('/assignments')
            ->assertInertia(fn ($page) => $page->where('title', 'My assignments'));
    }

    public function test_workspace_pages_require_authentication(): void
    {
        $this->get('/garden-plots')->assertRedirect('/login');
    }
}
