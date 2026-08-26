<?php

namespace Tests\Unit\Services;

use App\AI\AiManager;
use App\AI\DTO\MatchResult;
use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\User;
use App\Services\ResumeMatchingService;
use App\Services\VectorSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResumeMatchingServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeJobPosting(): JobPosting
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();

        return JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();
    }

    private function makeProfileWithResume(): array
    {
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();
        $resume = Resume::factory()->for($profile)->create([
            'is_primary' => true,
            'extracted_text' => 'PHP Laravel backend developer',
        ]);

        return [$profile, $resume];
    }

    public function test_matching_a_job_to_candidates_upserts_a_match_result_per_shortlisted_resume(): void
    {
        $posting = $this->makeJobPosting();
        [$profile, $resume] = $this->makeProfileWithResume();

        $vectorSearch = $this->createMock(VectorSearch::class);
        $vectorSearch->method('nearestResumesToJob')->willReturn(collect([
            (object) ['resume_id' => $resume->id, 'graduate_profile_id' => $profile->id, 'similarity' => 0.87],
        ]));

        $aiManager = $this->createMock(AiManager::class);
        $aiManager->method('scoreWithFallback')->willReturn(
            new MatchResult(75, 'strong', 'Good fit', ['Docker'], ['PHP', 'Laravel'], 'groq')
        );

        $results = (new ResumeMatchingService($vectorSearch, $aiManager))->matchJobToCandidates($posting);

        $this->assertCount(1, $results);
        $this->assertDatabaseHas('job_match_results', [
            'job_posting_id' => $posting->id,
            'graduate_profile_id' => $profile->id,
            'resume_id' => $resume->id,
            'fit_score' => 75,
            'recommendation' => 'strong',
            'scored_by' => 'groq',
        ]);
        $this->assertEqualsWithDelta(0.87, $results->first()->similarity, 0.0001);
    }

    public function test_matching_a_job_persists_similarity_only_when_scoring_fails(): void
    {
        $posting = $this->makeJobPosting();
        [$profile, $resume] = $this->makeProfileWithResume();

        $vectorSearch = $this->createMock(VectorSearch::class);
        $vectorSearch->method('nearestResumesToJob')->willReturn(collect([
            (object) ['resume_id' => $resume->id, 'graduate_profile_id' => $profile->id, 'similarity' => 0.5],
        ]));

        $aiManager = $this->createMock(AiManager::class);
        $aiManager->method('scoreWithFallback')->willReturn(null);

        (new ResumeMatchingService($vectorSearch, $aiManager))->matchJobToCandidates($posting);

        $this->assertDatabaseHas('job_match_results', [
            'job_posting_id' => $posting->id,
            'graduate_profile_id' => $profile->id,
            'fit_score' => null,
            'scored_by' => null,
            'scored_at' => null,
        ]);
    }

    /**
     * Regression: a failed re-score used to write nulls over the existing
     * row, so one provider outage (a retired model, say) silently degraded
     * every previously-scored recommendation to "unscored" — and because the
     * job still completed, nothing surfaced that anything had gone wrong.
     */
    public function test_a_failed_rescore_keeps_the_previous_score(): void
    {
        $posting = $this->makeJobPosting();
        [$profile, $resume] = $this->makeProfileWithResume();

        $vectorSearch = $this->createMock(VectorSearch::class);
        $vectorSearch->method('nearestResumesToJob')->willReturn(collect([
            (object) ['resume_id' => $resume->id, 'graduate_profile_id' => $profile->id, 'similarity' => 0.91],
        ]));

        // First pass succeeds.
        $working = $this->createMock(AiManager::class);
        $working->method('scoreWithFallback')->willReturn(
            new MatchResult(82, 'strong', 'Strong overlap', ['Docker'], ['PHP'], 'groq')
        );
        (new ResumeMatchingService($vectorSearch, $working))->matchJobToCandidates($posting);

        // Second pass: the provider is down.
        $down = $this->createMock(AiManager::class);
        $down->method('scoreWithFallback')->willReturn(null);
        (new ResumeMatchingService($vectorSearch, $down))->matchJobToCandidates($posting);

        $match = JobMatchResult::where('job_posting_id', $posting->id)
            ->where('graduate_profile_id', $profile->id)
            ->firstOrFail();

        // The good score survives...
        $this->assertSame(82, $match->fit_score);
        $this->assertSame('strong', $match->recommendation);
        $this->assertSame('groq', $match->scored_by);
        $this->assertSame(['PHP'], $match->matched_skills);
        // ...while the fresh similarity from the vector stage is still recorded.
        $this->assertEqualsWithDelta(0.91, $match->similarity, 0.0001);
    }

    public function test_re_matching_the_same_pair_updates_rather_than_duplicates(): void
    {
        $posting = $this->makeJobPosting();
        [$profile, $resume] = $this->makeProfileWithResume();

        $vectorSearch = $this->createMock(VectorSearch::class);
        $vectorSearch->method('nearestResumesToJob')->willReturn(collect([
            (object) ['resume_id' => $resume->id, 'graduate_profile_id' => $profile->id, 'similarity' => 0.6],
        ]));

        $aiManager = $this->createMock(AiManager::class);
        $aiManager->method('scoreWithFallback')->willReturn(
            new MatchResult(40, 'weak', 'first pass', [], [], 'groq'),
            new MatchResult(90, 'strong', 'second pass', [], ['PHP'], 'gemini'),
        );

        $service = new ResumeMatchingService($vectorSearch, $aiManager);
        $service->matchJobToCandidates($posting);
        $service->matchJobToCandidates($posting);

        $this->assertSame(1, JobMatchResult::where([
            'job_posting_id' => $posting->id,
            'graduate_profile_id' => $profile->id,
        ])->count());
        $this->assertDatabaseHas('job_match_results', ['fit_score' => 90, 'scored_by' => 'gemini']);
    }

    public function test_matching_a_profile_to_jobs_upserts_a_match_result_per_shortlisted_job(): void
    {
        $posting = $this->makeJobPosting();
        [$profile, $resume] = $this->makeProfileWithResume();

        $vectorSearch = $this->createMock(VectorSearch::class);
        $vectorSearch->method('nearestJobsToProfile')->willReturn(collect([
            (object) ['job_posting_id' => $posting->id, 'similarity' => 0.7],
        ]));

        $aiManager = $this->createMock(AiManager::class);
        $aiManager->method('scoreWithFallback')->willReturn(
            new MatchResult(60, 'moderate', 'decent fit', ['AWS'], ['PHP'], 'gemini')
        );

        $results = (new ResumeMatchingService($vectorSearch, $aiManager))->matchProfileToJobs($profile);

        $this->assertCount(1, $results);
        $this->assertDatabaseHas('job_match_results', [
            'job_posting_id' => $posting->id,
            'graduate_profile_id' => $profile->id,
            'resume_id' => $resume->id,
            'fit_score' => 60,
        ]);
    }

    public function test_matching_a_profile_without_a_primary_resume_returns_empty(): void
    {
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $vectorSearch = $this->createMock(VectorSearch::class);
        $vectorSearch->expects($this->never())->method('nearestJobsToProfile');

        $aiManager = $this->createMock(AiManager::class);

        $results = (new ResumeMatchingService($vectorSearch, $aiManager))->matchProfileToJobs($profile);

        $this->assertTrue($results->isEmpty());
    }
}
