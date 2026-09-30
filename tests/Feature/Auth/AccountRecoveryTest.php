<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

class AccountRecoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_sends_verification_and_blocks_the_workspace_until_confirmed(): void
    {
        Notification::fake();
        $this->post('/register', ['name' => 'New Gardener', 'email' => 'New@Garden.test', 'password' => 'Garden123!', 'password_confirmation' => 'Garden123!'])
            ->assertRedirect('/verify-email');
        $user = User::where('email', 'new@garden.test')->firstOrFail();
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->assertFalse($user->hasVerifiedEmail());
        $this->get('/member/dashboard')->assertRedirect('/verify-email');
        $this->getJson('/api/garden-plots')->assertForbidden();
        $this->get('/verify-email')->assertInertia(fn ($page) => $page->component('auth/verify-email')->where('auth.user.email', 'new@garden.test'));
        $this->get($this->verificationUrl($user))->assertRedirect('/member/dashboard');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->get('/member/dashboard')->assertOk();
    }

    public function test_expired_tampered_and_other_users_verification_links_are_rejected(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $this->actingAs($user)->get($this->verificationUrl($user, now()->subMinute()))->assertForbidden();
        $this->get($this->verificationUrl($other))->assertForbidden();
        $this->get($this->verificationUrl($user).'&tampered=1')->assertForbidden();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        $this->assertFalse($other->fresh()->hasVerifiedEmail());
    }

    public function test_unverified_users_of_every_role_are_redirected_after_login(): void
    {
        foreach (UserRole::cases() as $role) {
            $user = User::factory()->unverified()->create(['role' => $role, 'password' => 'Garden123!']);
            $this->post('/login', ['email' => $user->email, 'password' => 'Garden123!'])->assertRedirect('/verify-email');
            $this->get('/'.$role->value.'/dashboard')->assertRedirect('/verify-email');
            $this->post('/logout')->assertRedirect('/login');
        }
    }

    public function test_verification_links_can_be_followed_after_signing_in(): void
    {
        $user = User::factory()->unverified()->create(['password' => 'Garden123!']);
        $url = $this->verificationUrl($user);
        $this->get($url)->assertRedirect('/login');
        $this->post('/login', ['email' => $user->email, 'password' => 'Garden123!'])->assertRedirect($url);
        $this->get($url)->assertRedirect('/member/dashboard');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_login_uses_the_current_role_instead_of_an_obsolete_intended_workspace(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff, 'password' => 'Garden123!']);
        $this->get('/member/dashboard')->assertRedirect('/login');
        $this->post('/login', ['email' => $staff->email, 'password' => 'Garden123!'])->assertRedirect('/staff/dashboard');
    }

    public function test_verification_resends_are_throttled(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        $this->actingAs($user);
        for ($i = 0; $i < 6; $i++) {
            $this->post('/email/verification-notification')->assertSessionHas('status', 'verification-link-sent');
        }
        $this->post('/email/verification-notification')->assertStatus(429);
        Notification::assertSentToTimes($user, VerifyEmail::class, 6);
    }

    public function test_throttled_inertia_requests_show_an_inline_message(): void
    {
        Notification::fake();
        for ($i = 0; $i < 5; $i++) {
            $this->post('/forgot-password', ['email' => 'unknown@garden.test']);
        }
        $this->from('/forgot-password')->withHeader('X-Inertia', 'true')->post('/forgot-password', ['email' => 'unknown@garden.test'])
            ->assertRedirect('/forgot-password')->assertSessionHasErrors('email');
    }

    public function test_reset_requests_use_a_generic_response_and_store_a_hashed_token(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $this->from('/forgot-password')->post('/forgot-password', ['email' => strtoupper($user->email)])->assertRedirect('/forgot-password');
        $knownStatus = session('status');
        $this->post('/forgot-password', ['email' => 'unknown@garden.test'])->assertSessionHas('status', $knownStatus);
        $this->post('/forgot-password', ['email' => $user->email])->assertSessionHas('status', $knownStatus);
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $stored = DB::table('password_reset_tokens')->where('email', $user->email)->value('token');

            return $stored !== $notification->token && Hash::check($notification->token, $stored);
        });
        Notification::assertSentToTimes($user, ResetPassword::class, 1);
    }

    public function test_valid_reset_changes_the_password_consumes_the_token_and_invalidates_sessions(): void
    {
        config(['session.driver' => 'database', 'session.connection' => 'sqlite']);
        $user = User::factory()->create(['password' => 'OldGarden123!', 'remember_token' => 'old-token']);
        $other = User::factory()->create();
        foreach (['old-session' => $user, 'other-session' => $other] as $id => $owner) {
            DB::table('sessions')->insert(['id' => $id, 'user_id' => $owner->id, 'payload' => '', 'last_activity' => now()->timestamp]);
        }
        $token = Password::broker()->createToken($user);
        $data = ['email' => $user->email, 'token' => $token, 'password' => 'NewGarden123!', 'password_confirmation' => 'NewGarden123!'];
        $this->post('/reset-password', $data)->assertRedirect('/login')->assertSessionHas('status');
        $this->assertTrue(Hash::check('NewGarden123!', $user->fresh()->password));
        $this->assertNotSame('old-token', $user->fresh()->getRememberToken());
        $this->assertDatabaseMissing('sessions', ['id' => 'old-session']);
        $this->assertDatabaseHas('sessions', ['id' => 'other-session']);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->post('/reset-password', $data)->assertSessionHasErrors('email');
        $this->post('/login', ['email' => $user->email, 'password' => 'OldGarden123!'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => $user->email, 'password' => 'NewGarden123!'])->assertRedirect('/member/dashboard');
    }

    public function test_invalid_and_expired_reset_links_do_not_change_passwords(): void
    {
        $user = User::factory()->create(['password' => 'OldGarden123!']);
        $token = Password::broker()->createToken($user);
        $data = ['email' => $user->email, 'password' => 'NewGarden123!', 'password_confirmation' => 'NewGarden123!'];
        $this->post('/reset-password', [...$data, 'token' => 'invalid'])->assertSessionHasErrors('email');
        $this->travel(61)->minutes();
        $this->post('/reset-password', [...$data, 'token' => $token])->assertSessionHasErrors('email');
        $this->assertTrue(Hash::check('OldGarden123!', $user->fresh()->password));
    }

    public function test_reset_requires_matching_password_confirmation(): void
    {
        $user = User::factory()->create(['password' => 'OldGarden123!']);
        $token = Password::broker()->createToken($user);
        $this->post('/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'NewGarden123!', 'password_confirmation' => 'Different123!'])
            ->assertSessionHasErrors('password');
        $this->assertTrue(Password::broker()->tokenExists($user, $token));
        $this->assertTrue(Hash::check('OldGarden123!', $user->fresh()->password));
    }

    public function test_suspended_accounts_cannot_request_or_use_reset_links(): void
    {
        Notification::fake();
        $user = User::factory()->create(['password' => 'OldGarden123!']);
        $token = Password::broker()->createToken($user);
        $user->update(['is_active' => false]);
        $this->post('/forgot-password', ['email' => $user->email])->assertSessionHas('status');
        Notification::assertNothingSent();
        $this->post('/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'NewGarden123!', 'password_confirmation' => 'NewGarden123!'])
            ->assertSessionHasErrors('email');
        $this->assertTrue(Hash::check('OldGarden123!', $user->fresh()->password));
    }

    public function test_email_changes_require_a_password_and_confirmation_of_the_new_address(): void
    {
        Notification::fake();
        $user = User::factory()->create(['password' => 'Garden123!']);
        $oldLink = $this->verificationUrl($user);
        $data = ['name' => $user->name, 'email' => 'new@garden.test'];
        $this->actingAs($user)->put('/settings/profile', $data)->assertSessionHasErrors('current_password');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->put('/settings/profile', [...$data, 'current_password' => 'Garden123!'])->assertRedirect('/verify-email');
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        $this->assertSame('new@garden.test', $user->fresh()->email);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->get($oldLink)->assertForbidden();
        $this->get('/member/dashboard')->assertRedirect('/verify-email');
        $this->get($this->verificationUrl($user->fresh()))->assertRedirect('/member/dashboard');
    }

    public function test_remember_me_rotates_a_hidden_token_and_sets_a_cookie(): void
    {
        $user = User::factory()->create(['password' => 'Garden123!']);
        $response = $this->post('/login', ['email' => strtoupper($user->email), 'password' => 'Garden123!', 'remember' => true]);
        $response->assertRedirect('/member/dashboard')->assertCookie(auth()->guard()->getRecallerName());
        $this->assertNotEmpty($user->fresh()->getRememberToken());
        $this->assertArrayNotHasKey('remember_token', $user->fresh()->toArray());
    }

    public function test_authentication_emails_use_the_configured_origin_instead_of_an_untrusted_host(): void
    {
        $user = User::factory()->unverified()->create();
        URL::setRequest(Request::create('http://untrusted.test/forgot-password'));
        $verification = (new VerifyEmail)->toMail($user)->actionUrl;
        $reset = (new ResetPassword('test-token'))->toMail($user)->actionUrl;
        $this->assertStringStartsWith(config('app.url').'/verify-email/', $verification);
        $this->assertStringStartsWith(config('app.url').'/reset-password/', $reset);
        $this->assertTrue(URL::hasValidSignature(Request::create($verification)));
    }

    public function test_registration_keeps_the_account_recoverable_when_email_delivery_fails(): void
    {
        Notification::shouldReceive('send')->once()->andThrow(new TransportException('SMTP unavailable'));
        $this->post('/register', ['name' => 'New Gardener', 'email' => 'delivery@garden.test', 'password' => 'Garden123!', 'password_confirmation' => 'Garden123!'])
            ->assertRedirect('/verify-email')->assertSessionHas('error');
        $user = User::where('email', 'delivery@garden.test')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertFalse($user->hasVerifiedEmail());
        $this->get('/member/dashboard')->assertRedirect('/verify-email');
    }

    public function test_password_change_revokes_other_database_sessions_but_keeps_the_current_one(): void
    {
        config(['session.driver' => 'database', 'session.connection' => 'sqlite']);
        app('session')->forgetDrivers();
        app()->forgetInstance('session.store');
        $user = User::factory()->create(['password' => 'Garden123!']);
        $this->actingAs($user)->get('/settings')->assertOk();
        $currentSession = session()->getId();
        DB::table('sessions')->updateOrInsert(['id' => $currentSession], ['user_id' => $user->id, 'payload' => base64_encode(serialize([])), 'last_activity' => now()->timestamp]);
        DB::table('sessions')->insert(['id' => 'secondary-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => now()->timestamp]);
        $this->withCookie(config('session.cookie'), $currentSession)->put('/settings/password', ['current_password' => 'Garden123!', 'password' => 'ChangedGarden123!', 'password_confirmation' => 'ChangedGarden123!'])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('sessions', ['id' => 'secondary-session']);
        $this->assertDatabaseHas('sessions', ['id' => $currentSession]);
        $this->assertTrue(Hash::check('ChangedGarden123!', $user->fresh()->password));
    }

    private function verificationUrl(User $user, $expires = null): string
    {
        return URL::temporarySignedRoute('verification.verify', $expires ?? now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]);
    }
}
