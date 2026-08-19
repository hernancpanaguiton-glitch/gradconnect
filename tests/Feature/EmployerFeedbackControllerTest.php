<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\EmployerFeedback;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployerFeedbackControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function scenario(string $status = 'hired'): array
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $graduate = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($graduate, 'user')->create();

        $application = JobApplication::create([
            'job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id,
            'status' => $status, 'applied_at' => now(),
        ]);

        return [$partner, $company, $posting, $profile, $application];
    }

    public function test_employer_can_submit_feedback_after_hiring_decision(): void
    {
        [$partner, , , $profile, $application] = $this->scenario('hired');

        $this->actingAs($partner)
            ->post(route('applications.feedback.store', $application), [
                'overall_rating' => 5,
                'competency_ratings' => ['communication' => 4, 'teamwork' => 5],
                'comments' => 'Excellent hire.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('employer_feedbacks', [
            'job_application_id' => $application->id,
            'graduate_profile_id' => $profile->id,
            'overall_rating' => 5,
            'comments' => 'Excellent hire.',
        ]);
    }

    public function test_resubmitting_feedback_updates_the_existing_row_not_a_duplicate(): void
    {
        [$partner, , , , $application] = $this->scenario('hired');

        $this->actingAs($partner)->post(route('applications.feedback.store', $application), ['overall_rating' => 3]);
        $this->actingAs($partner)->post(route('applications.feedback.store', $application), ['overall_rating' => 5]);

        $this->assertSame(1, EmployerFeedback::where('job_application_id', $application->id)->count());
        $this->assertSame(5, EmployerFeedback::where('job_application_id', $application->id)->first()->overall_rating);
    }

    public function test_feedback_is_rejected_before_a_hiring_decision(): void
    {
        [$partner, , , , $application] = $this->scenario('submitted');

        $this->actingAs($partner)
            ->post(route('applications.feedback.store', $application), ['overall_rating' => 4])
            ->assertStatus(422);

        $this->assertDatabaseCount('employer_feedbacks', 0);
    }

    public function test_a_different_partner_cannot_submit_feedback_on_someone_elses_posting(): void
    {
        [, , , , $application] = $this->scenario('hired');
        $otherPartner = User::factory()->industryPartner()->create();
        Company::factory()->for($otherPartner, 'owner')->create();

        $this->actingAs($otherPartner)
            ->post(route('applications.feedback.store', $application), ['overall_rating' => 4])
            ->assertForbidden();
    }

    public function test_graduate_cannot_submit_employer_feedback(): void
    {
        [, , , , $application] = $this->scenario('hired');
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->post(route('applications.feedback.store', $application), ['overall_rating' => 4])
            ->assertForbidden();
    }
}
