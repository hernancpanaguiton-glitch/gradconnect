<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\GraduateProfile;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgramOutcomesControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_department_head_with_no_college_sees_empty_state(): void
    {
        $head = User::factory()->departmentHead()->create();

        $this->actingAs($head)->get(route('reports.program-outcomes'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/ProgramOutcomes')
                ->where('hasDepartment', false)
            );
    }

    public function test_department_head_sees_totals_scoped_to_their_college(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);

        $head = User::factory()->departmentHead()->create(['department_id' => $ccs->id]);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        $this->actingAs($head)->get(route('reports.program-outcomes'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('hasDepartment', true)
                ->where('totalGraduates', 1)
            );
    }

    public function test_department_head_scope_includes_child_programs(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $bsit = Department::create(['name' => 'BSIT', 'code' => 'BSIT', 'type' => 'program', 'parent_id' => $ccs->id]);

        $head = User::factory()->departmentHead()->create(['department_id' => $ccs->id]);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $bsit->id]);

        $this->actingAs($head)->get(route('reports.program-outcomes'))
            ->assertInertia(fn ($page) => $page->where('totalGraduates', 1));
    }

    public function test_alumni_cannot_access_program_outcomes(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('reports.program-outcomes'))->assertForbidden();
    }

    public function test_export_is_scoped_and_logs_a_report(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $head = User::factory()->departmentHead()->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);

        $response = $this->actingAs($head)->get(route('reports.program-outcomes.export'));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertDatabaseHas('reports', [
            'generated_by_user_id' => $head->id,
            'report_type' => 'program_outcomes',
        ]);
    }

    public function test_skill_gaps_are_scoped_to_the_heads_college(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);
        $head = User::factory()->departmentHead()->create(['department_id' => $ccs->id]);

        $inScope = GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        $outOfScope = GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        JobMatchResult::create(['job_posting_id' => $posting->id, 'graduate_profile_id' => $inScope->id, 'fit_score' => 50, 'skill_gaps' => ['Docker']]);
        JobMatchResult::create(['job_posting_id' => $posting->id, 'graduate_profile_id' => $outOfScope->id, 'fit_score' => 50, 'skill_gaps' => ['Rust']]);

        $this->actingAs($head)->get(route('reports.program-outcomes'))
            ->assertInertia(fn ($page) => $page
                ->where('topSkillGaps.0.skill', 'Docker')
                ->has('topSkillGaps', 1)
            );
    }
}
