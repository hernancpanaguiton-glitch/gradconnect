<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CandidateViewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function candidateProfile(): GraduateProfile
    {
        return GraduateProfile::factory()->create([
            'user_id' => User::factory()->alumni()->create()->id,
        ]);
    }

    /**
     * A partner who owns a posting that this graduate actually applied to.
     */
    private function partnerWithApplicantFrom(GraduateProfile $profile): User
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        JobApplication::create([
            'job_posting_id' => $posting->id,
            'graduate_profile_id' => $profile->id,
            'status' => 'submitted',
            'applied_at' => now(),
        ]);

        return $partner;
    }

    private function storedResumeFor(GraduateProfile $profile): Resume
    {
        $resume = Resume::factory()->for($profile)->create([
            'path' => "resumes/{$profile->id}/cv.pdf",
            'original_filename' => 'cv.pdf',
        ]);
        Storage::disk('local')->put($resume->path, '%PDF-1.4 fake');

        return $resume;
    }

    // ─── Profile browsing (intentionally open to Talent Search holders) ──────

    public function test_partner_can_view_a_candidate_profile(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $profile = $this->candidateProfile();

        $this->actingAs($partner)
            ->get(route('candidates.show', $profile))
            ->assertOk();
    }

    public function test_candidate_data_endpoint_returns_the_full_name(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $candidate = User::factory()->alumni()->create(['first_name' => 'Maria', 'last_name' => 'Reyes']);
        $profile = GraduateProfile::factory()->create(['user_id' => $candidate->id]);

        $this->actingAs($partner)
            ->getJson(route('candidates.data', $profile))
            ->assertOk()
            ->assertJsonPath('profile.user.name', 'Maria Reyes');
    }

    public function test_graduate_without_permission_is_forbidden(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = $this->candidateProfile();

        $this->actingAs($alumni)
            ->get(route('candidates.show', $profile))
            ->assertForbidden();
    }

    // ─── Résumé files (relationship-scoped) ─────────────────────────────────

    public function test_partner_can_stream_the_resume_of_someone_who_applied_to_them(): void
    {
        Storage::fake('local');
        $profile = $this->candidateProfile();
        $partner = $this->partnerWithApplicantFrom($profile);
        $resume = $this->storedResumeFor($profile);

        $this->actingAs($partner)
            ->get(route('candidates.resume', $resume))
            ->assertOk();
    }

    /**
     * Regression: a partner used to be able to enumerate /candidates/resume/{id}
     * and stream every résumé in the system.
     */
    public function test_partner_cannot_stream_the_resume_of_a_non_applicant(): void
    {
        Storage::fake('local');
        $profile = $this->candidateProfile();
        $resume = $this->storedResumeFor($profile);

        // Holds candidates.view_resumes, but this graduate never applied to them.
        $stranger = User::factory()->industryPartner()->create();
        Company::factory()->for($stranger, 'owner')->create();

        $this->actingAs($stranger)
            ->get(route('candidates.resume', $resume))
            ->assertForbidden();
    }

    public function test_partner_cannot_stream_a_resume_by_applying_to_a_different_partners_posting(): void
    {
        Storage::fake('local');
        $profile = $this->candidateProfile();
        $this->partnerWithApplicantFrom($profile); // graduate applied HERE
        $resume = $this->storedResumeFor($profile);

        $otherPartner = User::factory()->industryPartner()->create();
        Company::factory()->for($otherPartner, 'owner')->create();

        $this->actingAs($otherPartner)
            ->get(route('candidates.resume', $resume))
            ->assertForbidden();
    }

    public function test_sao_can_stream_any_resume_for_institutional_records(): void
    {
        Storage::fake('local');
        $profile = $this->candidateProfile();
        $resume = $this->storedResumeFor($profile);

        $this->actingAs(User::factory()->sao()->create())
            ->get(route('candidates.resume', $resume))
            ->assertOk();
    }

    public function test_missing_resume_file_returns_404_for_an_authorized_viewer(): void
    {
        Storage::fake('local');
        $profile = $this->candidateProfile();
        $resume = Resume::factory()->for($profile)->create();

        $this->actingAs(User::factory()->sao()->create())
            ->get(route('candidates.resume', $resume))
            ->assertNotFound();
    }
}
