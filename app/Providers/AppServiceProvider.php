<?php

namespace App\Providers;

use App\Listeners\RecordAuthActivity;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
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

        // Audit trail (Fig. 15 "System Logs & Audit Trail").
        Event::listen(Login::class, [RecordAuthActivity::class, 'handleLogin']);
        Event::listen(Failed::class, [RecordAuthActivity::class, 'handleFailed']);
        Event::listen(Logout::class, [RecordAuthActivity::class, 'handleLogout']);
    }
}
