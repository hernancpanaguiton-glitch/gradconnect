<?php

namespace Tests\Feature;

use App\Models\GraduateProfile;
use App\Models\StudentCase;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentCaseControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_student_can_file_a_concern(): void
    {
        $student = User::factory()->student()->create();
        GraduateProfile::factory()->for($student, 'user')->create();

        $this->actingAs($student)->post(route('student-cases.store'), [
            'category' => 'financial', 'description' => 'Need help with tuition.',
        ])->assertRedirect();

        $this->assertDatabaseHas('student_cases', [
            'reported_by_user_id' => $student->id, 'category' => 'financial', 'status' => 'open',
        ]);
    }

    public function test_alumni_cannot_file_a_concern(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();

        $this->actingAs($alumni)->post(route('student-cases.store'), [
            'category' => 'financial', 'description' => 'x',
        ])->assertForbidden();
    }

    public function test_student_sees_only_their_own_cases(): void
    {
        $studentA = User::factory()->student()->create();
        $profileA = GraduateProfile::factory()->for($studentA, 'user')->create();
        $studentB = User::factory()->student()->create();
        $profileB = GraduateProfile::factory()->for($studentB, 'user')->create();

        StudentCase::create([
            'graduate_profile_id' => $profileA->id, 'reported_by_user_id' => $studentA->id,
            'category' => 'academic', 'description' => 'Mine', 'status' => 'open',
        ]);
        StudentCase::create([
            'graduate_profile_id' => $profileB->id, 'reported_by_user_id' => $studentB->id,
            'category' => 'academic', 'description' => 'Not mine', 'status' => 'open',
        ]);

        $this->actingAs($studentA)->get(route('student-cases.index'))
            ->assertInertia(fn ($page) => $page->has('cases', 1)->where('cases.0.description', 'Mine'));
    }

    public function test_sao_sees_all_cases_and_can_update_status(): void
    {
        $sao = User::factory()->sao()->create();
        $student = User::factory()->student()->create();
        $profile = GraduateProfile::factory()->for($student, 'user')->create();
        $case = StudentCase::create([
            'graduate_profile_id' => $profile->id, 'reported_by_user_id' => $student->id,
            'category' => 'personal', 'description' => 'x', 'status' => 'open',
        ]);

        $this->actingAs($sao)->get(route('student-cases.index'))
            ->assertInertia(fn ($page) => $page->has('cases', 1)->where('canManage', true));

        $this->actingAs($sao)->patch(route('student-cases.update', $case), [
            'status' => 'resolved', 'resolution_notes' => 'Sorted out.',
        ])->assertRedirect();

        $this->assertDatabaseHas('student_cases', ['id' => $case->id, 'status' => 'resolved', 'resolution_notes' => 'Sorted out.']);
    }

    public function test_student_cannot_update_case_status(): void
    {
        $student = User::factory()->student()->create();
        $profile = GraduateProfile::factory()->for($student, 'user')->create();
        $case = StudentCase::create([
            'graduate_profile_id' => $profile->id, 'reported_by_user_id' => $student->id,
            'category' => 'personal', 'description' => 'x', 'status' => 'open',
        ]);

        $this->actingAs($student)->patch(route('student-cases.update', $case), ['status' => 'resolved'])->assertForbidden();
    }

    public function test_industry_partner_cannot_access_student_cases(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get(route('student-cases.index'))->assertForbidden();
    }
}
