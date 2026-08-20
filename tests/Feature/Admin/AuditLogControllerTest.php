<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_login_and_logout_are_recorded(): void
    {
        $user = User::factory()->alumni()->create();

        $this->post(route('login'), ['email' => $user->email, 'password' => 'password']);
        $this->assertDatabaseHas('audit_logs', ['user_id' => $user->id, 'action' => 'login']);

        $this->actingAs($user)->post(route('logout'));
        $this->assertDatabaseHas('audit_logs', ['user_id' => $user->id, 'action' => 'logout']);
    }

    public function test_failed_login_is_recorded(): void
    {
        $user = User::factory()->alumni()->create();

        $this->post(route('login'), ['email' => $user->email, 'password' => 'wrong-password']);

        $this->assertDatabaseHas('audit_logs', ['user_id' => $user->id, 'action' => 'login_failed']);
    }

    public function test_admin_can_view_and_search_logs(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::create(['user_id' => $admin->id, 'action' => 'user.updated', 'description' => 'Updated jane@example.com']);
        AuditLog::create(['user_id' => $admin->id, 'action' => 'role.created', 'description' => 'Created role "recruiter"']);

        $this->actingAs($admin)->get(route('admin.audit-logs'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/AuditLogs')->has('logs.data', 2));

        $this->actingAs($admin)->get(route('admin.audit-logs', ['search' => 'jane']))
            ->assertInertia(fn ($page) => $page->has('logs.data', 1)->where('logs.data.0.action', 'user.updated'));
    }

    public function test_non_admin_cannot_view_audit_logs(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('admin.audit-logs'))->assertForbidden();
    }

    public function test_role_and_user_admin_actions_are_recorded(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->pending()->create();
        $target->assignRole('student');

        $this->actingAs($admin)->patch(route('admin.users.update', $target), [
            'status' => 'active', 'roles' => ['student'],
        ]);

        $this->assertDatabaseHas('audit_logs', ['action' => 'user.updated', 'user_id' => $admin->id]);

        $this->actingAs($admin)->post(route('admin.roles.store'), ['name' => 'recruiter']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'role.created', 'user_id' => $admin->id]);
    }
}
