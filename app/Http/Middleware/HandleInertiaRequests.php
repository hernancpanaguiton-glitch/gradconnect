<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            $user->loadMissing('department');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'status' => $user->status,
                    'department_id' => $user->department_id,
                    'department' => $user->department
                        ? $user->department->only(['id', 'name', 'code'])
                        : null,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => [
                'unread' => fn () => $user ? $user->unreadNotifications()->count() : 0,
                'items' => fn () => $user
                    ? $user->notifications()->latest()->limit(6)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'title' => $n->data['title'] ?? 'Notification',
                        'message' => $n->data['message'] ?? '',
                        'url' => $n->data['url'] ?? null,
                        'read' => $n->read_at !== null,
                        'time' => $n->created_at->diffForHumans(),
                    ])
                    : [],
            ],
            'maintenanceBanner' => fn () => $user ? (Setting::get('maintenance_banner_message') ?: null) : null,
        ];
    }
}
