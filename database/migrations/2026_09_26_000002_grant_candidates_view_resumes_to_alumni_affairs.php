<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * alumni_affairs holds candidates.search but never held
 * candidates.view_resumes, so every candidate link the office was shown —
 * from Talent Search and from the topbar search — led to a 403. The seeder
 * now grants it; this brings already-seeded databases in line.
 */
return new class extends Migration
{
    public function up(): void
    {
        $role = Role::where('name', 'alumni_affairs')->where('guard_name', 'web')->first();

        // Nothing to do on a database migrated before the roles are seeded.
        if ($role === null) {
            return;
        }

        $permission = Permission::firstOrCreate([
            'name' => 'candidates.view_resumes',
            'guard_name' => 'web',
        ]);

        $role->givePermissionTo($permission);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $role = Role::where('name', 'alumni_affairs')->where('guard_name', 'web')->first();
        $permission = Permission::where('name', 'candidates.view_resumes')->where('guard_name', 'web')->first();

        if ($role === null || $permission === null) {
            return;
        }

        $role->revokePermissionTo($permission);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
