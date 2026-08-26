<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * The signed-in user's own settings (distinct from Admin\SystemSettingController,
     * which is platform-wide configuration).
     *
     * This page used to be a `Route::inertia` shell: the Account and Password
     * buttons had no handlers, the notification toggles were a hardcoded array
     * held in local state, and nothing persisted. The account and password
     * forms now post to the existing Breeze endpoints rather than duplicating
     * that logic.
     */
    public function index(Request $request): Response
    {
        $user = $request->user()->loadMissing(['department', 'notificationPreferences']);

        $preferences = collect(NotificationPreference::KEYS)
            ->map(fn (array $meta, string $key) => [
                'key' => $key,
                'label' => $meta['label'],
                'description' => $meta['description'],
                'enabled' => $user->wantsNotification($key),
            ])
            ->values();

        return Inertia::render('Settings', [
            'account' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->getRoleNames()->first(),
                'department' => $user->department?->name,
                'email_verified' => $user->email_verified_at !== null,
            ],
            'notificationPreferences' => $preferences,
        ]);
    }

    /**
     * Persist the notification toggles.
     */
    public function updateNotifications(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.key' => ['required', Rule::in(array_keys(NotificationPreference::KEYS))],
            'preferences.*.enabled' => ['required', 'boolean'],
        ]);

        foreach ($data['preferences'] as $preference) {
            NotificationPreference::updateOrCreate(
                ['user_id' => $request->user()->id, 'preference_key' => $preference['key']],
                ['enabled' => $preference['enabled']],
            );
        }

        return back()->with('success', 'Notification preferences saved.');
    }
}
