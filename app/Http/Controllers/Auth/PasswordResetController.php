<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountSessionService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class PasswordResetController extends Controller
{
    public function request(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', ['status' => $request->session()->get('status')]);
    }

    public function send(Request $request): RedirectResponse
    {
        $this->normalizeEmail($request);
        $data = $request->validate(['email' => ['required', 'string', 'email', 'max:255']]);
        try {
            Password::sendResetLink([...$data, 'is_active' => true]);
        } catch (TransportExceptionInterface $exception) {
            report($exception);

            return back()->withErrors(['email' => 'Email delivery is currently unavailable. Please try again shortly.']);
        }

        return back()->with('status', 'If an active account uses that email, we have sent a password reset link. Check your inbox and spam folder.');
    }

    public function edit(Request $request, string $token): Response
    {
        return Inertia::render('auth/reset-password', ['token' => $token, 'email' => $request->query('email', '')]);
    }

    public function update(Request $request, AccountSessionService $sessions): RedirectResponse
    {
        $this->normalizeEmail($request);
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset([...$data, 'is_active' => true], function (User $user, string $password) use ($sessions) {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $sessions->invalidate($user);
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => 'This reset link is invalid or expired. Request a new link and try again.']);
        }

        return redirect()->route('login')->with('status', 'Your password has been reset. Sign in with your new password.');
    }

    private function normalizeEmail(Request $request): void
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => Str::lower(trim($request->input('email')))]);
        }
    }
}
