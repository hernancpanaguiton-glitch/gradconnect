<?php

namespace Tests\Feature;

use App\Models\GraduateProfile;
use App\Models\Resume;
use App\Models\Skill;
use App\Models\User;
use App\Services\ResumeAnalysisService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ResumeAnalysisTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        // Force the deterministic/heuristic path regardless of the dev env.
        config(['services.groq.api_key' => null, 'services.gemini.api_key' => null]);
        Http::preventStrayRequests();
    }

    private function profileWithResume(string $resumeText): GraduateProfile
    {
        $user = User::factory()->alumni()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);
        // Deterministic status so the "employed but no current job" check does
        // not fire from the factory's random employment status.
        $profile = GraduateProfile::factory()->create([
            'user_id' => $user->id,
            'current_employment_status' => 'unemployed',
        ]);
        Resume::factory()->for($profile)->create([
            'is_primary' => true,
            'embedding_status' => 'done',
            'extracted_text' => $resumeText,
        ]);

        return $profile->fresh();
    }

    public function test_flags_profile_skill_missing_from_resume(): void
    {
        $profile = $this->profileWithResume('Experienced developer skilled in PHP and Laravel.');
        $profile->skills()->attach(Skill::findOrCreateByName('Kubernetes')->id, ['source' => 'self']);

        $result = app(ResumeAnalysisService::class)->analyze($profile);

        $this->assertTrue($result['hasResume']);
        $this->assertFalse($result['poweredByAi']);
        $titles = collect($result['discrepancies'])->pluck('title');
        $this->assertContains('Profile skills missing from résumé', $titles);
        $this->assertStringContainsString('Kubernetes', collect($result['discrepancies'])->pluck('detail')->implode(' '));
    }

    public function test_flags_employment_not_on_resume(): void
    {
        $profile = $this->profileWithResume('Software engineer. Skills: PHP.');
        $profile->employmentRecords()->create([
            'company_name' => 'Cebu Pacific IT', 'job_title' => 'Engineer',
            'employment_type' => 'full_time', 'is_current' => true, 'start_date' => '2023-01-01',
        ]);

        $result = app(ResumeAnalysisService::class)->analyze($profile->fresh());

        $this->assertContains('Employment not on résumé', collect($result['discrepancies'])->pluck('title'));
    }

    public function test_no_discrepancies_when_consistent(): void
    {
        $profile = $this->profileWithResume('Maria Santos — PHP, Laravel and Kubernetes engineer.');
        $profile->skills()->attach(Skill::findOrCreateByName('Kubernetes')->id, ['source' => 'self']);

        $result = app(ResumeAnalysisService::class)->analyze($profile->fresh());

        $this->assertEmpty($result['discrepancies']);
    }

    public function test_flags_name_not_on_resume(): void
    {
        // Résumé text with none of the profile's name (Maria Santos).
        $profile = $this->profileWithResume('Backend developer skilled in PHP and Laravel.');

        $result = app(ResumeAnalysisService::class)->analyze($profile->fresh());

        $this->assertContains('Name not found on résumé', collect($result['discrepancies'])->pluck('title'));
    }

    public function test_no_resume_state(): void
    {
        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);

        $result = app(ResumeAnalysisService::class)->analyze($profile);

        $this->assertFalse($result['hasResume']);
    }

    public function test_page_loads_for_alumni(): void
    {
        $user = User::factory()->alumni()->create();
        GraduateProfile::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('resume-analysis'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('ResumeAnalysis')->has('hasResume'));
    }
}
