<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function college(): Department
    {
        return Department::create(['name' => 'College of Computer Studies', 'code' => 'CCS', 'type' => 'college']);
    }

    public function test_department_head_can_set_their_college(): void
    {
        $college = $this->college();
        $head = User::factory()->departmentHead()->create();

        $this->actingAs($head)
            ->patch(route('department-head.college.update'), ['department_id' => $college->id])
            ->assertSessionHasNoErrors();

        $this->assertSame($college->id, $head->refresh()->department_id);
    }

    public function test_department_head_cannot_pick_a_program(): void
    {
        $college = $this->college();
        $program = Department::create([
            'name' => 'BS Information Technology', 'code' => 'BSIT', 'type' => 'program', 'parent_id' => $college->id,
        ]);
        $head = User::factory()->departmentHead()->create();

        $this->actingAs($head)
            ->patch(route('department-head.college.update'), ['department_id' => $program->id])
            ->assertSessionHasErrors('department_id');
    }

    public function test_admin_can_assign_a_users_college(): void
    {
        $college = $this->college();
        $admin = User::factory()->admin()->create();
        $head = User::factory()->departmentHead()->create();

        $this->actingAs($admin)
            ->patch(route('admin.users.update', $head), [
                'status' => 'active',
                'roles' => ['department_head'],
                'department_id' => $college->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame($college->id, $head->refresh()->department_id);
    }
}
