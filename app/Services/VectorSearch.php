<?php

namespace App\Services;

use App\Models\GraduateProfile;
use App\Models\JobPosting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VectorSearch
{
    /**
     * Shortlist the candidates (by primary resume) whose embedding is
     * nearest to the given job posting's embedding, by cosine similarity.
     *
     * @return Collection<int, object{resume_id: int, graduate_profile_id: int, similarity: float}>
     */
    public function nearestResumesToJob(JobPosting $jobPosting, int $limit = 20): Collection
    {
        if (DB::getDriverName() !== 'pgsql') {
            return collect();
        }

        $rows = DB::select(
            <<<'SQL'
                select r.id as resume_id, r.graduate_profile_id,
                       1 - (r.embedding <=> jp.embedding) as similarity
                from resumes r
                join job_postings jp on jp.id = ?
                where r.is_primary = true
                  and r.embedding is not null
                  and jp.embedding is not null
                order by r.embedding <=> jp.embedding asc
                limit ?
                SQL,
            [$jobPosting->id, $limit]
        );

        return $this->mapRows($rows);
    }

    /**
     * Shortlist the open job postings whose embedding is nearest to the
     * given graduate profile's primary resume embedding.
     *
     * @return Collection<int, object{job_posting_id: int, similarity: float}>
     */
    public function nearestJobsToProfile(GraduateProfile $profile, int $limit = 20): Collection
    {
        if (DB::getDriverName() !== 'pgsql') {
            return collect();
        }

        $resumeId = $profile->primaryResume?->id;

        if ($resumeId === null) {
            return collect();
        }

        $rows = DB::select(
            <<<'SQL'
                select jp.id as job_posting_id,
                       1 - (jp.embedding <=> r.embedding) as similarity
                from job_postings jp
                join resumes r on r.id = ?
                where jp.status = 'open'
                  and jp.embedding is not null
                  and r.embedding is not null
                order by jp.embedding <=> r.embedding asc
                limit ?
                SQL,
            [$resumeId, $limit]
        );

        return $this->mapRows($rows);
    }

    /**
     * @param  array<int, object>  $rows
     * @return Collection<int, object>
     */
    private function mapRows(array $rows): Collection
    {
        return collect($rows)->map(function ($row) {
            $row->similarity = (float) $row->similarity;

            return $row;
        });
    }
}
