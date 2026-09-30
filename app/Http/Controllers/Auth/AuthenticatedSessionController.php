<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', ['status' => $request->session()->get('status')]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();
        $intended = $request->session()->pull('url.intended');
        $verificationPath = route('verification.verify', ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())], false);
        if (is_string($intended) && parse_url($intended, PHP_URL_PATH) === $verificationPath && URL::hasValidSignature(Request::create($intended))) {
            return redirect()->to($intended);
        }

        return redirect()->route($user->hasVerifiedEmail() ? $user->dashboardRouteName() : 'verification.notice');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
