<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\GraduateProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployabilityReportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_alumni_affairs_can_view_the_report(): void
    {
        $staff = User::factory()->alumniAffairs()->create();

        $this->actingAs($staff)->get(route('reports.employability'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Employability')
                ->has('colleges')
                ->has('programs')
            );
    }

    public function test_student_without_permission_is_forbidden(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)->get(route('reports.employability'))->assertForbidden();
    }

    public function test_college_filter_narrows_the_totals(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        $this->actingAs($staff)->get(route('reports.employability', ['college_id' => $ccs->id]))
            ->assertInertia(fn ($page) => $page->where('totalGraduates', 1));

        $this->actingAs($staff)->get(route('reports.employability'))
            ->assertInertia(fn ($page) => $page->where('totalGraduates', 2));
    }

    public function test_export_streams_a_csv_and_logs_a_report(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $response = $this->actingAs($staff)->get(route('reports.employability.export'));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));

        $this->assertDatabaseHas('reports', [
            'generated_by_user_id' => $staff->id,
            'report_type' => 'employability',
        ]);
    }

    /**
     * Regression: ResolvesReportFilters read only request params and returned
     * [] (= institution-wide) when none were given, so a department head saw
     * the whole institution's employment and salary data.
     */
    public function test_department_head_report_is_scoped_to_their_own_college(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);
        $head = User::factory()->departmentHead()->create(['department_id' => $ccs->id]);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        $this->actingAs($head)->get(route('reports.employability'))
            ->assertInertia(fn ($page) => $page->where('totalGraduates', 1)->where('scopeLocked', true));
    }

    /**
     * Regression: a department head could retarget the report at any other
     * college simply by passing ?college_id=.
     */
    public function test_department_head_cannot_widen_scope_via_query_params(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);
        $head = User::factory()->departmentHead()->create(['department_id' => $ccs->id]);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        // Asking for the other college still yields only their own.
        $this->actingAs($head)->get(route('reports.employability', ['college_id' => $cob->id]))
            ->assertInertia(fn ($page) => $page->where('totalGraduates', 1));

        $this->actingAs($head)->get(route('reports.employability', ['program_id' => $cob->id]))
            ->assertInertia(fn ($page) => $page->where('totalGraduates', 1));
    }

    public function test_department_head_with_no_college_sees_nothing_rather_than_everything(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $head = User::factory()->departmentHead()->create(['department_id' => null]);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);

        $this->actingAs($head)->get(route('reports.employability'))
            ->assertInertia(fn ($page) => $page->where('totalGraduates', 0));
    }

    public function test_institution_wide_roles_are_not_scoped(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        foreach ([User::factory()->alumniAffairs()->create(), User::factory()->admin()->create()] as $staff) {
            $this->actingAs($staff)->get(route('reports.employability'))
                ->assertInertia(fn ($page) => $page->where('totalGraduates', 2)->where('scopeLocked', false));
        }
    }

    public function test_department_head_csv_export_is_also_scoped(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);
        $head = User::factory()->departmentHead()->create(['department_id' => $ccs->id]);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        $csv = $this->actingAs($head)->get(route('reports.employability.export', ['college_id' => $cob->id]))
            ->assertOk()
            ->streamedContent();

        // One graduate (their own college), not the institution-wide two.
        // fputcsv quotes fields containing spaces.
        $this->assertStringContainsString('"Total Graduates",1', $csv);
    }

    public function test_export_is_forbidden_without_permission(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)->get(route('reports.employability.export'))->assertForbidden();
        $this->assertDatabaseCount('reports', 0);
    }
}
