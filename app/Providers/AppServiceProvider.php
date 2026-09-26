<?php

namespace App\Providers;

use App\Listeners\RecordAuthActivity;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
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
        Vite::prefetch(concurrency: 3);

        // Brand all markdown emails (notifications + verification) with the app theme.
        config(['mail.markdown.theme' => 'gradconnect']);

        // Laravel's default reset link carries ?email=, which leaks the address
        // into browser history, referrer headers and any proxy log the link
        // passes through. The token alone identifies the request; the user
        // re-enters their address on the form.
        ResetPassword::createUrlUsing(
            fn (object $notifiable, string $token): string => url(route('password.reset', ['token' => $token], false))
        );

        // Audit trail (Fig. 15 "System Logs & Audit Trail").
        Event::listen(Login::class, [RecordAuthActivity::class, 'handleLogin']);
        Event::listen(Failed::class, [RecordAuthActivity::class, 'handleFailed']);
        Event::listen(Logout::class, [RecordAuthActivity::class, 'handleLogout']);
    }
}
