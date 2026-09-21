<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_view_authentication_pages(): void
    {
        $this->get('/login')->assertOk()->assertInertia(fn ($page) => $page->component('auth/login'));
        $this->get('/register')->assertOk()->assertInertia(fn ($page) => $page->component('auth/register'));
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_a_user_can_register_as_a_member(): void
    {
        $response = $this->post('/register', [
            'name' => 'New Gardener',
            'email' => 'gardener@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $user = User::where('email', 'gardener@example.com')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertSame(UserRole::Member, $user->role);
        $this->assertTrue(Hash::check('password', $user->password));
        $response->assertRedirect('/member/dashboard');
    }

    public function test_users_are_redirected_to_their_role_dashboard_after_login(): void
    {
        foreach (UserRole::cases() as $role) {
            $user = User::factory()->create(['role' => $role, 'password' => 'password']);

            $this->post('/login', ['email' => $user->email, 'password' => 'password'])
                ->assertRedirect('/'.$role->value.'/dashboard');

            $this->post('/logout')->assertRedirect('/login');
            $this->assertGuest();
        }
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->post('/login', ['email' => $user->email, 'password' => 'incorrect'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }
}
