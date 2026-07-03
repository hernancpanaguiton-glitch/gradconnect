<?php

namespace Tests\Feature;

use App\AI\AiManager;
use App\AI\DTO\MatchResult;
use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\Skill;
use App\Models\User;
use App\Services\ResumeMatchingService;
use App\Services\VectorSearch;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class RecommendationProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_build_profile_text_includes_skills_and_program(): void
    {
        $profile = GraduateProfile::factory()->create([
            'user_id' => User::factory()->create()->id,
            'program' => 'BS Information Technology',
            'headline' => 'Backend Developer',
        ]);
        $profile->skills()->attach(Skill::findOrCreateByName('Kubernetes')->id, ['source' => 'self']);

        $text = $profile->buildProfileText();

        $this->assertStringContainsString('BS Information Technology', $text);
        $this->assertStringContainsString('Backend Developer', $text);
        $this->assertStringContainsString('Kubernetes', $text);
    }

    public function test_scoring_passes_profile_text_alongside_resume(): void
    {
        $profile = GraduateProfile::factory()->create([
            'user_id' => User::factory()->create()->id,
            'program' => 'BS Computer Science',
        ]);
        $profile->skills()->attach(Skill::findOrCreateByName('Terraform')->id, ['source' => 'self']);

        $resume = Resume::factory()->create([
            'graduate_profile_id' => $profile->id,
            'is_primary' => true,
            'extracted_text' => 'RESUME_BODY_MARKER experience with CI/CD.',
        ]);

        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $jobPosting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();

        // Capture the candidate text handed to the AI scorer.
        $captured = null;
        $aiManager = Mockery::mock(AiManager::class);
        $aiManager->shouldReceive('scoreWithFallback')
            ->once()
            ->andReturnUsing(function (string $candidateText) use (&$captured) {
                $captured = $candidateText;

                return new MatchResult(
                    fitScore: 80,
                    explanation: 'Strong fit',
                    matchedSkills: ['Terraform'],
                    skillGaps: [],
                    recommendation: 'recommend',
                    provider: 'test',
                );
            });

        // Shortlist returns just our candidate for the job.
        $vectorSearch = Mockery::mock(VectorSearch::class);
        $vectorSearch->shouldReceive('nearestResumesToJob')->andReturn(collect([
            (object) ['resume_id' => $resume->id, 'graduate_profile_id' => $profile->id, 'similarity' => 0.9],
        ]));

        $service = new ResumeMatchingService($vectorSearch, $aiManager);
        $service->matchJobToCandidates($jobPosting);

        $this->assertNotNull($captured);
        $this->assertStringContainsString('Terraform', $captured, 'profile skills should be scored');
        $this->assertStringContainsString('RESUME_BODY_MARKER', $captured, 'resume text should still be scored');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
