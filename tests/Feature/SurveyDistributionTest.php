<?php

namespace Tests\Feature;

use App\Models\EmploymentRecord;
use App\Models\GraduateProfile;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\User;
use App\Notifications\SurveyInvitation;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SurveyDistributionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    // ─── Visibility filtering (target_role / target_graduation_year) ────────

    public function test_role_targeted_survey_is_hidden_from_other_roles(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $student = User::factory()->student()->create();
        $alumni = User::factory()->alumni()->create();

        Survey::factory()->for($staff, 'createdBy')->targetingRole('student')->create();

        $this->actingAs($student)->get('/surveys')
            ->assertInertia(fn ($page) => $page->has('surveys', 1));

        $this->actingAs($alumni)->get('/surveys')
            ->assertInertia(fn ($page) => $page->has('surveys', 0));
    }

    public function test_graduation_year_targeted_survey_only_visible_to_matching_year(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        Survey::factory()->for($staff, 'createdBy')->targetingGraduationYear(2024)->create();

        $matching = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($matching, 'user')->create(['graduation_year' => 2024]);

        $nonMatching = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($nonMatching, 'user')->create(['graduation_year' => 2020]);

        $this->actingAs($matching)->get('/surveys')
            ->assertInertia(fn ($page) => $page->has('surveys', 1));

        $this->actingAs($nonMatching)->get('/surveys')
            ->assertInertia(fn ($page) => $page->has('surveys', 0));
    }

    public function test_untargeted_survey_is_visible_to_everyone(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        Survey::factory()->for($staff, 'createdBy')->create();

        $student = User::factory()->student()->create();

        $this->actingAs($student)->get('/surveys')
            ->assertInertia(fn ($page) => $page->has('surveys', 1));
    }

    // ─── Invitation on publish ───────────────────────────────────────────────

    public function test_creating_an_open_survey_invites_eligible_respondents(): void
    {
        Notification::fake();

        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($staff)->post('/surveys', [
            'title' => 'General Tracer', 'type' => 'tracer', 'status' => 'open',
        ])->assertRedirect();

        Notification::assertSentTo($alumni, SurveyInvitation::class);
        // Untargeted, but industry partners aren't respondents for a tracer survey either —
        // they're still an active non-manager role, so they ARE eligible under the "no target" rule.
        Notification::assertSentTo($partner, SurveyInvitation::class);
        // The creator (a survey manager) must never be invited to respond to their own survey.
        Notification::assertNotSentTo($staff, SurveyInvitation::class);
    }

    public function test_creating_a_targeted_survey_only_invites_the_targeted_role(): void
    {
        Notification::fake();

        $staff = User::factory()->alumniAffairs()->create();
        $student = User::factory()->student()->create();
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($staff)->post('/surveys', [
            'title' => 'Student Readiness Check', 'type' => 'custom', 'status' => 'open',
            'target_role' => 'student',
        ]);

        Notification::assertSentTo($student, SurveyInvitation::class);
        Notification::assertNotSentTo($alumni, SurveyInvitation::class);
    }

    public function test_creating_a_draft_survey_sends_no_invitation(): void
    {
        Notification::fake();

        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($staff)->post('/surveys', ['title' => 'Draft Survey', 'type' => 'custom', 'status' => 'draft']);

        Notification::assertNothingSentTo($alumni);
    }

    public function test_publishing_a_draft_via_update_invites_once_not_on_every_edit(): void
    {
        Notification::fake();

        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'draft']);

        $this->actingAs($staff)->patch("/surveys/{$survey->id}", [
            'title' => $survey->title, 'type' => $survey->type, 'status' => 'open',
        ])->assertRedirect();

        Notification::assertSentTo($alumni, SurveyInvitation::class, 1);

        $this->actingAs($staff)->patch("/surveys/{$survey->id}", [
            'title' => 'Renamed', 'type' => $survey->type, 'status' => 'open',
        ]);

        Notification::assertSentTo($alumni, SurveyInvitation::class, 1);
    }

    // ─── Reminders ────────────────────────────────────────────────────────────

    public function test_reminder_only_goes_to_users_who_have_not_submitted(): void
    {
        Notification::fake();

        $staff = User::factory()->alumniAffairs()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);

        $responded = User::factory()->alumni()->create();
        $survey->responses()->create(['user_id' => $responded->id, 'status' => 'submitted', 'submitted_at' => now()]);

        $notResponded = User::factory()->alumni()->create();

        $this->actingAs($staff)->post("/surveys/{$survey->id}/remind")->assertRedirect();

        Notification::assertSentTo($notResponded, SurveyInvitation::class);
        Notification::assertNotSentTo($responded, SurveyInvitation::class);
    }

    public function test_alumni_cannot_send_reminders(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);

        $this->actingAs($alumni)->post("/surveys/{$survey->id}/remind")->assertForbidden();
    }

    // ─── maps_to write-back ───────────────────────────────────────────────────

    public function test_employment_status_answer_writes_back_to_profile(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create(['current_employment_status' => 'unemployed']);

        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);
        $question = SurveyQuestion::factory()->for($survey)->singleChoice(['employed', 'unemployed'])->create(['maps_to' => 'employment_status']);

        $this->actingAs($alumni)->post("/surveys/{$survey->id}/respond", [
            'answers' => [$question->id => 'employed'],
        ])->assertRedirect();

        $this->assertSame('employed', $profile->fresh()->current_employment_status);
    }

    public function test_employer_answers_create_a_current_employment_record(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);
        $employerQ = SurveyQuestion::factory()->for($survey)->create(['maps_to' => 'current_employer']);
        $titleQ = SurveyQuestion::factory()->for($survey)->create(['maps_to' => 'job_title']);

        $this->actingAs($alumni)->post("/surveys/{$survey->id}/respond", [
            'answers' => [
                $employerQ->id => 'Acme Corp',
                $titleQ->id => 'Backend Developer',
            ],
        ])->assertRedirect();

        $this->assertDatabaseHas('employment_records', [
            'graduate_profile_id' => $profile->id,
            'company_name' => 'Acme Corp',
            'job_title' => 'Backend Developer',
            'is_current' => true,
        ]);
    }

    public function test_employer_answer_updates_the_existing_current_record_instead_of_duplicating(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        EmploymentRecord::create([
            'graduate_profile_id' => $profile->id, 'company_name' => 'Old Co', 'job_title' => 'Junior Dev',
            'employment_type' => 'full_time', 'is_current' => true, 'start_date' => '2023-01-01',
        ]);

        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);
        $employerQ = SurveyQuestion::factory()->for($survey)->create(['maps_to' => 'current_employer']);

        $this->actingAs($alumni)->post("/surveys/{$survey->id}/respond", [
            'answers' => [$employerQ->id => 'New Co'],
        ]);

        $this->assertSame(1, EmploymentRecord::where('graduate_profile_id', $profile->id)->count());
        $this->assertSame('New Co', EmploymentRecord::where('graduate_profile_id', $profile->id)->first()->company_name);
    }

    public function test_partial_employer_answer_does_not_create_an_invalid_record(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);
        // Only "industry" mapped, no company_name/job_title — must not attempt
        // to create an EmploymentRecord (those columns are NOT NULL).
        $industryQ = SurveyQuestion::factory()->for($survey)->create(['maps_to' => 'industry']);

        $this->actingAs($alumni)->post("/surveys/{$survey->id}/respond", [
            'answers' => [$industryQ->id => 'IT'],
        ])->assertRedirect();

        $this->assertSame(0, EmploymentRecord::where('graduate_profile_id', $profile->id)->count());
    }

    public function test_questions_without_maps_to_do_not_affect_the_profile(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create(['current_employment_status' => 'unemployed']);

        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);
        $question = SurveyQuestion::factory()->for($survey)->create(); // maps_to null

        $this->actingAs($alumni)->post("/surveys/{$survey->id}/respond", [
            'answers' => [$question->id => 'some free-text answer'],
        ])->assertRedirect();

        $this->assertSame('unemployed', $profile->fresh()->current_employment_status);
    }
}
