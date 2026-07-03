<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Map the registration form's role choice to a Spatie role name.
     */
    private const ROLE_MAP = [
        'student' => 'student',
        'alumni' => 'alumni',
        'alumni_officer' => 'alumni_affairs',
        'dean' => 'department_head',
        'industry_partner' => 'industry_partner',
    ];

    /**
     * Registrants in these roles self-serve after confirming their email.
     * All others require an administrator to approve the account first.
     *
     * @var array<int, string>
     */
    private const SELF_SERVICE_ROLES = ['student', 'alumni'];

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(RegisterRequest $request): RedirectResponse
    {
        $role = self::ROLE_MAP[$request->role];
        $isSelfService = in_array($request->role, self::SELF_SERVICE_ROLES, true);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            // Staff/employer accounts wait for admin approval; graduates are
            // active immediately but must confirm their email address.
            'status' => $isSelfService ? 'active' : 'pending',
        ]);

        $user->assignRole($role);

        if (! $isSelfService) {
            // Admin approval is the gate for pending roles, so mark their email
            // verified now to avoid a second (email) gate after approval.
            $user->markEmailAsVerified();

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
