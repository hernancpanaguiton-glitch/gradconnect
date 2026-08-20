<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    /**
     * Global platform settings (FDD Admin "manage system settings"). Kept
     * to a small set of settings that actually change behavior — a
     * registration on/off switch, a support contact, and a site-wide
     * banner — rather than a generic key-value store nothing reads.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('system.settings'), 403);

        return Inertia::render('Admin/SystemSettings', [
            'settings' => [
                'registration_enabled' => Setting::getBool('registration_enabled', true),
                'support_email' => Setting::get('support_email', ''),
                'maintenance_banner_message' => Setting::get('maintenance_banner_message', ''),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('system.settings'), 403);

        $data = $request->validate([
            'registration_enabled' => ['required', 'boolean'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'maintenance_banner_message' => ['nullable', 'string', 'max:500'],
        ]);

        Setting::set('registration_enabled', $data['registration_enabled'] ? '1' : '0');
        Setting::set('support_email', $data['support_email'] ?? null);
        Setting::set('maintenance_banner_message', $data['maintenance_banner_message'] ?? null);

        AuditLog::record('settings.updated', $request->user(), 'Updated system settings');

        return back()->with('success', 'Settings updated.');
    }
}
