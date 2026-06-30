<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    /**
     * Core roles that cannot be deleted.
     */
    private const PROTECTED_ROLES = [
        'admin',
        'alumni_affairs',
        'department_head',
        'industry_partner',
        'alumni',
        'student',
    ];

    /**
     * Show the roles and permissions matrix.
     */
    public function index(): Response
    {
        $roles = Role::with('permissions')->orderBy('name')->get();

        $permissions = Permission::orderBy('name')
            ->get(['id', 'name'])
            ->groupBy(function (Permission $permission) {
                // Group by the prefix before the first dot, e.g. "surveys" from "surveys.manage"
                return str($permission->name)->before('.')->toString();
            });

        return Inertia::render('Admin/Roles', [
            'roles' => $roles,
            'permissionGroups' => $permissions,
        ]);
    }

    /**
     * Create a new role.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
        ]);

        return redirect()->route('admin.roles.index')->with('success', 'Role created.');
    }

    /**
     * Delete a role (protected roles cannot be removed).
     */
    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, self::PROTECTED_ROLES, strict: true)) {
            return back()->with('error', "The \"{$role->name}\" role is protected and cannot be deleted.");
        }

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted.');
    }

    /**
     * Sync permissions for a role.
     */
    public function updatePermissions(Request $request, Role $role): RedirectResponse
    {
        $request->validate([
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($request->input('permissions', []));

        return back()->with('success', 'Permissions updated.');
    }
}
