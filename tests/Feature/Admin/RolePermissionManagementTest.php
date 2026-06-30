<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolePermissionManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_view_roles_page(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/roles')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Roles'));
    }

    public function test_non_admin_cannot_view_roles_page(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get('/admin/roles')->assertStatus(403);
    }

    public function test_admin_can_create_a_custom_role(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/admin/roles', ['name' => 'custom_reviewer'])
            ->assertRedirect('/admin/roles');

        $this->assertDatabaseHas('roles', ['name' => 'custom_reviewer']);
    }

    public function test_role_name_must_be_unique(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/admin/roles', ['name' => 'alumni'])
            ->assertSessionHasErrors('name');
    }

    public function test_admin_can_delete_a_custom_role(): void
    {
        $admin = User::factory()->admin()->create();
        $role = Role::create(['name' => 'temp_role', 'guard_name' => 'web']);

        $this->actingAs($admin)
            ->delete("/admin/roles/{$role->id}")
            ->assertRedirect('/admin/roles');

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_protected_roles_cannot_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = Role::where('name', 'alumni')->first();

        $this->actingAs($admin)
            ->delete("/admin/roles/{$alumni->id}")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('roles', ['name' => 'alumni']);
    }

    public function test_admin_can_sync_permissions_on_a_role(): void
    {
        $admin = User::factory()->admin()->create();
        $role = Role::create(['name' => 'tester_role', 'guard_name' => 'web']);
        $permission = Permission::where('name', 'surveys.manage')->first();

        $this->actingAs($admin)
            ->patch("/admin/roles/{$role->id}/permissions", [
                'permissions' => ['surveys.manage'],
            ])
            ->assertRedirect();

        $this->assertTrue($role->fresh()->hasPermissionTo('surveys.manage'));
    }

    public function test_syncing_empty_permissions_clears_all(): void
    {
        $admin = User::factory()->admin()->create();
        $role = Role::create(['name' => 'bare_role', 'guard_name' => 'web']);
        $role->syncPermissions(['surveys.manage']);

        $this->actingAs($admin)
            ->patch("/admin/roles/{$role->id}/permissions", [
                'permissions' => [],
            ])
            ->assertRedirect();

        $this->assertCount(0, $role->fresh()->permissions);
    }

    public function test_non_admin_cannot_create_role(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->post('/admin/roles', ['name' => 'hacked_role'])
            ->assertStatus(403);

        $this->assertDatabaseMissing('roles', ['name' => 'hacked_role']);
    }
}
