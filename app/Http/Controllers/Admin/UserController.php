<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminUpdateUserRequest;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\User;
use App\Notifications\AccountApproved;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * List all users with their roles, paginated.
     */
    public function index(Request $request): Response
    {
        $users = User::with('roles')
            ->when($request->input('search'), function ($query, $search) {
                $like = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
                $query->where(function ($q) use ($search, $like) {
                    $q->where('first_name', $like, "%{$search}%")
                        ->orWhere('last_name', $like, "%{$search}%")
                        ->orWhere('email', $like, "%{$search}%")
                        ->orWhere('id_number', $like, "%{$search}%");
                });
            })
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the edit form for a user.
     */
    public function edit(User $user): Response
    {
        $user->load('roles');

        $roles = Role::orderBy('name')->get(['id', 'name']);
        $colleges = Department::colleges()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/UserEdit', [
            'user' => $user,
            'roles' => $roles,
            'colleges' => $colleges,
        ]);
    }

    /**
     * Update a user's status and roles.
     */
    public function update(AdminUpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->assertChangeIsSafe($request, $user);

        $wasInactive = $user->status !== 'active';

        $user->update([
            'status' => $request->status,
            'department_id' => $request->department_id,
        ]);
        $user->syncRoles($request->roles);

        AuditLog::record(
            'user.updated',
            $request->user(),
            "Updated {$user->email}: status={$request->status}, roles=".implode(',', $request->roles),
        );

        // Notify the user when their pending account is approved.
        if ($wasInactive && $request->status === 'active') {
            $user->notify(new AccountApproved);
        }

        return redirect()->route('admin.users.index')->with('success', 'User updated.');
    }

    /**
     * Delete a user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($this->isLastActiveAdmin($user)) {
            return back()->with('error', 'This is the last active administrator — promote another admin first.');
        }

        AuditLog::record('user.deleted', $request->user(), "Deleted {$user->email}");

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }

    /**
     * Stop an administrator locking themselves — or everyone — out.
     *
     * Nothing prevented an admin from suspending their own account or
     * removing their own admin role, and with a single administrator (the
     * common case here) either action leaves the platform with no way back
     * into /admin at all.
     */
    private function assertChangeIsSafe(AdminUpdateUserRequest $request, User $user): void
    {
        $roles = $request->input('roles', []);
        $staysAdmin = in_array('admin', $roles, true);
        $staysActive = $request->input('status') === 'active';
        $messages = [];

        if ($user->id === $request->user()->id) {
            if (! $staysActive) {
                $messages['status'] = 'You cannot change your own account status.';
            }
            if (! $staysAdmin) {
                $messages['roles'] = 'You cannot remove your own admin role.';
            }
        } elseif ($this->isLastActiveAdmin($user) && (! $staysAdmin || ! $staysActive)) {
            if (! $staysActive) {
                $messages['status'] = 'This is the last active administrator — promote another admin first.';
            }
            if (! $staysAdmin) {
                $messages['roles'] = 'This is the last active administrator — promote another admin first.';
            }
        }

        if ($messages !== []) {
            throw ValidationException::withMessages($messages);
        }
    }

    private function isLastActiveAdmin(User $user): bool
    {
        if (! $user->hasRole('admin') || $user->status !== 'active') {
            return false;
        }

        return User::role('admin')
            ->where('status', 'active')
            ->whereKeyNot($user->id)
            ->doesntExist();
    }
}
