<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        VerifyEmail::createUrlUsing(fn (User $user) => $this->authenticationUrls()->temporarySignedRoute(
            'verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        ));
        ResetPassword::createUrlUsing(fn (User $user, string $token) => $this->authenticationUrls()->route(
            'password.reset', ['token' => $token, 'email' => $user->getEmailForPasswordReset()],
        ));
    }

    private function authenticationUrls(): UrlGenerator
    {
        // Email links must use the configured application origin, never an incoming Host header.
        $urls = clone $this->app->make('url');
        $urls->forceRootUrl(config('app.url'));
        $urls->forceScheme(parse_url(config('app.url'), PHP_URL_SCHEME));

        return $urls;
    }
}
