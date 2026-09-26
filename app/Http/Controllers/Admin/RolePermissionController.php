<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Models\AuditLog;
use App\Support\Roles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    /**
     * Core roles that cannot be deleted. Read from the shared vocabulary so
     * a role added there is protected everywhere — 'sao' was missing here,
     * so the one role the whole Student Affairs module gates on was
     * deletable from the matrix.
     */
    private const PROTECTED_ROLES = Roles::PROTECTED;

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
            // The page kept its own copy of this list, which would drift.
            'protectedRoles' => self::PROTECTED_ROLES,
            'lockedRole' => Roles::ADMIN,
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

        AuditLog::record('role.created', $request->user(), "Created role \"{$request->name}\"");

        return redirect()->route('admin.roles.index')->with('success', 'Role created.');
    }

    /**
     * Delete a role (protected roles cannot be removed).
     */
    public function destroy(Request $request, Role $role): RedirectResponse
    {
        if (in_array($role->name, self::PROTECTED_ROLES, strict: true)) {
            return back()->with('error', "The \"{$role->name}\" role is protected and cannot be deleted.");
        }

        AuditLog::record('role.deleted', $request->user(), "Deleted role \"{$role->name}\"");

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted.');
    }

    /**
     * Sync permissions for a role.
     */
    public function updatePermissions(Request $request, Role $role): RedirectResponse
    {
        // The admin role is the platform's super-role: the seeder grants it
        // every permission and every "can this be undone?" guard assumes it
        // still holds them. Editing it here is how an administrator locks
        // themselves out of /admin.
        if ($role->name === Roles::ADMIN) {
            return back()->with('error', 'The admin role always holds every permission and cannot be edited.');
        }

        $request->validate([
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($request->input('permissions', []));

        AuditLog::record('role.permissions_updated', $request->user(), "Updated permissions for \"{$role->name}\"");

        return back()->with('success', 'Permissions updated.');
    }
}
