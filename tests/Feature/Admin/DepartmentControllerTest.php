<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Colleges & Programs: the admin screen that edits the institution's own structure. */
class DepartmentControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    private function college(string $code = 'CCS', string $name = 'College of Computer Studies'): Department
    {
        return Department::create(['code' => $code, 'name' => $name, 'type' => 'college']);
    }

    public function test_admin_sees_each_college_with_its_programs(): void
    {
        $college = $this->college();
        Department::create(['code' => 'BSIT', 'name' => 'BS Information Technology', 'type' => 'program', 'parent_id' => $college->id]);

        $this->actingAs($this->admin)->get(route('admin.colleges.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Colleges')
                ->has('colleges', 1)
                ->where('colleges.0.code', 'CCS')
                ->has('colleges.0.children', 1));
    }

    public function test_adding_a_college_stores_a_tidy_uppercase_code_and_is_audited(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.departments.store'), ['code' => ' xel ', 'name' => '  Test    College ', 'type' => 'college'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('departments', ['code' => 'XEL', 'name' => 'Test College', 'type' => 'college', 'parent_id' => null]);
        $this->assertTrue(AuditLog::where('action', 'department.created')->exists());
    }

    public function test_a_program_must_belong_to_a_college(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.departments.store'), ['code' => 'BSX', 'name' => 'BS Example', 'type' => 'program'])
            ->assertSessionHasErrors('parent_id');

        $this->assertDatabaseMissing('departments', ['code' => 'BSX']);
    }

    public function test_renaming_a_college_is_saved(): void
    {
        $college = $this->college('XEL', 'Test College');

        $this->actingAs($this->admin)
            ->patch(route('admin.departments.update', $college), ['code' => 'XEL', 'name' => 'Renamed College', 'type' => 'college'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Renamed College', $college->fresh()->name);
    }

    public function test_a_college_that_still_has_programs_cannot_be_deleted(): void
    {
        $college = $this->college();
        Department::create(['code' => 'BSIT', 'name' => 'BS Information Technology', 'type' => 'program', 'parent_id' => $college->id]);

        $this->actingAs($this->admin)
            ->delete(route('admin.departments.destroy', $college))
            ->assertSessionHasErrors('department');

        $this->assertNotNull($college->fresh());
    }

    public function test_an_empty_program_can_be_deleted(): void
    {
        $program = Department::create(['code' => 'BSX', 'name' => 'BS Example', 'type' => 'program', 'parent_id' => $this->college()->id]);

        $this->actingAs($this->admin)
            ->delete(route('admin.departments.destroy', $program))
            ->assertSessionHasNoErrors();

        $this->assertNull($program->fresh());
    }

    public function test_only_administrators_can_manage_colleges(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)->get(route('admin.colleges.index'))->assertForbidden();
        $this->actingAs($student)
            ->post(route('admin.departments.store'), ['code' => 'XEL', 'name' => 'Test College', 'type' => 'college'])
            ->assertForbidden();
        $this->assertDatabaseMissing('departments', ['code' => 'XEL']);
    }

    public function test_the_refusal_message_counts_in_proper_english(): void
    {
        $college = $this->college();
        Department::create(['code' => 'BSIT', 'name' => 'BS Information Technology', 'type' => 'program', 'parent_id' => $college->id]);

        $this->actingAs($this->admin)
            ->delete(route('admin.departments.destroy', $college))
            ->assertSessionHasErrors(['department' => 'Cannot delete "College of Computer Studies" — it still has 1 program. Move or remove those first.']);
    }
}
