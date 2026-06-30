<?php

namespace App\Services;

use App\AI\AiManager;
use App\Models\GraduateProfile;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\Resume;
use Illuminate\Support\Collection;

class ResumeMatchingService
{
    public function __construct(
        protected VectorSearch $vectorSearch,
        protected AiManager $aiManager,
    ) {}

    /**
     * Shortlist and score the candidates whose resumes best match a job
     * posting, upserting a JobMatchResult per pair.
     *
     * @return Collection<int, JobMatchResult>
     */
    public function matchJobToCandidates(JobPosting $jobPosting, int $shortlistSize = 20): Collection
    {
        return $this->vectorSearch
            ->nearestResumesToJob($jobPosting, $shortlistSize)
            ->map(function ($candidate) use ($jobPosting) {
                $resume = Resume::find($candidate->resume_id);

                return $resume ? $this->scoreAndUpsert($jobPosting, $resume, $candidate->similarity) : null;
            })
            ->filter()
            ->values();
    }

    /**
     * Shortlist and score the open job postings that best match a
     * graduate's primary resume, upserting a JobMatchResult per pair.
     *
     * @return Collection<int, JobMatchResult>
     */
    public function matchProfileToJobs(GraduateProfile $profile, int $shortlistSize = 20): Collection
    {
        $resume = $profile->primaryResume;

        if (! $resume) {
            return collect();
        }

        return $this->vectorSearch
            ->nearestJobsToProfile($profile, $shortlistSize)
            ->map(function ($item) use ($resume) {
                $jobPosting = JobPosting::find($item->job_posting_id);

                return $jobPosting ? $this->scoreAndUpsert($jobPosting, $resume, $item->similarity) : null;
            })
            ->filter()
            ->values();
    }

    protected function scoreAndUpsert(JobPosting $jobPosting, Resume $resume, float $similarity): JobMatchResult
    {
        $matchResult = $this->aiManager->scoreWithFallback(
            $resume->extracted_text ?? '',
            $jobPosting->buildEmbeddingText(),
            ['required_skills' => $jobPosting->requiredSkillNames()],
        );

        return JobMatchResult::updateOrCreate(
            [
                'job_posting_id' => $jobPosting->id,
                'graduate_profile_id' => $resume->graduate_profile_id,
            ],
            [
                'resume_id' => $resume->id,
                'similarity' => $similarity,
                'fit_score' => $matchResult?->fitScore,
                'explanation' => $matchResult?->explanation,
                'skill_gaps' => $matchResult?->skillGaps,
                'matched_skills' => $matchResult?->matchedSkills,
                'recommendation' => $matchResult?->recommendation,
                'scored_by' => $matchResult?->provider,
                'scored_at' => $matchResult ? now() : null,
            ],
        );
    }
}
