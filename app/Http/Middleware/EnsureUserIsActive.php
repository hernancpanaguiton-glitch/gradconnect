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

            return redirect()->route('login')->withErrors([
                'email' => 'Your account is not active. Please contact the administrator.',
            ]);
        }

        return $next($request);
    }
}
