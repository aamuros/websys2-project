<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_open_each_workspace_page(): void
    {
        $user = User::factory()->create();
        $pages = [
            'garden-plots',
            'plot-requests',
            'assignments',
            'garden-calendar',
            'community-updates',
            'reports',
            'members',
            'help',
            'settings',
        ];

        foreach ($pages as $page) {
            $this->actingAs($user)
                ->get('/'.$page)
                ->assertOk()
                ->assertInertia(fn ($response) => $response
                    ->component('workspace-page')
                    ->where('page', $page));
        }
    }

    public function test_workspace_pages_require_authentication(): void
    {
        $this->get('/garden-plots')->assertRedirect('/login');
    }
}
