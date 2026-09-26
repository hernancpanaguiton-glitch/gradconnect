<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\GraduateProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GraduateProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * Build an update payload mirroring what the Basic Info form re-submits:
     * every existing field is sent back alongside the changed ones. This is
     * what surfaces validation drift between the factory/seed and the request
     * rules (e.g. a bad gender casing silently rejecting the whole update).
     *
     * @return array<string, mixed>
     */
    private function formPayload(GraduateProfile $profile, array $overrides = []): array
    {
        return array_merge([
            'program' => $profile->program,
            'graduation_year' => $profile->graduation_year,
            'gender' => $profile->gender,
            'birthdate' => optional($profile->birthdate)->format('Y-m-d'),
            'phone' => $profile->phone,
            'city' => $profile->city,
            'headline' => $profile->headline,
            'summary' => $profile->summary,
            'current_employment_status' => $profile->current_employment_status,
            'willing_to_relocate' => $profile->willing_to_relocate,
        ], $overrides);
    }

    public function test_alumni_can_update_employment_status_and_relocation(): void
    {
        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->unemployed()->create([
            'user_id' => $user->id,
            'willing_to_relocate' => false,
        ]);

        $response = $this->actingAs($user)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, [
                'current_employment_status' => 'employed',
                'willing_to_relocate' => true,
            ])
        );

        $response->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertSame('employed', $profile->current_employment_status);
        $this->assertTrue($profile->willing_to_relocate);
    }

    public function test_factory_profiles_pass_the_update_validation_rules(): void
    {
        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);

        // Re-submitting the profile unchanged must not trip any validation rule.
        $this->actingAs($user)
            ->patch(route('graduate.profile.update'), $this->formPayload($profile))
            ->assertSessionHasNoErrors();
    }

    public function test_profile_update_persists_a_college_on_its_own(): void
    {
        $college = Department::create(['name' => 'College of Computer Studies', 'code' => 'CCS', 'type' => 'college']);

        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, ['college_id' => $college->id])
        )->assertSessionHasNoErrors();

        $this->assertSame($college->id, $profile->refresh()->department_id);
    }

    public function test_profile_update_stores_the_program_and_syncs_its_name(): void
    {
        $college = Department::create(['name' => 'College of Computer Studies', 'code' => 'CCS', 'type' => 'college']);
        $program = Department::create(['name' => 'BS Information Technology', 'code' => 'BSIT', 'type' => 'program', 'parent_id' => $college->id]);

        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, ['college_id' => $college->id, 'program_id' => $program->id])
        )->assertSessionHasNoErrors();

        // Reports group by the program row, so the narrower id wins.
        $this->assertSame($program->id, $profile->refresh()->department_id);
        $this->assertSame('BS Information Technology', $profile->program);
    }

    public function test_profile_update_rejects_a_program_from_another_college(): void
    {
        $college = Department::create(['name' => 'College of Computer Studies', 'code' => 'CCS', 'type' => 'college']);
        $other = Department::create(['name' => 'College of Nursing', 'code' => 'CON', 'type' => 'college']);
        $program = Department::create(['name' => 'BS Nursing', 'code' => 'BSN', 'type' => 'program', 'parent_id' => $other->id]);

        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, ['college_id' => $college->id, 'program_id' => $program->id])
        )->assertSessionHasErrors('program_id');
    }

    public function test_a_graduate_attached_to_a_program_can_save_their_profile(): void
    {
        // Seeded graduates are linked to a program, but the form used to offer
        // colleges only — so their department_id failed validation on every
        // save, including from tabs where the error was never visible.
        $college = Department::create(['name' => 'College of Computer Studies', 'code' => 'CCS', 'type' => 'college']);
        $program = Department::create(['name' => 'BS Computer Science', 'code' => 'BSCS', 'type' => 'program', 'parent_id' => $college->id]);

        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id, 'department_id' => $program->id]);

        $this->actingAs($user)
            ->get(route('graduate.profile.edit'))
            ->assertInertia(fn ($page) => $page
                ->where('selectedCollegeId', $college->id)
                ->where('selectedProgramId', $program->id));

        $this->actingAs($user)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, ['college_id' => $college->id, 'program_id' => $program->id])
        )->assertSessionHasNoErrors();

        $this->assertSame($program->id, $profile->refresh()->department_id);
    }

    public function test_profile_update_ignores_protected_fields(): void
    {
        $user = User::factory()->alumni()->create();
        $other = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, ['user_id' => $other->id, 'student_number' => 'HACKED'])
        )->assertSessionHasNoErrors();

        $profile->refresh();

        $this->assertSame($user->id, $profile->user_id);
        $this->assertNotSame('HACKED', $profile->student_number);
    }

    public function test_employability_report_reflects_status_change(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->unemployed()->create(['user_id' => $alumni->id]);

        $affairs = User::factory()->alumniAffairs()->create();

        // Baseline: the profile counts as unemployed.
        $this->actingAs($affairs)->get(route('reports.employability'))
            ->assertInertia(fn ($page) => $page->where('employmentBreakdown.unemployed', 1));

        // Alumni marks themselves employed.
        $this->actingAs($alumni)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, ['current_employment_status' => 'employed'])
        )->assertSessionHasNoErrors();

        // The report now counts them.
        $this->actingAs($affairs)->get(route('reports.employability'))
            ->assertInertia(fn ($page) => $page->where('employmentBreakdown.employed', 1));
    }
}
