<?php

namespace App\Listeners;

use App\Models\AuditLog;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

/**
 * Feeds the audit trail (Fig. 15) from Laravel's own auth events, rather
 * than instrumenting AuthenticatedSessionController by hand.
 */
class RecordAuthActivity
{
    public function handleLogin(Login $event): void
    {
        AuditLog::record('login', $event->user);
    }

    public function handleFailed(Failed $event): void
    {
        AuditLog::record('login_failed', $event->user, $event->credentials['email'] ?? null);
    }

    public function handleLogout(Logout $event): void
    {
        if ($event->user) {
            AuditLog::record('logout', $event->user);
        }
    }
}
