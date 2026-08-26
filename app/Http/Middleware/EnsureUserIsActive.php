<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->status !== 'active') {
            auth()->logout();

            // Tear the session down properly rather than just forgetting the
            // user: otherwise the old session ID stays valid and the CSRF
            // token is reused across the logout boundary.
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return redirect()->route('login')->withErrors([
                'email' => 'Your account is not active. Please contact the administrator.',
            ]);
        }

        return $next($request);
    }
}
