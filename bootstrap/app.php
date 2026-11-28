<?php

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'active' => EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // A refusal raised with abort(422, '…') — applying twice, a closed job
        // or survey, a full event — would otherwise reach the page as a bare
        // error screen. When the app itself sent the request, go back to the
        // page and show the reason as its error message instead.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if (! $request->header('X-Inertia') || ! $e instanceof HttpExceptionInterface) {
                return $response;
            }

            // The page we went back to cannot be shown either (a closed job's
            // page is gone; a closed survey refuses its own form): go to the
            // dashboard with the original reason rather than an error screen
            // or a redirect loop.
            if ($request->isMethod('GET') && $request->session()->get('refused')
                && in_array($e->getStatusCode(), [403, 404, 422], true)) {
                return redirect()->route('dashboard')->with('error', $request->session()->get('error'));
            }

            if ($e->getStatusCode() === 422 && $e->getMessage() !== '') {
                return back()->with('error', $e->getMessage())->with('refused', true);
            }

            return $response;
        });
    })->create();
