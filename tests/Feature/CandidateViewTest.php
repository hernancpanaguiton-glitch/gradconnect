<?php

namespace Tests\Feature;

use App\Models\GraduateProfile;
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

    public function test_partner_can_view_a_candidate_profile(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $profile = $this->candidateProfile();

        $this->actingAs($partner)
            ->get(route('candidates.show', $profile))
            ->assertOk();
    }

    public function test_partner_can_stream_a_candidate_resume(): void
    {
        Storage::fake('local');
        $partner = User::factory()->industryPartner()->create();
        $profile = $this->candidateProfile();

        $resume = Resume::factory()->for($profile)->create([
            'path' => "resumes/{$profile->id}/cv.pdf",
            'original_filename' => 'cv.pdf',
        ]);
        Storage::disk('local')->put($resume->path, '%PDF-1.4 fake');

        $this->actingAs($partner)
            ->get(route('candidates.resume', $resume))
            ->assertOk();
    }

    public function test_missing_resume_file_returns_404(): void
    {
        Storage::fake('local');
        $partner = User::factory()->industryPartner()->create();
        $resume = Resume::factory()->for($this->candidateProfile())->create();

        $this->actingAs($partner)
            ->get(route('candidates.resume', $resume))
            ->assertNotFound();
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
}
