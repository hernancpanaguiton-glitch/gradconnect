<?php

namespace App\AI\Contracts;

use App\AI\DTO\MatchResult;

interface MatchScorer
{
    /**
     * Score how well a resume matches a job, returning null on failure.
     *
     * @param  array<string, mixed>  $context
     */
    public function score(string $resumeText, string $jobText, array $context = []): ?MatchResult;
}
