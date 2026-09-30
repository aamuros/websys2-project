<?php

namespace App\Http\Controllers;

use App\Services\AccountSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class SettingsController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('settings');
    }

    public function profile(Request $request): RedirectResponse
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => Str::lower(trim($request->input('email')))]);
        }
        $data = $request->validate(['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($request->user())]]);
        $emailChanged = $data['email'] !== $request->user()->email;
        if ($emailChanged) {
            $request->validate(['current_password' => ['required', 'current_password']]);
        }
        $user = $request->user();
        $user->fill($data);
        if ($emailChanged) {
            $user->email_verified_at = null;
        }
        $user->save();

        if ($emailChanged) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (TransportExceptionInterface $exception) {
                report($exception);

                return redirect()->route('verification.notice')->with('error', 'Your email was changed, but the confirmation email could not be sent. Please try resending it shortly.');
            }

            return redirect()->route('verification.notice')->with('status', 'verification-link-sent');
        }

        return back()->with('success', 'Profile updated.');
    }

    public function password(Request $request, AccountSessionService $sessions): RedirectResponse
    {
        $data = $request->validate(['current_password' => ['required', 'current_password'], 'password' => ['required', 'confirmed', Password::defaults()]]);
        $request->user()->forceFill(['password' => Hash::make($data['password']), 'remember_token' => Str::random(60)])->save();
        $sessions->invalidate($request->user(), $request->session()->getId());

        return back()->with('success', 'Password updated.');
    }
}
