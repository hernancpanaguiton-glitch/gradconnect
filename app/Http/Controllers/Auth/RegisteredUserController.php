<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\NewAccountPendingApproval;
use App\Support\Roles;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            // Only the department head picker uses these, but the form needs
            // them up front to avoid a second round trip on role change.
            'colleges' => Department::colleges()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(RegisterRequest $request): RedirectResponse
    {
        abort_unless(Setting::getBool('registration_enabled', true), 403, 'Registration is currently disabled.');

        // The form now posts Spatie role names directly; canonical() only has
        // to fold the legacy "dean"/"alumni_officer" values from stale tabs.
        $role = Roles::canonical($request->role);
        $isSelfService = Roles::isSelfService($role);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            // Staff/employer accounts wait for admin approval; graduates are
            // active immediately but must confirm their email address.
            'status' => $isSelfService ? 'active' : 'pending',
            'department_id' => $request->validated('department_id'),
        ]);

        $user->assignRole($role);

        if (! $isSelfService) {
            // Admin approval is the gate for pending roles, so mark their email
            // verified now to avoid a second (email) gate after approval.
            $user->markEmailAsVerified();

            if ($role === Roles::ADMIN) {
                // Administrator access is registrable but never self-service,
                // so leave a trail of who asked for it.
                AuditLog::record('user.admin_requested', $user, "Administrator access requested by {$user->email}");
            }

            // Active admins only: a pending administrator request must not
            // receive everyone else's approval notices while it waits.
            Notification::send(
                User::role(Roles::ADMIN)->where('status', 'active')->get(),
                new NewAccountPendingApproval($user),
            );

            return redirect()->route('login')->with(
                'status',
                'Your account was created and is awaiting administrator approval. '.
                'You will be able to sign in once it has been approved.'
            );
        }

        // Ensure the graduate profile exists so the profile/resume flow is ready.
        $user->graduateProfile()->firstOrCreate(['user_id' => $user->id]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
