<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->alumni()->count(3)->create();

        $this->actingAs($admin)->get('/admin/users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Users'));
    }

    public function test_admin_can_search_users_without_error(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->alumni()->create(['first_name' => 'Searchable']);

        $this->actingAs($admin)->get('/admin/users?search=Searchable')->assertOk();
    }

    public function test_admin_can_view_user_edit_form(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->alumni()->create();

        $this->actingAs($admin)->get("/admin/users/{$target->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/UserEdit'));
    }

    public function test_admin_can_update_user_status_and_roles(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->alumni()->create();

        $this->actingAs($admin)
            ->patch("/admin/users/{$target->id}", [
                'status' => 'suspended',
                'roles' => ['student'],
            ])
            ->assertRedirect('/admin/users');

        $target->refresh();
        $this->assertSame('suspended', $target->status);
        $this->assertTrue($target->hasRole('student'));
        $this->assertFalse($target->hasRole('alumni'));
    }

    public function test_admin_can_delete_a_user(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin)
            ->delete("/admin/users/{$target->id}")
            ->assertRedirect('/admin/users');

        $this->assertNull($target->fresh());
    }

    public function test_non_admin_cannot_update_a_user(): void
    {
        $alumni = User::factory()->alumni()->create();
        $target = User::factory()->create();

        $this->actingAs($alumni)
            ->patch("/admin/users/{$target->id}", ['status' => 'suspended', 'roles' => []])
            ->assertStatus(403);

        $this->assertSame('active', $target->fresh()->status);
    }

    public function test_invalid_status_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->alumni()->create();

        $this->actingAs($admin)
            ->patch("/admin/users/{$target->id}", [
                'status' => 'invalid_status',
                'roles' => ['alumni'],
            ])
            ->assertSessionHasErrors('status');
    }
}
