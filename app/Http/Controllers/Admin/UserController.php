<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminUpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        return Inertia::render('Admin/UserEdit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update a user's status and roles.
     */
    public function update(AdminUpdateUserRequest $request, User $user): RedirectResponse
    {
        $user->update(['status' => $request->status]);
        $user->syncRoles($request->roles);

        return redirect()->route('admin.users.index')->with('success', 'User updated.');
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }
}
